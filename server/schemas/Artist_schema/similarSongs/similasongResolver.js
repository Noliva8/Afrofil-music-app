

import { SIMILARITY_TIERS } from "../Redis/keys.js";
import {Song, Artist} from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import {similarSongsMatches } from "../Redis/keys.js";
import mongoose from 'mongoose';
import { addSongRedis} from "../Redis/addSongRedis.js";
import { getSongRedis } from "../Redis/addSongRedis.js";
import { songKey } from "../Redis/keys.js";
import { deserializeFromRedisStorage, fieldTypes } from "../Redis/addSongRedis.js";
import { CreatePresignedUrlDownload } from "../../../utils/awsS3.js";
import { CreatePresignedUrlDownloadAudio } from "../../../utils/awsS3.js";
import { CreatePresignedUrlDownloadAudioServerSide } from "../../../utils/awsS3.js";
import { CreatePresignedUrlDownloadServerSide } from "../../../utils/awsS3.js";

import { SIMILAR_SONGS_PLAYBACK } from "../Redis/keys.js";


const asArr = v => Array.isArray(v) ? v : (v ? [v] : []);

const exactMatch = async ({ id, artist, mood, subMoods, genre, tempo, client }) => {
  try {
    // Convert artist to ObjectId if it's not already
    const artistId = typeof artist === 'object' ? artist : new mongoose.Types.ObjectId(artist);
   
    // For exact match: same artist, same genre, at least one matching mood, at least one matching subMood
    const exactSongsMatch = await Song.find({
      artist: artistId, // Same artist
      genre: genre, // Same genre
      mood: { $in: mood }, // At least one matching mood
      subMoods: { $in: subMoods }, // At least one matching subMood
      _id: { $ne: new mongoose.Types.ObjectId(id) } // Exclude the current song
    })
    .select('_id') // Only get IDs
    .limit(50)
    .lean();

    // console.log(`Found ${exactSongsMatch.length} exact matches for song ${id}`);
    // console.log(`Search criteria: artist=${artistId}, mood=${JSON.stringify(mood)}, subMoods=${JSON.stringify(subMoods)}, genre=${genre}`);

    // Add song IDs to Redis sorted set
    if (exactSongsMatch.length > 0) {
      const redisCommands = exactSongsMatch.map(song => ({
        value: song._id.toString(), // Store only the song ID as string
        score: 100 // Highest similarity score for exact matches
      }));
      
      await client.zAdd(similarSongsMatches(id), redisCommands, { GT: true, CH: true });

      // console.log(`Added ${redisCommands.length} song IDs to exactSimilarSongs for song ${id}`);
    }

    return exactSongsMatch.length;

  } catch (error) {
    console.error('Error in exactMatch for song', id, ':', error);
    throw error;
  }
};

const highMatch = async ({ id, artist, mood, subMoods, genre, country, client }) => {
  try {
    // Get artist country if not provided
    let artistCountry = country;
    if (!artistCountry) {
      const artistDoc = await Artist.findById(artist).select('country').lean();
      artistCountry = artistDoc?.country;
    }

    if (!artistCountry) {
      // console.log(`No country found for artist ${artist}, skipping highMatch`);
      return 0;
    }

    // Use aggregation to join with artists and filter by country in one query
    const highMatchSongs = await Song.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(id) },
          mood: { $in: mood },
          subMoods: { $in: subMoods },
          genre: genre,
          artist: { $ne: new mongoose.Types.ObjectId(artist) }
        }
      },
      {
        $lookup: {
          from: 'artists',
          localField: 'artist',
          foreignField: '_id',
          as: 'artistInfo'
        }
      },
      {
        $unwind: '$artistInfo'
      },
      {
        $match: {
          'artistInfo.country': artistCountry
        }
      },
      {
        $project: {
          _id: 1
        }
      },
      {
        $limit: 50
      }
    ]);

    // console.log(`Found ${highMatchSongs.length} high similarity matches for song ${id} from country ${artistCountry}`);

    // Add to Redis
    if (highMatchSongs.length > 0) {
      const redisCommands = highMatchSongs.map(song => ({
        value: song._id.toString(),
        score: 80
      }));
     await client.zAdd(similarSongsMatches(id), redisCommands, { GT: true, CH: true });

    }

    return highMatchSongs.length;
  } catch (error) {
    console.error('Error in highMatch:', error);
    throw error;
  }
};


const mediumMatch = async ({ id, mood, subMoods, country, client }) => {
  try {
    const mediumSongsMatch = await Song.find({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      mood: { $in: mood },
      subMoods: { $in: subMoods } // Keep subMoods, drop genre
    })
    .populate('artist', 'country')
    .select('_id')
    .limit(50)
    .lean();

    // Filter by country
    const sameCountrySongs = mediumSongsMatch.filter(song => 
      song.artist && song.artist.country === country
    );

    // console.log(`Found ${sameCountrySongs.length} medium similarity matches for song ${id} from country ${country}`);

    if (sameCountrySongs.length > 0) {
      const redisCommands = sameCountrySongs.map(song => ({
        value: song._id.toString(),
        score: 60
      }));
     await client.zAdd(similarSongsMatches(id), redisCommands, { GT: true, CH: true });

    }

    return sameCountrySongs.length;
  } catch (error) {
    console.error('Error in mediumMatch for song', id, ':', error);
    throw error;
  }
};

const basicMatch = async ({ id, mood, country, client }) => {
  try {
    const basicSongsMatch = await Song.find({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      mood: { $in: mood } // Keep only mood, drop subMoods and genre
    })
    .populate('artist', 'country')
    .select('_id')
    .limit(50)
    .lean();

    // Filter by country
    const sameCountrySongs = basicSongsMatch.filter(song => 
      song.artist && song.artist.country === country
    );

    // console.log(`Found ${sameCountrySongs.length} basic similarity matches for song ${id} from country ${country}`);

    if (sameCountrySongs.length > 0) {
      const redisCommands = sameCountrySongs.map(song => ({
        value: song._id.toString(),
        score: 40 // Basic similarity
      }));
      await client.zAdd(similarSongsMatches(id), redisCommands, { GT: true, CH: true });

    }

    return sameCountrySongs.length;
  } catch (error) {
    console.error('Error in basicMatch for song', id, ':', error);
    throw error;
  }
};


const minimalMatch = async ({ id, country, client, limit = 50 }) => {
  try {
    const minimalSongsMtch = await Song.find({
      _id: { $ne: new mongoose.Types.ObjectId(id) }
      // No mood/subMoods/genre restrictions - only country remains
    })
    .populate('artist', 'country')
    .select('_id')
    .limit(limit)
    .lean();

    // Filter by country
    const sameCountrySongs = minimalSongsMtch.filter(song => 
      song.artist && song.artist.country === country
    );

    // console.log(`Found ${sameCountrySongs.length} minimal similarity matches for song ${id} from country ${country}`);

    if (sameCountrySongs.length > 0) {
      const redisCommands = sameCountrySongs.map(song => ({
        value: song._id.toString(),
        score: 20 // Minimal similarity
      }));
     await client.zAdd(similarSongsMatches(id), redisCommands, { GT: true, CH: true });

    }

    return sameCountrySongs.length;
  } catch (error) {
    console.error('Error in minimalMatch for song', id, ':', error);
    throw error;
  }
};


export const generateSimilarSongs = async (newSong) => {
  const client = await getRedis();

  const { _id: id, artist, mood, subMoods, genre } = newSong;

  const artistDoc = await Artist.findById(artist).select('country').lean();
  const country = artistDoc?.country;

  if (!country) throw new Error('Could not determine country for song');

  // Normalize safely
  const safeMood = asArr(mood);
  const safeSub = asArr(subMoods);

  console.log(`Preparing similar songs sets for: ${newSong.title} (${id}) from ${country}`);

  const [exactCount, highCount, mediumCount, basicCount, minimalCount] = await Promise.all([
    safeMood.length && safeSub.length ? exactMatch({ id, artist, mood: safeMood, subMoods: safeSub, genre, country, client }) : 0,
    safeMood.length && safeSub.length ? highMatch({ id, artist, mood: safeMood, subMoods: safeSub, genre, country, client }) : 0,
    safeMood.length ? mediumMatch({ id, mood: safeMood, subMoods: safeSub, country, client }) : 0,
    safeMood.length ? basicMatch({ id, mood: safeMood, country, client }) : 0,
    minimalMatch({ id, country, client })
  ]);

  const results = {
    exactCount,
    highCount,
    mediumCount,
    basicCount,
    minimalCount,
    totalSongs: exactCount + highCount + mediumCount + basicCount + minimalCount
  };

  console.log(`Similar songs sets prepared for ${newSong.title}:`, results);
  return results;
};




export const similarSongsRepair = async (client) => {
  try {
    const r = client || await getRedis();

    const BATCH_CONCURRENCY = 12;      // tune 8–16
    const TARGET_SIZE       = 50;      // desired ZSET cap
    const MIN_OK_SIZE       = 30;      // below this → repair
    const SLEEP_MS          = 200;     // tiny cool-down per page
    const PAGE_SIZE         = 500;     // Mongo page size

    let lastId = null;
    let total = 0, repaired = 0, skipped = 0, failed = 0;

    console.log('[similarRepair] start');

    while (true) {
      const pageQuery = lastId ? { _id: { $gt: lastId } } : {};
      // Only fetch the fields generateSimilarSongs needs
      const page = await Song.find(pageQuery)
        .sort({ _id: 1 })
        .limit(PAGE_SIZE)
        .select('_id artist mood subMoods genre title')
        .lean();

      if (!page.length) break;
      lastId = page[page.length - 1]._id;

      // simple concurrency pool
      let idx = 0;
      const pool = new Array(BATCH_CONCURRENCY).fill(0).map(async () => {
        while (idx < page.length) {
          const i = idx++;
          const s = page[i];
          total++;

          const key = similarSongsMatches(String(s._id));

          try {
            // 1) Quick health check: if set is present and big enough, skip
            const zsize = await r.zCard(key);
            if (zsize >= MIN_OK_SIZE) {
              skipped++;
              continue;
            }

            // 2) (Optional) clear the key to rebuild from scratch
            //    If you prefer "add-only + GT", comment this DEL out.
            await r.del(key);

            // 3) Rebuild (your generator already caps/GTs/TTLs if you added that)
            await generateSimilarSongs(s);

            // 4) Safety: hard-cap and TTL in case generator didn’t
            await r.multi()
              .zRemRangeByRank(key, 0, - (TARGET_SIZE + 1))
              
              .exec();

            repaired++;
            // Optional: small progress log every N songs
            if ((repaired + skipped + failed) % 2000 === 0) {
              console.log(`[similarRepair] progress: total=${total}, repaired=${repaired}, skipped=${skipped}, failed=${failed}`);
            }
          } catch (e) {
            failed++;
            console.warn(`[similarRepair] fail ${s._id}:`, e?.message || e);
          }
        }
      });

      await Promise.all(pool);

      // tiny cool-down between pages
      if (SLEEP_MS) await new Promise(res => setTimeout(res, SLEEP_MS));
    }

    console.log(`[similarRepair] done. total=${total} repaired=${repaired} skipped=${skipped} failed=${failed}`);
  } catch (err) {
    console.error('[similarRepair] fatal:', err);
  }
};













const getSimilarSongsFallback = async (songId, limit = 20) => {
  try {
    // Get the current song with artist info
    const currentSong = await Song.findById(songId)
      .populate({ path: 'artist', select: 'country' })
      .select('artist genre mood')
      .lean();
    
    if (!currentSong) return [];

    const fallbackSongs = [];
    
    // Fallback 1: Same artist + same genre
    if (currentSong.artist && currentSong.genre) {
      const artistGenreSongs = await Song.find({
        artist: currentSong.artist._id,
        genre: currentSong.genre,
        _id: { $ne: songId }
      })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title cover' })
      .sort({ trendingScore: -1 })
      .limit(limit)
      .lean();
      
      fallbackSongs.push(...artistGenreSongs);
    }

    // Fallback 2: Same artist only (if we need more)
    if (fallbackSongs.length < limit && currentSong.artist) {
      const remaining = limit - fallbackSongs.length;
      const artistSongs = await Song.find({
        artist: currentSong.artist._id,
        _id: { $ne: songId, $nin: fallbackSongs.map(s => s._id) }
      })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title cover' })
      .sort({ trendingScore: -1 })
      .limit(remaining)
      .lean();
      
      fallbackSongs.push(...artistSongs);
    }

    // Fallback 3: Same genre only (if we still need more)
    if (fallbackSongs.length < limit && currentSong.genre) {
      const remaining = limit - fallbackSongs.length;
      const genreSongs = await Song.find({
        genre: currentSong.genre,
        _id: { $ne: songId, $nin: fallbackSongs.map(s => s._id) }
      })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title cover' })
      .sort({ trendingScore: -1 })
      .limit(remaining)
      .lean();
      
      fallbackSongs.push(...genreSongs);
    }

    // Fallback 4: Same mood only (if we still need more)
    if (fallbackSongs.length < limit && currentSong.mood?.length > 0) {
      const remaining = limit - fallbackSongs.length;
      const moodSongs = await Song.find({
        mood: { $in: currentSong.mood },
        _id: { $ne: songId, $nin: fallbackSongs.map(s => s._id) }
      })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title cover' })
      .sort({ trendingScore: -1 })
      .limit(remaining)
      .lean();
      
      fallbackSongs.push(...moodSongs);
    }

    // Fallback 5: Trending songs as last resort
    if (fallbackSongs.length < limit) {
      const remaining = limit - fallbackSongs.length;
      const trendingSongs = await Song.find({
        _id: { $ne: songId, $nin: fallbackSongs.map(s => s._id) }
      })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka country' })
      .populate({ path: 'album', select: 'title cover' })
      .sort({ trendingScore: -1 })
      .limit(remaining)
      .lean();
      
      fallbackSongs.push(...trendingSongs);
    }

    // Add fallback tier information
    return fallbackSongs.slice(0, limit).map(song => ({
      ...song,
      similarityTier: 'fallback'
    }));

  } catch (error) {
    console.warn('Similar songs fallback also failed:', error);
    
    // Ultimate fallback: Just get any songs (should rarely happen)
    const randomSongs = await Song.find({ _id: { $ne: songId } })
      .select('_id title artist album duration artwork streamAudioFileUrl')
      .populate({ path: 'artist', select: 'artistAka' })
      .populate({ path: 'album', select: 'title cover' })
      .limit(limit)
      .lean();
    
    return randomSongs.map(song => ({
      ...song,
      similarityTier: 'random_fallback'
    }));
  }
};






// Generate unique context ID
const generateContextId = () => {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};










// not ms!
const SEVEN_DAY_EXP = 6 * 24 * 60 * 60; // 518400
function extractS3KeyIfBucket(url, bucket) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('amazonaws.com')) return null;

    // virtual-hosted: <bucket>.s3.<region>.amazonaws.com/<key>
    const hostBucket = u.hostname.split('.')[0];
    if (hostBucket === bucket) {
      return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    }

    // path-style: s3.<region>.amazonaws.com/<bucket>/<key>
    const parts = u.pathname.replace(/^\/+/, '').split('/');
    if (parts[0] === bucket && parts.length > 1) {
      return decodeURIComponent(parts.slice(1).join('/'));
    }
    return null;
  } catch {
    return null;
  }
}

const PRESIGN_TTL_SEC = Math.min(SEVEN_DAY_EXP, 604800);


export const similarSongs = async (_parent, { songId }, _ctx) => {
  if (!songId) return { context: "", songs: [], expireAt: new Date().toISOString() };
console.log('recieved song id from client in simila songs:', songId);

const userId = String(_ctx.user._id);

  try {
    const client = await getRedis();
    const context = generateContextId(); 
    const hashKey = SIMILAR_SONGS_PLAYBACK(userId);

    // console.log('see the key from server:', hashKey)
    const expireAt = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();



    // 1) Similar IDs
    const similarIds = await client.zRange(similarSongsMatches(songId), 0, -1, { REV: true });
    if (!similarIds.length) return { context, songs: [], expireAt };

    // 2) Redis songs (keep your helper for now)
    const songs = await Promise.all(similarIds.map(id => getSongRedis(id, client)));

    // 3) Filter valid
    const validSongs = songs.filter(s => s && s._id && s.title && s.artist && Object.keys(s).length > 1);
    const missingIds = similarIds.filter((id, i) => !songs[i] || !songs[i]._id);
    if (missingIds.length) cacheMissingSongsInBackground(missingIds, client);

    // 4) Presign and clean
    const playbackSongs = await Promise.all(validSongs.map(async (song) => {
      const clean = { ...song };

      if (Array.isArray(clean.featuringArtist)) {
        clean.featuringArtist = clean.featuringArtist.filter(x => x && (x.name || x._id));
      }
      if (Array.isArray(clean.producer)) {
        clean.producer = clean.producer.filter(x => x && x.name);
      }
      if (Array.isArray(clean.composer)) {
        clean.composer = clean.composer.filter(x => x && x.name);
      }

    // ARTWORK
if (song.artwork) {
  const key = extractS3KeyIfBucket(song.artwork, 'afrofeel-cover-images-for-songs');
  if (key) {
    clean.artworkPresignedUrl = await CreatePresignedUrlDownloadServerSide({
      bucket: 'afrofeel-cover-images-for-songs',
      key,
      region: 'us-east-2',
      expiresIn: PRESIGN_TTL_SEC, // seconds
    });
  } else {
    clean.artworkPresignedUrl = song.artwork.startsWith('http')
      ? song.artwork
      : await getFallbackArtworkUrl();
  }
} else {
  clean.artworkPresignedUrl = await getFallbackArtworkUrl();
}

// AUDIO (don’t lose folders / avoid double 'for-streaming/')
if (song.streamAudioFileUrl) {
  const u = new URL(song.streamAudioFileUrl);
  const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  const key = path.includes('for-streaming/')
    ? path.slice(path.indexOf('for-streaming/'))
    : `for-streaming/${path.split('/').pop()}`;
  clean.audioPresignedUrl = await CreatePresignedUrlDownloadAudioServerSide({
    bucket: 'afrofeel-songs-streaming',
    key,
    region: 'us-west-2',
    expiresIn: PRESIGN_TTL_SEC,
  });
}

      return clean;
    }));



    return { context, songs: playbackSongs, expireAt };
  } catch (error) {
    console.error("Similar songs error:", error);
    return { context: "", songs: [], expireAt: new Date().toISOString() };
  }
};


// Helper functions

export const getFallbackArtworkUrl = async () => {
  try {
    const fallbackImages = ['Icon1.jpg', 'Singing.jpg'];
    const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    
    return await CreatePresignedUrlDownload({
      bucket: 'fallback-imagess',
      key: randomImage,
      region: 'us-west-2'
    });
  } catch (error) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imYAgQWZyb2ZlZWw8L3RleHQ+PC9zdmc+';
  }
};

// Background caching function
const cacheMissingSongsInBackground = async (missingIds, client) => {
  try {
    const missingSongs = await Song.find({ 
      _id: { $in: missingIds } 
    })
    .populate('artist', '_id artistAka bio country profileImage coverImage')
    .populate('album', '_id title albumCoverImage')
    .lean();

    await Promise.all(
      missingSongs.map(song => addSongRedis(song._id, client))
    );
  } catch (error) {
    console.error('Background caching error:', error);
  }
};





