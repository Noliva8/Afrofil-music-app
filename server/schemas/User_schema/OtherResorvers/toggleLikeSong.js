

import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { Song } from '../../../models/Artist/index_artist.js';
import { LikedSongs } from '../../../models/User/user_index.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { userLikesKey, songKey } from '../../Artist_schema/Redis/keys.js';
import {addSongRedis, getSongRedis} from "../../Artist_schema/Redis/addSongRedis.js"
import { updateSongRedis } from '../../Artist_schema/Redis/songCreateRedis.js';
import { likesSetExpiration, songHashExpiration } from '../../Artist_schema/Redis/redisExpiration.js';
import { trendIndexZSet, TRENDING_WEIGHTS } from '../../Artist_schema/Redis/keys.js';

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const SONG_OF_THE_WEEK_INITIAL_MIN_PLAYS = numberFromEnv(
  process.env.PLAYS_NEEDED_TO_WIN_MAXIMUM_PRIZE_INITIALLY,
  1000
);
const SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_PLAYS = numberFromEnv(
  process.env.SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_PLAYS,
  1000
);
const SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_LIKES = numberFromEnv(
  process.env.SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_LIKES,
  100
);

const getSongOfTheWeekStartDate = (date = new Date()) => {
  const weekStartDate = new Date(date);
  const daysSinceSaturday = (weekStartDate.getDay() + 1) % 7;
  weekStartDate.setDate(weekStartDate.getDate() - daysSinceSaturday);
  weekStartDate.setHours(0, 0, 0, 0);
  return weekStartDate;
};

const getSongOfTheWeekEndDate = (weekStartDate) => {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);
  return weekEndDate;
};

const isSameSongOfTheWeekWindow = (songWeekStartDate, currentWeekStartDate) => {
  if (!songWeekStartDate) return false;
  return new Date(songWeekStartDate).getTime() === currentWeekStartDate.getTime();
};

const songMeetsSongOfTheWeekRepeatThreshold = (song) =>
  Number(song?.weeklyPlayCount || 0) >= SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_PLAYS &&
  Number(song?.weeklyLikeCount || 0) >= SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_LIKES;

const songMeetsSongOfTheWeekGrandPrizeThreshold = (song) =>
  Number(song?.weeklyPlayCount || 0) >= SONG_OF_THE_WEEK_INITIAL_MIN_PLAYS;

const updateSongOfTheWeekCriteriaReachedAt = async ({
  song,
  weekStartDate,
  now = new Date(),
}) => {
  if (!song?._id || !isSameSongOfTheWeekWindow(song.weekStartDate, weekStartDate)) return song;

  const $set = {};
  if (songMeetsSongOfTheWeekGrandPrizeThreshold(song)) {
    if (!song.songOfTheWeekGrandPrizeCriteriaReachedAt) {
      $set.songOfTheWeekGrandPrizeCriteriaReachedAt = now;
    }
  } else if (song.songOfTheWeekGrandPrizeCriteriaReachedAt) {
    $set.songOfTheWeekGrandPrizeCriteriaReachedAt = null;
  }

  if (songMeetsSongOfTheWeekRepeatThreshold(song)) {
    if (!song.songOfTheWeekRepeatCriteriaReachedAt) {
      $set.songOfTheWeekRepeatCriteriaReachedAt = now;
    }
  } else if (song.songOfTheWeekRepeatCriteriaReachedAt) {
    $set.songOfTheWeekRepeatCriteriaReachedAt = null;
  }

  if (Object.keys($set).length === 0) return song;
  return Song.findByIdAndUpdate(song._id, { $set }, { new: true, runValidators: true });
};

const updateSongOfTheWeekCriteriaReachedAtBestEffort = async ({
  song,
  weekStartDate,
  now = new Date(),
}) => {
  try {
    return await updateSongOfTheWeekCriteriaReachedAt({ song, weekStartDate, now });
  } catch (error) {
    console.warn('[songOfTheWeek] criteria timestamp update skipped:', error?.message || error);
    return song;
  }
};

const resetSongOfTheWeekCountersIfNeeded = async (redis, weekStartDate, weekEndDate) => {
  const resetKey = `song-of-the-week:reset:${weekStartDate.toISOString().slice(0, 10)}`;
  const acquired = await redis.set(resetKey, '1', {
    EX: 8 * 24 * 60 * 60,
    NX: true,
  });

  if (!acquired) return;

  try {
    const staleWeekFilter = {
      $or: [
        { weekStartDate: { $exists: false } },
        { weekStartDate: null },
        { weekStartDate: { $ne: weekStartDate } },
      ],
    };

    await Song.updateMany(
      staleWeekFilter,
      [
        {
          $set: {
            previousWeekPlayCount: { $ifNull: ['$weeklyPlayCount', 0] },
          },
        },
      ]
    );

    await Song.updateMany(
      staleWeekFilter,
      {
        $set: {
          weekStartDate,
          weekEndDate,
          weeklyPlayCount: 0,
          weeklyLikeCount: 0,
          weeklyShareCount: 0,
          weeklyDownloadCount: 0,
          songOfTheWeekGrandPrizeCriteriaReachedAt: null,
          songOfTheWeekRepeatCriteriaReachedAt: null,
        },
      }
    );
  } catch (error) {
    await redis.del(resetKey).catch(() => {});
    throw error;
  }
};

export const toggleLikeSong = async (_, { songId }, context) => {

  const userr = context?.user?._id ;

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
    const weekStartDate = getSongOfTheWeekStartDate();
    const weekEndDate = getSongOfTheWeekEndDate(weekStartDate);
    await resetSongOfTheWeekCountersIfNeeded(redis, weekStartDate, weekEndDate);

    const existingSong = await Song.findById(songObjectId).select('weekStartDate').lean();
    if (!existingSong) throw new Error('Song not found');
    const isCurrentWeek = isSameSongOfTheWeekWindow(existingSong.weekStartDate, weekStartDate);

    // 1. MongoDB operation to toggle like AND update trending score
    let updatedSong = await Song.findOneAndUpdate(
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
            },
            weekStartDate,
            weekEndDate,
            weeklyLikeCount: {
              $cond: [
                isCurrentWeek,
                {
                  $max: [
                    0,
                    {
                      $add: [
                        { $ifNull: ["$weeklyLikeCount", 0] },
                        { $cond: ["$likedByMe", 1, -1] }
                      ]
                    }
                  ]
                },
                { $cond: ["$likedByMe", 1, 0] }
              ]
            },
            ...(!isCurrentWeek ? {
              weeklyPlayCount: 0,
              weeklyShareCount: 0,
              weeklyDownloadCount: 0,
              songOfTheWeekGrandPrizeCriteriaReachedAt: null,
              songOfTheWeekRepeatCriteriaReachedAt: null,
            } : {})
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
    updatedSong = await updateSongOfTheWeekCriteriaReachedAtBestEffort({
      song: updatedSong,
      weekStartDate,
      now: new Date(),
    });

    const isNowLiked = updatedSong.likedByUsers.some(id => String(id) === userId);

    // 2. Update Redis user likes set
    await Promise.all([
      isNowLiked
        ? redis.sAdd(redisKey, songId)
        : redis.sRem(redisKey, songId),

      // Update song cache likes count, trending score, and weekly counters.
      updateSongRedis(songId, {
        likesCount: updatedSong.likesCount,
        trendingScore: updatedSong.trendingScore,
        weekStartDate: updatedSong.weekStartDate,
        weekEndDate: updatedSong.weekEndDate,
        weeklyPlayCount: updatedSong.weeklyPlayCount,
        weeklyLikeCount: updatedSong.weeklyLikeCount,
        weeklyShareCount: updatedSong.weeklyShareCount,
        weeklyDownloadCount: updatedSong.weeklyDownloadCount,
        songOfTheWeekGrandPrizeCriteriaReachedAt: updatedSong.songOfTheWeekGrandPrizeCriteriaReachedAt,
        songOfTheWeekRepeatCriteriaReachedAt: updatedSong.songOfTheWeekRepeatCriteriaReachedAt,
        hasWonSongOfTheWeek: updatedSong.hasWonSongOfTheWeek,
        lastSongOfTheWeekWonAt: updatedSong.lastSongOfTheWeekWonAt,
        songOfTheWeekWinnerWeekStartDate: updatedSong.songOfTheWeekWinnerWeekStartDate,
      }).catch(async (error) => {
        if (error?.message?.includes('song not found')) {
          await addSongRedis(songId, redis);
          return;
        }
        throw error;
      }),
      redis.expire(redisSongKey, songHashExpiration),
      redis.expire(redisKey, likesSetExpiration)
    ]);

    try {
      const patternKeys = await redis.keys('home:daily-mix:*');
      if (patternKeys.length) {
        await redis.del(patternKeys);
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to clear Daily Mix cache:', cacheError.message);
    }

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
