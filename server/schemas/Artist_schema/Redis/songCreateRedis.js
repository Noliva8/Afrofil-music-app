// ✅ works in ESM when the package is CommonJS
import redisPkg from 'redis';
const { SchemaFieldTypes } = redisPkg; 

import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import {Artist,Album} from "../../../models/Artist/index_artist.js"
import { getMultipleArtistsRedis } from './artistCreateRedis.js';
import { getMultipleAlbumsRedis } from './albumCreateRedis.js';
import { artistCreateRedis } from './artistCreateRedis.js';
import { albumCreateRedis } from './albumCreateRedis.js';
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


export function simKeysForSongDoc(s) {
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






export function buildDocForRedisJSON(baseDoc, { artistCountry, artistAka } = {}) {
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
  out.artistAka = artistAka || out.artistAka || '';

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

  // fetch artist.country + artistAka once and denormalize
  let artistCountry = '';
  let artistAka = '';
  try {
    if (baseDoc?.artist?.country) {
      artistCountry = baseDoc.artist.country;
    }
    if (baseDoc?.artist?.artistAka || baseDoc?.artist?.fullName) {
      artistAka = baseDoc.artist.artistAka || baseDoc.artist.fullName || '';
    }
    if (baseDoc.artist && (!artistCountry || !artistAka)) {
      const a = await Artist.findById(baseDoc.artist).select('country artistAka fullName').lean();
      artistCountry = artistCountry || a?.country || '';
      artistAka = artistAka || a?.artistAka || a?.fullName || '';
    }
  } catch { /* ignore */ }

  // build lean JSON doc for Redis
  const leanDoc = buildDocForRedisJSON(baseDoc, { artistCountry, artistAka });

  // ensure IDs are strings for TAG indexing
  leanDoc.artist = baseDoc.artist ? String(baseDoc.artist) : '';
  leanDoc.album  = baseDoc.album  ? String(baseDoc.album)  : '';

  // dates → millis (safe)
  const toMs = (d) => (d ? new Date(d).getTime() : 0);
  leanDoc.createdAtMs   = toMs(leanDoc.createdAt) || Date.now();
  leanDoc.releaseDateMs = toMs(leanDoc.releaseDate) || 0;
  leanDoc.updatedAtMs   = Date.now();

  const createdAtSec = Math.floor(leanDoc.createdAtMs / 1000);
  const releasedMs   = leanDoc.releaseDateMs;

  // compute + embed trending score (needed for ON-JSON index)
  const trendingScore = computeTrendingScore({
    playCount: Number(leanDoc.playCount || 0),
    downloadCount: Number(leanDoc.downloadCount || 0),
    likesCount: Number(leanDoc.likesCount || 0),
    createdAtMs: leanDoc.createdAtMs,
  });
  leanDoc.trendingScore = trendingScore;

  const artistId = leanDoc.artist;
  const albumId  = leanDoc.album;

  // capacity guard
  try {
    const size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size check timeout");
    if (size >= C.MAX_N_SONGS) await withTimeout(enforceSongLimit(), 3000, "Eviction timeout");
  } catch (error) {
    console.warn("Capacity check failed:", error);
  }

  // write
  const key = `${C.SONG_PREFIX}${id}`;
  try {
    // If an older HASH (or any non-JSON type) exists under this key, unlink it first
    const existingType = await r.type(key);
    if (existingType && existingType !== 'none' && existingType !== 'ReJSON-RL') {
      console.log(`🔄 Converting ${key} from ${existingType} to JSON`);
      await r.unlink(key); // non-blocking delete
    }

    // Store canonical song JSON
    await r.json.set(key, '$', leanDoc);

    // Membership + leaderboards + aux indices (same as before)
    const m = r.multi();

    // base membership
    m.sAdd(C.IDX_ALL, id);
    if (artistId) m.sAdd(C.byArtist(artistId), id);
    if (albumId)  m.sAdd(C.byAlbum(albumId), id);

    // leaderboards
    m.zAdd(C.IDX_SCORE,   [{ score: trendingScore, value: id }]);
    m.zAdd(C.IDX_PLAYS,   [{ score: Number(leanDoc.playCount || 0), value: id }]);
    m.zAdd(C.IDX_CREATED, [{ score: createdAtSec, value: id }]);

    // per-facet sets (optional once RediSearch is the main query path, but safe to keep)
    if (leanDoc.genre)        m.sAdd(C.byGenre(leanDoc.genre), id);
    if (leanDoc.country)      m.sAdd(C.byCountry(leanDoc.country), id);
    if (Number.isFinite(leanDoc.tempoBucket)) m.sAdd(C.byTempo(leanDoc.tempoBucket), id);
    if (Array.isArray(leanDoc.mood))     for (const mo of leanDoc.mood)     if (mo) m.sAdd(C.byMood(mo), id);
    if (Array.isArray(leanDoc.subMoods)) for (const sm of leanDoc.subMoods) if (sm) m.sAdd(C.bySubMood(sm), id);

    // release-date indexes
    m.zAdd(C.IDX_RELEASED, [{ score: releasedMs, value: id }]);
    if (releasedMs) {
      const d = new Date(releasedMs);
      const yyyy   = d.getUTCFullYear();
      const yyyymm = `${yyyy}${pad2(d.getUTCMonth() + 1)}`;
      m.sAdd(C.byReleaseYear(yyyy), id);
      m.sAdd(C.byReleaseYM(yyyymm), id);
    }

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
    for (const sk of simKeys) {
      m.zAdd(sk, [{ score: simScore, value: id }]);
      if (C.SIM_TTL) m.expire(sk, C.SIM_TTL);
    }

    await withTimeout(m.exec(), 4000, "Redis transaction timeout");
    console.log(`✅ Song ${id} stored as JSON with indexes updated`);
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

export async function createSongIndex() {
  const r = await withTimeout(getRedis(), 3000, 'Redis connection timeout');

  try {
    await r.ft.create(
      'idx:songs',
      {
        // IDs / exact filters
        '$._id':                { type: 'TAG',     AS: 'songId' },
        '$.artist':             { type: 'TAG',     AS: 'artist' },   // artist ObjectId as string
        '$.album':              { type: 'TAG',     AS: 'album'  },   // album ObjectId as string
        '$.genre':              { type: 'TAG',     AS: 'genre'  },

        // Full-text
        '$.title':              { type: 'TEXT',    AS: 'title' },
        '$.artistAka':          { type: 'TEXT',    AS: 'artistAka' },
        '$.producer[*].name':   { type: 'TEXT',    AS: 'producer' },
        '$.composer[*].name':   { type: 'TEXT',    AS: 'composer' },
        '$.featuringArtist[*]': { type: 'TEXT',    AS: 'featuringArtist' },
        '$.label':              { type: 'TEXT',    AS: 'label' },

        // Facets (arrays)
        '$.mood[*]':            { type: 'TAG',     AS: 'mood' },
        '$.subMoods[*]':        { type: 'TAG',     AS: 'subMoods' },

        // Numeric (sortable/range)
        '$.tempo':              { type: 'NUMERIC', AS: 'tempo' },
        '$.duration':           { type: 'NUMERIC', AS: 'duration',       SORTABLE: true },
        '$.playCount':          { type: 'NUMERIC', AS: 'playCount',      SORTABLE: true },
        '$.likesCount':         { type: 'NUMERIC', AS: 'likesCount',     SORTABLE: true },
        '$.downloadCount':      { type: 'NUMERIC', AS: 'downloadCount',  SORTABLE: true },
        '$.trendingScore':      { type: 'NUMERIC', AS: 'trendingScore',  SORTABLE: true },

        // Timestamps — use millis fields you’re writing now
        '$.createdAtMs':        { type: 'NUMERIC', AS: 'createdAtMs',    SORTABLE: true },
        '$.releaseDateMs':      { type: 'NUMERIC', AS: 'releaseDateMs',  SORTABLE: true },
        '$.updatedAtMs':        { type: 'NUMERIC', AS: 'updatedAtMs',    SORTABLE: true },
      },
      {
        ON: 'JSON',
        PREFIX: ['song:'],
        STOPWORDS: ['the','a','an'],
      }
    );

    console.log('✅ idx:songs created');
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

function escapeFt(s='') {
  return String(s).replace(/([-+|{}[\]()^~*:\\"@])/g, '\\$1');
}

const buildSongSearchQuery = (q) => {
  const tokens = String(q || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${escapeFt(t)}*`);
  if (!tokens.length) return '';

  const fields = ['title', 'artistAka', 'producer', 'composer', 'featuringArtist', 'label'];
  const groups = tokens.map((token) => {
    const fieldQuery = fields.map((field) => `@${field}:(${token})`).join(' | ');
    return `(${fieldQuery})`;
  });

  return groups.join(' ');
};

export async function searchSongsRedis(query, limit = 20) {
  const q = (query || '').trim();
  if (!q) return [];

  let redis;
  try { redis = await getRedis(); } catch { return []; }

  const searchQuery = buildSongSearchQuery(q);
  if (!searchQuery) return [];

  try {
    const rs = await redis.ft.search(
      'idx:songs',
      searchQuery,
      { LIMIT: { from: 0, size: limit } }
    );
    if (rs?.documents?.length) return rs.documents.map((d) => d.value);
  } catch {
    return [];
  }

  return [];
}

// ---------- ARTISTS ----------
export async function createArtistIndex() {
  const r = await withTimeout(getRedis(), 3000, 'Redis connection timeout');

  try {
    await r.ft.create(
      'idx:artists',
      {
        // IDs / exact filters
        '$._id':              { type: 'TAG',     AS: 'artistId' },
        '$.artistSlug':       { type: 'TAG',     AS: 'artistSlug' }, // add to serializer if you haven’t yet
        '$.country':          { type: 'TAG',     AS: 'country' },
        '$.genre[*]':         { type: 'TAG',     AS: 'genre' },
        '$.languages[*]':     { type: 'TAG',     AS: 'languages' },
        '$.mood[*]':          { type: 'TAG',     AS: 'mood' },
        '$.category':         { type: 'TAG',     AS: 'category' },
        '$.plan':             { type: 'TAG',     AS: 'plan' },
        '$.role':             { type: 'TAG',     AS: 'role' },

        // Text search
        '$.fullName':         { type: 'TEXT',    AS: 'fullName' },
        '$.artistAka':        { type: 'TEXT',    AS: 'artistAka' },
        '$.bio':              { type: 'TEXT',    AS: 'bio' },

        // Booleans/numerics
        // If `confirmed` is boolean in JSON, prefer a string mirror (e.g., confirmedStr: "true"/"false") for TAGs
        '$.followersCount':   { type: 'NUMERIC', AS: 'followersCount', SORTABLE: true },
        '$.songsCount':       { type: 'NUMERIC', AS: 'songsCount',     SORTABLE: true },
        '$.albumsCount':      { type: 'NUMERIC', AS: 'albumsCount',    SORTABLE: true },
        '$.createdAtMs':      { type: 'NUMERIC', AS: 'createdAtMs',    SORTABLE: true },
        '$.updatedAtMs':      { type: 'NUMERIC', AS: 'updatedAtMs',    SORTABLE: true },
      },
      {
        ON: 'JSON',
        PREFIX: ['artist:'],
      }
    );

    console.log('✅ idx:artists created');
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










export async function updateSongRedis(songId, patch) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    if (!r) throw new Error("Redis client not available");
  } catch {
    throw new Error("Database unavailable");
  }

  const key = songKey(songId);

  // ---- read BEFORE (supports old HASH or JSON) ----
  let beforeRaw;
  let keyType = 'none';
  try {
    keyType = await withTimeout(r.type(key), 2000, "Type read timeout");

    if (keyType === 'hash') {
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (!h || !h.doc) throw new Error("updateSongRedis: song not found (hash missing doc)");

      // Parse document from stored hash blob
      beforeRaw = JSON.parse(h.doc);

      // If scalar mirrors exist in hash, prefer them (source of truth drift protection)
      if (h.playCount != null)     beforeRaw.playCount     = Number(h.playCount);
      if (h.likesCount != null)    beforeRaw.likesCount    = Number(h.likesCount);
      if (h.downloadCount != null) beforeRaw.downloadCount = Number(h.downloadCount);
      if (h.artist != null)        beforeRaw.artist        = String(h.artist);
      if (h.album != null)         beforeRaw.album         = String(h.album);

    } else if (keyType === 'ReJSON-RL' || keyType === 'json') {
      beforeRaw = await withTimeout(r.json.get(key), 2000, "JSON read timeout");
      if (!beforeRaw) throw new Error("updateSongRedis: song not found (json empty)");
    } else {
      throw new Error("updateSongRedis: song not found");
    }
  } catch (err) {
    console.error("Read failed:", err);
    throw err;
  }

  // ---- compute artistCountry if artist changed ----
  const artistChanged =
    Object.prototype.hasOwnProperty.call(patch, 'artist') &&
    String(patch.artist || '') !== String(beforeRaw.artist || '');

  let artistCountry = beforeRaw.artistCountry || '';
  let artistAka = beforeRaw.artistAka || '';
  if (artistChanged && patch.artist) {
    try {
      const a = await Artist.findById(patch.artist).select('country artistAka fullName').lean();
      artistCountry = a?.country || '';
      artistAka = a?.artistAka || a?.fullName || '';
    } catch { /* ignore */ }
  }

  // ---- normalize BEFORE/AFTER ----
  const before = buildDocForRedisJSON(
    { ...beforeRaw, createdAt: beforeRaw.createdAt, releaseDate: beforeRaw.releaseDate },
    { artistCountry: beforeRaw.artistCountry || beforeRaw.country || '', artistAka: beforeRaw.artistAka || '' }
  );

  const afterBase = { ...beforeRaw, ...patch, updatedAt: new Date() };
  const after     = buildDocForRedisJSON(afterBase, { artistCountry, artistAka });

  // ensure IDs are strings for TAG indexing
  after.artist = after.artist ? String(after.artist) : '';
  after.album  = after.album  ? String(after.album)  : '';

  // millis fields + trending
  const toMs = (d) => (d ? new Date(d).getTime() : 0);
  after.createdAtMs   = toMs(after.createdAt) || before.createdAtMs || Date.now();
  after.releaseDateMs = toMs(after.releaseDate) || 0;
  after.updatedAtMs   = Date.now();

  const createdAtSec  = Math.floor(after.createdAtMs / 1000);
  const releasedMs    = after.releaseDateMs;

  const trendingScore = computeTrendingScore({
    playCount: Number(after.playCount || 0),
    downloadCount: Number(after.downloadCount || 0),
    likesCount: Number(after.likesCount || 0),
    createdAtMs: after.createdAtMs,
  });
  after.trendingScore = trendingScore;

  // mirrors for set moves
  const beforeArtist = String(before.artist || '');
  const beforeAlbum  = String(before.album  || '');
  const afterArtist  = String(after.artist  || '');
  const afterAlbum   = String(after.album   || '');

  // ---- diffs ----
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

  const { rm: moodRm,     add: moodAdd }     =
    diffSet(arr(before.mood).filter(Boolean), arr(after.mood).filter(Boolean));
  const { rm: subRm,      add: subAdd }      =
    diffSet(arr(before.subMoods).filter(Boolean), arr(after.subMoods).filter(Boolean));

  // producers by slug
  const toSlug = (p) => (p?.nameSlug ? String(p.nameSlug) : slugToken(p?.name));
  const beforeProd = (before.producer || []).map(toSlug).filter(Boolean);
  const afterProd  = (after.producer  || []).map(toSlug).filter(Boolean);
  const { rm: prodRm, add: prodAdd } = diffSet(beforeProd, afterProd);

  // release year/month movement
  const dBefore = new Date(before.releaseDate || before.createdAt || Date.now());
  const bYYYY   = dBefore.getUTCFullYear();
  const bYYYYMM = `${bYYYY}${pad2(dBefore.getUTCMonth() + 1)}`;
  const dAfter  = new Date(after.releaseDate || after.createdAt || Date.now());
  const aYYYY   = dAfter.getUTCFullYear();
  const aYYYYMM = `${aYYYY}${pad2(dAfter.getUTCMonth() + 1)}`;
  const yearChanged = bYYYY !== aYYYY;
  const ymChanged   = bYYYYMM !== aYYYYMM;

  // similarity composites
  const simKeysBefore = simKeysForSongDoc(before);
  const simKeysAfter  = simKeysForSongDoc(after);
  const simScore      = trendingScore || releasedMs;

  // ---- write (migrate hash→json if needed) ----
  try {
    // If key is a HASH, convert it to JSON first
    if (keyType === 'hash') {
      await r.unlink(key);                 // non-blocking delete
      await r.json.set(key, '$', after);   // create JSON
    } else {
      // JSON already: set new document
      await r.json.set(key, '$', after);
    }

    // Now update indexes in a pipeline
    const m = r.multi();

    // leaderboards
    m.zAdd(C.IDX_SCORE,   [{ score: trendingScore, value: songId }]);

    if (Object.prototype.hasOwnProperty.call(patch, "playCount")) {
      const next = Number(after.playCount || 0);
      m.zAdd(C.IDX_PLAYS, [{ score: next, value: songId }]);
    }

    if (Object.prototype.hasOwnProperty.call(patch, "createdAt")) {
      m.zAdd(C.IDX_CREATED, [{ score: createdAtSec, value: songId }]);
    }

    // per-artist/per-album membership updates
    if (afterArtist !== beforeArtist) {
      if (beforeArtist) m.sRem(C.byArtist(beforeArtist), songId);
      if (afterArtist)  m.sAdd(C.byArtist(afterArtist), songId);
    }
    if (afterAlbum !== beforeAlbum) {
      if (beforeAlbum) m.sRem(C.byAlbum(beforeAlbum), songId);
      if (afterAlbum)  m.sAdd(C.byAlbum(afterAlbum), songId);
    }

    // facet sets
    if (genreChanged) {
      if (before.genre) m.sRem(C.byGenre(before.genre), songId);
      if (after.genre)  m.sAdd(C.byGenre(after.genre), songId);
    }

    for (const v of moodRm)  m.sRem(C.byMood(v), songId);
    for (const v of moodAdd) m.sAdd(C.byMood(v), songId);

    for (const v of subRm)   m.sRem(C.bySubMood(v), songId);
    for (const v of subAdd)  m.sAdd(C.bySubMood(v), songId);

    if (tempoBChanged) {
      if (Number.isFinite(before.tempoBucket)) m.sRem(C.byTempo(before.tempoBucket), songId);
      if (Number.isFinite(after.tempoBucket))  m.sAdd(C.byTempo(after.tempoBucket), songId);
    }

    if (countryChanged) {
      if (before.country) m.sRem(C.byCountry(before.country), songId);
      if (after.country)  m.sAdd(C.byCountry(after.country), songId);
    }

    // release-date indexes
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

    // producer zsets
    for (const slug of prodRm)  m.zRem(C.byProducer(slug), songId);
    for (const slug of prodAdd) m.zAdd(C.byProducer(slug), [{ score: simScore, value: songId }]);

    // similarity keys (remove old memberships, add new with TTL)
    for (const k of simKeysBefore) m.zRem(k, songId);
    for (const k of simKeysAfter) {
      m.zAdd(k, [{ score: simScore, value: songId }]);
      if (C.SIM_TTL) m.expire(k, C.SIM_TTL);
    }

    await withTimeout(m.exec(), 4000, "Update transaction timeout");

    return { updatedId: songId, trendingScore, simScore };
  } catch (error) {
    console.error("Update failed:", error);
    throw new Error(`Failed to update song: ${error.message}`);
  }
}





export async function deleteSongRedis(songId) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    if (!r) throw new Error("Redis unavailable");
  } catch (err) {
    throw new Error("Redis unavailable");
  }

  const key = songKey(songId);

  // --- read current doc (supports JSON or legacy HASH) ---
  let doc = null;
  let keyType = 'none';
  try {
    keyType = await withTimeout(r.type(key), 2000, "Type read timeout");

    if (keyType === 'ReJSON-RL' || keyType === 'json') {
      // Full JSON doc
      doc = await withTimeout(r.json.get(key), 2000, "JSON read timeout");
    } else if (keyType === 'hash') {
      // Legacy HASH with { doc: "<json>" } and scalar mirrors
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (h?.doc) {
        try { doc = JSON.parse(h.doc); } catch { doc = {}; }
        // prefer scalar mirrors if present
        if (h.artist != null) doc.artist = String(h.artist);
        if (h.album  != null) doc.album  = String(h.album);
        if (h.playCount != null)     doc.playCount     = Number(h.playCount);
        if (h.likesCount != null)    doc.likesCount    = Number(h.likesCount);
        if (h.downloadCount != null) doc.downloadCount = Number(h.downloadCount);
      }
    }
  } catch (e) {
    console.warn("deleteSongRedis: read failed, proceeding with best-effort cleanup:", e?.message || e);
  }

  // --- derive fields for cleanup ---
  const artistId = String(doc?.artist || '');
  const albumId  = String(doc?.album  || '');
  const genre    = doc?.genre ? String(doc.genre) : '';
  const country  = doc?.country ? String(doc.country) : '';
  const moods    = Array.isArray(doc?.mood) ? doc.mood.filter(Boolean).map(String) : [];
  const subMoods = Array.isArray(doc?.subMoods) ? doc.subMoods.filter(Boolean).map(String) : [];
  const tempoVal = Number(doc?.tempo || 0);
  const tb = Number.isFinite(doc?.tempoBucket) ? Number(doc.tempoBucket) : tempoBucket(tempoVal);

  // release buckets
  const releaseMs =
    (Number.isFinite(doc?.releaseDateMs) && doc.releaseDateMs) ? Number(doc.releaseDateMs) :
    (doc?.releaseDate ? +new Date(doc.releaseDate) :
    (Number.isFinite(doc?.createdAtMs) ? Number(doc.createdAtMs) :
    (doc?.createdAt ? +new Date(doc.createdAt) : 0)));

  const d  = new Date(releaseMs || 0);
  const yy = d.getUTCFullYear();
  const ym = `${yy}${pad2(d.getUTCMonth() + 1)}`;

  // producer slugs
  const producers = Array.isArray(doc?.producer) ? doc.producer : [];
  const prodSlugs = producers
    .map(p => p?.nameSlug ? String(p.nameSlug) : (p?.name ? slugToken(p.name) : ''))
    .filter(Boolean);

  // similarity composite keys (best-effort)
  const simKeys = simKeysForSongDoc({
    artist: artistId,
    album : albumId,
    genre,
    mood: moods,
    subMoods,
    tempo: tempoVal,
    tempoBucket: tb,
    country
  });

  // --- cleanup pipeline ---
  try {
    const m = r.multi();

    // leaderboards / global
    m.zRem(C.IDX_SCORE,   songId);
    m.zRem(C.IDX_PLAYS,   songId);
    m.zRem(C.IDX_CREATED, songId);
    m.zRem(C.IDX_RELEASED,songId);
    m.sRem(C.IDX_ALL,     songId);

    // per-artist / per-album
    if (artistId) m.sRem(C.byArtist(artistId), songId);
    if (albumId)  m.sRem(C.byAlbum(albumId),   songId);

    // facet sets
    if (genre)   m.sRem(C.byGenre(genre),     songId);
    if (country) m.sRem(C.byCountry(country), songId);
    if (Number.isFinite(tb)) m.sRem(C.byTempo(tb), songId);

    for (const mo of moods)    m.sRem(C.byMood(mo),       songId);
    for (const sm of subMoods) m.sRem(C.bySubMood(sm),    songId);

    // release buckets
    if (releaseMs) {
      m.sRem(C.byReleaseYear(yy), songId);
      m.sRem(C.byReleaseYM(ym),   songId);
    }

    // producer zsets
    for (const slug of prodSlugs) m.zRem(C.byProducer(slug), songId);

    // similarity keys
    for (const sk of simKeys) m.zRem(sk, songId);

    await withTimeout(m.exec(), 4000, "Redis delete transaction timeout");

    // finally remove the primary key
    // prefer UNLINK (non-blocking), fallback to DEL
    try {
      await withTimeout(r.unlink(key), 2000, "UNLINK timeout");
    } catch {
      await withTimeout(r.del(key), 2000, "DEL timeout");
    }

    return true;
  } catch (error) {
    console.error("[redis] deleteSongRedis failed:", error);
    throw new Error(`Failed to delete from cache: ${error.message}`);
  }
}







/** ---------- Read (Mongo-like object) ---------- */

export async function getSongRedis(songId) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Redis connection failed for read:", error);
    return null;
  }

  const key = songKey(songId);

  try {
    const t = await withTimeout(r.type(key), 1000, "Type read timeout");

    if (t === 'ReJSON-RL' || t === 'json') {
      // JSON canonical path
      const [doc] = await Promise.all([
        withTimeout(r.json.get(key), 2000, "JSON get timeout"),
        // best-effort last-access update; don't fail the read if this times out
        withTimeout(r.json.set(key, "$.lastAccessedMs", Date.now()), 800, "JSON lastAccessed update").catch(() => null),
      ]);
      if (!doc) return null;
      return reviveTopLevelDates(doc);
    }

    if (t === 'hash') {
      // Legacy HASH with { doc: "<json>" }
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (!h || !h.doc) return null;

      // best-effort last-access update
      await withTimeout(r.hSet(key, "lastAccessed", String(Date.now())), 800, "Hash lastAccessed update").catch(() => {});

      // parse stored JSON blob
      let doc;
      try {
        doc = JSON.parse(h.doc);
      } catch (e) {
        console.warn("getSongRedis: JSON parse failed for", key, e?.message || e);
        return null;
      }

      // prefer scalar mirrors if present
      if (h.artist != null)        doc.artist        = String(h.artist);
      if (h.album  != null)        doc.album         = String(h.album);
      if (h.playCount != null)     doc.playCount     = Number(h.playCount);
      if (h.likesCount != null)    doc.likesCount    = Number(h.likesCount);
      if (h.downloadCount != null) doc.downloadCount = Number(h.downloadCount);

      return reviveTopLevelDates(doc);
    }

    // none / unknown
    return null;
  } catch (error) {
    console.error("Error reading song from Redis:", error);
    return null;
  }
}

// Convert common top-level ISO date strings to Date objects
function reviveTopLevelDates(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const k of ["createdAt", "updatedAt", "releaseDate", "lastPlayedAt"]) {
    if (k in out) {
      const d = new Date(out[k]);
      if (!Number.isNaN(d.getTime())) out[k] = d;
    }
  }
  return out;
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
    if (!r) throw new Error("Redis client not available");
  } catch (error) {
    console.error("Redis connection failed for play count:", error);
    return 0;
  }

  const key = songKey(songId);

  try {
    const t = await withTimeout(r.type(key), 1000, "Type read timeout");

    // -------------------------
    // JSON (canonical) path
    // -------------------------
    if (t === 'ReJSON-RL' || t === 'json') {
      const m = r.multi();

      // atomically increment counters
      m.json.numIncrBy(key, '$.playCount', 1);
      if (msListened > 0) {
        m.json.numIncrBy(key, '$.msListened', Math.max(0, Math.floor(msListened)));
      }

      // timestamps
      m.json.set(key, '$.lastPlayedAt', new Date().toISOString());
      m.json.set(key, '$.updatedAtMs', Date.now());
      m.json.set(key, '$.lastAccessedMs', Date.now());

      const results = await withTimeout(m.exec(), 3000, "Play count (JSON) pipeline timeout");

      // new play count is the result of the first NUMINCRBY
      // results = [[err,val], [err,val], ...]
      let newPlayCount = 0;
      if (Array.isArray(results?.[0])) {
        const val = results[0][1];
        newPlayCount = Number(val || 0);
      }

      // fetch the few fields needed to recompute trending
      const arr = await withTimeout(
        r.json.get(key, { path: ['$.downloadCount', '$.likesCount', '$.createdAtMs'] }),
        1500,
        "JSON get for trending timeout"
      );
      const downloadCount = Array.isArray(arr) ? Number(arr[0] || 0) : Number(arr?.downloadCount || 0);
      const likesCount    = Array.isArray(arr) ? Number(arr[1] || 0) : Number(arr?.likesCount || 0);
      const createdAtMs   = Array.isArray(arr) ? Number(arr[2] || 0) : Number(arr?.createdAtMs || 0);

      const trendingScore = computeTrendingScore({
        playCount: newPlayCount,
        downloadCount,
        likesCount,
        createdAtMs,
      });

      // update trending in JSON + leaderboards
      const m2 = r.multi();
      m2.json.set(key, '$.trendingScore', trendingScore);
      m2.zAdd(C.IDX_PLAYS, [{ score: newPlayCount, value: String(songId) }]);
      m2.zAdd(C.IDX_SCORE, [{ score: trendingScore, value: String(songId) }]);
      await withTimeout(m2.exec(), 2000, "Leaderboard update timeout");

      return newPlayCount;
    }

    // -------------------------
    // Legacy HASH path (kept for back-compat)
    // -------------------------
    if (t === 'hash') {
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (!h || !h.doc) return 0;

      const m = r.multi();
      m.hIncrBy(key, "playCount", 1);
      m.zIncrBy(C.IDX_PLAYS, 1, String(songId));
      if (msListened > 0) m.hIncrBy(key, "msListened", Math.max(0, Math.floor(msListened)));
      m.hSet(key, "lastAccessed", String(Date.now()));

      // update stored blob for consumers still reading "doc"
      let doc = {};
      try { doc = JSON.parse(h.doc) || {}; } catch {}
      const next = Number(doc.playCount || h.playCount || 0) + 1;
      doc.playCount   = next;
      doc.lastPlayedAt = new Date();
      doc.updatedAt    = new Date();
      m.hSet(key, "doc", JSON.stringify(doc));

      await withTimeout(m.exec(), 3000, "Play count (HASH) pipeline timeout");

      // keep trending in sync (legacy helper; or do inline like above if preferred)
      try {
        await recomputeTrendingFor(r, songId);
      } catch (e) {
        // best-effort; don't fail the increment
        console.warn("recomputeTrendingFor failed:", e?.message || e);
      }

      return next;
    }

    // no such key
    return 0;

  } catch (error) {
    console.error("Play count increment failed:", error);
    return 0;
  }
}




export async function bumpDownloadCount(songId, delta = 1) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    if (!r) throw new Error("Redis client not available");
  } catch (error) {
    console.error("Redis connection failed for download count:", error);
    return 0;
  }

  const key = songKey(songId);
  const inc = Number.isFinite(Number(delta)) ? Math.trunc(Number(delta)) : 1;

  try {
    const t = await withTimeout(r.type(key), 1000, "Type read timeout");

    // -------------------------
    // JSON (canonical) path
    // -------------------------
    if (t === 'ReJSON-RL' || t === 'json') {
      // 1) bump count atomically
      let next = await withTimeout(
        r.json.numIncrBy(key, '$.downloadCount', inc),
        1500,
        "JSON.NUMINCRBY timeout"
      );
      next = Number(next || 0);

      // clamp at 0 if a negative delta underflows
      if (next < 0) {
        await withTimeout(r.json.set(key, '$.downloadCount', 0), 800, "Clamp JSON downloadCount timeout");
        next = 0;
      }

      // 2) update timestamps (best-effort)
      const nowMs = Date.now();
      await withTimeout(
        r.multi()
         .json.set(key, '$.updatedAtMs', nowMs)
         .json.set(key, '$.lastAccessedMs', nowMs)
         .exec(),
        1200,
        "JSON timestamp update timeout"
      ).catch(() => null);

      // 3) recompute trending & update leaderboard
      const fields = await withTimeout(
        r.json.get(key, { path: ['$.playCount','$.likesCount','$.createdAtMs'] }),
        1500,
        "JSON get for trending timeout"
      );

      const playCount  = Array.isArray(fields) ? Number(fields[0] || 0) : Number(fields?.playCount || 0);
      const likesCount = Array.isArray(fields) ? Number(fields[1] || 0) : Number(fields?.likesCount || 0);
      const createdAtMs= Array.isArray(fields) ? Number(fields[2] || 0) : Number(fields?.createdAtMs || 0);

      const trendingScore = computeTrendingScore({
        playCount,
        downloadCount: next,
        likesCount,
        createdAtMs,
      });

      const m2 = r.multi();
      m2.json.set(key, '$.trendingScore', trendingScore);
      m2.zAdd(C.IDX_SCORE, [{ score: trendingScore, value: String(songId) }]);
      await withTimeout(m2.exec(), 1500, "Leaderboard/trending update timeout");

      return next;
    }

    // -------------------------
    // Legacy HASH path
    // -------------------------
    if (t === 'hash') {
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (!h || !h.doc) return 0;

      const current = Number(h.downloadCount || 0);
      let next = Math.max(0, current + inc);

      // update hash mirrors + blob
      let doc = {};
      try { doc = JSON.parse(h.doc) || {}; } catch {}
      doc.downloadCount = next;
      doc.updatedAt = new Date();

      const m = r.multi();
      m.hSet(key, "downloadCount", String(next));
      m.hSet(key, "doc", JSON.stringify(doc));
      await withTimeout(m.exec(), 3000, "Download count (HASH) update timeout");

      // keep trending in sync (reuse your helper)
      try { await recomputeTrendingFor(r, songId); } catch {}
      return next;
    }

    // no such key
    return 0;

  } catch (error) {
    console.error("Download count bump failed:", error);
    return 0;
  }
}


export async function bumpLikesCount(songId, delta = 1) {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
    if (!r) throw new Error("Redis client not available");
  } catch (error) {
    console.error("Redis connection failed for likes count:", error);
    return 0;
  }

  const key = songKey(songId);
  const inc = Number.isFinite(Number(delta)) ? Math.trunc(Number(delta)) : 1;

  try {
    const t = await withTimeout(r.type(key), 1000, "Type read timeout");

    // -------------------------
    // JSON (canonical) path
    // -------------------------
    if (t === 'ReJSON-RL' || t === 'json') {
      // 1) bump likes atomically
      let next = await withTimeout(
        r.json.numIncrBy(key, '$.likesCount', inc),
        1500,
        "JSON.NUMINCRBY likesCount timeout"
      );
      next = Number(next || 0);

      // clamp at 0 if negative
      if (next < 0) {
        await withTimeout(r.json.set(key, '$.likesCount', 0), 800, "Clamp JSON likesCount timeout");
        next = 0;
      }

      // 2) timestamps (best-effort)
      const nowMs = Date.now();
      await withTimeout(
        r.multi()
         .json.set(key, '$.updatedAtMs', nowMs)
         .json.set(key, '$.lastAccessedMs', nowMs)
         .exec(),
        1200,
        "JSON timestamp update timeout"
      ).catch(() => null);

      // 3) recompute trending & update leaderboard
      const fields = await withTimeout(
        r.json.get(key, { path: ['$.playCount','$.downloadCount','$.createdAtMs'] }),
        1500,
        "JSON get for trending timeout"
      );

      const playCount    = Array.isArray(fields) ? Number(fields[0] || 0) : Number(fields?.playCount || 0);
      const downloadCount= Array.isArray(fields) ? Number(fields[1] || 0) : Number(fields?.downloadCount || 0);
      const createdAtMs  = Array.isArray(fields) ? Number(fields[2] || 0) : Number(fields?.createdAtMs || 0);

      const trendingScore = computeTrendingScore({
        playCount,
        downloadCount,
        likesCount: next,
        createdAtMs,
      });

      const m2 = r.multi();
      m2.json.set(key, '$.trendingScore', trendingScore);
      m2.zAdd(C.IDX_SCORE, [{ score: trendingScore, value: String(songId) }]);
      await withTimeout(m2.exec(), 1500, "Leaderboard/trending update timeout");

      return next;
    }

    // -------------------------
    // Legacy HASH path (back-compat)
    // -------------------------
    if (t === 'hash') {
      const h = await withTimeout(r.hGetAll(key), 2000, "Hash read timeout");
      if (!h || !h.doc) return 0;

      const current = Number(h.likesCount || 0);
      let next = Math.max(0, current + inc);

      let doc = {};
      try { doc = JSON.parse(h.doc) || {}; } catch {}
      doc.likesCount = next;
      doc.updatedAt  = new Date();

      const m = r.multi();
      m.hSet(key, "likesCount", String(next));
      m.hSet(key, "doc", JSON.stringify(doc));
      await withTimeout(m.exec(), 3000, "Likes count (HASH) update timeout");

      // keep trending in sync (legacy helper)
      try { await recomputeTrendingFor(r, songId); } catch {}

      return next;
    }

    // no such key
    return 0;

  } catch (error) {
    console.error("Likes count bump failed:", error);
    return 0;
  }
}




// JSON-first fetch; falls back to legacy hash { doc } if needed
export async function fetchDocsForIds(r, ids) {
  if (!ids?.length) return [];
  const keys = ids.map(id => songKey(id));

  // Prefer JSON.MGET (fast, preserves order)
  let rows;
  try {
    rows = await r.json.mGet(keys, '$'); // each row is [doc] or null
  } catch {
    rows = null;
  }

  const docsOut = new Array(keys.length).fill(null);

  if (rows) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const doc = Array.isArray(row) ? row?.[0] : row;
      if (doc && doc._id) docsOut[i] = doc;
    }
  } else {
    // Fallback: pipeline JSON.GET $ (node-redis v4 returns raw results)
    const p1 = r.multi();
    for (const k of keys) p1.json.get(k, '$');
    const res1 = await p1.exec(); // array of results (not [err,val] in node-redis v4)
    const fallbackIdxs = [];
    for (let i = 0; i < res1.length; i++) {
      const val = res1[i];
      const doc = Array.isArray(val) ? val?.[0] : val;
      if (doc && doc._id) docsOut[i] = doc;
      else fallbackIdxs.push(i);
    }

    // Legacy HASH fallback for missing ones
    if (fallbackIdxs.length) {
      const p2 = r.multi();
      for (const i of fallbackIdxs) p2.hGetAll(keys[i]);
      const res2 = await p2.exec();
      for (let j = 0; j < res2.length; j++) {
        const h = res2[j];
        if (h && h.doc) {
          try { docsOut[fallbackIdxs[j]] = JSON.parse(h.doc); } catch {}
        }
      }
    }
  }

  return docsOut.filter(Boolean);
}








// ---------- small helpers ----------
const arrify = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);

function normalizePeopleArray(list, nameKey = 'name', roleKey = 'role') {
  const out = [];
  for (const item of arrify(list)) {
    if (item == null) continue;
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) out.push({ name, [roleKey]: null });
      continue;
    }
    const name = (item?.[nameKey] ?? '').toString().trim();
    const role = item?.[roleKey] ?? item?.contribution ?? null; // support composer.contribution too
    if (name) out.push({ name, [roleKey]: role ?? null });
  }
  return out;
}

function normalizeSongForGraphQL(s) {
  const mood      = arrify(s.mood).filter(Boolean).map(String);
  const subMoods  = arrify(s.subMoods).filter(Boolean).map(String);
  const feat      = arrify(s.featuringArtist).filter(Boolean).map(String);

  // Producers: ensure [{ name, role }]
  const producer  = normalizePeopleArray(s.producer, 'name', 'role');

  // Composers: ensure [{ name, contribution }]
  const composer = arrify(s.composer).map(item => {
    if (item == null) return null;
    if (typeof item === 'string') return { name: item.trim(), contribution: null };
    const name = (item?.name ?? '').toString().trim();
    const contribution = item?.contribution ?? null;
    return name ? { name, contribution } : null;
  }).filter(Boolean);

  return {
    ...s,
    mood,
    subMoods,
    featuringArtist: feat,
    producer,
    composer
  };
}

// ---------- main ----------
export async function hydrateSongsForClient(r, songs) {
  if (!songs?.length) return [];

  const artistIds = [...new Set(songs.map(s => String(s.artist || '')).filter(Boolean))];
  const albumIds  = [...new Set(songs.map(s => String(s.album  || '')).filter(Boolean))];

  console.log(`[hydrate] input songs=${songs.length}  artistIds=${artistIds.length}  albumIds=${albumIds.length}`);

  const safeParse = (x) => {
    if (!x) return null;
    if (typeof x === 'object') return x;
    try { return JSON.parse(x); } catch { return null; }
  };

  // 1) Try Redis caches first
  let artistsArr = [];
  let albumsArr  = [];
  try {
    const a = await getMultipleArtistsRedis(r, artistIds);
    artistsArr = Array.isArray(a) ? a.map(safeParse).filter(Boolean) : [];
  } catch (e) {
    console.warn('[hydrate] getMultipleArtistsRedis failed:', e?.message || e);
  }
  try {
    const b = await getMultipleAlbumsRedis(r, albumIds);
    albumsArr = Array.isArray(b) ? b.map(safeParse).filter(Boolean) : [];
  } catch (e) {
    console.warn('[hydrate] getMultipleAlbumsRedis failed:', e?.message || e);
  }

  console.log(`[hydrate] redis hits  artists=${artistsArr.length}  albums=${albumsArr.length}`);

  const artistMap = new Map(artistsArr.map(a => [String(a._id), a]));
  const albumMap  = new Map(albumsArr.map(a => [String(a._id), a]));

  // 2) Mongo fallback for misses, then WRITE BACK to Redis (cache-aside)
  const missingArtistIds = artistIds.filter(id => !artistMap.has(id));
  const missingAlbumIds  = albumIds.filter(id => !albumMap.has(id));

  if (missingArtistIds.length) {
    try {
      const docs = await Artist.find({ _id: { $in: missingArtistIds } })
        .select('_id artistAka country profileImage createdAt updatedAt')
        .lean();

      for (const a of docs) artistMap.set(String(a._id), a);
      console.log(`[hydrate] mongo fallback artists=${docs.length}`);

      // write-back to Redis
      await Promise.all(
        docs.map(doc =>
          artistCreateRedis(doc, { updateExisting: true })
            .catch(e => console.warn('[hydrate] artistCreateRedis failed:', e?.message || e))
        )
      );
    } catch (e) {
      console.warn('[hydrate] mongo artist fallback failed:', e?.message || e);
    }
  }

  if (missingAlbumIds.length) {
    try {
      const docs = await Album.find({ _id: { $in: missingAlbumIds } })
        .select('_id title artist createdAt')
        .lean();

      for (const a of docs) albumMap.set(String(a._id), a);
      console.log(`[hydrate] mongo fallback albums=${docs.length}`);

      // write-back to Redis
      await Promise.all(
        docs.map(doc =>
          albumCreateRedis(doc, { updateExisting: true })
            .catch(e => console.warn('[hydrate] albumCreateRedis failed:', e?.message || e))
        )
      );
    } catch (e) {
      console.warn('[hydrate] mongo album fallback failed:', e?.message || e);
    }
  }

  // 3) Shape to GraphQL selection (nested artist/album) + normalize arrays
  const shaped = songs.map(s => {
    const a = s.artist ? artistMap.get(String(s.artist)) : null;
    const b = s.album  ? albumMap.get(String(s.album))   : null;

    const base = {
      ...s,
      artist: a
        ? { _id: String(a._id), artistAka: a.artistAka ?? null, country: a.country ?? null, profileImage: a.profileImage ?? null }
        : (s.artist ? { _id: String(s.artist), artistAka: null, country: null, profileImage: null } : null),
      album: b
        ? { _id: String(b._id), title: b.title ?? null }
        : (s.album ? { _id: String(s.album), title: null } : null),
    };

    return normalizeSongForGraphQL(base);
  });

  console.log(`[hydrate] shaped=${shaped.length}`);
  return shaped;
}


export async function redisTrending(limit = 20) {
  const r = await getRedis();
  const n = Math.max(0, Number(limit) | 0);
  if (n === 0) return [];

  const ids = await r.zRange(C.IDX_SCORE, 0, Math.max(0, n - 1), { REV: true });
  // console.log('ids returned of trending songs:', ids);
  if (!ids?.length) return [];

  const raw = await fetchDocsForIds(r, ids);
  // console.log('raws returned from trending songs:', raw)
  const songs = await hydrateSongsForClient(r, raw);
  // console.log('hydrated[0]:', songs[0]);
  return songs;
}



export async function redisPopular(limit = 20) {
  const r = await getRedis();
  const ids = await r.zRange(C.IDX_PLAYS, 0, Math.max(0, limit - 1), { REV: true });
  const raw = await fetchDocsForIds(r, ids);
  return hydrateSongsForClient(r, raw);
}

export async function redisNewReleases(limit = 20) {
  const r = await getRedis();
  const ids = await r.zRange(C.IDX_CREATED, 0, Math.max(0, limit - 1), { REV: true });
  const raw = await fetchDocsForIds(r, ids);
  return hydrateSongsForClient(r, raw);
}

// Example: similar songs -> hydrate too
export async function similarSongs(_p, { songId, limit = 20 }) {
  const r = await getRedis();
  const ids = await getSimilarSongIds(r, songId, limit); // your existing logic
  const raw = await fetchDocsForIds(r, ids);
  return hydrateSongsForClient(r, raw);
}













/** ---------- Capacity & eviction ---------- */
export async function getCurrentSongCount() {
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Error getting song count (conn):", error);
    return 0;
  }

  try {
    // Query several sources in parallel; whichever is highest wins.
    const results = await withTimeout(
      Promise.allSettled([
        r.zCard(C.IDX_SCORE),   // primary: trending score index
        r.zCard(C.IDX_PLAYS),   // backup: plays leaderboard
        r.zCard(C.IDX_CREATED), // backup: created-time index
        r.sCard(C.IDX_ALL),     // backup: membership set
      ]),
      2500,
      "Song count timeout"
    );

    const val = (p) => (p.status === "fulfilled" ? Number(p.value || 0) : 0);
    const counts = {
      score:   val(results[0]),
      plays:   val(results[1]),
      created: val(results[2]),
      all:     val(results[3]),
    };

    const maxCount = Math.max(counts.score, counts.plays, counts.created, counts.all);

    // Optional: warn in non-prod if things drift (can help spot bugs)
    if (process.env.NODE_ENV !== "production") {
      const uniq = new Set(Object.values(counts));
      if (uniq.size > 1) {
        console.warn("[getCurrentSongCount] index drift detected:", counts);
      }
    }

    return maxCount;
  } catch (error) {
    console.error("Error getting song count:", error);
    return 0;
  }
}


/**
 * Get up to `limit` song IDs from a chosen index.
 *
 * @param {number} limit  Max number of IDs to return (default 1000)
 * @param {object} [opts]
 * @param {'score'|'plays'|'created'|'released'} [opts.by='score']   Which index to read
 * @param {'asc'|'desc'} [opts.direction='asc']                      Sort direction
 */

export async function getAllSongIds(limit = 1000, opts = {}) {
  const by        = (opts.by || 'score').toLowerCase();
  const direction = (opts.direction || 'asc').toLowerCase();

  const end = Math.max(0, (Number(limit) | 0) - 1);
  if (end < 0) return [];

  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");
  } catch (error) {
    console.error("Error getting song IDs (conn):", error);
    return [];
  }

  const idxMap = {
    score:   C.IDX_SCORE,
    plays:   C.IDX_PLAYS,
    created: C.IDX_CREATED,
    released:C.IDX_RELEASED,
  };
  const zkey = idxMap[by] || C.IDX_SCORE;

  try {
    // Prefer zset (ordered). Use native REV so we don't fetch and reverse.
    let ids;
    if (direction === 'desc') {
      ids = await withTimeout(r.zRange(zkey, 0, end, { REV: true }), 2000, "ZRange (rev) timeout");
    } else {
      ids = await withTimeout(r.zRange(zkey, 0, end), 2000, "ZRange timeout");
    }

    if (Array.isArray(ids) && ids.length) return ids.filter(Boolean);

    // Fallback: membership set (unordered) if the zset is empty/out-of-sync.
    // We SSCAN until we collect up to `limit` IDs.
    const out = [];
    let cursor = 0;
    do {
      const [next, chunk] = await withTimeout(
        r.sScan(C.IDX_ALL, cursor, { COUNT: Math.min(1000, limit) }),
        2000,
        "SSCAN timeout"
      );
      cursor = Number(next) || 0;
      if (Array.isArray(chunk) && chunk.length) {
        for (const id of chunk) {
          if (id) out.push(id);
          if (out.length >= limit) break;
        }
      }
      if (out.length >= limit) break;
    } while (cursor !== 0);

    return out;

  } catch (error) {
    console.error("Error getting song IDs:", error);
    return [];
  }
}



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
  const LOCK_KEY = C.LOCK_EVICT || "lock:evict:songs";
  const LOCK_TTL = 10_000; // ms
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  // Try to be the only evictor
  try {
    const locked = await withTimeout(
      r.set(LOCK_KEY, token, { NX: true, PX: LOCK_TTL }),
      1000,
      "Evict lock timeout"
    );
    if (!locked) {
      // someone else is evicting; just exit quietly
      return evicted;
    }
  } catch (err) {
    console.warn("Evict lock acquire failed:", err?.message || err);
    // proceed without a lock (best effort), but keep the loop cautious
  }

  try {
    // Re-check size inside the (possible) lock window
    let size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size check timeout");
    const cap  = Number(C.MAX_N_SONGS || 0);

    if (!Number.isFinite(size) || !Number.isFinite(cap) || cap <= 0) return evicted;
    if (size <= cap) return evicted;

    // Evict in small batches to avoid long blocking
    while (size > cap) {
      const nExtra = Math.min(size - cap, 200); // batch 200 at a time
      const victims = await withTimeout(
        r.zRange(C.IDX_SCORE, 0, nExtra - 1),
        2000,
        "Victim selection timeout"
      );
      if (!victims?.length) break;

      // Claim the victims from IDX_SCORE early to reduce contention
      try {
        await withTimeout(r.zRem(C.IDX_SCORE, victims), 2000, "zRem claim timeout");
      } catch (e) {
        // If claim fails, continue anyway; deleteSongRedis also zRems.
      }

      // Remove each song (cleans other zsets/sets/keys)
      for (const id of victims) {
        try {
          await deleteSongRedis(id);
          evicted.push(id);
        } catch (e) {
          console.warn("[redis] eviction delete failed for", id, e?.message || e);
        }
      }

      // Update size and continue if still over cap
      size = await withTimeout(r.zCard(C.IDX_SCORE), 2000, "Size update timeout");
    }

    if (evicted.length) {
      console.log(`[redis] Evicted ${evicted.length} song(s) to cap=${cap}`);
    }
    return evicted;

  } catch (error) {
    console.error("Eviction failed:", error);
    return evicted;

  } finally {
    // best-effort safe release (only delete if we still hold the lock)
    try {
      const v = await withTimeout(r.get(LOCK_KEY), 500, "Lock get timeout");
      if (v === token) await withTimeout(r.del(LOCK_KEY), 500, "Lock release timeout");
    } catch { /* ignore */ }
  }
}



// Health probe with richer diagnostics
export async function checkRedisStatus() {
  const nowIso = new Date().toISOString();
  let r;
  try {
    r = await withTimeout(getRedis(), 2000, "Redis connection timeout");

    const t0 = Date.now();
    const pong = await withTimeout(r.ping(), 1000, "Ping timeout");
    const latencyMs = Date.now() - t0;

    const [memoryMB, counts, indexInfo] = await Promise.all([
      usedMB(r).catch(() => null),
      (async () => {
        const [score, plays, created, released, all] = await Promise.all([
          r.zCard(C.IDX_SCORE).catch(() => 0),
          r.zCard(C.IDX_PLAYS).catch(() => 0),
          r.zCard(C.IDX_CREATED).catch(() => 0),
          r.zCard(C.IDX_RELEASED).catch(() => 0),
          r.sCard(C.IDX_ALL).catch(() => 0),
        ]);
        return {
          score, plays, created, released, all,
          estimated: Math.max(score, plays, created, released, all),
        };
      })(),
      (async () => {
        try {
          await r.ft.info('idx:songs');
          return { exists: true };
        } catch {
          return { exists: false };
        }
      })(),
    ]);

    return {
      status: "connected",
      ping: pong,
      latencyMs,
      memoryMB,
      counts,
      index: indexInfo,
      timestamp: nowIso,
    };
  } catch (error) {
    return {
      status: "disconnected",
      error: error.message,
      timestamp: nowIso,
    };
  }
}

// Periodic cleanup with a best-effort lock
export async function runCleanupTask() {
  let r;
  try {
    r = await getRedis();
  } catch (e) {
    console.error("[redis] cleanup conn error:", e);
    return { success: false, error: "connection_failed" };
  }

  const LOCK_KEY = C.LOCK_CLEANUP || "lock:cleanup:songs";
  const LOCK_TTL = 30_000; // ms
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  try {
    // Acquire lock (best effort)
    const ok = await r.set(LOCK_KEY, token, { NX: true, PX: LOCK_TTL });
    if (!ok) return { success: false, error: "locked" };

    const mb = await usedMB(r).catch(() => null);
    if (mb != null && C.MAX_MB && mb > C.MAX_MB) {
      await notifyAdmin("Redis memory above threshold", { usedMB: +mb.toFixed(2) }).catch(() => {});
    }

    const evicted = await enforceSongLimit().catch((e) => {
      console.error("[redis] enforceSongLimit error:", e);
      return [];
    });

    return { success: true, memoryMB: mb, evictedCount: evicted.length };
  } catch (e) {
    console.error("[redis] cleanup error:", e);
    return { success: false, error: e.message || String(e) };
  } finally {
    // Release lock if we still hold it
    try {
      const v = await r.get(LOCK_KEY);
      if (v === token) await r.del(LOCK_KEY);
    } catch { /* ignore */ }
  }
}


export async function getMultipleSongsRedis(
  redis,
  songIds = [],
  { touchTTL = true, ttl = SONG_CONFIG.TTL, touchAccess = false } = {}
) {
  if (!Array.isArray(songIds) || songIds.length === 0) return [];

  const keys = songIds.map(songKey);
  const docs = new Array(keys.length).fill(null);

  // 1) Try JSON first in a single pipeline
  const p1 = redis.multi();
  for (const k of keys) p1.json.get(k);
  const res1 = await p1.exec(); // [[err, val], ...]

  const fallbackIdxs = [];
  for (let i = 0; i < res1.length; i++) {
    const [err, val] = res1[i] || [];
    if (!err && val) {
      docs[i] = val; // JSON doc found
    } else {
      fallbackIdxs.push(i); // need legacy fallback
    }
  }

  // 2) Fallback for legacy HASH keys (only those that failed JSON)
  if (fallbackIdxs.length) {
    const p2 = redis.multi();
    for (const i of fallbackIdxs) p2.hGetAll(keys[i]);
    const res2 = await p2.exec();

    for (let j = 0; j < res2.length; j++) {
      const [err, h] = res2[j] || [];
      if (!err && h && h.doc) {
        try { docs[fallbackIdxs[j]] = JSON.parse(h.doc); } catch { /* ignore bad JSON */ }
      }
    }
  }

  // 3) Touch TTL and/or lastAccessedMs (best-effort)
  if (touchTTL || touchAccess) {
    const now = Date.now();
    let touched = false;
    const pt = redis.multi();

    for (let i = 0; i < keys.length; i++) {
      if (!docs[i]) continue;

      if (touchTTL && Number.isFinite(ttl) && ttl > 0) {
        pt.expire(keys[i], ttl); // works for any Redis key type
        touched = true;
      }
      if (touchAccess) {
        // JSON path update (ignore failure for legacy hashes)
        pt.json.set(keys[i], '$.lastAccessedMs', now);
        touched = true;
      }
    }

    if (touched) {
      try { await pt.exec(); } catch { /* ignore best-effort */ }
    }
  }

  // Return found docs in input order (compacted)
  return docs.filter(Boolean);
}



// ----------------------
