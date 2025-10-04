import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { usedMB, notifyAdmin } from "./songCreateRedis.js";
import {Artist } from '../../../models/Artist/index_artist.js'

/** ---------- artist Config ---------- */
const A = {
  MAX_MB: 7.5,
  ARTIST_PREFIX: "artist:", 
  IDX_ALL_ARTIST: "index:artists:all",  
  IDX_TOP_ARTIST_SCORE: "index:artists:score",
  byCountry: (country) => `index:artist:${country}:artists`,
  TTL: 24 * 60 * 60, // 24 hours in seconds
}

const artistKey = (id) => `${A.ARTIST_PREFIX}${id}`;

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

/** Create/Update artist in Redis */
export async function artistCreateRedis(artistData, options = {}) {
  const { updateExisting = false, ttl = A.TTL } = options;
  let redis;
  
  try {
    redis = await getRedis();
    const artistId = artistData._id?.toString();
    
    if (!artistId) {
      throw new Error('Artist ID is required');
    }

    const key = artistKey(artistId);
    
    // Check if artist already exists (unless we're forcing update)
    if (!updateExisting) {
      const exists = await redis.exists(key);
      if (exists) {
        console.log(`Artist ${artistId} already exists in Redis`);
        return { success: true, action: 'exists' };
      }
    }

    // Get fresh data from database if needed
    let artist = artistData;
    if (!artist.artistAka || !artist.country) {
      artist = await Artist.findById(artistId)
        .populate('songs', '_id title')
        .populate('albums', '_id title')
        .populate('followers', '_id username')
        .lean();
      
      if (!artist) {
        throw new Error(`Artist ${artistId} not found in database`);
      }
    }

    // Serialize artist data
    const serializedArtist = serializeArtist(artist);
    if (!serializedArtist) {
      throw new Error('Failed to serialize artist data');
    }

    // Store in Redis
  await withTimeout(
  redis.set(key, JSON.stringify(serializedArtist), 'EX', ttl),
  3000,
  'Redis set timeout'
);


    // Update indexes
    await updateArtistIndexes(redis, serializedArtist);

    // Check memory usage
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

/** Get artist from Redis */
export async function getArtistRedis(artistId) {
  let redis;
  
  try {
    redis = await getRedis();
    const key = artistKey(artistId);
    
    const artistData = await withTimeout(
      redis.get(key),
      2000,
      'Redis get timeout'
    );

    if (!artistData) {
      return null;
    }

    const artist = JSON.parse(artistData);
    
    // Refresh TTL on access
    await withTimeout(
      redis.expire(key, A.TTL),
      1000,
      'Redis expire timeout'
    );

    return artist;

  } catch (error) {
    console.error('❌ getArtistRedis error:', error);
    return null;
  }
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

/** Get multiple artists from Redis */

export async function getMultipleArtistsRedis(redis, artistIds = []) {
  if (!artistIds.length) return [];
  const keys = artistIds.map(artistKey);

  const blobs = await withTimeout(redis.mGet(keys), 1500, 'Redis mget timeout');

  const out = [];
  const pipe = redis.multi(); // batch EXPIREs
  for (let i = 0; i < blobs.length; i++) {
    const raw = blobs[i];
    if (!raw) continue;
    try {
      const a = JSON.parse(raw);
      if (a && a._id) {
        out.push(a);
        // optionally keep TTL fresh; comment out to skip
        pipe.expire(keys[i], A.TTL);
      }
    } catch {/* ignore parse errors */}
  }
  if (out.length) await pipe.exec();
  return out;
}





/** Update artist indexes */
async function updateArtistIndexes(redis, artist) {
  try {
  const pipeline = redis.multi(); 
    
    // Add to all artists index
    pipeline.zadd(A.IDX_ALL_ARTIST, Date.now(), artist._id);
    
    // Add to country index
    if (artist.country) {
      const countryKey = A.byCountry(artist.country);
      pipeline.zadd(countryKey, Date.now(), artist._id);
    }
    
    // Add to score index (using followers count as score)
    const score = artist.followersCount * 10 + artist.songsCount * 5 + artist.albumsCount * 3;
    pipeline.zadd(A.IDX_TOP_ARTIST_SCORE, score, artist._id);
    
    await withTimeout(
      pipeline.exec(),
      3000,
      'Index update timeout'
    );
    
  } catch (error) {
    console.warn('Index update failed:', error);
  }
}

/** Remove from indexes */
async function removeFromIndexes(redis, artistId) {
  try {
    const pipeline = redis.multi(); 
    
    pipeline.zrem(A.IDX_ALL_ARTIST, artistId);
    pipeline.zrem(A.IDX_TOP_ARTIST_SCORE, artistId);
    
    // Remove from all country indexes (this is inefficient but safe)
    // In production, you might want to track which countries each artist is in
    const countries = await redis.keys('index:artist:*:artists');
    for (const countryKey of countries) {
      pipeline.zrem(countryKey, artistId);
    }
    
    await pipeline.exec();
    
  } catch (error) {
    console.warn('Index removal failed:', error);
  }
}

/** Get artists by country from Redis */
export async function getArtistsByCountryRedis(country, limit = 50) {
  let redis;
  
  try {
    redis = await getRedis();
    const countryKey = A.byCountry(country);
    
    const artistIds = await withTimeout(
      redis.zrevrange(countryKey, 0, limit - 1),
      2000,
      'Redis zrevrange timeout'
    );

    if (artistIds.length === 0) {
      return [];
    }

    return await getMultipleArtistsRedis(artistIds);

  } catch (error) {
    console.error('❌ getArtistsByCountryRedis error:', error);
    return [];
  }
}

/** Get top artists by score from Redis */
export async function getTopArtistsRedis(limit = 50) {
  let redis;
  
  try {
    redis = await getRedis();
    
    const artistIds = await withTimeout(
      redis.zrevrange(A.IDX_TOP_ARTIST_SCORE, 0, limit - 1),
      2000,
      'Redis zrevrange timeout'
    );

    if (artistIds.length === 0) {
      return [];
    }

    return await getMultipleArtistsRedis(artistIds);

  } catch (error) {
    console.error('❌ getTopArtistsRedis error:', error);
    return [];
  }
}

/** Search artists in Redis (basic implementation) */
export async function searchArtistsRedis(query, limit = 20) {
  let redis;
  
  try {
    redis = await getRedis();
    
    // Get all artist IDs from index
    const allArtistIds = await withTimeout(
      redis.zrange(A.IDX_ALL_ARTIST, 0, -1),
      3000,
      'Redis zrange timeout'
    );

    if (allArtistIds.length === 0) {
      return [];
    }

    // Get all artists
    const allArtists = await getMultipleArtistsRedis(allArtistIds);
    
    // Basic client-side search (for production, consider Redis Search module)
    const searchTerm = query.toLowerCase();
    const results = allArtists.filter(artist => 
      artist.artistAka?.toLowerCase().includes(searchTerm) ||
      artist.fullName?.toLowerCase().includes(searchTerm) ||
      artist.genre?.some(g => g.toLowerCase().includes(searchTerm))
    ).slice(0, limit);

    return results;

  } catch (error) {
    console.error('❌ searchArtistsRedis error:', error);
    return [];
  }
}