import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { usedMB, notifyAdmin } from "./songCreateRedis.js";
import {Album} from '../../../models/Artist/index_artist.js'
import {C} from './songCreateRedis.js'


/** ---------- Album Config ---------- */
const ALBUM_CONFIG = {
  MAX_MB: 7.5,
  ALBUM_PREFIX: "album:", 
  IDX_ALL_ALBUMS: "index:albums:all",  
  IDX_ALBUMS_BY_ARTIST: "index:albums:artist:", // + artistId
  IDX_ALBUMS_BY_DATE: "index:albums:date",
  IDX_ALBUMS_BY_SONG_COUNT: "index:albums:song_count",
  TTL: 24 * 60 * 60, // 24 hours in seconds
}

const albumKey = (id) => `${ALBUM_CONFIG.ALBUM_PREFIX}${id}`;
const albumsByArtistKey = (artistId) => `${ALBUM_CONFIG.IDX_ALBUMS_BY_ARTIST}${artistId}`;

/** Timeout wrapper */
const withTimeout = (promise, timeoutMs = 5000, errorMessage = "Operation timeout") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);

/** Helper to serialize album data for Redis */
const serializeAlbum = (album) => {
  if (!album) return null;
  
  return {
    _id: album._id?.toString(),
    title: album.title,
    artist: album.artist?._id ? {
      _id: album.artist._id.toString(),
      artistAka: album.artist.artistAka,
      profileImage: album.artist.profileImage
    } : album.artist?.toString(),
    releaseDate: album.releaseDate?.toISOString(),
    songs: album.songs?.map(id => id.toString()) || [],
    songsCount: album.songs?.length || 0,
    albumCoverImage: album.albumCoverImage,
    createdAt: album.createdAt?.toISOString(),
    updatedAt: album.updatedAt?.toISOString()
  };
};

/** Helper to check Redis memory usage */
const checkMemoryAndNotify = async (redis, operation) => {
  try {
    const memory = await usedMB(redis);
    if (memory > ALBUM_CONFIG.MAX_MB) {
      await notifyAdmin(`High Redis memory usage: ${memory}MB during ${operation}`);
    }
    return memory;
  } catch (error) {
    console.warn('Memory check failed:', error.message);
  }
};



/** Create/Update album in Redis (JSON canonical) */
export async function albumCreateRedis(albumData, options = {}) {
  const { updateExisting = false, ttl = ALBUM_CONFIG.TTL } = options;
  let redis;

  try {
    redis = await getRedis();
    const albumId = albumData._id?.toString();
    if (!albumId) throw new Error('Album ID is required');

    const key = albumKey(albumId);

    if (!updateExisting) {
      const exists = await withTimeout(redis.exists(key), 1500, 'Exists timeout');
      if (exists) {
        console.log(`Album ${albumId} already exists in Redis`);
        return { success: true, action: 'exists' };
      }
    }

    // Hydrate if needed
    let album = albumData;
    if (!album.title || !album.artist) {
      album = await Album.findById(albumId)
        .populate('artist', 'artistAka profileImage')
        .populate('songs', '_id title duration')
        .lean();
      if (!album) throw new Error(`Album ${albumId} not found in database`);
    }

    const serializedAlbum = serializeAlbum(album);
    if (!serializedAlbum) throw new Error('Failed to serialize album data');

    // Normalize common fields
    serializedAlbum._id    = String(serializedAlbum._id || albumId);
    serializedAlbum.songs  = (serializedAlbum.songs || []).map(String);
    serializedAlbum.songsCount = serializedAlbum.songs?.length || 0;
    serializedAlbum.createdAtMs  = serializedAlbum.createdAt ? +new Date(serializedAlbum.createdAt) : Date.now();
    serializedAlbum.releaseDateMs = serializedAlbum.releaseDate ? +new Date(serializedAlbum.releaseDate) : 0;
    serializedAlbum.updatedAtMs   = Date.now();

    // Ensure JSON type at key
    const t = await withTimeout(redis.type(key), 1000, 'Type timeout');
    if (t && t !== 'none' && t !== 'json' && t !== 'ReJSON-RL') {
      await withTimeout(redis.unlink(key), 1500, 'UNLINK legacy album timeout');
    }

    await withTimeout(redis.json.set(key, '$', serializedAlbum), 3000, 'JSON set timeout');
    if (Number.isFinite(ttl) && ttl > 0) await withTimeout(redis.expire(key, ttl), 1500, 'Expire timeout');

    // Indexes
    await updateAlbumIndexes(redis, serializedAlbum);

    await checkMemoryAndNotify(redis, `albumCreateRedis:${albumId}`);

    console.log(`✅ Album ${albumId} ${updateExisting ? 'updated' : 'created'} in Redis`);
    return { success: true, action: updateExisting ? 'updated' : 'created' };

  } catch (error) {
    console.error('❌ albumCreateRedis error:', error);
    throw error;
  }
}

/** Update album in Redis (alias) */
export async function albumUpdateRedis(albumData, options = {}) {
  return albumCreateRedis(albumData, { ...options, updateExisting: true });
}





/** Get album from Redis */
export async function getAlbumRedis(albumId) {
  let redis;
  
  try {
    redis = await getRedis();
    const key = albumKey(albumId);
    
    const albumData = await withTimeout(
      redis.get(key),
      2000,
      'Redis get timeout'
    );

    if (!albumData) {
      return null;
    }

    const album = JSON.parse(albumData);
    
    // Refresh TTL on access
    await withTimeout(
      redis.expire(key, ALBUM_CONFIG.TTL),
      1000,
      'Redis expire timeout'
    );

    return album;

  } catch (error) {
    console.error('❌ getAlbumRedis error:', error);
    return null;
  }
}


/** Delete album from Redis */
export async function deleteAlbumRedis(albumId) {
  let redis;
  try {
    redis = await getRedis();
    const key = albumKey(albumId);

    // Read album for index cleanup
    let album = null;
    const t = await withTimeout(redis.type(key), 1000, 'Type timeout');
    try {
      if (t === 'json' || t === 'ReJSON-RL') {
        album = await withTimeout(redis.json.get(key), 1500, 'JSON get timeout');
      } else if (t === 'string') {
        const raw = await withTimeout(redis.get(key), 1500, 'GET timeout');
        if (raw) album = JSON.parse(raw);
      }
    } catch {}

    // Remove from indexes first (best effort)
    await removeAlbumFromIndexes(redis, albumId, album);

    // Remove the primary key
    try {
      await withTimeout(redis.unlink(key), 1500, 'UNLINK timeout');
    } catch {
      await withTimeout(redis.del(key), 1500, 'DEL timeout');
    }

    console.log(`✅ Album ${albumId} deleted from Redis`);
    return { success: true };

  } catch (error) {
    console.error('❌ deleteAlbumRedis error:', error);
    throw error;
  }
}


/** Get multiple albums from Redis */
export async function getMultipleAlbumsRedis(redis, albumIds = [], { touchTTL = true } = {}) {
  if (!albumIds?.length) return [];
  const keys = albumIds.map(albumKey);
  const out  = new Array(keys.length).fill(null);

  // JSON first
  const p1 = redis.multi();
  for (const k of keys) p1.json.get(k);
  const res1 = await withTimeout(p1.exec(), 3000, 'JSON multi get timeout');

  const fallbackIdxs = [];
  for (let i = 0; i < res1.length; i++) {
    const [, val] = res1[i] || [];
    if (val) out[i] = val; else fallbackIdxs.push(i);
  }

  // legacy strings
  if (fallbackIdxs.length) {
    const p2 = redis.multi();
    for (const i of fallbackIdxs) p2.get(keys[i]);
    const res2 = await withTimeout(p2.exec(), 3000, 'GET multi timeout');
    for (let j = 0; j < res2.length; j++) {
      const [, raw] = res2[j] || [];
      if (!raw) continue;
      try { out[fallbackIdxs[j]] = JSON.parse(raw); } catch {}
    }
  }

  // touch TTL
  if (touchTTL && Number.isFinite(ALBUM_CONFIG.TTL) && ALBUM_CONFIG.TTL > 0) {
    const p3 = redis.multi(); let has = false;
    for (let i = 0; i < keys.length; i++) if (out[i]) { p3.expire(keys[i], ALBUM_CONFIG.TTL); has = true; }
    if (has) await withTimeout(p3.exec(), 2000, 'Expire multi timeout');
  }

  return out.filter(Boolean);
}






/** Update album indexes */
async function updateAlbumIndexes(redis, album) {
  try {
    const albumId  = String(album._id);
    const artistId = typeof album.artist === 'object' ? String(album.artist?._id) : String(album.artist || '');
    const createdMs = Number(album.createdAtMs || (album.createdAt ? +new Date(album.createdAt) : Date.now()));
    const releaseMs = Number(album.releaseDateMs || (album.releaseDate ? +new Date(album.releaseDate) : 0));
    const songsCount = Number(album.songsCount || (Array.isArray(album.songs) ? album.songs.length : 0));

    const m = redis.multi();

    // All albums (created time)
    m.zAdd(ALBUM_CONFIG.IDX_ALL_ALBUMS, [{ score: createdMs, value: albumId }]);

    // By artist (created time)
    if (artistId) m.zAdd(albumsByArtistKey(artistId), [{ score: createdMs, value: albumId }]);

    // By release date
    if (releaseMs) m.zAdd(ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, [{ score: releaseMs, value: albumId }]);

    // By song count
    m.zAdd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, [{ score: songsCount, value: albumId }]);

    await withTimeout(m.exec(), 3000, 'Album index update timeout');
  } catch (error) {
    console.warn('Album index update failed:', error);
  }
}

/** Remove album from indexes */
async function removeAlbumFromIndexes(redis, albumId, album = null) {
  try {
    let artistId = null;

    if (!album) {
      // Try to read JSON/string if caller didn't pass it
      const key = albumKey(albumId);
      const t = await redis.type(key);
      try {
        if (t === 'json' || t === 'ReJSON-RL') {
          const a = await redis.json.get(key);
          album = a || null;
        } else if (t === 'string') {
          const raw = await redis.get(key);
          if (raw) album = JSON.parse(raw);
        }
      } catch {}
    }

    if (album?.artist) {
      artistId = typeof album.artist === 'object' ? String(album.artist._id) : String(album.artist);
    }

    const m = redis.multi();
    m.zRem(ALBUM_CONFIG.IDX_ALL_ALBUMS, albumId);
    m.zRem(ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, albumId);
    m.zRem(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, albumId);
    if (artistId) m.zRem(albumsByArtistKey(artistId), albumId);

    await withTimeout(m.exec(), 3000, 'Album index removal timeout');
  } catch (error) {
    console.warn('Album index removal failed:', error);
  }
}




/** Get albums by artist from Redis */
export async function getAlbumsByArtistRedis(artistId, limit = 50) {
  try {
    const redis = await getRedis();
    const key = albumsByArtistKey(artistId);

    const albumIds = await withTimeout(
      redis.zRange(key, 0, Math.max(0, limit - 1), { REV: true }),
      2000, 'zRange artist albums timeout'
    );
    if (!albumIds.length) return [];

    return await getMultipleAlbumsRedis(redis, albumIds);
  } catch (error) {
    console.error('❌ getAlbumsByArtistRedis error:', error);
    return [];
  }
}

/** Get latest albums (by created time) */
export async function getLatestAlbumsRedis(limit = 20) {
  try {
    const redis = await getRedis();
    const albumIds = await withTimeout(
      redis.zRange(ALBUM_CONFIG.IDX_ALL_ALBUMS, 0, Math.max(0, limit - 1), { REV: true }),
      2000, 'zRange all albums timeout'
    );
    if (!albumIds.length) return [];
    return await getMultipleAlbumsRedis(redis, albumIds);
  } catch (error) {
    console.error('❌ getLatestAlbumsRedis error:', error);
    return [];
  }
}



/** Get albums by release date */
export async function getAlbumsByReleaseDateRedis(limit = 20, descending = true) {
  try {
    const redis = await getRedis();
    const opts = descending ? { REV: true } : undefined;
    const albumIds = await withTimeout(
      redis.zRange(ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, 0, Math.max(0, limit - 1), opts),
      2000, 'zRange albums by date timeout'
    );
    if (!albumIds.length) return [];
    return await getMultipleAlbumsRedis(redis, albumIds);
  } catch (error) {
    console.error('❌ getAlbumsByReleaseDateRedis error:', error);
    return [];
  }
}

/** Get albums with most songs */
export async function getAlbumsBySongCountRedis(limit = 20) {
  try {
    const redis = await getRedis();
    const albumIds = await withTimeout(
      redis.zRange(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, 0, Math.max(0, limit - 1), { REV: true }),
      2000, 'zRange albums by song count timeout'
    );
    if (!albumIds.length) return [];
    return await getMultipleAlbumsRedis(redis, albumIds);
  } catch (error) {
    console.error('❌ getAlbumsBySongCountRedis error:', error);
    return [];
  }
}






/** Search albums in Redis */
/** Search albums in Redis */
export async function searchAlbumsRedis(query, limit = 20) {
  const q = (query || '').trim();
  if (!q) return [];

  let redis;
  try { redis = await getRedis(); } catch (e) { return []; }

  // Try RediSearch if you've created an ON JSON album index (e.g. 'idx:albums')
  try {
    const rs = await redis.ft.search(
      'idx:albums',
      `(@title:(${escapeFt(q)}*)) | (@artistAka:(${escapeFt(q)}*))`,
      { LIMIT: { from: 0, size: limit } }
    );
    if (rs?.documents?.length) return rs.documents.map(d => d.value);
  } catch {
    // no index or search error → fallback
  }

  // Fallback: client-side filter
  try {
    const allIds = await withTimeout(
      redis.zRange(ALBUM_CONFIG.IDX_ALL_ALBUMS, 0, -1),
      3000, 'zRange all albums timeout'
    );
    const all = await getMultipleAlbumsRedis(redis, allIds);
    const s = q.toLowerCase();
    return all.filter(a =>
      a?.title?.toLowerCase().includes(s) ||
      (a?.artist && typeof a.artist === 'object' && a.artist.artistAka?.toLowerCase().includes(s))
    ).slice(0, limit);
  } catch (e) {
    console.error('searchAlbumsRedis fallback error:', e);
    return [];
  }
}

function escapeFt(s='') {
  return String(s).replace(/([\-+\|\{\}\[\]\(\)\^\~\*\:\\"@])/g, '\\$1');
}





/** Add song to album in Redis */
export async function addSongToAlbumRedis(albumId, songId) {
  try {
    const redis = await getRedis();
    const key = albumKey(albumId);

    const t = await withTimeout(redis.type(key), 1000, 'Type timeout');
    if (t !== 'json' && t !== 'ReJSON-RL') {
      // migrate legacy string if present
      const raw = await redis.get(key);
      if (!raw) return { success: false, error: 'Album not found in Redis' };
      try { await redis.json.set(key, '$', JSON.parse(raw)); await redis.unlink(key); } catch {}
    }

    // fetch songs array to check membership
    let songsArr = await withTimeout(redis.json.get(key, { path: '$.songs' }), 1500, 'JSON get songs timeout');
    songsArr = Array.isArray(songsArr) ? songsArr[0] : songsArr;
    if (!Array.isArray(songsArr)) songsArr = [];

    const sid = String(songId);
    if (songsArr.includes(sid)) return { success: true }; // already in

    // append & bump count atomically
    const m = redis.multi();
    m.json.arrAppend(key, '$.songs', sid);
    m.json.numIncrBy(key, '$.songsCount', 1);
    m.json.set(key, '$.updatedAtMs', Date.now());
    await withTimeout(m.exec(), 2000, 'Album add song pipeline timeout');

    // update song-count index
    const newCountArr = await withTimeout(redis.json.get(key, { path: '$.songsCount' }), 1000, 'JSON get count timeout');
    const newCount = Array.isArray(newCountArr) ? Number(newCountArr[0] || 0) : Number(newCountArr || 0);
    await withTimeout(
      redis.zAdd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, [{ score: newCount, value: String(albumId) }]),
      1000, 'zAdd song count timeout'
    );

    return { success: true };
  } catch (error) {
    console.error('❌ addSongToAlbumRedis error:', error);
    return { success: false, error: error.message };
  }
}

/** Remove song from album in Redis */
export async function removeSongFromAlbumRedis(albumId, songId) {
  try {
    const redis = await getRedis();
    const key = albumKey(albumId);

    const t = await withTimeout(redis.type(key), 1000, 'Type timeout');
    if (t !== 'json' && t !== 'ReJSON-RL') {
      const raw = await redis.get(key);
      if (!raw) return { success: false, error: 'Album not found in Redis' };
      try { await redis.json.set(key, '$', JSON.parse(raw)); await redis.unlink(key); } catch {}
    }

    // fetch and filter array (ARRPOP can't remove by value)
    let songsArr = await withTimeout(redis.json.get(key, { path: '$.songs' }), 1500, 'JSON get songs timeout');
    songsArr = Array.isArray(songsArr) ? songsArr[0] : songsArr;
    if (!Array.isArray(songsArr)) songsArr = [];

    const sid = String(songId);
    const next = songsArr.filter(id => String(id) !== sid);
    if (next.length === songsArr.length) return { success: true }; // nothing to do

    const m = redis.multi();
    m.json.set(key, '$.songs', next);
    m.json.set(key, '$.songsCount', next.length);
    m.json.set(key, '$.updatedAtMs', Date.now());
    await withTimeout(m.exec(), 2000, 'Album remove song pipeline timeout');

    // update song-count index
    await withTimeout(
      redis.zAdd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, [{ score: next.length, value: String(albumId) }]),
      1000, 'zAdd song count timeout'
    );

    return { success: true };
  } catch (error) {
    console.error('❌ removeSongFromAlbumRedis error:', error);
    return { success: false, error: error.message };
  }
}



// ------------migration---------------
// Full reindex: drop everything (songs/artists/albums keys + FT indexes) and reinsert JSON docs from Mongo
export async function deleteAllSongInRedisAndInsertThemAgain({
  batchSize = 500,
  withLock = true
} = {}) {
  const r = await withTimeout(getRedis(), 5000, "Redis connection timeout");

  // --- 1) Acquire a best-effort lock so only one migrator runs
  const LOCK_KEY = "lock:migrate:all";
  const LOCK_TTL_MS = 10 * 60 * 1000; // 10 mins
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  if (withLock) {
    const ok = await r.set(LOCK_KEY, token, { NX: true, PX: LOCK_TTL_MS }).catch(() => null);
    if (!ok) return { ok: false, reason: "locked" };
  }

  const summary = {
    ok: true,
    droppedIndexes: [],
    deletedKeys: { songs: 0, artists: 0, albums: 0, indexes: 0 },
    reinserted: { artists: 0, albums: 0, songs: 0 },
    errors: [],
    startedAt: new Date().toISOString(),
    finishedAt: null
  };

  try {
    // --- 2) Drop RediSearch FT indexes (ignore if missing)
    await dropFtIndexSafe(r, "idx:songs", summary);
    await dropFtIndexSafe(r, "idx:artists", summary);
    // If you add an albums FT index later, drop it here too:
    // await dropFtIndexSafe(r, "idx:albums", summary);

    // --- 3) Delete all primary JSON keys & secondary indexes
    const albumPrefix = ALBUM_CONFIG.ALBUM_PREFIX || "album:";

    // Primary keys — scan & UNLINK one-by-one (non-blocking and bullet-proof)
    summary.deletedKeys.songs   += await scanUnlink(r, `${C.SONG_PREFIX}*`);
    summary.deletedKeys.artists += await scanUnlink(r, `${A.ARTIST_PREFIX}*`);
    summary.deletedKeys.albums  += await scanUnlink(r, `${albumPrefix}*`);

    // Secondary index exact keys
    await delIfExists(r, [
      C.IDX_ALL, C.IDX_SCORE, C.IDX_PLAYS, C.IDX_CREATED, C.IDX_RELEASED,
      A.IDX_ALL_ARTIST, A.IDX_TOP_ARTIST_SCORE,
      ALBUM_CONFIG.IDX_ALL_ALBUMS, ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT,
    ], summary);

    // Secondary index families (adjust to your actual prefixes as needed)
    summary.deletedKeys.indexes += await scanUnlink(r, "index:songs:*");
    summary.deletedKeys.indexes += await scanUnlink(r, "index:artist:*");
    summary.deletedKeys.indexes += await scanUnlink(r, "index:albums:*");
    // Optional (uncomment/adjust if you use these families):
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byArtist:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byAlbum:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byGenre:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byCountry:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byTempo:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byMood:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:bySubMood:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byReleaseYear:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byReleaseYM:*");
    // summary.deletedKeys.indexes += await scanUnlink(r, "songs:byProducer:*");

    // --- 4) Recreate FT indexes
    try { await createSongIndex();   } catch (e) { tagError(summary, "createSongIndex", e); }
    try { await createArtistIndex(); } catch (e) { tagError(summary, "createArtistIndex", e); }

    // --- 5) Reinsert data from Mongo as JSON (Artists → Albums → Songs)
    summary.reinserted.artists = await reinsertArtists(r, batchSize, summary);
    summary.reinserted.albums  = await reinsertAlbums(r, batchSize, summary);
    summary.reinserted.songs   = await reinsertSongs(r, batchSize, summary);

    summary.finishedAt = new Date().toISOString();
    return summary;
  } catch (err) {
    summary.ok = false;
    summary.errors.push(err?.message || String(err));
    summary.finishedAt = new Date().toISOString();
    return summary;
  } finally {
    if (withLock) {
      try {
        const v = await r.get(LOCK_KEY);
        if (v === token) await r.del(LOCK_KEY);
      } catch { /* ignore */ }
    }
  }
}

/* ---------- helpers (one-by-one UNLINK, safe) ---------- */

// Drop FT index safely (ignore missing)
async function dropFtIndexSafe(r, name, summary) {
  try {
    await r.ft.dropIndex(name);
    summary.droppedIndexes.push(name);
  } catch (e) {
    const msg = String(e?.message || "");
    if (/Unknown Index|no such index|not found/i.test(msg)) {
      // already gone
    } else {
      tagError(summary, `dropIndex ${name}`, e);
    }
  }
}

// Small tracer for errors
function tagError(summary, where, e) {
  summary.errors.push(`${where}: ${e?.message || String(e)}`);
}

// Safely remove a single key (prefer UNLINK, fallback to DEL)
async function unlinkOne(r, key) {
  const k = (key == null) ? "" : String(key);
  if (!k) return 0;
  try {
    if (typeof r.unlink === 'function') {
      return await r.unlink(k);   // unlink one key
    }
  } catch (_) { /* fall back */ }
  try {
    return await r.del(k);        // fallback
  } catch (_) {
    return 0;
  }
}

// SCAN + UNLINK by pattern; unlink ONE-BY-ONE to avoid variadic issues entirely
async function scanUnlink(r, pattern, count = 1000) {
  let cursor = 0;
  let total = 0;
  do {
    // node-redis/ioredis both return [cursor, keys] arrays
    const res = await r.scan(cursor, { MATCH: pattern, COUNT: count });
    const next  = Array.isArray(res) ? res[0] : res?.cursor ?? '0';
    const keys  = Array.isArray(res) ? res[1] : res?.keys ?? [];

    cursor = Number(next) || 0;

    if (Array.isArray(keys) && keys.length) {
      for (const rawKey of keys) {
        total += await unlinkOne(r, rawKey);
      }
    }
  } while (cursor !== 0);
  return total;
}

// Delete a small set of exact keys (iterate one-by-one as well)
async function delIfExists(r, keys, summary) {
  const arr = Array.isArray(keys) ? keys : [keys];
  let n = 0;
  for (const k of arr) {
    n += await unlinkOne(r, k);
  }
  summary.deletedKeys.indexes += n;
}

/* ---------- reinsert (streamed) ---------- */

async function reinsertArtists(r, batchSize, summary) {
  let n = 0;
  const cursor = Artist.find().select().lean().cursor({ batchSize });
  for await (const artist of cursor) {
    try {
      await artistCreateRedis(artist, { updateExisting: true });
      n++;
    } catch (e) {
      tagError(summary, `artist ${artist?._id}`, e);
    }
  }
  return n;
}

async function reinsertAlbums(r, batchSize, summary) {
  let n = 0;
  const cursor = Album.find().select().lean().cursor({ batchSize });
  for await (const album of cursor) {
    try {
      await albumCreateRedis(album, { updateExisting: true });
      n++;
    } catch (e) {
      tagError(summary, `album ${album?._id}`, e);
    }
  }
  return n;
}

async function reinsertSongs(r, batchSize, summary) {
  let n = 0;
  const cursor = Song.find().select().lean().cursor({ batchSize });
  for await (const song of cursor) {
    try {
      await createSongRedis(song); // your JSON-first writer cleans up sets/zsets
      n++;
    } catch (e) {
      tagError(summary, `song ${song?._id}`, e);
    }
  }
  return n;
}
