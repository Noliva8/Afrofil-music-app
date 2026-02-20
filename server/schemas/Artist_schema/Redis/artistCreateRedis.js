import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { usedMB, notifyAdmin } from "./songCreateRedis.js";
import {Artist } from '../../../models/Artist/index_artist.js'
import { artistKey } from "./keys.js";
import { artistRecordExpiry } from "./keys.js";



/** ---------- artist Config ---------- */
const A = {
  MAX_MB: 7.5,
  ARTIST_PREFIX: "artist:", 
  IDX_ALL_ARTIST: "index:artists:all",  
  IDX_TOP_ARTIST_SCORE: "index:artists:score",
  byCountry: (country) => `index:artist:${country}:artists`,
  TTL: artistRecordExpiry, // 24 hours in seconds
}





/** Timeout wrapper */
const withTimeout = (promise, timeoutMs = 5000, errorMessage = "Operation timeout") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);

/** Helper to serialize artist data for Redis */
const serializeArtist = (artist) => {
  if (!artist) return null;
  
  return {
    _id: artist._id?.toString(),
    fullName: artist.fullName,
    artistAka: artist.artistAka,
    email: artist.email,
    confirmed: artist.confirmed,
    selectedPlan: artist.selectedPlan,
    plan: artist.plan,
    role: artist.role,
    genre: artist.genre || [],
    bio: artist.bio,
    country: artist.country,
    languages: artist.languages || [],
    mood: artist.mood || [],
    category: artist.category,
    profileImage: artist.profileImage,
    coverImage: artist.coverImage,
    songs: artist.songs?.map(id => id.toString()) || [],
    albums: artist.albums?.map(id => id.toString()) || [],
    followers: artist.followers?.map(id => id.toString()) || [],
    followersCount: artist.followers?.length || 0,
    songsCount: artist.songs?.length || 0,
    albumsCount: artist.albums?.length || 0,
    createdAt: artist.createdAt?.toISOString(),
    updatedAt: artist.updatedAt?.toISOString()
  };
};



/** Helper to check Redis memory usage */
const checkMemoryAndNotify = async (redis, operation) => {
  try {
    const memory = await usedMB(redis);
    if (memory > A.MAX_MB) {
      await notifyAdmin(`High Redis memory usage: ${memory}MB during ${operation}`);
    }
    return memory;
  } catch (error) {
    console.warn('Memory check failed:', error.message);
  }
};


/** Create/Update artist in Redis (JSON canonical) */

export async function artistCreateRedis(artistData, options = {}) {
  const { updateExisting = false, ttl = A.TTL } = options;
  let redis;

  try {
    redis = await getRedis();
    const artistId = artistData._id?.toString();
    if (!artistId) throw new Error('Artist ID is required');

    const key = artistKey(artistId);

    if (!updateExisting) {
      const exists = await redis.exists(key);
      if (exists) {
        console.log(`Artist ${artistId} already exists in Redis`);
        return { success: true, action: 'exists' };
      }
    }

    // hydrate if missing fields
    let artist = artistData;
    if (!artist.artistAka || !artist.country) {
      artist = await Artist.findById(artistId)
        .populate('songs', '_id title')
        .populate('albums', '_id title')
        .populate('followers', '_id username')
        .lean();
      if (!artist) throw new Error(`Artist ${artistId} not found in database`);
    }

    const serializedArtist = serializeArtist(artist);
    if (!serializedArtist) throw new Error('Failed to serialize artist data');

    // Ensure arrays use strings
    serializedArtist.songs = (serializedArtist.songs || []).map(String);
    serializedArtist.albums = (serializedArtist.albums || []).map(String);

    // Prepare hash payload (flatten complex arrays to JSON strings)
    const hashPayload = {
      _id: serializedArtist._id,
      fullName: serializedArtist.fullName || '',
      artistAka: serializedArtist.artistAka || '',
      confirmed: serializedArtist.confirmed ? '1' : '0',
      selectedPlan: serializedArtist.selectedPlan ? '1' : '0',
      country: serializedArtist.country || '',
      songs: JSON.stringify(serializedArtist.songs || []),
      albums: JSON.stringify(serializedArtist.albums || []),
      followers: JSON.stringify(serializedArtist.followers || []),
      createdAt: serializedArtist.createdAt ? serializedArtist.createdAt.toISOString() : '',
      updatedAt: serializedArtist.updatedAt ? serializedArtist.updatedAt.toISOString() : '',
    };

    await withTimeout(redis.hSet(key, hashPayload), 3000, 'Redis hash set timeout');

    if (Number.isFinite(ttl) && ttl > 0) {
      await withTimeout(redis.expire(key, ttl), 1500, 'Redis expire timeout');
    }

    // Update secondary indexes
    await updateArtistIndexes(redis, serializedArtist);

    // Memory check (best-effort)
    await checkMemoryAndNotify(redis, `artistCreateRedis:${artistId}`);

    console.log(`✅ Artist ${artistId} ${updateExisting ? 'updated' : 'created'} in Redis`);
    return { success: true, action: updateExisting ? 'updated' : 'created' };

  } catch (error) {
    console.error('❌ artistCreateRedis error:', error);
    throw error;
  }
}







/** Update artist in Redis (alias for create with update flag) */
export async function artistUpdateRedis(artistData, options = {}) {
  return artistCreateRedis(artistData, { ...options, updateExisting: true });
}




/** Get artist from Redis (hash-first) */
function artistDeserialization(hashData) {
  if (!hashData || !hashData._id) return null;
  return {
    _id: hashData._id,
    fullName: hashData.fullName,
    artistAka: hashData.artistAka,
    confirmed: hashData.confirmed === '1',
    selectedPlan: hashData.selectedPlan === '1',
    country: hashData.country || '',
    createdAt: hashData.createdAt ? new Date(hashData.createdAt) : null,
    updatedAt: hashData.updatedAt ? new Date(hashData.updatedAt) : null,
    songs: hashData.songs ? JSON.parse(hashData.songs) : [],
    albums: hashData.albums ? JSON.parse(hashData.albums) : [],
    followers: hashData.followers ? JSON.parse(hashData.followers) : [],
  };
}

export async function getArtistRedis(artistId) {
  try {
    const redis = await getRedis();
    const key = artistKey(artistId);
    const t = await withTimeout(redis.type(key), 1000, 'Type timeout');

    if (t === 'hash') {
      const hash = await withTimeout(redis.hGetAll(key), 1500, 'HGETALL timeout');
      if (!hash || !hash._id) return null;
      if (Number.isFinite(A.TTL) && A.TTL > 0) redis.expire(key, A.TTL).catch(() => {});
      return artistDeserialization(hash);
    }

    return null;
  } catch (error) {
    console.error('❌ getArtistRedis error:', error);
    return null;
  }
}


export async function getMultipleArtistsRedis(redis, artistIds = [], { touchTTL = true } = {}) {
  if (!artistIds?.length) return [];
  const keys = artistIds.map(artistKey);
  const out = new Array(keys.length).fill(null);
  const p1 = redis.multi();
  for (const k of keys) p1.hGetAll(k);
  const res1 = await p1.exec();

  for (let i = 0; i < res1.length; i++) {
    const [, hash] = res1[i] || [];
    if (!hash || !hash._id) continue;
    out[i] = artistDeserialization(hash);
  }

  if (touchTTL && Number.isFinite(A.TTL) && A.TTL > 0) {
    const p3 = redis.multi();
    let has = false;
    for (let i = 0; i < keys.length; i++) {
      if (out[i]) { p3.expire(keys[i], A.TTL); has = true; }
    }
    if (has) await p3.exec();
  }

  return out.filter(Boolean);
}






/** Delete artist from Redis */
export async function deleteArtistRedis(artistId) {
  let redis;
  
  try {
    redis = await getRedis();
    const key = artistKey(artistId);
    
    // Remove from main store
    await withTimeout(
      redis.del(key),
      2000,
      'Redis del timeout'
    );

    // Remove from indexes (async, don't await)
    removeFromIndexes(redis, artistId).catch(error => 
      console.warn('Index cleanup failed:', error)
    );

    console.log(`✅ Artist ${artistId} deleted from Redis`);
    return { success: true };

  } catch (error) {
    console.error('❌ deleteArtistRedis error:', error);
    throw error;
  }
}


/** Update artist indexes */
/** Update artist indexes */
async function updateArtistIndexes(redis, artist) {
  try {
    const pipeline = redis.multi();
    // all artists (score = time)
    pipeline.zAdd(A.IDX_ALL_ARTIST, [{ score: Date.now(), value: artist._id }]);

    // by country (score = time)
    if (artist.country) {
      pipeline.zAdd(A.byCountry(artist.country), [{ score: Date.now(), value: artist._id }]);
    }

    // top score (followersWeight + songs/albums)
    const score = (artist.followersCount || 0) * 10 + (artist.songsCount || 0) * 5 + (artist.albumsCount || 0) * 3;
    pipeline.zAdd(A.IDX_TOP_ARTIST_SCORE, [{ score, value: artist._id }]);

    await withTimeout(pipeline.exec(), 3000, 'Index update timeout');
  } catch (error) {
    console.warn('Index update failed:', error);
  }
}

/** Remove from indexes (read doc to know country; avoid KEYS scan) */
async function removeFromIndexes(redis, artistId) {
  try {
    const key = artistKey(artistId);
    const hash = await redis.hGetAll(key);
    const artist = artistDeserialization(hash);

    const pipeline = redis.multi();
    pipeline.zRem(A.IDX_ALL_ARTIST, artistId);
    pipeline.zRem(A.IDX_TOP_ARTIST_SCORE, artistId);
    if (artist?.country) {
      pipeline.zRem(A.byCountry(artist.country), artistId);
    }
    await pipeline.exec();
  } catch (error) {
    console.warn('Index removal failed:', error);
  }
}


/** Get artists by country from Redis */
/** Get artists by country from Redis */
export async function getArtistsByCountryRedis(country, limit = 50) {
  try {
    const redis = await getRedis();
    const countryKey = A.byCountry(country);
    const artistIds = await withTimeout(
      redis.zRange(countryKey, 0, limit - 1, { REV: true }),
      2000, 'Redis zrange timeout'
    );
    if (!artistIds.length) return [];
    return await getMultipleArtistsRedis(redis, artistIds);
  } catch (error) {
    console.error('❌ getArtistsByCountryRedis error:', error);
    return [];
  }
}

/** Get top artists by score from Redis */
export async function getTopArtistsRedis(limit = 50) {
  try {
    const redis = await getRedis();
    const artistIds = await withTimeout(
      redis.zRange(A.IDX_TOP_ARTIST_SCORE, 0, Math.max(0, limit - 1), { REV: true }),
      2000, 'Redis zrange timeout'
    );
    if (!artistIds.length) return [];
    return await getMultipleArtistsRedis(redis, artistIds);
  } catch (error) {
    console.error('❌ getTopArtistsRedis error:', error);
    return [];
  }
}


/** Search artists (FT first, fallback to client filter) */
export async function searchArtistsRedis(query, limit = 20) {
  const q = (query || '').trim();
  if (!q) return [];

  let redis;
  try {
    redis = await getRedis();
  } catch (e) {
    console.error('searchArtistsRedis conn error:', e);
    return [];
  }

  // Try RediSearch (ON JSON)
  try {
    const rs = await redis.ft.search(
      'idx:artists',
      // match in artistAka/fullName; allow prefix
      `(@artistAka:(${escapeFt(q)}*)) | (@fullName:(${escapeFt(q)}*)) | (@genre:{${escapeFt(q)}})`
      , { LIMIT: { from: 0, size: limit } }
    );
    if (rs?.documents?.length) {
      return rs.documents.map(d => d.value); // Node client returns parsed JSON for JSON indexes
    }
  } catch (e) {
    // fall through to client-side if idx missing
  }

  // Fallback: client-side filter
  try {
    const allIds = await redis.zRange(A.IDX_ALL_ARTIST, 0, -1);
    const all = await getMultipleArtistsRedis(redis, allIds);
    const s = q.toLowerCase();
    return all.filter(a =>
      a?.artistAka?.toLowerCase().includes(s) ||
      a?.fullName?.toLowerCase().includes(s) ||
      (Array.isArray(a?.genre) && a.genre.some(g => g?.toLowerCase().includes(s)))
    ).slice(0, limit);
  } catch (e) {
    console.error('searchArtistsRedis fallback error:', e);
    return [];
  }
}

function escapeFt(s='') {
  // minimal escaper for RediSearch special chars
  return String(s).replace(/([\-+\|\{\}\[\]\(\)\^\~\*\:\\"@])/g, '\\$1');
}



/** Fetch songs for an artist via RediSearch or set membership */
export async function getSongsByArtistId(artistId, limit = 50) {
  const r = await getRedis();
  // Preferred: FT.SEARCH on your idx:songs ON JSON
  try {
    const rs = await r.ft.search('idx:songs',
      `@artistId:{${escapeFt(String(artistId))}}`,
      { LIMIT: { from: 0, size: limit }, SORTBY: { BY: 'createdAtMs', DIRECTION: 'DESC' } }
    );
    if (rs?.documents?.length) return rs.documents.map(d => d.value);
  } catch { /* ignore */ }

  // Fallback: use your existing per-artist set & fetch docs
  try {
    const ids = await r.sMembers(C.byArtist(String(artistId)));
    if (!ids?.length) return [];
    return await fetchDocsForIds(r, ids.slice(0, limit));
  } catch {
    return [];
  }
}
