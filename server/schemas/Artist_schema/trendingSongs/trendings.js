import { getMultipleAlbumsRedis } from "../Redis/albumCreateRedis.js";

import { getMultipleArtistsRedis } from "../Redis/artistCreateRedis.js";

import {Song} from "../../../models/Artist/index_artist.js";
import { redisTrending,createSongRedis } from "../Redis/songCreateRedis.js";
import { getMultipleSongsRedis } from "../Redis/songCreateRedis.js";

import { ensureSearchIndexes } from "../Redis/addIndexesForSearch.js";


import { checkRedisIndexes, debugRedisData } from "../Redis/songCreateRedis.js";




export const trendingSongs = async () => {
  const limit = 20;
   let source = 'unknown';

//    await ensureSearchIndexes();

await debugRedisData();

  // 1) get IDs (or skeletons) from Redis once
  const fromRedis = await redisTrending(limit);         

  if (Array.isArray(fromRedis) && fromRedis.length) {
    const songIds   = [...new Set(fromRedis.map(s => s._id || s).filter(Boolean).map(String))];


    const songs     = await getMultipleSongsRedis(songIds);

    const artistIds = [...new Set(songs.map(s => s.artist).filter(Boolean).map(String))];
    const albumIds  = [...new Set(songs.map(s => s.album).filter(Boolean).map(String))];

    const [artists, albums] = await Promise.all([
      getMultipleArtistsRedis(artistIds),
      getMultipleAlbumsRedis(albumIds),
    ]);

    const aMap = new Map(artists.map(a => [String(a._id), a]));
    const albMap = new Map(albums.map(a => [String(a._id), a]));

    const enriched = [];
    for (const s of songs) {
      const a = s.artist ? aMap.get(String(s.artist)) : null;
      if (!a) continue;
      const alb = s.album ? albMap.get(String(s.album)) : null;
      enriched.push({
        ...s,
        artist: { _id: a._id, artistAka: a.artistAka || '', country: a.country || '', profileImage: a.profileImage || '' },
        album: alb ? { _id: alb._id, title: alb.title || 'Unknown Album' } : { _id: 'unknown', title: 'Unknown Album' },
      });
      if (enriched.length >= limit) break;
    }
    if (enriched.length) return enriched;
  }



  // 2) Database fallback (unchanged; consider later optimizing with a single aggregation)

  try {
    source = 'database';

    const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
      Song.find({ artist: { $exists: true, $ne: null } })
        .sort({ playCount: -1, createdAt: -1 })
        .limit(limit)
        .populate({ path: 'artist', select: 'artistAka country' })
        .populate({ path: 'album',  select: 'title' })
        .lean(),

      Song.aggregate([
        { $match: { artist: { $exists: true, $ne: null } } },
        { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: limit }
      ]),

      Song.find({ artist: { $exists: true, $ne: null } })
        .sort({ downloadCount: -1, createdAt: -1 })
        .limit(limit)
        .populate({ path: 'artist', select: 'artistAka country' })
        .populate({ path: 'album',  select: 'title' })
        .lean(),

      Song.find({ artist: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate({ path: 'artist', select: 'artistAka country' })
        .populate({ path: 'album',  select: 'title' })
        .lean(),
    ]);

    const likedIds = topLikesAgg.map(s => s._id);
    const topLikes = likedIds.length
      ? await Song.find({ _id: { $in: likedIds }, artist: { $exists: true, $ne: null } })
          .populate({ path: 'artist', select: 'artistAka country' })
          .populate({ path: 'album',  select: 'title' })
          .lean()
      : [];

    const merged = [];
    const seen = new Set();
    const addUnique = (songs) => {
      for (const s of songs) {
        const id = String(s._id);
        if (seen.has(id)) continue;
        if (!s.artist || typeof s.artist !== 'object' || !s.artist._id) continue;

        merged.push({
          ...s,
          mood: s.mood || [],
          subMoods: s.subMoods || [],
          tempo: s.tempo || 0,
          likesCount: s.likedByUsers?.length || s.likesCount || 0,
          trendingScore: s.trendingScore || 0,
          downloadCount: s.downloadCount || 0,
          playCount: s.playCount || 0,
          featuringArtist: s.featuringArtist || [],
          genre: s.genre || '',
          duration: s.duration || 0,
          artwork: s.artwork || '',
          streamAudioFileUrl: s.streamAudioFileUrl || '',
          audioFileUrl: s.audioFileUrl || '',
          createdAt: s.createdAt || new Date(),
        });

        seen.add(id);
        if (merged.length >= limit) break;
      }
    };

    addUnique(topPlays);
    addUnique(topLikes);
    addUnique(topDownloads);
    addUnique(latestSongs);

    const result = merged.slice(0, limit);

    // Warm whole-list cache for next time
    (async () => {
      try {
        const redis = await getRedis();
        await redis.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL_SECONDS });
        for (const song of result) createSongRedis(song).catch(() => {});
      } catch {}
    })();

    return result;
  } catch (err) {
    console.error("❌ Database query failed:", err);
    source = 'error';
    return [];
  } finally {
    // optional light log:
    // console.log(`📊 TRENDING SONGS SOURCE: ${source.toUpperCase()}`);
  }
};