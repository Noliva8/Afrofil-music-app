

import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { Song } from '../../../models/Artist/index_artist.js';
import { LikedSongs } from '../../../models/User/user_index.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { userLikesKey, songKey } from '../../Artist_schema/Redis/keys.js';
import {addSongRedis, getSongRedis} from "../../Artist_schema/Redis/addSongRedis.js"
import { likesSetExpiration, songHashExpiration } from '../../Artist_schema/Redis/redisExpiration.js';
import { trendIndexZSet, TRENDING_WEIGHTS } from '../../Artist_schema/Redis/keys.js';


export const toggleLikeSong = async (_, { songId }, context) => {

  const userr = context?.user?._id ;
  console.log('see the user from context:', userr)
  if (!context?.user?._id) {

    throw new GraphQLError('User login required to like songs', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const userId = String(context.user._id);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const songObjectId = new mongoose.Types.ObjectId(songId);
  const redisKey = userLikesKey(userId);
  const redisSongKey = songKey(songId);

  try {
    const redis = await getRedis();

    // 1. MongoDB operation to toggle like AND update trending score
    const updatedSong = await Song.findOneAndUpdate(
      { _id: songObjectId },
      [
        {
          $set: {
            likedByMe: {
              $cond: [
                { $in: [userObjectId, { $ifNull: ["$likedByUsers", []] }] },
                false, // Unlike
                true   // Like
              ]
            }
          }
        },
        {
          $set: {
            likedByUsers: {
              $cond: [
                "$likedByMe",
                { $setUnion: [[userObjectId], { $ifNull: ["$likedByUsers", []] }] },
                {
                  $filter: {
                    input: { $ifNull: ["$likedByUsers", []] },
                    as: "u",
                    cond: { $ne: ["$$u", userObjectId] }
                  }
                }
              ]
            }
          }
        },
        {
          $set: {
            likesCount: { $size: { $ifNull: ["$likedByUsers", []] } },
            trendingScore: {
              $cond: [
                "$likedByMe",
                { $add: [{ $ifNull: ["$trendingScore", 0] }, TRENDING_WEIGHTS.LIKE_WEIGHT] }, // Like: add weight
                { $subtract: [{ $ifNull: ["$trendingScore", 0] }, TRENDING_WEIGHTS.LIKE_WEIGHT] } // Unlike: subtract weight
              ]
            }
          }
        }
      ],
      { 
        new: true,
        runValidators: false 
      }
    )
    .populate({ path: 'artist', select: 'artistAka country' })
    .populate({ path: 'album', select: 'title cover artworkUrl' });

    if (!updatedSong) throw new Error('Song not found');

    const isNowLiked = updatedSong.likedByUsers.some(id => String(id) === userId);

    // 2. Update Redis user likes set
    await Promise.all([
      isNowLiked 
        ? redis.sAdd(redisKey, songId)
        : redis.sRem(redisKey, songId),
      
      // Update song cache likes count AND trending score
      redis.hSet(redisSongKey, {
        'likesCount': updatedSong.likesCount,
        'trendingScore': updatedSong.trendingScore
      }),
      redis.expire(redisSongKey, songHashExpiration),
      redis.expire(redisKey, likesSetExpiration)
    ]);

    // 2b. Persist liked songs for user library
    if (isNowLiked) {
      await LikedSongs.findOneAndUpdate(
        { user: userObjectId, liked_songs: songObjectId },
        { $set: { user: userObjectId, liked_songs: songObjectId, createdAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await LikedSongs.findOneAndDelete({ user: userObjectId, liked_songs: songObjectId });
    }

    // 3. Update trending set
    try {
      const currentTrendingScore = await redis.zScore(trendIndexZSet, songId.toString());
      const scoreChange = isNowLiked ? TRENDING_WEIGHTS.LIKE_WEIGHT : -TRENDING_WEIGHTS.LIKE_WEIGHT;
      
      if (currentTrendingScore !== null) {
        // Song is in trending - update score
        const newScore = parseFloat(currentTrendingScore) + scoreChange;
        await redis.zAdd(trendIndexZSet, { 
          score: newScore, 
          value: songId.toString() 
        });
        console.log(`📈 Trending ${isNowLiked ? 'increased' : 'decreased'}: ${songId}: ${currentTrendingScore} → ${newScore}`);
      } else if (isNowLiked) {
        // Song not in trending - only try to enter on like (not on unlike)
        const songNewScore = updatedSong.trendingScore;
        const trendingCount = await redis.zCard(trendIndexZSet);
        
        if (trendingCount < 20) {
          // Space available - add it
          await redis.zAdd(trendIndexZSet, {
            score: songNewScore,
            value: songId.toString()
          });
          console.log(`🎉 Added ${songId} to trending via like: ${songNewScore}`);
        } else {
          // Full - check if score is higher than lowest
          const lowestSongs = await redis.zRange(trendIndexZSet, 0, 0, { WITHSCORES: true });
          const lowestScore = parseFloat(lowestSongs[1]);
          
          if (songNewScore > lowestScore) {
            // Replace lowest scoring song
            await redis.zRem(trendIndexZSet, lowestSongs[0]);
            await redis.zAdd(trendIndexZSet, {
              score: songNewScore,
              value: songId.toString()
            });
            console.log(`🔄 ${songId} replaced ${lowestSongs[0]} in trending via like: ${songNewScore} > ${lowestScore}`);
          }
        }
      }
    } catch (trendingError) {
      console.warn('Trending update failed during like:', trendingError);
    }

    // 4. Transform response
    const obj = updatedSong.toObject();
    obj._id = String(obj._id);
    if (obj.artist?._id) obj.artist._id = String(obj.artist._id);
    if (obj.album?._id) obj.album._id = String(obj.album._id);
    obj.likedByMe = isNowLiked;

    return obj;

  } catch (error) {
    console.error('toggleLikeSong error:', error);
    throw new GraphQLError(`Error toggling like: ${error.message}`, {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
};
