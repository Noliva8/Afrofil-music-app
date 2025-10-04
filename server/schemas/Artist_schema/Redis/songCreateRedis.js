// ✅ works in ESM when the package is CommonJS
import redisPkg from 'redis';
const { SchemaFieldTypes } = redisPkg; 

import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import {Artist} from "../../../models/Artist/index_artist.js"


/** ---------- Config ---------- */
export const C = {
  MAX_N_SONGS: 10_000,
  SCALE: 1_000_000,                 // legacy composite scale (kept if you need it)
  MAX_MB: 15,                       // admin warning threshold (MB)
  SONG_PREFIX: "song:",             // HASH per song
  IDX_ALL: "index:songs:all",       // SET of songIds
  IDX_SCORE: "index:songs:score",   // ZSET: trending score (higher = hotter)
  IDX_PLAYS: "index:songs:plays",   // ZSET: total playCount (higher = more popular)
  IDX_CREATED: "index:songs:created", // ZSET: createdAt (sec) (higher/newer = newer)
  SIM_PREFIX: "index:sim",
  SIM_TTL: 24 * 60 * 60,
  byArtist: (artistId) => `index:artist:${artistId}:songs`,
  byAlbum:  (albumId)  => `index:album:${albumId}:songs`,

  // NEW: Similarity indices
  byGenre: (genre) => `index:genre:${genre}:songs`,
  byMood: (mood) => `index:mood:${mood}:songs`,
  bySubMood: (subMood) => `index:submood:${subMood}:songs`,
  byTempo: (tempo) => `index:tempo:${tempo}:songs`,
  byCountry: (country) => `index:country:${country}:songs`,

 byProducer: (producerSlug) => `index:producer:${producerSlug}:songs`, 

 

  IDX_RELEASED: "index:songs:released", // ZSET
  byReleaseYear : (yyyy)     => `index:released:year:${yyyy}`,     
  byReleaseYM   : (yyyymm)   => `index:released:ym:${yyyymm}`,     
  


  // Similarity search configuration

SIMILARITY_LEVELS: [
    {
      name: 'exact_match',
      criteria: ['artist', 'album', 'genre', 'mood', 'subMood', 'tempo', 'country'],
      minResults: 20,
      weight: 10
    },
    {
      name: 'high_similarity',
      criteria: ['genre', 'mood', 'subMood', 'tempo', 'country'],
      minResults: 15,
      weight: 8
    },
    {
      name: 'medium_similarity',
      criteria: ['mood', 'subMood', 'tempo', 'country'],
      minResults: 10,
      weight: 6
    },
    {
      name: 'basic_similarity',
      criteria: ['mood', 'subMood', 'country'],
      minResults: 5,
      weight: 4
    },
    {
      name: 'minimal_similarity',
      criteria: ['mood', 'country'],
      minResults: 3,
      weight: 2
    },
    {
      name: 'fallback',
      criteria: ['country'],
      minResults: 1,
      weight: 1
    }
  ]

};



const TEMPO_BUCKET_SIZE = 5; // ≈ ±2–3 BPM tolerance
const tempoBucket = (n) => Math.round((Number(n) || 0) / TEMPO_BUCKET_SIZE) * TEMPO_BUCKET_SIZE;
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const normToken = (v) => norm(v).replace(/\s+/g, ' ');
const slugToken = (v) => norm(v).replace(/\s+/g, '-');
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);




const keyPart = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[:\s]+/g, '-');

// Build composite similarity keys from C.SIMILARITY_LEVELS
function fieldValForKey(s, field) {
  switch (field) {
    case 'artist':  return keyPart(s.artist || '');
    case 'album':   return keyPart(s.album || '');
    case 'genre':   return keyPart(s.genre || '');
    case 'mood':    return keyPart(Array.isArray(s.mood) ? s.mood[0] : s.mood || '');
    case 'subMood': return keyPart(Array.isArray(s.subMoods) ? s.subMoods[0] : (s.subMood || s.submood || ''));
    case 'tempo':   return String(Number.isFinite(s.tempoBucket) ? s.tempoBucket : tempoBucket(s.tempo || 0));
    case 'country': return keyPart(s.country || '');
    default:        return '';
  }
}


function simKeysForSongDoc(s) {
  return C.SIMILARITY_LEVELS.map((lvl, idx) => {
    const parts = (lvl.criteria || []).map((c) => fieldValForKey(s, c) || '_');
    return `${C.SIM_PREFIX}:${idx + 1}:${lvl.name}:${parts.join(':')}`;
  });
}

const songKey = (id) => `${C.SONG_PREFIX}${id}`;
const nowSec = () => Math.floor(Date.now() / 1000);


// Fields we never want inside the JSON doc we store in Redis
const EXCLUDE_FROM_DOC = new Set([
  "beats",            // heavy: drop it
  "msListened",       // transient counters
  "lastAccessed",     // stored as a hash field already
  "currentlyPlaying",
  "currentlyDisplayed",
]);


/** Timeout wrapper */
export const withTimeout = (promise, timeoutMs = 5000, errorMessage = "Operation timeout") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);

/** Legacy composite score (not used for trending anymore, kept for reference) */
function computeLegacyScore(playCount, createdAtSec) {
  const pc = Number.isFinite(+playCount) ? +playCount : 0;
  const ins = Number.isFinite(+createdAtSec) ? +createdAtSec : nowSec();
  return pc * C.SCALE + ins;
}




/** Trending score = engagement * freshness
 * engagement = 1*plays + 2*downloads + 3*likes
 * freshness  = ageHours^-0.4 (gentle decay)
 */
function computeTrendingScore({ playCount = 0, downloadCount = 0, likesCount = 0, createdAtMs }) {
  const now = Date.now();
  const ageHours = Math.max(1, (now - (createdAtMs || now)) / 3_600_000);

  const engagement =
    1 * Number(playCount || 0) +
    2 * Number(downloadCount || 0) +
    3 * Number(likesCount || 0);

  const freshness = Math.pow(ageHours, -0.4);
  
  return engagement * freshness;
}






/** Parse INFO memory to MB */
export async function usedMB(r) {
  try {
    const info = await withTimeout(r.info("memory"), 2000, "Memory info timeout");
    const line = info.split("\n").find((l) => l.startsWith("used_memory:"));
    if (!line) return null;
    const bytes = Number(line.split(":")[1]);
    return Number.isFinite(bytes) ? bytes / (1024 * 1024) : null;
  } catch (error) {
    console.warn("Memory check failed:", error.message);
    return null;
  }
}


export async function notifyAdmin(subject, details) {
  console.warn("[ADMIN]", subject, details || {});
}

// Normalize a Mongo ref/ObjectId-ish field to a plain string
export function normalizeId(v) {
  if (v == null) return v;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (v._id) return String(v._id);
    if (v.$oid) return String(v.$oid);
  }
  return String(v);
}

/** Build a lean JSON doc for Redis (strip heavy/transient fields, normalize ids & counters) */


// export function buildDocForRedisJSON(baseDoc) {
//   const out = { ...baseDoc };

//   // strip unwanted fields
//   for (const k of EXCLUDE_FROM_DOC) delete out[k];

//   // normalize common relations to strings for consistency
//   if (out.artist) out.artist = normalizeId(out.artist);
//   if (out.album) out.album = normalizeId(out.album);

//  // NEW: Normalize similarity fields
//   if (out.genre) out.genre = String(out.genre).toLowerCase().trim();
//   if (out.mood) out.mood = String(out.mood).toLowerCase().trim();
//   if (out.subMood) out.subMood = String(out.subMood).toLowerCase().trim();
//   if (out.tempo) out.tempo = String(out.tempo).toLowerCase().trim();
//   if (out.artist.country) out.artist.country = String(out.artist.country).toLowerCase().trim();



//   // counters present in the doc (and also mirrored as hash scalars)
//   out.playCount = Number(out.playCount || 0);
//   out.downloadCount = Number(out.downloadCount || 0);
//   out.likesCount =
//     Number(
//       out.likesCount ??
//         (Array.isArray(out.likedByUsers) ? out.likedByUsers.length : 0)
//     ) || 0;

//   // ensure timestamps are proper dates
//   out.createdAt = out.createdAt ? new Date(out.createdAt) : new Date();
//   out.updatedAt = new Date();

//   return out;
// }

export function buildDocForRedisJSON(baseDoc, { artistCountry } = {}) {
  const out = { ...baseDoc };

  for (const k of EXCLUDE_FROM_DOC) delete out[k];

  if (out.artist) out.artist = normalizeId(out.artist);
  if (out.album)  out.album  = normalizeId(out.album);

  // strings
  if (out.genre) out.genre = normToken(out.genre);

  // arrays
  if (Array.isArray(out.mood)) out.mood = out.mood.map(normToken).filter(Boolean);
  else if (out.mood) out.mood = [normToken(out.mood)];
  else out.mood = [];

  if (Array.isArray(out.subMoods)) out.subMoods = out.subMoods.map(normToken).filter(Boolean);
  else out.subMoods = [];

  // tempo numeric + bucket convenience
  const tempoNum =
    typeof out.tempo === 'number'
      ? out.tempo
      : Number(out.tempo);
  out.tempo = Number.isFinite(tempoNum) ? Math.round(tempoNum) : 0;
  out.tempoBucket = tempoBucket(out.tempo);

  // ⬅️ denormalize country to top-level
  out.country = normToken(artistCountry || out.country || '');

  // counters
  out.playCount     = Number(out.playCount || 0);
  out.downloadCount = Number(out.downloadCount || 0);
  out.likesCount    = Number(out.likesCount ?? (Array.isArray(out.likedByUsers) ? out.likedByUsers.length : 0)) || 0;

  // timestamps
  out.createdAt  = out.createdAt  ? new Date(out.createdAt)  : new Date();
  out.releaseDate= out.releaseDate? new Date(out.releaseDate): out.createdAt;
  out.updatedAt  = new Date();

  // normalize producers array (keep original structure; add normalized fields for indexing)
  if (Array.isArray(out.producer)) {
    out.producer = out.producer.map(p => ({
      name: p?.name || '',
      role: p?.role || '',
      nameNorm: normToken(p?.name || ''),
      roleNorm: normToken(p?.role || ''),
      nameSlug: slugToken(p?.name || ''),
    }));
  } else {
    out.producer = [];
  }

  return out;
}


/** Recompute and store trending score for a song */
async function recomputeTrendingFor(r, songId) {
  const key = songKey(songId);
  const h = await r.hGetAll(key);
  if (!h || !h.doc) return;

  const doc = JSON.parse(h.doc);
  const playCount = Number(h.playCount ?? doc.playCount ?? 0);
  const downloadCount = Number(h.downloadCount ?? doc.downloadCount ?? 0);
  const likesCount = Number(h.likesCount ?? doc.likesCount ?? 0);
  const createdAtMs = Number(h.createdAt) || new Date(doc.createdAt).getTime();

  const score = computeTrendingScore({ playCount, downloadCount, likesCount, createdAtMs });

  const m = r.multi();
  m.zAdd(C.IDX_SCORE, [{ score, value: String(songId) }]);

  // optional: mirror inside doc for visibility/debug
  doc.trendingScore = score;
  doc.updatedAt = new Date();
  m.hSet(key, "doc", JSON.stringify(doc));
  m.hSet(key, "updatedAt", String(Date.now()));

  await m.exec();
}

/** ---------- Create / Mirror ---------- */
// export async function createSongRedis(songDoc) {
//   let r;
//   try {
//     r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
//     if (!r) throw new Error("Redis client not available");
//   } catch (error) {
//     console.error("Redis connection failed:", error);
//     throw new Error("Database temporarily unavailable");
//   }

//   const id = String(songDoc?._id ?? songDoc?.id);
//   if (!id) throw new Error("createSongRedis: song _id is required");

//   // Async memory check (non-blocking)
//   setTimeout(async () => {
//     try {
//       const mb = await usedMB(r);
//       if (mb != null && mb > C.MAX_MB) {
//         const n = await r.zCard(C.IDX_SCORE);
//         await notifyAdmin("Redis memory above threshold", { usedMB: +mb.toFixed(2), songsIndexed: n });
//       }
//     } catch (error) {
//       console.warn("Async memory check failed:", error);
//     }
//   }, 0);

//   // Normalize doc to plain object
//   const baseDoc = typeof songDoc.toObject === "function" ? songDoc.toObject() : { ...songDoc };

//   // Ensure core fields exist
//   if (!("_id" in baseDoc)) baseDoc._id = id;
//   if (!("playCount" in baseDoc)) baseDoc.playCount = 0;
//   if (!("downloadCount" in baseDoc)) baseDoc.downloadCount = 0;
//   if (!("likesCount" in baseDoc)) {
//     baseDoc.likesCount = Array.isArray(baseDoc.likedByUsers) ? baseDoc.likedByUsers.length : 0;
//   }
//   if (!("createdAt" in baseDoc)) baseDoc.createdAt = new Date();
//   if (!("updatedAt" in baseDoc)) baseDoc.updatedAt = new Date();

//   const leanDoc = buildDocForRedisJSON(baseDoc);
//   const docJson = JSON.stringify(leanDoc);

//   const createdAtSec = Math.floor(new Date(baseDoc.createdAt).getTime() / 1000) || nowSec();

//   // trending score at insert
//   const trendingScore = computeTrendingScore({
//     playCount: Number(leanDoc.playCount || 0),
//     downloadCount: Number(leanDoc.downloadCount || 0),
//     likesCount: Number(leanDoc.likesCount || 0),
//     createdAtMs: createdAtSec * 1000,
//   });

//   const artistId = baseDoc.artist ? String(baseDoc.artist) : "";
//   const albumId  = baseDoc.album  ? String(baseDoc.album)  : "";

//   // If at/over cap, make room
//   try {
//     const size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size check timeout");
//     if (size >= C.MAX_N_SONGS) {
//       await withTimeout(enforceSongLimit(), 3000, "Eviction timeout");
//     }
//   } catch (error) {
//     console.warn("Capacity check failed:", error);
//   }

//   // Write hash + indexes
//   try {
//     const m = r.multi();

//     m.hSet(songKey(id), {
//       doc: docJson,
//       playCount: String(leanDoc.playCount || 0),
//       downloadCount: String(leanDoc.downloadCount || 0),
//       likesCount: String(leanDoc.likesCount || 0),
//       createdAt: String(createdAtSec * 1000),
//       updatedAt: String(Date.now()),
//       artist: artistId,
//       album: albumId,
//       lastAccessed: String(Date.now()),
//     });

//     m.sAdd(C.IDX_ALL, id);
//     if (artistId) m.sAdd(C.byArtist(artistId), id);
//     if (albumId)  m.sAdd(C.byAlbum(albumId), id);

//     // leaderboards
//     m.zAdd(C.IDX_SCORE,   [{ score: trendingScore, value: id }]);              // trending
//     m.zAdd(C.IDX_PLAYS,   [{ score: Number(leanDoc.playCount || 0), value: id }]); // popular
//     m.zAdd(C.IDX_CREATED, [{ score: createdAtSec, value: id }]);               // new releases

//     await withTimeout(m.exec(), 4000, "Redis transaction timeout");
//     return { insertedId: id };
//   } catch (error) {
//     console.error("Redis transaction failed:", error);
//     try {
//       await cleanupPartialWrite(id, artistId, albumId);
//     } catch (cleanupError) {
//       console.error("Cleanup also failed:", cleanupError);
//     }
//     throw new Error(`Failed to store song: ${error.message}`);
//   }
// }


export async function createSongRedis(songDoc) {
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
    if (!r) throw new Error("Redis client not available");
  } catch (error) {
    console.error("Redis connection failed:", error);
    throw new Error("Database temporarily unavailable");
  }

  const id = String(songDoc?._id ?? songDoc?.id);
  if (!id) throw new Error("createSongRedis: song _id is required");

  // async memory check (non-blocking)
  setTimeout(async () => {
    try {
      const mb = await usedMB(r);
      if (mb != null && mb > C.MAX_MB) {
        const n = await r.zCard(C.IDX_SCORE);
        await notifyAdmin("Redis memory above threshold", { usedMB: +mb.toFixed(2), songsIndexed: n });
      }
    } catch (error) {
      console.warn("Async memory check failed:", error);
    }
  }, 0);

  // normalize base
  const baseDoc = typeof songDoc.toObject === "function" ? songDoc.toObject() : { ...songDoc };
  if (!("_id" in baseDoc)) baseDoc._id = id;
  if (!("playCount" in baseDoc)) baseDoc.playCount = 0;
  if (!("downloadCount" in baseDoc)) baseDoc.downloadCount = 0;
  if (!("likesCount" in baseDoc))
    baseDoc.likesCount = Array.isArray(baseDoc.likedByUsers) ? baseDoc.likedByUsers.length : 0;
  if (!("createdAt" in baseDoc)) baseDoc.createdAt = new Date();
  if (!("updatedAt" in baseDoc)) baseDoc.updatedAt = new Date();

  // fetch artist.country once and denormalize
  let artistCountry = '';
  try {
    if (baseDoc?.artist?.country) {
      artistCountry = baseDoc.artist.country;
    } else if (baseDoc.artist) {
      const a = await Artist.findById(baseDoc.artist).select('country').lean();
      artistCountry = a?.country || '';
    }
  } catch {}

  const leanDoc = buildDocForRedisJSON(baseDoc, { artistCountry });
  const docJson = JSON.stringify(leanDoc);

  const createdAtSec = Math.floor(new Date(leanDoc.createdAt).getTime() / 1000);
  const releasedMs   = new Date(leanDoc.releaseDate).getTime();

  const trendingScore = computeTrendingScore({
    playCount: Number(leanDoc.playCount || 0),
    downloadCount: Number(leanDoc.downloadCount || 0),
    likesCount: Number(leanDoc.likesCount || 0),
    createdAtMs: createdAtSec * 1000,
  });

  const artistId = baseDoc.artist ? String(baseDoc.artist) : "";
  const albumId  = baseDoc.album  ? String(baseDoc.album)  : "";

  // capacity guard
  try {
    const size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size check timeout");
    if (size >= C.MAX_N_SONGS) await withTimeout(enforceSongLimit(), 3000, "Eviction timeout");
  } catch (error) {
    console.warn("Capacity check failed:", error);
  }

  // write txn
  try {
    const m = r.multi();

    // store song JSON & mirrors
    m.hSet(`${C.SONG_PREFIX}${id}`, {
      doc: docJson,
      playCount: String(leanDoc.playCount || 0),
      downloadCount: String(leanDoc.downloadCount || 0),
      likesCount: String(leanDoc.likesCount || 0),
      createdAt: String(createdAtSec * 1000),
      updatedAt: String(Date.now()),
      artist: artistId,
      album: albumId,
      lastAccessed: String(Date.now()),
    });

    // base membership + leaderboards
    m.sAdd(C.IDX_ALL, id);
    if (artistId) m.sAdd(C.byArtist(artistId), id);
    if (albumId)  m.sAdd(C.byAlbum(albumId), id);

    m.zAdd(C.IDX_SCORE,   [{ score: trendingScore, value: id }]);
    m.zAdd(C.IDX_PLAYS,   [{ score: Number(leanDoc.playCount || 0), value: id }]);
    m.zAdd(C.IDX_CREATED, [{ score: createdAtSec, value: id }]);

    // per-facet sets
    if (leanDoc.genre)        m.sAdd(C.byGenre(leanDoc.genre), id);
    if (leanDoc.country)      m.sAdd(C.byCountry(leanDoc.country), id);
    if (Number.isFinite(leanDoc.tempoBucket)) m.sAdd(C.byTempo(leanDoc.tempoBucket), id);
    if (Array.isArray(leanDoc.mood))     for (const mo of leanDoc.mood)     if (mo) m.sAdd(C.byMood(mo), id);
    if (Array.isArray(leanDoc.subMoods)) for (const sm of leanDoc.subMoods) if (sm) m.sAdd(C.bySubMood(sm), id);

    // release-date indexes
    m.zAdd(C.IDX_RELEASED, [{ score: releasedMs, value: id }]);
    const d = new Date(releasedMs);
    const yyyy   = d.getUTCFullYear();
    const yyyymm = `${yyyy}${pad2(d.getUTCMonth() + 1)}`;
    m.sAdd(C.byReleaseYear(yyyy), id);
    m.sAdd(C.byReleaseYM(yyyymm), id);

    // producer zsets (rank by trending or release)
    if (Array.isArray(leanDoc.producer)) {
      const rank = trendingScore || releasedMs;
      for (const pr of leanDoc.producer) {
        const slug = slugToken(pr?.name);
        if (slug) m.zAdd(C.byProducer(slug), [{ score: rank, value: id }]);
      }
    }

    // composite similarity keys (built from C.SIMILARITY_LEVELS)
    const simKeys = simKeysForSongDoc(leanDoc);
    const simScore = trendingScore || releasedMs;
    for (const key of simKeys) {
      m.zAdd(key, [{ score: simScore, value: id }]);
      if (C.SIM_TTL) m.expire(key, C.SIM_TTL);
    }

    await withTimeout(m.exec(), 4000, "Redis transaction timeout");
    return { insertedId: id };
  } catch (error) {
    console.error("Redis transaction failed:", error);
    try {
      await cleanupPartialWrite(id, artistId, albumId);
    } catch (cleanupError) {
      console.error("Cleanup also failed:", cleanupError);
    }
    throw new Error(`Failed to store song: ${error.message}`);
  }
}





// --------------indexes----------------------


// ---------- SONGS ----------
export async function createSongIndex() {
  const r = await withTimeout(getRedis(), 3000, 'Redis connection timeout');

  try {
    await r.ft.create(
      'idx:songs',
      {
        // Match the actual JSON structure
        '$._id':                { type: 'TAG',     AS: 'songId' },
        '$.title':              { type: 'TEXT',    AS: 'title' },
        
        // FIXED: Use actual field names from your JSON
        '$.artist':             { type: 'TAG',     AS: 'artist' },    // Not artistId
        '$.album':              { type: 'TAG',     AS: 'album' },     // Not albumId
        '$.genre':              { type: 'TAG',     AS: 'genre' },
        '$.mood[*]':            { type: 'TAG',     AS: 'mood' },
        '$.subMoods[*]':        { type: 'TAG',     AS: 'subMoods' },
        '$.producer[*].name':   { type: 'TEXT',    AS: 'producer' },
        '$.composer[*].name':   { type: 'TEXT',    AS: 'composer' },
        '$.featuringArtist[*]': { type: 'TEXT',    AS: 'featuringArtist' },
        
        // Numeric fields
        '$.tempo':              { type: 'NUMERIC', AS: 'tempo' },
        '$.duration':           { type: 'NUMERIC', AS: 'duration',       SORTABLE: true },
        '$.playCount':          { type: 'NUMERIC', AS: 'playCount',      SORTABLE: true },
        '$.likesCount':         { type: 'NUMERIC', AS: 'likesCount',     SORTABLE: true },
        '$.downloadCount':      { type: 'NUMERIC', AS: 'downloadCount',  SORTABLE: true },
        '$.trendingScore':      { type: 'NUMERIC', AS: 'trendingScore',  SORTABLE: true },
        
        // Timestamps (convert dates to numeric if needed)
        '$.createdAt':          { type: 'TEXT',    AS: 'createdAt' },  // Keep as text for exact match
        '$.releaseDate':        { type: 'TEXT',    AS: 'releaseDate' }, // Keep as text
        
        // Remove fields that don't exist in your JSON:
        // - $.artistCountry
        // - $.country  
        // - $.label
        // - $.tempoBucket
        // - $.releaseDateMs
        // - $.createdAtMs
      },
      {
        ON: 'JSON',
        PREFIX: ['song:'],
        STOPWORDS: ['the', 'a', 'an'],
      }
    );

    console.log('✅ Song index created successfully');
    return { created: true };
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('already exists')) {
      console.info('idx:songs already exists — skipping.');
      return { created: false, reason: 'exists' };
    }
    console.error('Failed to create idx:songs:', e);
    throw e;
  }
}
// ---------- ARTISTS ----------
export async function createArtistIndex() {
  const r = await withTimeout(getRedis(), 3000, 'Redis connection timeout');

  try {
    await r.ft.create(
      'idx:artists',
      {
        '$._id':              { type: 'TAG',    AS: 'artistId' },
        '$.artistSlug':       { type: 'TAG',    AS: 'artistSlug' }, // add in serializer for exact lookups

        // name/bio text (phonetic matching still works when set via option below)
        '$.fullName':         { type: 'TEXT',   AS: 'fullName' },
        '$.artistAka':        { type: 'TEXT',   AS: 'artistAka' },
        '$.bio':              { type: 'TEXT',   AS: 'bio' },

        // facets
        '$.genre[*]':         { type: 'TAG',    AS: 'genre' },
        '$.country':          { type: 'TAG',    AS: 'country' },
        '$.mood[*]':          { type: 'TAG',    AS: 'mood' },
        '$.category':         { type: 'TAG',    AS: 'category' },
        '$.languages[*]':     { type: 'TAG',    AS: 'languages' },
        '$.plan':             { type: 'TAG',    AS: 'plan' },
        '$.role':             { type: 'TAG',    AS: 'role' },
        '$.confirmed':        { type: 'TAG',    AS: 'confirmed' }, // "true"/"false"

        // metrics / sorting
        '$.followersCount':   { type: 'NUMERIC', AS: 'followersCount', SORTABLE: true },
        '$.songsCount':       { type: 'NUMERIC', AS: 'songsCount',     SORTABLE: true },
        '$.albumsCount':      { type: 'NUMERIC', AS: 'albumsCount',    SORTABLE: true },
        '$.createdAtMs':      { type: 'NUMERIC', AS: 'createdAtMs',    SORTABLE: true },
        '$.updatedAtMs':      { type: 'NUMERIC', AS: 'updatedAtMs',    SORTABLE: true },
      },
      {
        ON: 'JSON',
        PREFIX: ['artist:'],
        // Optional phonetic across index (alternative to field-level PHONETIC in some setups)
        // PHONETIC: 'dm:en' // (node-redis doesn't have a top-level PHONETIC opt; keep as TEXT matches)
      }
    );

    console.log('✅ Artist index created successfully');
    return { created: true };
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('already exists')) {
      console.info('idx:artists already exists — skipping.');
      return { created: false, reason: 'exists' };
    }
    console.error('Failed to create idx:artists:', e);
    throw e;
  }
}

export async function createAllIndexes() {
  const [songResult, artistResult] = await Promise.all([
    createSongIndex(),
    createArtistIndex(),
  ]);
  return { success: true, indexes: { songs: songResult, artists: artistResult } };
}


export async function checkRedisIndexes() {
  const r = await getRedis();
  
  try {
    console.log('🔍 Checking Redis Search Indexes...\n');
    
    // 1. List all indexes
    const indexes = await r.ft._list();
    console.log('📋 Available Indexes:', indexes);
    
    if (indexes.length === 0) {
      console.log('❌ No indexes found');
      return { success: false, indexes: [] };
    }
    
    const results = {};
    
    // 2. Check each index
    for (const indexName of indexes) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🏷️  Index: ${indexName}`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        const info = await r.ft.info(indexName);
        
        // Basic info
        console.log(`📊 Documents indexed: ${info.num_docs}`);
        console.log(`🔧 Index options: ${JSON.stringify(info.index_options)}`);
        console.log(`🏗️  Index definition:`, info.index_definition);
        
        // Fields/schema
        console.log(`\n📝 Fields (${info.attributes.length}):`);
        info.attributes.forEach((attr, i) => {
          const identifier = attr[1]; // $.field path
          const fieldName = attr[3];  // AS name
          const fieldType = attr[5];  // TYPE
          console.log(`  ${i + 1}. ${identifier} → ${fieldName} (${fieldType})`);
        });
        
        // Test search
        console.log(`\n🔍 Testing search...`);
        const searchResult = await r.ft.search(indexName, '*', { 
          LIMIT: { from: 0, size: 2 } 
        });
        console.log(`   Found ${searchResult.total} total documents`);
        console.log(`   Sample documents:`, searchResult.documents.length);
        
        results[indexName] = {
          info,
          searchSample: searchResult.documents,
          totalDocuments: searchResult.total
        };
        
      } catch (error) {
        console.log(`❌ Error checking index ${indexName}:`, error.message);
        results[indexName] = { error: error.message };
      }
    }
    
    // 3. Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📈 SUMMARY');
    console.log(`${'='.repeat(50)}`);
    
    indexes.forEach(indexName => {
      const result = results[indexName];
      if (result.info) {
        console.log(`✅ ${indexName}: ${result.totalDocuments} documents, ${result.info.attributes.length} fields`);
      } else {
        console.log(`❌ ${indexName}: ERROR - ${result.error}`);
      }
    });
    
    return { 
      success: true, 
      indexes,
      details: results 
    };
    
  } catch (error) {
    console.error('❌ Failed to check Redis indexes:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}



export async function debugRedisData() {
  const r = await getRedis();
  
  console.log('🔍 Debugging Redis Data...\n');
  
  // Check what keys actually exist
  const songKeys = await r.keys('song:*');
  const artistKeys = await r.keys('artist:*');
  
  console.log(`🎵 Song keys found: ${songKeys.length}`);
  console.log(`🎤 Artist keys found: ${artistKeys.length}`);
  
  // Sample a few keys to see their structure
  if (songKeys.length > 0) {
    console.log('\n📝 Sample song structure:');
    const sampleSong = await r.hGetAll(songKeys[0]);
    console.log('Keys in song hash:', Object.keys(sampleSong));
    
    if (sampleSong.doc) {
      try {
        const songDoc = JSON.parse(sampleSong.doc);
        console.log('JSON doc structure:', Object.keys(songDoc));
        console.log('Sample title:', songDoc.title);
        console.log('Sample artist:', songDoc.artist);
      } catch (e) {
        console.log('Error parsing song doc:', e.message);
      }
    }
  }
  
  if (artistKeys.length > 0) {
    console.log('\n📝 Sample artist structure:');
    const sampleArtist = await r.get(artistKeys[0]);
    if (sampleArtist) {
      try {
        const artistDoc = JSON.parse(sampleArtist);
        console.log('Artist doc structure:', Object.keys(artistDoc));
      } catch (e) {
        console.log('Error parsing artist doc:', e.message);
      }
    }
  }
  
  return { songKeys, artistKeys };
}
// ----------------------------







/** ---------- Update (shallow patch) ---------- */
// export async function updateSongRedis(songId, patch) {
//   let r;
//   try {
//     r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
//   } catch (error) {
//     throw new Error("Database unavailable");
//   }

//   try {
//     const key = songKey(songId);
//     const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
//     if (!h || !h.doc) throw new Error("updateSongRedis: song not found");

//     const before = JSON.parse(h.doc);
//     const after = { ...before, ...patch, updatedAt: new Date() };

//     const beforeArtist = before.artist ? String(before.artist) : "";
//     const beforeAlbum  = before.album  ? String(before.album)  : "";
//     const afterArtist  = after.artist  ? String(after.artist)  : "";
//     const afterAlbum   = after.album   ? String(after.album)   : "";

//     const m = r.multi();
//     m.hSet(key, "doc", JSON.stringify(after));
//     m.hSet(key, "updatedAt", String(Date.now()));

//     // Scalar mirrors + leaderboard sync
//     if ("playCount" in patch) {
//       const next = Number(patch.playCount || 0);
//       m.hSet(key, "playCount", String(next));
//       m.zAdd(C.IDX_PLAYS, [{ score: next, value: songId }]); // Popular index
//     }
//     if ("downloadCount" in patch) {
//       const next = Number(patch.downloadCount || 0);
//       m.hSet(key, "downloadCount", String(next));
//       // no separate leaderboard, trending covers it
//     }
//     if ("likesCount" in patch) {
//       const next = Number(patch.likesCount || 0);
//       m.hSet(key, "likesCount", String(next));
//       // no separate leaderboard, trending covers it
//     }
//     if ("createdAt" in patch) {
//       const createdAtMs = new Date(after.createdAt).getTime();
//       const createdAtSec = Math.floor(createdAtMs / 1000);
//       m.hSet(key, "createdAt", String(createdAtMs));
//       m.zAdd(C.IDX_CREATED, [{ score: createdAtSec, value: songId }]); // New Releases index
//     }

//     // Move between per-artist/per-album indexes when ids change
//     if ("artist" in patch && afterArtist !== beforeArtist) {
//       if (beforeArtist) m.sRem(C.byArtist(beforeArtist), songId);
//       if (afterArtist)  m.sAdd(C.byArtist(afterArtist), songId);
//       m.hSet(key, "artist", afterArtist);
//     }
//     if ("album" in patch && afterAlbum !== beforeAlbum) {
//       if (beforeAlbum) m.sRem(C.byAlbum(beforeAlbum), songId);
//       if (afterAlbum)  m.sAdd(C.byAlbum(afterAlbum), songId);
//       m.hSet(key, "album", afterAlbum);
//     }

//     await withTimeout(m.exec(), 3000, "Update transaction timeout");

//     // Recompute trending if score-affecting fields changed
//     const scoreFields = ["playCount", "downloadCount", "likesCount", "createdAt"];
//     if (Object.keys(patch).some((k) => scoreFields.includes(k))) {
//       await recomputeTrendingFor(r, songId);
//     }
//   } catch (error) {
//     console.error("Update failed:", error);
//     throw new Error(`Failed to update song: ${error.message}`);
//   }
// }

export async function updateSongRedis(songId, patch) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch {
    throw new Error("Database unavailable");
  }

  const key = songKey(songId);

  try {
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
    if (!h || !h.doc) throw new Error("updateSongRedis: song not found");

    const beforeRaw = JSON.parse(h.doc);

    // Determine if artist changed (country may need refresh)
    const artistChanged = Object.prototype.hasOwnProperty.call(patch, 'artist')
      && String(patch.artist || '') !== String(beforeRaw.artist || '');

    // Fetch artist.country if needed (for denorm on Redis doc)
    let artistCountry = beforeRaw.country || '';
    if (artistChanged && patch.artist) {
      try {
        const a = await Artist.findById(patch.artist).select('country').lean();
        artistCountry = a?.country || '';
      } catch { /* ignore */ }
    }

    // Rebuild normalized BEFORE/AFTER docs to compute diffs safely
    const before = buildDocForRedisJSON(
      { ...beforeRaw, createdAt: beforeRaw.createdAt, releaseDate: beforeRaw.releaseDate },
      { artistCountry: beforeRaw.country }
    );

    const afterBase = { ...beforeRaw, ...patch, updatedAt: new Date() };
    const after = buildDocForRedisJSON(afterBase, { artistCountry });

    // Mirror fields
    const beforeArtist = String(before.artist || '');
    const beforeAlbum  = String(before.album  || '');
    const afterArtist  = String(after.artist  || '');
    const afterAlbum   = String(after.album   || '');

    // Scores (trending uses play/download/likes/createdAt)
    const createdAtSec = Math.floor(new Date(after.createdAt).getTime() / 1000) || nowSec();
    const releasedMs   = new Date(after.releaseDate).getTime();
    const trendingScore = computeTrendingScore({
      playCount: Number(after.playCount || 0),
      downloadCount: Number(after.downloadCount || 0),
      likesCount: Number(after.likesCount || 0),
      createdAtMs: createdAtSec * 1000,
    });
    const simScore = trendingScore || releasedMs;

    // Diff helpers
    const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
    const setOf = (xs) => new Set(xs);
    const diffSet = (prev, next) => {
      const rm = []; const add = [];
      const sPrev = setOf(prev); const sNext = setOf(next);
      for (const v of sPrev) if (!sNext.has(v)) rm.push(v);
      for (const v of sNext) if (!sPrev.has(v)) add.push(v);
      return { rm, add };
    };

    const genreChanged   = (before.genre || '') !== (after.genre || '');
    const countryChanged = (before.country || '') !== (after.country || '');
    const tempoBChanged  = Number(before.tempoBucket || 0) !== Number(after.tempoBucket || 0);

    const { rm: moodRm, add: moodAdd } =
      diffSet(arr(before.mood).filter(Boolean), arr(after.mood).filter(Boolean));
    const { rm: subRm, add: subAdd } =
      diffSet(arr(before.subMoods).filter(Boolean), arr(after.subMoods).filter(Boolean));

    // Producer diff (use slugged name)
    const beforeProd = (before.producer || []).map(p => String(p?.nameSlug || '').trim()).filter(Boolean);
    const afterProd  = (after.producer  || []).map(p => String(p?.nameSlug || '').trim()).filter(Boolean);
    const { rm: prodRm, add: prodAdd } = diffSet(beforeProd, afterProd);

    // Release year/month diff
    const dBefore = new Date(before.releaseDate || before.createdAt || Date.now());
    const bYYYY   = dBefore.getUTCFullYear();
    const bYYYYMM = `${bYYYY}${pad2(dBefore.getUTCMonth() + 1)}`;
    const dAfter  = new Date(after.releaseDate || after.createdAt || Date.now());
    const aYYYY   = dAfter.getUTCFullYear();
    const aYYYYMM = `${aYYYY}${pad2(dAfter.getUTCMonth() + 1)}`;
    const yearChanged = bYYYY !== aYYYY;
    const ymChanged   = bYYYYMM !== aYYYYMM;

    // Similarity composite keys (remove old, add new)
    const simKeysBefore = simKeysForSongDoc(before);
    const simKeysAfter  = simKeysForSongDoc(after);

    // Begin pipeline
    const m = r.multi();

    // Update stored doc + mirrors
    m.hSet(key, "doc", JSON.stringify(after));
    m.hSet(key, "updatedAt", String(Date.now()));

    // scalar mirrors + leaderboards
    if (Object.prototype.hasOwnProperty.call(patch, "playCount")) {
      const next = Number(after.playCount || 0);
      m.hSet(key, "playCount", String(next));
      m.zAdd(C.IDX_PLAYS, [{ score: next, value: songId }]);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "downloadCount")) {
      const next = Number(after.downloadCount || 0);
      m.hSet(key, "downloadCount", String(next));
    }
    if (Object.prototype.hasOwnProperty.call(patch, "likesCount")) {
      const next = Number(after.likesCount || 0);
      m.hSet(key, "likesCount", String(next));
    }
    if (Object.prototype.hasOwnProperty.call(patch, "createdAt")) {
      const createdAtMs = new Date(after.createdAt).getTime();
      const createdAtSecNew = Math.floor(createdAtMs / 1000);
      m.hSet(key, "createdAt", String(createdAtMs));
      m.zAdd(C.IDX_CREATED, [{ score: createdAtSecNew, value: songId }]);
    }

    // Always refresh trending score (cheap; guarantees producer/sim zscores stay in sync)
    m.zAdd(C.IDX_SCORE, [{ score: trendingScore, value: songId }]);

    // Move between per-artist/per-album when ids change
    if (afterArtist !== beforeArtist) {
      if (beforeArtist) m.sRem(C.byArtist(beforeArtist), songId);
      if (afterArtist)  m.sAdd(C.byArtist(afterArtist), songId);
      m.hSet(key, "artist", afterArtist);
    }
    if (afterAlbum !== beforeAlbum) {
      if (beforeAlbum) m.sRem(C.byAlbum(beforeAlbum), songId);
      if (afterAlbum)  m.sAdd(C.byAlbum(afterAlbum), songId);
      m.hSet(key, "album", afterAlbum);
    }

    // Facet sets
    if (genreChanged) {
      if (before.genre) m.sRem(C.byGenre(before.genre), songId);
      if (after.genre)  m.sAdd(C.byGenre(after.genre), songId);
    }
    for (const v of moodRm) m.sRem(C.byMood(v), songId);
    for (const v of moodAdd) m.sAdd(C.byMood(v), songId);

    for (const v of subRm) m.sRem(C.bySubMood(v), songId);
    for (const v of subAdd) m.sAdd(C.bySubMood(v), songId);

    if (tempoBChanged) {
      if (Number.isFinite(before.tempoBucket)) m.sRem(C.byTempo(before.tempoBucket), songId);
      if (Number.isFinite(after.tempoBucket))  m.sAdd(C.byTempo(after.tempoBucket), songId);
    }

    if (countryChanged) {
      if (before.country) m.sRem(C.byCountry(before.country), songId);
      if (after.country)  m.sAdd(C.byCountry(after.country), songId);
    }

    // Release date indexes
    if (Object.prototype.hasOwnProperty.call(patch, 'releaseDate')) {
      m.zAdd(C.IDX_RELEASED, [{ score: releasedMs, value: songId }]);
      if (yearChanged) {
        m.sRem(C.byReleaseYear(bYYYY), songId);
        m.sAdd(C.byReleaseYear(aYYYY), songId);
      }
      if (ymChanged) {
        m.sRem(C.byReleaseYM(bYYYYMM), songId);
        m.sAdd(C.byReleaseYM(aYYYYMM), songId);
      }
    }

    // Producer zsets (rank by trending or release)
    for (const slug of prodRm)  m.zRem(C.byProducer(slug), songId);
    for (const slug of prodAdd) m.zAdd(C.byProducer(slug), [{ score: simScore, value: songId }]);

    // Similarity composites: remove old memberships, add new with current simScore
    for (const k of simKeysBefore) m.zRem(k, songId);
    for (const k of simKeysAfter)  { m.zAdd(k, [{ score: simScore, value: songId }]); if (C.SIM_TTL) m.expire(k, C.SIM_TTL); }

    await withTimeout(m.exec(), 4000, "Update transaction timeout");

    return { updatedId: songId, trendingScore, simScore };
  } catch (error) {
    console.error("Update failed:", error);
    throw new Error(`Failed to update song: ${error.message}`);
  }
}

/** Delete a song from Redis (hash + all indexes) */
// export async function deleteSongRedis(songId) {
//   let r;
//   try {
//     r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
//   } catch (err) {
//     throw new Error("Redis unavailable");
//   }

//   const key = songKey(songId);

//   try {
//     const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
//     const artist = h?.artist || "";
//     const album  = h?.album  || "";

//     const m = r.multi();
//     m.zRem(C.IDX_SCORE, songId);
//     m.zRem(C.IDX_PLAYS, songId);
//     m.zRem(C.IDX_CREATED, songId);
//     m.sRem(C.IDX_ALL, songId);
//     if (artist) m.sRem(C.byArtist(artist), songId);
//     if (album)  m.sRem(C.byAlbum(album), songId);
//     m.del(key);

//     await withTimeout(m.exec(), 3000, "Redis delete transaction timeout");
//     return true;
//   } catch (error) {
//     console.error("[redis] deleteSongRedis failed:", error);
//     throw new Error(`Failed to delete from cache: ${error.message}`);
//   }
// }

export async function deleteSongRedis(songId) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (err) {
    throw new Error("Redis unavailable");
  }

  const key = songKey(songId);

  try {
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");

    // Always remove from the global boards/sets even if doc missing
    const m = r.multi();
    m.zRem(C.IDX_SCORE, songId);
    m.zRem(C.IDX_PLAYS, songId);
    m.zRem(C.IDX_CREATED, songId);
    m.zRem(C.IDX_RELEASED, songId);
    m.sRem(C.IDX_ALL, songId);

    // If we have a stored doc, remove from all facet indexes & sim keys
    if (h && h.doc) {
      const doc = JSON.parse(h.doc) || {};

      // mirrors (strings)
      const artistId = h.artist || doc.artist || "";
      const albumId  = h.album  || doc.album  || "";

      if (artistId) m.sRem(C.byArtist(String(artistId)), songId);
      if (albumId)  m.sRem(C.byAlbum(String(albumId)), songId);

      // facet sets (normalized in Redis write path)
      if (doc.genre)   m.sRem(C.byGenre(String(doc.genre)), songId);
      if (doc.country) m.sRem(C.byCountry(String(doc.country)), songId);

      // moods/submoods are arrays
      if (Array.isArray(doc.mood))     for (const mo of doc.mood)     if (mo) m.sRem(C.byMood(String(mo)), songId);
      if (Array.isArray(doc.subMoods)) for (const sm of doc.subMoods) if (sm) m.sRem(C.bySubMood(String(sm)), songId);

      // tempo bucket set
      const tb = Number.isFinite(doc.tempoBucket) ? doc.tempoBucket : tempoBucket(doc.tempo || 0);
      if (Number.isFinite(tb)) m.sRem(C.byTempo(tb), songId);

      // release date buckets
      const relMs = doc.releaseDate ? new Date(doc.releaseDate).getTime()
                   : (doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now());
      const d  = new Date(relMs);
      const yy = d.getUTCFullYear();
      const ym = `${yy}${pad2(d.getUTCMonth() + 1)}`;
      m.sRem(C.byReleaseYear(yy), songId);
      m.sRem(C.byReleaseYM(ym), songId);

      // producer zsets
      if (Array.isArray(doc.producer)) {
        for (const pr of doc.producer) {
          const slug = pr?.nameSlug || (pr?.name ? slugToken(pr.name) : '');
          if (slug) m.zRem(C.byProducer(slug), songId);
        }
      }

      // similarity composite keys (remove membership)
      const simKeys = simKeysForSongDoc({
        artist : artistId || doc.artist,
        album  : albumId  || doc.album,
        genre  : doc.genre,
        mood   : doc.mood,
        subMoods: doc.subMoods,
        tempo  : doc.tempo,
        tempoBucket: tb,
        country: doc.country,
      });
      for (const sk of simKeys) m.zRem(sk, songId);
    } else {
      // No doc: still try to clean per-artist/per-album from scalar mirrors if present
      const artist = h?.artist || "";
      const album  = h?.album  || "";
      if (artist) m.sRem(C.byArtist(artist), songId);
      if (album)  m.sRem(C.byAlbum(album), songId);
    }

    // finally, remove the song hash
    m.del(key);

    await withTimeout(m.exec(), 4000, "Redis delete transaction timeout");
    return true;
  } catch (error) {
    console.error("[redis] deleteSongRedis failed:", error);
    throw new Error(`Failed to delete from cache: ${error.message}`);
  }
}

export async function cleanupPartialWrite(songId, artistId, albumId) {
  try {
    const r = await getRedis();
    const key = songKey(songId);

    // Try to read whatever is there to clean up fully.
    let h = null;
    try { h = await r.hGetAll(key); } catch { /* ignore */ }

    const m = r.multi();

    // Always remove from global sets/zsets
    m.sRem(C.IDX_ALL, songId);
    m.zRem(C.IDX_SCORE,   songId);
    m.zRem(C.IDX_PLAYS,   songId);
    m.zRem(C.IDX_CREATED, songId);
    m.zRem(C.IDX_RELEASED, songId);

    // Remove from artist/album indexes using both mirrors and provided args
    const artistMirror = h?.artist || "";
    const albumMirror  = h?.album  || "";
    const artist = String(artistMirror || artistId || "");
    const album  = String(albumMirror  || albumId  || "");
    if (artist) m.sRem(C.byArtist(artist), songId);
    if (album)  m.sRem(C.byAlbum(album), songId);

    // If we have the stored doc, also remove from all facet and similarity indexes
    if (h && h.doc) {
      try {
        const doc = JSON.parse(h.doc) || {};

        // Facets (values already normalized in our write path)
        if (doc.genre)   m.sRem(C.byGenre(String(doc.genre)), songId);
        if (doc.country) m.sRem(C.byCountry(String(doc.country)), songId);

        if (Array.isArray(doc.mood)) {
          for (const mo of doc.mood) if (mo) m.sRem(C.byMood(String(mo)), songId);
        }
        if (Array.isArray(doc.subMoods)) {
          for (const sm of doc.subMoods) if (sm) m.sRem(C.bySubMood(String(sm)), songId);
        }

        // Tempo bucket
        const tb = Number.isFinite(doc.tempoBucket) ? doc.tempoBucket : tempoBucket(doc.tempo || 0);
        if (Number.isFinite(tb)) m.sRem(C.byTempo(tb), songId);

        // Release buckets
        const relMs = doc.releaseDate ? new Date(doc.releaseDate).getTime()
                     : (doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now());
        const d  = new Date(relMs);
        const yy = d.getUTCFullYear();
        const ym = `${yy}${pad2(d.getUTCMonth() + 1)}`;
        m.sRem(C.byReleaseYear(yy), songId);
        m.sRem(C.byReleaseYM(ym), songId);

        // Producers
        if (Array.isArray(doc.producer)) {
          for (const pr of doc.producer) {
            const slug = pr?.nameSlug || (pr?.name ? slugToken(pr.name) : '');
            if (slug) m.zRem(C.byProducer(slug), songId);
          }
        }

        // Composite similarity keys
        const simKeys = simKeysForSongDoc({
          artist : artist || doc.artist,
          album  : album  || doc.album,
          genre  : doc.genre,
          mood   : doc.mood,
          subMoods: doc.subMoods,
          tempo  : doc.tempo,
          tempoBucket: tb,
          country: doc.country,
        });
        for (const sk of simKeys) m.zRem(sk, songId);
      } catch (e) {
        // If parsing fails, we still delete the hash & basics
      }
    }

    // Finally remove the hash
    m.del(key);

    await m.exec();
  } catch (error) {
    console.warn("Partial cleanup failed:", error);
  }
}

/** Cleanup partial writes if transaction fails */
// async function cleanupPartialWrite(songId, artistId, albumId) {
//   try {
//     const r = await getRedis();
//     const m = r.multi();
//     m.del(songKey(songId));
//     m.sRem(C.IDX_ALL, songId);
//     m.zRem(C.IDX_SCORE, songId);
//     m.zRem(C.IDX_PLAYS, songId);
//     m.zRem(C.IDX_CREATED, songId);
//     if (artistId) m.sRem(C.byArtist(artistId), songId);
//     if (albumId)  m.sRem(C.byAlbum(albumId), songId);
//     await m.exec();
//   } catch (error) {
//     console.warn("Partial cleanup failed:", error);
//   }
// }

// Assumes these are available in scope or imported:
// C, getRedis, songKey, simKeysForSongDoc, tempoBucket, pad2, slugToken








/** ---------- Read (Mongo-like object) ---------- */
export async function getSongRedis(songId) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for read:", error);
    return null;
  }

  try {
    const key = songKey(songId);
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
    if (!h || !h.doc) return null;

    await withTimeout(r.hSet(key, "lastAccessed", String(Date.now())), 1000, "Last accessed update timeout");

    const doc = JSON.parse(h.doc, (k, v) => {
      if (k === "createdAt" || k === "updatedAt" || k === "releaseDate" || k === "lastPlayedAt") {
        const d = new Date(v);
        return isNaN(d) ? v : d;
      }
      return v;
    });

    return doc;
  } catch (error) {
    console.error("Error reading song from Redis:", error);
    return null;
  }
}



/** Ensure presence (returns cached doc or null; does not create) */
export async function ensureSongCached(songId) {
  return await getSongRedis(songId);
}



/** ---------- Play / Download / Like counters ---------- */
export async function incrementPlayCount(songId, { msListened = 0 } = {}) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for play count:", error);
    return 0;
  }

  try {
    const key = songKey(songId);
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
    if (!h || !h.doc) return 0;

    const m = r.multi();
    m.hIncrBy(key, "playCount", 1);
    m.zIncrBy(C.IDX_PLAYS, 1, songId); // keep Popular leaderboard in sync
    if (msListened) m.hIncrBy(key, "msListened", Math.max(0, Math.floor(msListened)));
    m.hSet(key, "lastAccessed", String(Date.now()));

    const doc = JSON.parse(h.doc);
    const next = Number(doc.playCount || 0) + 1;
    doc.playCount = next;
    doc.lastPlayedAt = new Date();
    doc.updatedAt = new Date();
    m.hSet(key, "doc", JSON.stringify(doc));

    await withTimeout(m.exec(), 3000, "Play count update timeout");

    // trending recompute
    await recomputeTrendingFor(r, songId);
    return next;
  } catch (error) {
    console.error("Play count increment failed:", error);
    return 0;
  }
}

export async function bumpDownloadCount(songId, delta = 1) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for download count:", error);
    return 0;
  }

  try {
    const key = songKey(songId);
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
    if (!h || !h.doc) return 0;

    const current = Number(h.downloadCount || 0);
    const next = Math.max(0, current + Number(delta || 0));

    const doc = JSON.parse(h.doc);
    doc.downloadCount = next;
    doc.updatedAt = new Date();

    const m = r.multi();
    m.hSet(key, "downloadCount", String(next));
    m.hSet(key, "doc", JSON.stringify(doc));
    await withTimeout(m.exec(), 3000, "Download count update timeout");

    await recomputeTrendingFor(r, songId);
    return next;
  } catch (error) {
    console.error("Download count bump failed:", error);
    return 0;
  }
}

export async function bumpLikesCount(songId, delta = 1) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for likes count:", error);
    return 0;
  }

  try {
    const key = songKey(songId);
    const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
    if (!h || !h.doc) return 0;

    const current = Number(h.likesCount || 0);
    const next = Math.max(0, current + Number(delta || 0));

    const doc = JSON.parse(h.doc);
    doc.likesCount = next;
    doc.updatedAt = new Date();

    const m = r.multi();
    m.hSet(key, "likesCount", String(next));
    m.hSet(key, "doc", JSON.stringify(doc));
    await withTimeout(m.exec(), 3000, "Likes count update timeout");

    await recomputeTrendingFor(r, songId);
    return next;
  } catch (error) {
    console.error("Likes count bump failed:", error);
    return 0;
  }
}

/** ---------- Leaderboard Reads (Redis-first) ---------- */
async function fetchDocsForIds(r, ids) {
  if (!ids?.length) return [];
  const m = r.multi();
  for (const id of ids) m.hGetAll(songKey(id));
  const rows = await m.exec();
  const docs = [];
  for (const h of rows) {
    if (!h || !h.doc) continue;
    try {
      docs.push(JSON.parse(h.doc));
    } catch (_) {}
  }
  return docs;
}

export async function redisTrending(limit = 20) {
  const r = await getRedis();
  const ids = await r.zRange(C.IDX_SCORE, 0, Math.max(0, limit - 1), { REV: true }); // ✅
  return fetchDocsForIds(r, ids);
}


export async function redisPopular(limit = 20) {
  const r = await getRedis();
  const ids = await r.zRevRange(C.IDX_PLAYS, 0, Math.max(0, limit - 1));
  return fetchDocsForIds(r, ids);
}

export async function redisNewReleases(limit = 20) {
  const r = await getRedis();
  const ids = await r.zRevRange(C.IDX_CREATED, 0, Math.max(0, limit - 1));
  return fetchDocsForIds(r, ids);
}

/** ---------- Capacity & eviction ---------- */
export async function getCurrentSongCount() {
  try {
    const r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    return await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Song count timeout");
  } catch (error) {
    console.error("Error getting song count:", error);
    return 0;
  }
}

export async function getAllSongIds(limit = 1000) {
  try {
    const r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    // ascending by trending score; callers can reverse if needed
    return await withTimeout(r.zRange(C.IDX_SCORE, 0, Math.max(0, limit - 1)), 2000, "Song IDs fetch timeout");
  } catch (error) {
    console.error("Error getting song IDs:", error);
    return [];
  }
}

/** Evict lowest trending (then oldest among equals) until under cap */
/** Update the eviction function to reuse deleteSongRedis */
export async function enforceSongLimit() {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for eviction:", error);
    return [];
  }

  const evicted = [];
  try {
    let size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size check timeout");

    while (size > C.MAX_N_SONGS) {
      const victims = await withTimeout(r.zRange(C.IDX_SCORE, 0, 0), 2000, "Victim selection timeout");
      const victim = victims[0];
      if (!victim) break;

      // one call that removes from ALL indexes & sim keys
      await deleteSongRedis(victim);

      evicted.push(victim);
      size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size update timeout");
    }

    if (evicted.length) {
      console.log(`[redis] Evicted ${evicted.length} song(s) to cap=${C.MAX_N_SONGS}`);
    }
    return evicted;
  } catch (error) {
    console.error("Eviction failed:", error);
    return evicted;
  }
}


/** Connection status check */
export async function checkRedisStatus() {
  try {
    const r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    await withTimeout(r.ping(), 1000, "Ping timeout");
    const memory = await usedMB(r);
    const songCount = await getCurrentSongCount();

    return {
      status: "connected",
      memoryMB: memory,
      songCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/** Optional: periodic cleanup */
export async function runCleanupTask() {
  try {
    const r = await getRedis();
    const mb = await usedMB(r);
    if (mb != null && mb > C.MAX_MB) {
      await notifyAdmin("Redis memory above threshold", { usedMB: +mb.toFixed(2) });
    }
    await enforceSongLimit();
  } catch (e) {
    console.error("[redis] cleanup error:", e);
  }
}



export async function getMultipleSongsRedis(redis, songIds = []) {
  if (!songIds.length) return [];
  const keys = songIds.map(songKey);

  const blobs = await redis.mGet(keys);

  const out = [];
  const pipe = redis.multi();
  for (let i = 0; i < blobs.length; i++) {
    const raw = blobs[i];
    if (!raw) continue;
    try {
      const s = JSON.parse(raw);
      out.push(s);
      pipe.expire(keys[i], SONG_CONFIG.TTL); // or remove to skip
    } catch {/* ignore */}
  }
  if (out.length) await pipe.exec();
  return out;
}
