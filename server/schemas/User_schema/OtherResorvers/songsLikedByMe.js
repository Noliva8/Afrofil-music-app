import { userLikesKey } from "../../Artist_schema/Redis/keys.js";
import { Song } from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import { songHashExpiration, likesSetExpiration } from "../../Artist_schema/Redis/redisExpiration.js";


const transformSong = (song) => {
  // ✅ Direct calculation from the array you already have
  const likesCount = Array.isArray(song.likedByUsers) 
    ? song.likedByUsers.length 
    : 0;

  console.log('check the actual likeCount:', likesCount);
  console.log('check the actual likeCount again:', song.likesCount);

  return {
    _id: String(song._id),
    title: song.title,
    mood: song.mood,
    tempo: song.tempo,
    subMoods: song.subMoods,
    artwork: song.artwork,
    genre: song.genre,
    trackNumber: song.trackNumber,
    createdAt: song.createdAt,
    duration: song.duration,
    featuringArtist: song.featuringArtist,
    streamAudioFileUrl: song.streamAudioFileUrl,
    audioFileUrl: song.audioFileUrl,
    playCount: song.playCount,
    downloadCount: song.downloadCount,
    // ✅ Use the calculated value
    likesCount: likesCount,
    trendingScore: song.trendingScore,
    likedByMe: true,
    artist: song.artist ? {
      _id: String(song.artist._id),
      artistAka: song.artist.artistAka,
      country: song.artist.country
    } : null,
    album: song.album ? {
      _id: String(song.album._id),
      title: song.album.title
    } : null
  };
};

export const songsLikedByMe = async (_, { limit = 20, offset = 0 }, context) => {
  if (!context?.user?._id) {
    throw new GraphQLError('User login required to fetch liked songs', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const userId = String(context.user._id);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const redisKey = userLikesKey(userId);

  // ──────────────────────────
  // Redis-first approach
  // ──────────────────────────
  try {
    const redis = await getRedis();
    const redisExists = await redis.exists(redisKey);

    if (!redisExists) {
      const likedSongs = await Song.find({ likedByUsers: userObjectId }, { _id: 1 }).lean();
      const songIds = likedSongs.map((s) => String(s._id));
      
      if (songIds.length > 0) {
        await redis.sAdd(redisKey, songIds);
        await redis.expire(redisKey, likesSetExpiration); 
      }
    }

    const allLikedSongIds = await redis.sMembers(redisKey);
    
    // ✅ Handle empty case with proper totalCount
    if (allLikedSongIds.length === 0) {
      return {
        songs: [],
        totalCount: 0, // ✅ Explicitly set to 0
        hasNextPage: false,
        hasPreviousPage: false
      };
    }

    const paginatedSongIds = allLikedSongIds.slice(offset, offset + limit);
    
    // ✅ Handle pagination beyond available songs
    if (paginatedSongIds.length === 0) {
      return {
        songs: [],
        totalCount: allLikedSongIds.length, // ✅ Use actual count
        hasNextPage: offset + limit < allLikedSongIds.length,
        hasPreviousPage: offset > 0
      };
    }

    const songs = await Song.find({
      _id: { $in: paginatedSongIds.map(id => new mongoose.Types.ObjectId(id)) }
    })
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title' })
      .select('_id title mood tempo subMoods artwork genre trackNumber createdAt duration featuringArtist streamAudioFileUrl audioFileUrl playCount downloadCount likesCount trendingScore likedByUsers')
      .lean(); 





    return {
      songs: songs,
      totalCount: allLikedSongIds.length, // ✅ Always include totalCount
      hasNextPage: offset + limit < allLikedSongIds.length,
      hasPreviousPage: offset > 0
    };

  } catch (error) {
    console.warn('Redis unavailable or failed. Falling back to MongoDB:', error.message);
    // Continue to MongoDB fallback
  }

  // ──────────────────────────
  // MongoDB-only fallback
  // ──────────────────────────
  try {
    // ✅ Get total count FIRST to ensure we always have it
    const totalCount = await Song.countDocuments({ likedByUsers: userObjectId });
    
    // ✅ Handle empty case immediately
    if (totalCount === 0) {
      return {
        songs: [],
        totalCount: 0, // ✅ Explicitly set to 0
        hasNextPage: false,
        hasPreviousPage: false
      };
    }

    const songs = await Song.find({ likedByUsers: userObjectId })
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title' })
      .select('_id title mood tempo subMoods artwork genre trackNumber createdAt duration featuringArtist streamAudioFileUrl audioFileUrl playCount downloadCount likesCount trendingScore likedByUsers')
      .skip(offset)
      .limit(limit)
      .lean();



    return {
      songs: songs,
      totalCount: totalCount, // ✅ Use the pre-calculated count
      hasNextPage: offset + limit < totalCount,
      hasPreviousPage: offset > 0
    };

  } catch (mongoError) {
    console.error('MongoDB fallback failed:', mongoError);
    
    // ✅ Return valid structure even in error cases to avoid null totalCount
    return {
      songs: [],
      totalCount: 0, // ✅ Never return null
      hasNextPage: false,
      hasPreviousPage: false
    };
  }
};