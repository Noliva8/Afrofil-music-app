import { Song } from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { NEW_UPLOADS_CACHE_KEY } from "../Redis/keys.js";
export const CACHE_TTL_SECONDS = 60;






export const newUploads = async (_parent, { limit }) => {
  const requested = Math.max(1, Math.min(Number(limit), 50)); // guard
  const CACHE_LIMIT = 20;
  
  let redis;
  try {
    redis = await getRedis();
  } catch {
    redis = null;
  }

  // 1) Redis hit: slice and return
  if (redis) {
    try {
      const cached = await redis.get(NEW_UPLOADS_CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          return list.slice(0, requested);
        }
      }
    } catch (e) {
      console.warn("New uploads cache read failed:", e?.message || e);
    }
  }

  // 2) DB fallback: fetch newest CACHE_LIMIT, normalize, cache
  try {
    const songsFromDb = await Song.find({ visibility: { $ne: "private" } })
      .sort({ createdAt: -1, _id: -1 }) // newest first, deterministic
      .limit(CACHE_LIMIT)
    .populate({
      path: "artist",
      select:
        "artistAka country bio artistDownloadCounts followersCount bookingAvailability",
    })
      .populate({
        path: "album",
        select: "title releaseDate",
      })
      .lean();

    const normalized = songsFromDb.map((song) => ({
      ...song,
      artistFollowers: Number(song.artist?.followersCount || 0),
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
        await redis.set(
          NEW_UPLOADS_CACHE_KEY,
          JSON.stringify(normalized),
          { EX: CACHE_TTL_SECONDS }
        );
      } catch (e) {
        console.warn("New uploads cache write failed:", e?.message || e);
      }
    }

    return normalized.slice(0, requested);
  } catch (error) {
    console.error("New uploads error:", error);
    return [];
  }
};
