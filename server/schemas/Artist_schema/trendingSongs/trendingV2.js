
import {Song} from "../../../models/Artist/index_artist.js";
import { trendIndexZSet } from "../Redis/keys.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { similarSongsRepair } from "../similarSongs/similasongResolver.js";





const normalizeSong = (song) => ({
  ...song,
  artistFollowers: Array.isArray(song.artist?.followers)
    ? song.artist.followers.length
    : 0,
  mood: song.mood || [],
  subMoods: song.subMoods || [],
  composer: Array.isArray(song.composer) ? song.composer : [],
  producer: Array.isArray(song.producer) ? song.producer : [],
  likesCount: song.likedByUsers?.length || song.likesCount || 0,
  downloadCount: song.downloadCount || 0,
  playCount: song.playCount || 0,
  shareCount: song.shareCount || 0,
  artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
});




export const trendingSongsV2 = async (_parent, { limit }) => {
  const requested = Math.max(1, Math.min(Number(limit) || 10, 50)); // guard
  const CACHE_LIMIT = 20; 
  const take = Math.max(requested, Math.min(CACHE_LIMIT, 50)); 

  let redis;
  try {
    redis = await getRedis();
  } catch {
    redis = null;
  }

  const hasArtist = (song) => Boolean(song?.artist?._id);

  const normalize = (song) => ({
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
    trendingScore: Number(song.trendingScore || 0),
  });

  // --------
  // 1) Payload cache hit
  // --------
  if (redis) {
    try {
      const cached = await redis.get(TRENDING_SONGS_CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length) {
          const safe = list.filter(hasArtist);
          if (safe.length >= requested) return safe.slice(0, requested);
          // else fall through to try ZSET and refill cache
        }
      }
    } catch (e) {
      console.warn("Trending payload cache read failed:", e?.message || e);
    }
  }


  // Helper: hydrate by ids and preserve order
  const hydrateByIds = async (ids) => {
    if (!ids?.length) return [];

    const docs = await Song.find({ _id: { $in: ids } })
    .populate({
      path: "artist",
      select:
        "artistAka country bio artistDownloadCounts followersCount profileImage bookingAvailability",
    })
      .populate({
        path: "album",
        select: "title releaseDate albumCoverImage",
      })
      .lean();

    const map = new Map(docs.map((s) => [s._id.toString(), s]));

    return ids
      .map((id) => map.get(String(id)))
      .filter(Boolean)
      .filter(hasArtist)
      .map(normalize);
  };

  // --------
  // 2) ZSET IDs fallback (longer TTL source-of-truth)
  // --------
  if (redis) {
    try {
      const ids = await redis.zRange(trendIndexZSet, 0, take - 1, { REV: true });

      if (Array.isArray(ids) && ids.length) {
        const hydrated = await hydrateByIds(ids);

        // If we got enough, refresh payload cache and return
        if (hydrated.length) {
          try {
            await redis.set(
              TRENDING_SONGS_CACHE_KEY,
              JSON.stringify(hydrated.slice(0, take)),
              { EX: CACHE_TTL_SECONDS } // short TTL for payload list
            );
          } catch (e) {
            console.warn("Trending payload cache write failed:", e?.message || e);
          }

          if (hydrated.length >= requested) return hydrated.slice(0, requested);
          // else fall through to DB to fill the gap
        }
      }
    } catch (e) {
      console.warn("Trending zset read/hydrate failed:", e?.message || e);
    }
  }

  // --------
  // 3) DB fallback (authoritative compute)
  // --------
  try {
    // Overfetch to survive filtering broken artist refs
    const fromDb = await Song.find({
      visibility: { $ne: "private" },
      artist: { $exists: true, $ne: null },
    })
      .sort({ trendingScore: -1, createdAt: -1, _id: -1 })
      .limit(take * 3)
      .populate({
        path: "artist",
        select:
          "artistAka country bio artistDownloadCounts followersCount profileImage bookingAvailability",
      })
      .populate({
        path: "album",
        select: "title releaseDate albumCoverImage",
      })
      .lean();

    const normalized = fromDb
      .filter(hasArtist)
      .map(normalize)
      .slice(0, take);

    // Backfill Redis structures
    if (redis) {
      // (a) refresh payload cache
      try {
        await redis.set(
          TRENDING_SONGS_CACHE_KEY,
          JSON.stringify(normalized),
          { EX: CACHE_TTL_SECONDS }
        );
      } catch (e) {
        console.warn("Trending payload cache write failed:", e?.message || e);
      }

      // (b) optional: backfill zset ids so next time hydrate is fast
      try {
        const commands = normalized.map((s) => ({
          score: Number(s.trendingScore || 0) || 1000,
          value: s._id.toString(),
        }));
        if (commands.length) {
          await redis.zAdd(trendIndexZSet, commands);
        }
      } catch {
        // ignore
      }
    }

    return normalized.slice(0, requested);
  } catch (error) {
    console.error("Trending songs error:", error);
    return [];
  }
};
