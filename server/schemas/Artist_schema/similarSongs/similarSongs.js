// import { Song } from '../../../models/Artist/index_artist.js';
// import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
// import { getSongRedis } from '../Redis/songCreateRedis.js';
// import { createSongRedis } from '../Redis/songCreateRedis.js';
// import { GraphQLError } from 'graphql';

// // Helper functions
// // ---------------

// const asArray = (value) => {
//   if (Array.isArray(value)) return value.filter(Boolean);
//   if (value) return [value];
//   return [];
// };

// const normalizeTempo = (tempo) => {
//   const num = Number(tempo);
//   return Number.isFinite(num) ? num : 0;
// };

// // Main resolver
// export async function similarSongs(_, { songId }, context) {
//   console.log('resolver of similarSongs is called for songId:', songId);
  
//   try {
//     // Validate songId
//     if (!songId || typeof songId !== 'string') {
//       throw new GraphQLError('Invalid song ID provided', {
//         extensions: { code: 'BAD_USER_INPUT' }
//       });
//     }

//     // Try to get clicked song from Redis first
//     let clickedSong = await getSongRedis(songId);
    
//     // If not in Redis, fetch from database with proper population
//     if (!clickedSong) {
//       console.log('Song not found in Redis, querying database...');
//       clickedSong = await Song.findById(songId)
//         .populate('artist', 'country artistAka')
//         .populate('album', 'title');
      
//       if (!clickedSong) {
//         throw new GraphQLError('Song not found', {
//           extensions: { code: 'NOT_FOUND' }
//         });
//       }
      
//       // Cache the song in Redis for future requests
//       await createSongRedis(clickedSong);
//     }

//     console.log('Structure of clicked song:', JSON.stringify(clickedSong, null, 2));

//     // Get similar songs using optimized query
//     const similarSongs = await findSimilarSongsOptimized(clickedSong, 20);
    
//     console.log(`Found ${similarSongs.length} similar songs`);
    
//     return similarSongs;

//   } catch (error) {
//     console.error('Error in similarSongs resolver:', error);
    
//     if (error instanceof GraphQLError) {
//       throw error;
//     }
    
//     throw new GraphQLError('Failed to fetch similar songs', {
//       extensions: { 
//         code: 'INTERNAL_ERROR',
//         details: error.message 
//       }
//     });
//   }
// }

// // Optimized similar songs finder
// async function findSimilarSongsOptimized(sourceSong, limit = 20) {
//   const redis = await getRedis();

//   const cacheKey = `similar_songs:${sourceSong._id.toString()}`;
  
//   // Try to get from Redis cache first
//   try {
//     const cached = await redis.get(cacheKey);
//     if (cached) {
//       console.log('Cache hit for similar songs');
//       const parsed = JSON.parse(cached);
      
//       // Re-hydrate the songs from database to get full populated data
//       const songIds = parsed.map(song => song._id);
//       const populatedSongs = await Song.find({ _id: { $in: songIds } })
//         .populate('artist', 'artistAka country')
//         .populate('album', 'title')
//         .sort({ trendingScore: -1, releaseDate: -1 });
      
//       return populatedSongs;
//     }
//   } catch (cacheError) {
//     console.warn('Redis cache error, proceeding with database query:', cacheError);
//   }

//   const {
//     _id: sourceId,
//     artist,
//     album,
//     genre,
//     mood,
//     subMoods,
//     tempo
//   } = sourceSong;

//   const country = artist?.country;
//   const sourceTempo = normalizeTempo(tempo);

//   console.log(`Finding similar songs for: ${sourceSong.title}, Country: ${country}, Tempo: ${sourceTempo}`);

//   // If no artist country, fallback to recent trending songs
//   if (!country) {
//     console.log('No country found, using fallback songs');
//     return await getFallbackSongs(sourceSong, limit);
//   }

//   // Use aggregation pipeline for better performance
//   const similarSongs = await Song.aggregate([
//     {
//       $lookup: {
//         from: 'artists',
//         localField: 'artist',
//         foreignField: '_id',
//         as: 'artistInfo'
//       }
//     },
//     {
//       $unwind: '$artistInfo'
//     },
//     {
//       $match: {
//         _id: { $ne: sourceId },
//         'artistInfo.country': country
//       }
//     },
//     {
//       $addFields: {
//         similarityScore: {
//           $add: [
//             // High score for exact matches
//             { $cond: [{ $eq: ['$artist', artist._id] }, 100, 0] },
//             { $cond: [{ $and: [album, { $eq: ['$album', album._id] }] }, 80, 0] },
//             { $cond: [{ $eq: ['$genre', genre] }, 60, 0] },
            
//             // Mood matching
//             {
//               $cond: [{
//                 $gt: [{
//                   $size: {
//                     $setIntersection: [asArray(mood), asArray('$mood')]
//                   }
//                 }, 0]
//               }, 40, 0]
//             },
            
//             // SubMood matching
//             {
//               $cond: [{
//                 $gt: [{
//                   $size: {
//                     $setIntersection: [asArray(subMoods), asArray('$subMoods')]
//                   }
//                 }, 0]
//               }, 30, 0]
//             },
            
//             // Tempo similarity (closer tempo = higher score)
//             {
//               $cond: [{
//                 $and: [
//                   { $gte: ['$tempo', sourceTempo - 10] },
//                   { $lte: ['$tempo', sourceTempo + 10] }
//                 ]
//               }, 25, 
//               {
//                 $cond: [{
//                   $and: [
//                     { $gte: ['$tempo', sourceTempo - 20] },
//                     { $lte: ['$tempo', sourceTempo + 20] }
//                   ]
//                 }, 15, 0]
//               }]
//             },
            
//             // Boost trending songs
//             { $multiply: ['$trendingScore', 0.1] },
            
//             // Boost recent songs (last 90 days)
//             {
//               $cond: [{
//                 $gte: ['$releaseDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)]
//               }, 10, 0]
//             }
//           ]
//         }
//       }
//     },
//     {
//       $sort: {
//         similarityScore: -1,
//         trendingScore: -1,
//         releaseDate: -1
//       }
//     },
//     {
//       $limit: limit * 2 // Get more for diversity filtering
//     },
//     {
//       $project: {
//         artistInfo: 0,
//         similarityScore: 0
//       }
//     }
//   ]);

//   // Apply diversity filtering to avoid too many songs from same artist/album
//   const diversifiedSongs = applyDiversityFilter(similarSongs, limit);
  
//   // Convert aggregation results to full Mongoose documents with population
//   const songIds = diversifiedSongs.map(song => song._id);
//   const populatedSongs = await Song.find({ _id: { $in: songIds } })
//     .populate('artist', 'artistAka country')
//     .populate('album', 'title')
//     .sort({ trendingScore: -1, releaseDate: -1 });

//   // Cache the result in Redis (only IDs to save space)
//   try {
//     const cacheData = populatedSongs.map(song => ({
//       _id: song._id.toString(),
//       title: song.title,
//       artist: song.artist?._id,
//       album: song.album?._id
//     }));
    
//     await redis.setex(cacheKey, 300, JSON.stringify(cacheData)); // Cache for 5 minutes
//     console.log('Cached similar songs result');
//   } catch (cacheError) {
//     console.warn('Failed to cache similar songs:', cacheError);
//   }

//   return populatedSongs;
// }

// // Apply diversity to avoid repetitive songs
// function applyDiversityFilter(songs, limit) {
//   const result = [];
//   const artistCount = new Map();
//   const albumCount = new Map();
  
//   for (const song of songs) {
//     if (result.length >= limit) break;
    
//     const artistId = song.artist?.toString();
//     const albumId = song.album?.toString();
    
//     // Check artist diversity (max 3 songs per artist in first 10)
//     const currentArtistCount = artistCount.get(artistId) || 0;
//     if (result.length < 10 && currentArtistCount >= 3) {
//       continue;
//     }
    
//     // Check album diversity (max 2 songs per album in first 10)
//     const currentAlbumCount = albumCount.get(albumId) || 0;
//     if (result.length < 10 && currentAlbumCount >= 2) {
//       continue;
//     }
    
//     result.push(song);
//     artistCount.set(artistId, currentArtistCount + 1);
//     albumCount.set(albumId, currentAlbumCount + 1);
//   }
  
//   return result;
// }

// // Fallback function
// async function getFallbackSongs(sourceSong, limit, excludeIds = new Set()) {
//   excludeIds.add(sourceSong._id.toString());
  
//   const fallbackSongs = await Song.find({
//     _id: { $nin: Array.from(excludeIds) }
//   })
//     .populate('artist', 'artistAka country')
//     .populate('album', 'title')
//     .sort({ trendingScore: -1, releaseDate: -1 })
//     .limit(limit);

//   return fallbackSongs;
// }















/** ---------- Similar Songs Finder (Redis-first, DB fallback) ---------- */



import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { Song, Artist} from "../../../models/Artist/index_artist.js";
import { withTimeout, C } from '../Redis/songCreateRedis.js';

const OVERFETCH = 3;           
const TEMPO_WIN = 2;          

const songKey = (id) => `${C.SONG_PREFIX}${id}`;

/* ------------- small utils ------------- */
const uniq = (arr) => [...new Set(arr)];
const toId = (v) => (v ? String(v) : '');
const pickPrimary = (arrOrStr) => Array.isArray(arrOrStr) ? (arrOrStr[0] || '') : (arrOrStr || '');

/* ------------- seed: try Redis hash -> DB ------------- */
async function getSeed(redis, songId) {
  // Redis hash -> field "doc"
  const raw = await withTimeout(redis.hGet(songKey(songId), 'doc'), 1500, 'seed hget timeout');
  if (raw) {
    try {
      const s = JSON.parse(raw);
      return {
        _id: toId(s._id || songId),
        artist: toId(s.artist),
        album: toId(s.album),
        genre: (s.genre || '').toLowerCase().trim(),
        mood: pickPrimary(s.mood || ''),
        subMood: pickPrimary(s.subMoods || s.subMood || s.submood || ''),
        tempo: Number(s.tempo || 0),
        country: (s.country || '').toLowerCase().trim(), // denormalized in Redis write path
      };
    } catch {/* fall through */}
  }

  // DB fallback
  const doc = await Song.findById(songId)
    .select('_id artist album genre mood subMoods tempo')
    .populate({ path: 'artist', select: '_id country' })
    .lean();
  if (!doc) return null;

  return {
    _id: toId(doc._id),
    artist: toId(doc.artist?._id || doc.artist),
    album: toId(doc.album?._id || doc.album),
    genre: (doc.genre || '').toLowerCase().trim(),
    mood: pickPrimary(doc.mood || ''),
    subMood: pickPrimary(doc.subMoods || ''),
    tempo: Number(doc.tempo || 0),
    country: (doc.artist?.country || '').toLowerCase().trim(),
  };
}

/* ------------- Similarity Key Generator ------------- */
function simKeysForSongDoc(song) {
  const keys = [];
  const {
    artist, album, genre, mood = [], subMoods = [], 
    tempo, tempoBucket, country
  } = song;

  // Helper to create safe Redis keys
  const safeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Exact matches (highest priority)
  if (artist) keys.push(`sim:artist:${safeKey(artist)}`);
  if (album) keys.push(`sim:album:${safeKey(album)}`);
  
  // Genre-based
  if (genre) keys.push(`sim:genre:${safeKey(genre)}`);
  
  // Mood-based (handle arrays)
  const moods = Array.isArray(mood) ? mood : [mood].filter(Boolean);
  const subMoodsArr = Array.isArray(subMoods) ? subMoods : [subMoods].filter(Boolean);
  
  moods.forEach(m => {
    if (m) {
      keys.push(`sim:mood:${safeKey(m)}`);
      // Mood + SubMood combinations
      subMoodsArr.forEach(sm => {
        if (sm) keys.push(`sim:mood_combo:${safeKey(m)}:${safeKey(sm)}`);
      });
    }
  });
  
  subMoodsArr.forEach(sm => {
    if (sm) keys.push(`sim:submood:${safeKey(sm)}`);
  });

  // Tempo-based (bucketed for better matching)
  if (tempo || tempoBucket) {
    const bucket = tempoBucket || Math.floor((tempo || 120) / 10) * 10;
    keys.push(`sim:tempo:${bucket}`);
  }

  // Country-based
  if (country) keys.push(`sim:country:${safeKey(country)}`);

  // Composite keys (medium priority)
  if (genre && moods.length) {
    moods.forEach(m => {
      if (m) keys.push(`sim:genre_mood:${safeKey(genre)}:${safeKey(m)}`);
    });
  }

  if (country && genre) {
    keys.push(`sim:country_genre:${safeKey(country)}:${safeKey(genre)}`);
  }

  return uniq(keys.filter(Boolean));
}


async function batchGetSongsFromRedis(redis, ids) {
  if (!ids?.length) return [];

  try {
    const pipe = redis.multi();
    ids.forEach(id => pipe.hGet(songKey(id), 'doc'));
    
    const res = await withTimeout(
      pipe.exec(), 
      3000, 
      'songs hget pipeline timeout'
    );

    const out = [];
    for (let i = 0; i < res.length; i++) {
      const result = res[i];
      if (result && result[1]) { // [error, result] format
        try {
          const parsed = JSON.parse(result[1]);
          out.push(parsed);
        } catch (parseError) {
          console.warn(`Failed to parse song ${ids[i]}:`, parseError.message);
        }
      }
    }
    return out;
  } catch (error) {
    console.error('Batch get from Redis failed:', error);
    return [];
  }
}

/* ------------- hydrate artist/album for Redis docs ------------- */
async function hydrateArtistsAlbums(redisDocs) {
  const artistIds = uniq(
    redisDocs.map(s => toId(s.artist)).filter(Boolean)
  );
  const albumIds = uniq(
    redisDocs.map(s => toId(s.album)).filter(Boolean)
  );

  // Prefer Redis helpers if you have them; else DB
  let artistsMap = new Map();
  let albumsMap  = new Map();

  // TRY Redis helpers (uncomment if available)
  // try {
  //   const [artists, albums] = await Promise.all([
  //     getMultipleArtistsRedis(artistIds),
  //     getMultipleAlbumsRedis(albumIds),
  //   ]);
  //   artistsMap = new Map(artists.map(a => [toId(a._id), a]));
  //   albumsMap  = new Map(albums.map(a => [toId(a._id), a]));
  // } catch { /* fall back to DB below */ }

  if (!artistsMap.size && artistIds.length) {
    const artists = await Artist.find({ _id: { $in: artistIds } })
      .select('_id artistAka country').lean();
    artistsMap = new Map(artists.map(a => [toId(a._id), a]));
  }

  if (!albumsMap.size && albumIds.length) {
    const albums = await Song.db.model('Album').find({ _id: { $in: albumIds } })
      .select('_id title').lean();
    albumsMap = new Map(albums.map(a => [toId(a._id), a]));
  }

  return { artistsMap, albumsMap };
}

/* ------------- DTO for GraphQL ------------- */
function toDTO(s, artistsMap, albumsMap) {
  const a = s.artist ? artistsMap.get(toId(s.artist)) : null;
  const alb = s.album ? albumsMap.get(toId(s.album)) : null;
  return {
    _id: toId(s._id),
    title: s.title,
    artwork: s.artwork,
    audioFileUrl: s.audioFileUrl,
    streamAudioFileUrl: s.streamAudioFileUrl,
    duration: s.duration,
    tempo: s.tempo,
    genre: s.genre,
    mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
    subMoods: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
    lyrics: s.lyrics,
    composer: s.composer,
    producer: s.producer,
    releaseDate: s.releaseDate,
    trackNumber: s.trackNumber,
    trendingScore: s.trendingScore || 0,
    artist: a ? { _id: toId(a._id), artistAka: a.artistAka, country: a.country } : null,
    album:  alb ? { _id: toId(alb._id), title: alb.title } : null,
  };
}

/* ------------- Redis-first progressive fill ------------- */
async function fillFromRedis(redis, seed, limit, excludeSet) {
  const keys = simKeysForSongDoc({
    artist: seed.artist,
    album: seed.album,
    genre: seed.genre,
    mood: [seed.mood].filter(Boolean),
    subMoods: [seed.subMood].filter(Boolean),
    tempo: seed.tempo,
    country: seed.country,
  });

  if (!keys.length) return [];

  // Get song counts for each key to prioritize
  const countPipeline = redis.multi();
  keys.forEach(key => countPipeline.zcard(key));
  
  const counts = await withTimeout(
    countPipeline.exec(), 
    2000, 
    'sim key counts timeout'
  ).catch(() => []);

  // Sort keys by song count (descending)
  const prioritizedKeys = keys.map((key, i) => ({
    key,
    count: counts[i]?.[1] || 0
  })).filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(item => item.key);

  const picked = new Set();
  const batchSize = Math.min(limit * OVERFETCH, 100); // Avoid too large batches

  for (const key of prioritizedKeys) {
    if (picked.size >= limit) break;
    
    const remaining = limit - picked.size;
    const fetchCount = Math.min(batchSize, remaining * OVERFETCH);

    try {
      const ids = await withTimeout(
        redis.zrevrange(key, 0, fetchCount - 1),
        1500,
        `sim zrange timeout for ${key}`
      );

      for (const id of ids) {
        if (excludeSet.has(id) || id === seed._id) continue;
        if (picked.size >= limit) break;
        
        picked.add(id);
        excludeSet.add(id);
      }
    } catch (error) {
      console.warn(`Failed to fetch from key ${key}:`, error.message);
      continue;
    }
  }

  if (!picked.size) return [];

  const pickedArray = Array.from(picked);
  const redisDocs = await batchGetSongsFromRedis(redis, pickedArray);
  
  if (!redisDocs.length) return [];

  const { artistsMap, albumsMap } = await hydrateArtistsAlbums(redisDocs);
  
  return pickedArray
    .map(id => {
      const doc = redisDocs.find(d => toId(d._id) === id);
      return doc ? toDTO(doc, artistsMap, albumsMap) : null;
    })
    .filter(d => d && d.artist) // Ensure valid documents with artists
    .slice(0, limit);
}

/* ------------- DB fallback with same relaxation ------------- */
function buildDbQueryForLevel(level, seed, countryArtistIds) {
  const q = { _id: { $ne: seed._id } };

  for (const c of level.criteria || []) {
    switch (c) {
      case 'artist':  q.artist = seed.artist; break;
      case 'album':   q.album  = seed.album; break;
      case 'genre':   if (seed.genre) q.genre = seed.genre; break;
      case 'mood':    if (seed.mood)  q.mood = { $in: [seed.mood] }; break;
      case 'subMood': if (seed.subMood) q.subMoods = { $in: [seed.subMood] }; break;
      case 'tempo':   if (Number.isFinite(seed.tempo)) q.tempo = { $gte: seed.tempo - TEMPO_WIN, $lte: seed.tempo + TEMPO_WIN }; break;
      case 'country':
        if (countryArtistIds?.length) {
          // merge with artist if present
          q.artist = q.artist
            ? q.artist // 'artist' criterion already constrains it
            : { $in: countryArtistIds };
        }
        break;
      default: break;
    }
  }
  return q;
}

async function fillFromDb(seed, limit, excludeSet) {
  const out = [];
  // resolve country->artistIds once
  let countryArtistIds = null;
  if (seed.country) {
    const artists = await Artist.find({ country: seed.country })
      .select('_id').lean();
    countryArtistIds = artists.map(a => a._id);
  }

  for (const lvl of C.SIMILARITY_LEVELS) {
    if (out.length >= limit) break;
    const remaining = limit - out.length;

    const q = buildDbQueryForLevel(lvl, seed, countryArtistIds);
    const docs = await Song.find(q)
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(remaining * OVERFETCH)
      .select('_id title artwork audioFileUrl streamAudioFileUrl duration tempo genre mood subMoods lyrics composer producer releaseDate trackNumber trendingScore artist album')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album',  select: 'title' })
      .lean();

    for (const s of docs) {
      const id = toId(s._id);
      if (excludeSet.has(id) || id === seed._id) continue;
      excludeSet.add(id);

      out.push({
        _id: id,
        title: s.title,
        artwork: s.artwork,
        audioFileUrl: s.audioFileUrl,
        streamAudioFileUrl: s.streamAudioFileUrl,
        duration: s.duration,
        tempo: s.tempo,
        genre: s.genre,
        mood: s.mood,
        subMoods: s.subMoods,
        lyrics: s.lyrics,
        composer: s.composer,
        producer: s.producer,
        releaseDate: s.releaseDate,
        trackNumber: s.trackNumber,
        trendingScore: s.trendingScore || 0,
        artist: s.artist ? { _id: toId(s.artist._id), artistAka: s.artist.artistAka, country: s.artist.country } : null,
        album:  s.album  ? { _id: toId(s.album._id),  title: s.album.title } : null,
      });

      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}


/* ------------- Cache Warming for Popular Songs ------------- */
export async function warmSimilarityCache(topSongIds = [], concurrency = 5) {

  const redis = await getRedis();
  const warmed = new Set();

  // Process in batches to avoid overwhelming Redis
  for (let i = 0; i < topSongIds.length; i += concurrency) {
    const batch = topSongIds.slice(i, i + concurrency);
    
    await Promise.allSettled(
      batch.map(async (songId) => {
        try {
          const seed = await getSeed(redis, songId);
          if (!seed) return;

          const keys = simKeysForSongDoc({
            artist: seed.artist,
            album: seed.album,
            genre: seed.genre,
            mood: [seed.mood].filter(Boolean),
            subMoods: [seed.subMood].filter(Boolean),
            tempo: seed.tempo,
            country: seed.country,
          });

          // Ensure these keys exist by adding the song to them
          const pipeline = redis.multi();
          keys.forEach(key => {
            pipeline.zadd(key, Date.now(), songId); // Use timestamp as score
            pipeline.expire(key, 60 * 60 * 24 * 7); // Keep for 1 week
          });

          await pipeline.exec();
          warmed.add(songId);
        } catch (error) {
          console.warn(`Failed to warm cache for ${songId}:`, error.message);
        }
      })
    );
  }

  return Array.from(warmed);
}

/* ------------- Metrics and Monitoring ------------- */
class SimilarityMetrics {
  constructor() {
    this.requests = 0;
    this.redisHits = 0;
    this.dbFallbacks = 0;
    this.errors = 0;
    this.responseTimes = [];
  }

  recordRequest(source, duration, success = true) {
    this.requests++;
    if (source === 'redis') this.redisHits++;
    if (source === 'db') this.dbFallbacks++;
    if (!success) this.errors++;
    
    this.responseTimes.push(duration);
    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  getStats() {
    const avgTime = this.responseTimes.length 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    return {
      requests: this.requests,
      redisHitRate: this.requests ? (this.redisHits / this.requests) * 100 : 0,
      dbFallbackRate: this.requests ? (this.dbFallbacks / this.requests) * 100 : 0,
      errorRate: this.requests ? (this.errors / this.requests) * 100 : 0,
      avgResponseTime: avgTime,
      sampleSize: this.responseTimes.length
    };
  }
}

const metrics = new SimilarityMetrics();

// ---------------------------------





// Enhanced main resolver function with metrics
export async function similarSongs(songId, { limit = 20, excludeIds = [] } = {}) {
  const startTime = Date.now();
  console.log(`[DEBUG] Finding similar songs for: ${songId}`);
  
  // kickoffBackfillOnce();

  try {
    const redis = await getRedis();
    const seed = await getSeed(redis, songId);
    
    if (!seed) {
      console.log('[DEBUG] No seed song found');
      return [];
    }

    console.log('[DEBUG] Seed song:', {
      id: seed._id,
      artist: seed.artist,
      genre: seed.genre,
      mood: seed.mood,
      country: seed.country
    });

    const excludeSet = new Set([toId(songId), ...excludeIds.map(toId)]);
    
    // 1) Check what similarity keys we're generating
    const similarityKeys = simKeysForSongDoc({
      artist: seed.artist,
      album: seed.album,
      genre: seed.genre,
      mood: [seed.mood].filter(Boolean),
      subMoods: [seed.subMood].filter(Boolean),
      tempo: seed.tempo,
      country: seed.country,
    });
    
    console.log('[DEBUG] Similarity keys to search:', similarityKeys);
    
    // 2) Check if these keys exist in Redis
    const keyChecks = redis.multi();
    similarityKeys.forEach(key => keyChecks.exists(key));
    
    const keyExists = await keyChecks.exec();
    const existingKeys = similarityKeys.filter((key, i) => keyExists[i][1] > 0);
    
    console.log('[DEBUG] Existing keys in Redis:', existingKeys);
    
    if (existingKeys.length === 0) {
      console.log('[DEBUG] No similarity indices found, falling back to DB');
      // Fall directly to DB since no indices exist
      const fromDb = await fillFromDb(seed, limit, excludeSet);
      return fromDb;
    }

    // 3) Try Redis search with existing keys only
    const fromRedis = await fillFromRedis(redis, seed, limit, excludeSet);
    console.log('[DEBUG] Found from Redis:', fromRedis.length);
    
    if (fromRedis.length >= limit) {
      return fromRedis;
    }

    // 4) DB fallback to top off
    const need = limit - fromRedis.length;
    const fromDb = await fillFromDb(seed, need, new Set([...excludeSet, ...fromRedis.map(s => toId(s._id))]));
    console.log('[DEBUG] Found from DB:', fromDb.length);

    const result = [...fromRedis, ...fromDb].slice(0, limit);
    console.log(`[DEBUG] Total results: ${result.length}, Time: ${Date.now() - startTime}ms`);
    
    return result;
    
  } catch (error) {
    console.error('[DEBUG] Similar songs error:', error);
    return []; // Graceful fallback
  }
}

// Export metrics for monitoring
export function getSimilarityMetrics() {
  return metrics.getStats();
}











// helper used by key generation so ":" and spaces don't break your key format
const keyPart = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[:\s]+/g, '-');

const TEMPO_BUCKET_SIZE = 5;
const tempoBucket = (n) => Math.round((Number(n) || 0) / TEMPO_BUCKET_SIZE) * TEMPO_BUCKET_SIZE;


export async function bulkCreateSimilarityIndices({ batchSize = 300 } = {}) {
  const redis = await getRedis();
  let lastId = null;
  let total = 0;

  console.log(`[similarity-backfill] start batchSize=${batchSize}`);

  while (true) {
    const query = lastId ? { _id: { $gt: lastId } } : {};
    const batch = await Song.find(query)
      .sort({ _id: 1 })
      .limit(batchSize)
      .select('_id title artist album genre mood subMoods tempo trendingScore releaseDate createdAt artwork audioFileUrl streamAudioFileUrl duration composer producer trackNumber')
      .populate({ path: 'artist', select: 'country artistAka' })
      .populate({ path: 'album',  select: 'title' })
      .lean();

    if (!batch.length) break;

    const pipe = redis.multi();

    for (const s of batch) {
      const id       = String(s._id);
      const artistId = String(s.artist?._id || s.artist || '');
      const albumId  = String(s.album?._id  || s.album  || '');
      const genre    = (s.genre || '').trim().toLowerCase();
      const moods    = Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []);
      const subMoods = Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []);
      const mood0    = (moods[0] || '').trim().toLowerCase();
      const sub0     = (subMoods[0] || '').trim().toLowerCase();
      const tempo    = Number.isFinite(+s.tempo) ? Math.round(+s.tempo) : 0;
      const tBucket  = tempoBucket(tempo);
      const country  = (s.artist?.country || '').trim().toLowerCase();

      // 1) Write (or refresh) the Redis song hash, so seed reads are fast
      const doc = {
        _id: id,
        title: s.title,
        artist: artistId,
        album: albumId,
        genre,
        mood: moods.map(v => v.trim().toLowerCase()),
        subMoods: subMoods.map(v => v.trim().toLowerCase()),
        tempo,
        tempoBucket: tBucket,
        country,
        releaseDate: s.releaseDate || s.createdAt,
        createdAt: s.createdAt,
        updatedAt: new Date(),
        artwork: s.artwork,
        audioFileUrl: s.audioFileUrl,
        streamAudioFileUrl: s.streamAudioFileUrl,
        duration: s.duration,
        composer: s.composer,
        producer: Array.isArray(s.producer) ? s.producer.map(p => ({
          name: p?.name || '',
          role: p?.role || '',
          nameSlug: keyPart(p?.name || ''),
        })) : [],
        trackNumber: s.trackNumber,
        trendingScore: Number.isFinite(+s.trendingScore) ? +s.trendingScore : 0,
      };
      pipe.hSet(songKey(id), {
        doc: JSON.stringify(doc),
        artist: artistId,
        album: albumId,
        createdAt: String(new Date(doc.createdAt).getTime()),
        updatedAt: String(Date.now()),
      });

      // 2) Facet SETs (this is what you’re missing in Insight)
      if (genre)          pipe.sAdd(C.byGenre(keyPart(genre)), id);
      if (country)        pipe.sAdd(C.byCountry(keyPart(country)), id);
      if (Number.isFinite(tBucket)) pipe.sAdd(C.byTempo(tBucket), id);
      if (artistId)       pipe.sAdd(C.byArtist(artistId), id);
      if (albumId)        pipe.sAdd(C.byAlbum(albumId), id);
      for (const m of doc.mood)     if (m)  pipe.sAdd(C.byMood(keyPart(m)), id);
      for (const sm of doc.subMoods) if (sm) pipe.sAdd(C.bySubMood(keyPart(sm)), id);

      // 3) Release indexes (optional but useful)
      const releasedMs = new Date(doc.releaseDate || doc.createdAt).getTime();
      pipe.zAdd(C.IDX_RELEASED, [{ score: releasedMs, value: id }]);
      const d  = new Date(releasedMs);
      const yy = d.getUTCFullYear();
      const ym = `${yy}${String(d.getUTCMonth() + 1).padStart(2,'0')}`;
      pipe.sAdd(C.byReleaseYear(yy), id);
      pipe.sAdd(C.byReleaseYM(ym),  id);

      // 4) Composite similarity ZSETs (what your current function already did)
      const keys = simKeysForSongDoc({
        artist: artistId,
        album:  albumId,
        genre,
        mood: [mood0].filter(Boolean),
        subMoods: [sub0].filter(Boolean),
        tempo,
        country,
      });
      const simScore =
        (Number.isFinite(s.trendingScore) ? Number(s.trendingScore) : null) ??
        releasedMs ??
        (s.createdAt ? new Date(s.createdAt).getTime() : Date.now());

      for (const k of keys) {
        pipe.zAdd(k, [{ score: simScore, value: id }]);
        if (C.SIM_TTL) pipe.expire(k, C.SIM_TTL);
      }
    }

    await pipe.exec();

    total += batch.length;
    lastId = batch[batch.length - 1]._id;
    console.log(`[similarity-backfill] indexed=${total} lastId=${lastId}`);
  }

  console.log(`[similarity-backfill] done. total indexed=${total}`);
  return { indexed: total };
}




let backfillStarted = false;

async function kickoffBackfillOnce() {
  if (backfillStarted) return;
  const r = await getRedis();

  // lock key prevents thundering herd if many requests hit at once
  const ok = await r.set('job:sim-backfill:lock', String(Date.now()), { NX: true, EX: 3600 });
  if (!ok) return;

  backfillStarted = true;
  // Do NOT await — keep the request path fast
  backfillSimilarIndexes({ batchSize: 300, onlyPublic: true })
    .catch(err => console.error('[backfill] failed:', err))
    .finally(() => { backfillStarted = false; });
}






/* ------------- Public API ------------- */
/**
 * Fill a queue of similar songs (progressive relaxation).
 * Redis-first using composite similarity keys; DB fallback to top off.
 * @param {string} songId
 * @param {object} opts
 * @param {number} opts.limit default 20
 * @param {string[]} opts.excludeIds already played/queued
 */
// export async function similarSongs(songId, { limit = 20, excludeIds = [] } = {}) {
//   const redis = await getRedis();
//   const seed = await getSeed(redis, songId);
//   if (!seed) return [];

//   const excludeSet = new Set([toId(songId), ...excludeIds.map(toId)]);

//   // 1) Redis-first
//   const fromRedis = await fillFromRedis(redis, seed, limit, excludeSet);
//   if (fromRedis.length >= limit) return fromRedis;

//   // 2) DB fallback to top off
//   const need = limit - fromRedis.length;
//   const fromDb = await fillFromDb(
//     seed,
//     need,
//     new Set([...excludeSet, ...fromRedis.map(s => toId(s._id))])
//   );

//   return [...fromRedis, ...fromDb].slice(0, limit);
// }
