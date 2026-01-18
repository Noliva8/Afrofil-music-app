import { Song } from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { NEW_UPLOADS_CACHE_KEY } from "../Redis/keys.js";
const CACHE_TTL_SECONDS = 60;

export const newUploads = async () => {
  let redis;
  try {
    redis = await getRedis();
  } catch {
    redis = null;
  }

  if (redis) {
    try {
      const cached = await redis.get(NEW_UPLOADS_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (error) {
      console.warn("New uploads cache read failed:", error?.message || error);
    }
  }

  try {
    const songs = await Song.find({ visibility: { $ne: "private" } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({ path: "artist", select: "artistAka country bio followers artistDownloadCounts" })
      .populate({ path: "album", select: "title releaseDate" })
      .lean();

    return songs.map((song) => ({
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
        await redis.set(NEW_UPLOADS_CACHE_KEY, JSON.stringify(songs), { EX: CACHE_TTL_SECONDS });
      } catch (error) {
        console.warn("New uploads cache write failed:", error?.message || error);
      }
    }

    return songs;
  } catch (error) {
    console.error("New uploads error:", error);
    return [];
  }
};
