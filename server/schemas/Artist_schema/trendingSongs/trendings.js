
import {Song} from "../../../models/Artist/index_artist.js";
import { trendIndexZSet } from "../Redis/keys.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { similarSongsRepair } from "../similarSongs/similasongResolver.js";



// export const trendingSongs = async () => {
//   const limit = 20;
//    let source = 'unknown';



//   try {
//     source = 'database';

//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find({ artist: { $exists: true, $ne: null } })
//         .sort({ playCount: -1, createdAt: -1 })
//         .limit(limit)
//         .populate({ path: 'artist', select: 'artistAka country' })
//         .populate({ path: 'album',  select: 'title' })
//         .lean(),

//       Song.aggregate([
//         { $match: { artist: { $exists: true, $ne: null } } },
//         { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find({ artist: { $exists: true, $ne: null } })
//         .sort({ downloadCount: -1, createdAt: -1 })
//         .limit(limit)
//         .populate({ path: 'artist', select: 'artistAka country' })
//         .populate({ path: 'album',  select: 'title' })
//         .lean(),

//       Song.find({ artist: { $exists: true, $ne: null } })
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .populate({ path: 'artist', select: 'artistAka country' })
//         .populate({ path: 'album',  select: 'title' })
//         .lean(),
//     ]);

//     const likedIds = topLikesAgg.map(s => s._id);
//     const topLikes = likedIds.length
//       ? await Song.find({ _id: { $in: likedIds }, artist: { $exists: true, $ne: null } })
//           .populate({ path: 'artist', select: 'artistAka country' })
//           .populate({ path: 'album',  select: 'title' })
//           .lean()
//       : [];

//     const merged = [];
//     const seen = new Set();
//     const addUnique = (songs) => {
//       for (const s of songs) {
//         const id = String(s._id);
//         if (seen.has(id)) continue;
//         if (!s.artist || typeof s.artist !== 'object' || !s.artist._id) continue;

//         merged.push({
//           ...s,
//           mood: s.mood || [],
//           subMoods: s.subMoods || [],
//           tempo: s.tempo || 0,
//           likesCount: s.likedByUsers?.length || s.likesCount || 0,
//           trendingScore: s.trendingScore || 0,
//           downloadCount: s.downloadCount || 0,
//           playCount: s.playCount || 0,
//           featuringArtist: s.featuringArtist || [],
//           genre: s.genre || '',
//           duration: s.duration || 0,
//           artwork: s.artwork || '',
//           streamAudioFileUrl: s.streamAudioFileUrl || '',
//           audioFileUrl: s.audioFileUrl || '',
//           createdAt: s.createdAt || new Date(),
//         });

//         seen.add(id);
//         if (merged.length >= limit) break;
//       }
//     };

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

//     const result = merged.slice(0, limit);

//     // Warm whole-list cache for next time
//     (async () => {
//       try {
//         const redis = await getRedis();
//         await redis.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL_SECONDS });
//         for (const song of result) createSongRedis(song).catch(() => {});
//       } catch {}
//     })();

//     return result;
//   } catch (err) {
//     console.error("❌ Database query failed:", err);
//     source = 'error';
//     return [];
//   } finally {
//     // optional light log:
//     // console.log(`📊 TRENDING SONGS SOURCE: ${source.toUpperCase()}`);
//   }
// };



export const trendingSongs = async () => {
  const client = await getRedis();



  try {

    // await similarSongsRepair(client)
    // Get ALL songs from Redis trending set



    const trendingSongIds = await client.zRange(trendIndexZSet, 0, -1, {
      REV: true // Highest scores first
    });

  

    if (trendingSongIds.length === 20) {
      // Redis has exactly 20 songs - use it directly
      const songs = await Song.find({ _id: { $in: trendingSongIds } })
        .populate({ path: 'artist', select: 'artistAka country bio followers artistDownloadCounts' })
        .populate({ path: 'album', select: 'title releaseDate' })
        .lean();

 console.log('[trendingSongs] mongo count', songs.length, 'redis count', trendingSongIds.length);

      const songMap = new Map(songs.map(song => [song._id.toString(), song]));
      
      return trendingSongIds.map(id => songMap.get(id)).filter(Boolean)
        .map(song => ({
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
    }

    // Redis has less than 20 songs - get from MongoDB and fill the gap
    const songs = await Song.find({})
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(20)
      .populate({ path: 'artist', select: 'artistAka country bio followers artistDownloadCounts' })
      .populate({ path: 'album', select: 'title releaseDate' })
      .lean();

    // Add missing songs to Redis (in background)
    const existingSongIds = new Set(trendingSongIds);
    const songsToAdd = songs.filter(song => !existingSongIds.has(song._id.toString()));
    
    if (songsToAdd.length > 0) {
      const redisCommands = songsToAdd.map(song => ({
        score: song.trendingScore || 1000,
        value: song._id.toString()
      }));

      client.zAdd(trendIndexZSet, redisCommands)
        .then(() => console.log(`✅ Added ${redisCommands.length} missing songs to Redis trending set`))
        .catch(() => {});
    }

    return songs.map(song => ({
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

  } catch (error) {
    console.error('Trending songs error:', error);
    return [];
  }
};
