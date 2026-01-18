import { Song } from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { SUGGESTED_SONGS_CACHE_KEY, similarSongsMatches } from "../Redis/keys.js";

const CACHE_TTL_SECONDS = 60;
const LIMIT = 20;

export const suggestedSongs = async () => {
  let redis;
  try {
    redis = await getRedis();
  } catch {
    redis = null;
  }

  if (redis) {
    try {
      const cached = await redis.get(SUGGESTED_SONGS_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (error) {
      console.warn("Suggested songs cache read failed:", error?.message || error);
    }
  }

  try {
    const topSong = await Song.findOne({ visibility: { $ne: "private" } })
      .sort({ playCount: -1, trendingScore: -1, createdAt: -1 })
      .select("_id")
      .lean();

    if (!topSong?._id || !redis) {
      return [];
    }

    const similarIds = await redis.zRange(similarSongsMatches(String(topSong._id)), 0, LIMIT - 1, {
      REV: true,
    });

    if (!similarIds.length) {
      return [];
    }

    const songs = await Song.find({
      _id: { $in: similarIds },
      visibility: { $ne: "private" },
    })
      .populate({
        path: "artist",
        select: "artistAka country bio followers artistDownloadCounts profileImage",
      })
      .populate({ path: "album", select: "title releaseDate albumCoverImage" })
      .lean();

    const songMap = new Map(songs.map((song) => [String(song._id), song]));
    const ordered = similarIds.map((id) => songMap.get(String(id))).filter(Boolean);

    const mapped = ordered.map((song) => ({
      ...song,
      artistFollowers: Array.isArray(song.artist?.followers) ? song.artist.followers.length : 0,
      mood: song.mood || [],
      subMoods: song.subMoods || [],
      composer: Array.isArray(song.composer) ? song.composer : [],
      producer: Array.isArray(song.producer) ? song.producer : [],
      likesCount: song.likedByUsers?.length || song.likesCount || 0,
      downloadCount: song.downloadCount || 0,
      playCount: song.playCount || 0,
      shareCount: song.shareCount || 0,
      artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
    }));

    if (redis) {
      try {
        await redis.set(SUGGESTED_SONGS_CACHE_KEY, JSON.stringify(mapped), {
          EX: CACHE_TTL_SECONDS,
        });
      } catch (error) {
        console.warn("Suggested songs cache write failed:", error?.message || error);
      }
    }

    return mapped;
  } catch (error) {
    console.error("Suggested songs error:", error);
    return [];
  }
};
