import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { usedMB, notifyAdmin } from "./songCreateRedis.js";
import {Album} from '../../../models/Artist/index_artist.js'

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

/** Create/Update album in Redis */
export async function albumCreateRedis(albumData, options = {}) {
  const { updateExisting = false, ttl = ALBUM_CONFIG.TTL } = options;
  let redis;
  
  try {
    redis = await getRedis();
    const albumId = albumData._id?.toString();
    
    if (!albumId) {
      throw new Error('Album ID is required');
    }

    const key = albumKey(albumId);
    
    // Check if album already exists (unless we're forcing update)
    if (!updateExisting) {
      const exists = await redis.exists(key);
      if (exists) {
        console.log(`Album ${albumId} already exists in Redis`);
        return { success: true, action: 'exists' };
      }
    }

    // Get fresh data from database if needed
    let album = albumData;
    if (!album.title || !album.artist) {
      album = await Album.findById(albumId)
        .populate('artist', 'artistAka profileImage')
        .populate('songs', '_id title duration')
        .lean();
      
      if (!album) {
        throw new Error(`Album ${albumId} not found in database`);
      }
    }

    // Serialize album data
    const serializedAlbum = serializeAlbum(album);
    if (!serializedAlbum) {
      throw new Error('Failed to serialize album data');
    }

    // Store in Redis
    await withTimeout(
      redis.set(key, JSON.stringify(serializedAlbum), 'EX', ttl),
      3000,
      'Redis setex timeout'
    );

    // Update indexes
    await updateAlbumIndexes(redis, serializedAlbum);

    // Check memory usage
    await checkMemoryAndNotify(redis, `albumCreateRedis:${albumId}`);

    console.log(`✅ Album ${albumId} ${updateExisting ? 'updated' : 'created'} in Redis`);
    return { success: true, action: updateExisting ? 'updated' : 'created' };

  } catch (error) {
    console.error('❌ albumCreateRedis error:', error);
    throw error;
  }
}

/** Update album in Redis */
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
    
    // Get album data first to remove from indexes properly
    const albumData = await redis.get(key);
    let album = null;
    if (albumData) {
      album = JSON.parse(albumData);
    }

    // Remove from main store
    await withTimeout(
      redis.del(key),
      2000,
      'Redis del timeout'
    );

    // Remove from indexes (async, don't await)
    removeAlbumFromIndexes(redis, albumId, album).catch(error => 
      console.warn('Album index cleanup failed:', error)
    );

    console.log(`✅ Album ${albumId} deleted from Redis`);
    return { success: true };

  } catch (error) {
    console.error('❌ deleteAlbumRedis error:', error);
    throw error;
  }
}

/** Get multiple albums from Redis */
export async function getMultipleAlbumsRedis(redis, albumIds = []) {
  if (!albumIds.length) return [];
  const keys = albumIds.map(albumKey);

  const blobs = await withTimeout(redis.mGet(keys), 1500, 'Redis mget timeout');

  const out = [];
  const pipe = redis.multi();
  for (let i = 0; i < blobs.length; i++) {
    const raw = blobs[i];
    if (!raw) continue;
    try {
      const a = JSON.parse(raw);
      out.push(a);
      pipe.expire(keys[i], ALBUM_CONFIG.TTL); // or remove to skip
    } catch {/* ignore */}
  }
  if (out.length) await pipe.exec();
  return out;
}


/** Update album indexes */
async function updateAlbumIndexes(redis, album) {
  try {
    const pipeline = redis.multi(); 
    const albumId = album._id;
    const artistId = typeof album.artist === 'object' ? album.artist._id : album.artist;
    
    // Add to all albums index (sorted by creation date)
    pipeline.zadd(ALBUM_CONFIG.IDX_ALL_ALBUMS, new Date(album.createdAt).getTime(), albumId);
    
    // Add to artist's albums index
    if (artistId) {
      const artistAlbumsKey = albumsByArtistKey(artistId);
      pipeline.zadd(artistAlbumsKey, new Date(album.createdAt).getTime(), albumId);
    }
    
    // Add to date index (sorted by release date)
    if (album.releaseDate) {
      pipeline.zadd(ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, new Date(album.releaseDate).getTime(), albumId);
    }
    
    // Add to song count index
    pipeline.zadd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, album.songsCount || 0, albumId);
    
    await withTimeout(
      pipeline.exec(),
      3000,
      'Album index update timeout'
    );
    
  } catch (error) {
    console.warn('Album index update failed:', error);
  }
}

/** Remove album from indexes */
async function removeAlbumFromIndexes(redis, albumId, album = null) {
  try {
   const pipeline = redis.multi(); 
    
    // Remove from main indexes
    pipeline.zrem(ALBUM_CONFIG.IDX_ALL_ALBUMS, albumId);
    pipeline.zrem(ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, albumId);
    pipeline.zrem(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, albumId);
    
    // Remove from artist index if we have artist info
    if (album?.artist) {
      const artistId = typeof album.artist === 'object' ? album.artist._id : album.artist;
      if (artistId) {
        const artistAlbumsKey = albumsByArtistKey(artistId);
        pipeline.zrem(artistAlbumsKey, albumId);
      }
    } else {
      // If we don't have album data, remove from all artist indexes (less efficient)
      const artistIndexKeys = await redis.keys(ALBUM_CONFIG.IDX_ALBUMS_BY_ARTIST + '*');
      for (const key of artistIndexKeys) {
        pipeline.zrem(key, albumId);
      }
    }
    
    await pipeline.exec();
    
  } catch (error) {
    console.warn('Album index removal failed:', error);
  }
}

/** Get albums by artist from Redis */
export async function getAlbumsByArtistRedis(artistId, limit = 50) {
  let redis;
  
  try {
    redis = await getRedis();
    const artistAlbumsKey = albumsByArtistKey(artistId);
    
    const albumIds = await withTimeout(
      redis.zrevrange(artistAlbumsKey, 0, limit - 1), // Latest first
      2000,
      'Redis zrevrange timeout'
    );

    if (albumIds.length === 0) {
      return [];
    }

    return await getMultipleAlbumsRedis(albumIds);

  } catch (error) {
    console.error('❌ getAlbumsByArtistRedis error:', error);
    return [];
  }
}

/** Get latest albums from Redis */
export async function getLatestAlbumsRedis(limit = 20) {
  let redis;
  
  try {
    redis = await getRedis();
    
    const albumIds = await withTimeout(
      redis.zrevrange(ALBUM_CONFIG.IDX_ALL_ALBUMS, 0, limit - 1),
      2000,
      'Redis zrevrange timeout'
    );

    if (albumIds.length === 0) {
      return [];
    }

    return await getMultipleAlbumsRedis(albumIds);

  } catch (error) {
    console.error('❌ getLatestAlbumsRedis error:', error);
    return [];
  }
}

/** Get albums by release date from Redis */
export async function getAlbumsByReleaseDateRedis(limit = 20, descending = true) {
  let redis;
  
  try {
    redis = await getRedis();
    
    const rangeMethod = descending ? 'zrevrange' : 'zrange';
    const albumIds = await withTimeout(
      redis[rangeMethod](ALBUM_CONFIG.IDX_ALBUMS_BY_DATE, 0, limit - 1),
      2000,
      'Redis range timeout'
    );

    if (albumIds.length === 0) {
      return [];
    }

    return await getMultipleAlbumsRedis(albumIds);

  } catch (error) {
    console.error('❌ getAlbumsByReleaseDateRedis error:', error);
    return [];
  }
}

/** Get albums with most songs from Redis */
export async function getAlbumsBySongCountRedis(limit = 20) {
  let redis;
  
  try {
    redis = await getRedis();
    
    const albumIds = await withTimeout(
      redis.zrevrange(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, 0, limit - 1),
      2000,
      'Redis zrevrange timeout'
    );

    if (albumIds.length === 0) {
      return [];
    }

    return await getMultipleAlbumsRedis(albumIds);

  } catch (error) {
    console.error('❌ getAlbumsBySongCountRedis error:', error);
    return [];
  }
}

/** Search albums in Redis */
export async function searchAlbumsRedis(query, limit = 20) {
  let redis;
  
  try {
    redis = await getRedis();
    
    // Get all album IDs from index
    const allAlbumIds = await withTimeout(
      redis.zrange(ALBUM_CONFIG.IDX_ALL_ALBUMS, 0, -1),
      3000,
      'Redis zrange timeout'
    );

    if (allAlbumIds.length === 0) {
      return [];
    }

    // Get all albums
    const allAlbums = await getMultipleAlbumsRedis(allAlbumIds);
    
    // Client-side search
    const searchTerm = query.toLowerCase();
    const results = allAlbums.filter(album => 
      album.title?.toLowerCase().includes(searchTerm) ||
      (typeof album.artist === 'object' && album.artist.artistAka?.toLowerCase().includes(searchTerm))
    ).slice(0, limit);

    return results;

  } catch (error) {
    console.error('❌ searchAlbumsRedis error:', error);
    return [];
  }
}

/** Add song to album in Redis */
export async function addSongToAlbumRedis(albumId, songId) {
  let redis;
  
  try {
    redis = await getRedis();
    const key = albumKey(albumId);
    
    const albumData = await redis.get(key);
    if (!albumData) {
      return { success: false, error: 'Album not found in Redis' };
    }

    const album = JSON.parse(albumData);
    
    // Add song if not already present
    if (!album.songs.includes(songId)) {
      album.songs.push(songId);
      album.songsCount = album.songs.length;
      
      // Update Redis
      await redis.setex(key, ALBUM_CONFIG.TTL, JSON.stringify(album));
      
      // Update song count index
      await redis.zadd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, album.songsCount, albumId);
    }

    return { success: true };

  } catch (error) {
    console.error('❌ addSongToAlbumRedis error:', error);
    return { success: false, error: error.message };
  }
}

/** Remove song from album in Redis */
export async function removeSongFromAlbumRedis(albumId, songId) {
  let redis;
  
  try {
    redis = await getRedis();
    const key = albumKey(albumId);
    
    const albumData = await redis.get(key);
    if (!albumData) {
      return { success: false, error: 'Album not found in Redis' };
    }

    const album = JSON.parse(albumData);
    
    // Remove song
    album.songs = album.songs.filter(id => id !== songId);
    album.songsCount = album.songs.length;
    
    // Update Redis
    await redis.setex(key, ALBUM_CONFIG.TTL, JSON.stringify(album));
    
    // Update song count index
    await redis.zadd(ALBUM_CONFIG.IDX_ALBUMS_BY_SONG_COUNT, album.songsCount, albumId);

    return { success: true };

  } catch (error) {
    console.error('❌ removeSongFromAlbumRedis error:', error);
    return { success: false, error: error.message };
  }
}