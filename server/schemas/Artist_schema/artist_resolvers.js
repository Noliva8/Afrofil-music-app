
import fs from 'fs'
import { pipeline } from 'stream';
import { ApolloError } from 'apollo-server-express';
import util from 'util';
import  { Artist, Album, Song, User, Fingerprint } from '../../models/Artist/index_artist.js';
import dotenv from 'dotenv';
import { AuthenticationError, signArtistToken } from '../../utils/artist_auth.js';
import sendEmail from '../../utils/emailTransportation.js';
import awsS3Utils from '../../utils/awsS3.js';
import { S3Client, PutObjectCommand ,CreateMultipartUploadCommand, HeadObjectCommand, UploadPartCommand, DeleteObjectCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
 import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { processAudio} from '../../utils/AudioIntegrity.js';
import { fileURLToPath } from 'url';
import  { validateAudioFormat } from '../../utils/validateAudioFormat.js'
import cleanupTempFiles from '../../utils/cleanTempFiles.js';
import { extractDuration } from '../../utils/songDuration.js'
import stream from "stream";
import path from 'path';
import crypto from "crypto";
import { createHash } from 'crypto';
const { CreatePresignedUrl, CreatePresignedUrlDownload, CreatePresignedUrlDownloadAudio, CreatePresignedUrlDelete } = awsS3Utils;


import Fingerprinting from '../../utils/DuplicateAndCopyrights/fingerPrinting.js'
import isCoverOrRemix from '../../utils/DuplicateAndCopyrights/coverRemix.js'
import {withFilter } from 'graphql-subscriptions';
import { pubsub } from '../../utils/ pubsub.js'

import generateFingerprint from '../../utils/DuplicateAndCopyrights/fingerPrinting.js';
import preProcessAudio from '../../utils/DuplicateAndCopyrights/preProcessAudio.js';
// import FingerprintModule from '../../utils/factory/generateFingerPrint2.js';
import FingerprintGenerator from '../../utils/factory/generateFingerPrint2.js';
import FingerprintMatcher from '../../utils/factory/fingerprintMatcher.js'
import extractFeatures from '../../utils/DuplicateAndCopyrights/detectChroma.js';
import generateHarmonicFingerprint from '../../utils/Covers/Indicators/harmonicFingerprint.js';
import generateStructureHash from '../../utils/Covers/Indicators/similalityHashGenerator.js';
import generateSimilarityFingerprint from '../../utils/Covers/Indicators/similalityFingerprints.js';
import detectKey from '../../utils/Covers/Indicators/keyGenerator.js';
import tempoDetect from '../../utils/Covers/Indicators/tempoDetection.js';
import { title } from 'process';
// import kMeans from 'kmeans-js';

import { upsertSongMeta } from '../../utils/AdEngine/redis/redisSchema.js';
import { recommendNextAfterFull } from '../../utils/AdEngine/nextSong.js';

// import SimHash from 'simhash';
// cache
import { createSongRedis, getSongRedis, updateSongRedis, incrementPlayCount, deleteSongRedis, redisTrending } from './Redis/songCreateRedis.js';
import { checkRedisHealth } from '../../utils/AdEngine/redis/redisClient.js';
import { ensureSongCached } from '../../utils/doesSongExistInCache.js';
import { artistCreateRedis, artistUpdateRedis, deleteArtistRedis,getArtistRedis, getArtistsByCountryRedis, getTopArtistsRedis, searchArtistsRedis,} from './Redis/artistCreateRedis.js';

import { albumCreateRedis, albumUpdateRedis, deleteAlbumRedis, getLatestAlbumsRedis,getAlbumsByReleaseDateRedis, getAlbumsBySongCountRedis, searchAlbumsRedis,getMultipleAlbumsRedis, addSongToAlbumRedis,getAlbumRedis, removeSongFromAlbumRedis } from './Redis/albumCreateRedis.js';

import { getRedis } from '../../utils/AdEngine/redis/redisClient.js';
import { trendingSongs } from './trendingSongs/trendings.js';
import { similarSongs } from './similarSongs/similarSongs.js';


const pipe = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3 = new S3Client({
  region: process.env.JWT_REGION_SONGS_TO_STREAM,
  credentials: {
    accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
    secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
  },
});


function analyzeFingerprints(fingerprint) {
  const deltas = fingerprint.map(fp => fp.deltaTime);
  const avgDelta = deltas.reduce((a,b) => a+b, 0) / deltas.length;
  
  console.log(`Fingerprint Analysis:
  - Total: ${fingerprint.length}
  - Avg Δt: ${avgDelta.toFixed(4)}s
  - Time range: ${fingerprint[0]?.time.toFixed(4)}-${fingerprint.at(-1)?.time.toFixed(4)}s
  `);
}

const SONG_UPLOAD_UPDATE = 'SONG_UPLOAD_UPDATE';
dotenv.config();




// Redis update helpers
// -----------------



/** Helpers */
const isDefined = (v) => v !== undefined;            // keep nulls (to allow clearing), drop only undefined
const asId = (v) => (v && typeof v === 'object' && v._id ? String(v._id) : (v != null ? String(v) : v));
const asIdArray = (arr) => Array.isArray(arr) ? arr.map(asId) : arr;

/** Only the fields you actually want to keep in Redis' doc blob (intentionally no 'beats') */

const shapeForRedis = (songDoc) => ({
  _id: String(songDoc._id),
  title: songDoc.title ?? null,
  artist: asId(songDoc.artist) ?? null,
  featuringArtist: asIdArray(songDoc.featuringArtist) ?? [],
  album: asId(songDoc.album) ?? null,
  trackNumber: songDoc.trackNumber ?? null,
  genre: songDoc.genre ?? null,
  mood: songDoc.mood ?? [],
  subMoods: songDoc.subMoods ?? [],
  producer: asIdArray(songDoc.producer) ?? [],
  composer: asIdArray(songDoc.composer) ?? [],
  label: songDoc.label ?? null,
  releaseDate: songDoc.releaseDate ? new Date(songDoc.releaseDate) : null,
  lyrics: songDoc.lyrics ?? null,
  artwork: songDoc.artwork ?? null,
  audioFileUrl: songDoc.audioFileUrl ?? null,
  streamAudioFileUrl: songDoc.streamAudioFileUrl ?? null,
  visibility: songDoc.visibility ?? 'public',

  // ✅ counters you’ll use for trending
  playCount: Number(songDoc.playCount || 0),
  downloadCount: Number(songDoc.downloadCount || 0),
  likesCount: Number(
    // prefer an explicit likesCount if you add it on Mongo,
    // otherwise derive from likedByUsers length when present
    songDoc.likesCount ??
    (Array.isArray(songDoc.likedByUsers) ? songDoc.likedByUsers.length : 0)
  ),

  // ✅ timestamps
  createdAt: songDoc.createdAt ? new Date(songDoc.createdAt) : new Date(),
  updatedAt: new Date(),
  // optional:
  // lastPlayedAt: songDoc.lastPlayedAt ? new Date(songDoc.lastPlayedAt) : null,
});


/** Build a shallow patch from args: include keys that were provided; stringify IDs where needed */
const buildRedisPatch = (args) => {
  const {
    title,
    featuringArtist,
    album,
    trackNumber,
    genre,
    mood,
    subMoods,
    producer,
    composer,
    label,
    releaseDate,
    lyrics,
    artwork,
  } = args;

  const patch = {
    title,
    featuringArtist: isDefined(featuringArtist) ? asIdArray(featuringArtist) : undefined,
    album: isDefined(album) ? asId(album) : undefined,
    trackNumber,
    genre,
    mood,
    subMoods,
    producer: isDefined(producer) ? asIdArray(producer) : undefined,
    composer: isDefined(composer) ? asIdArray(composer) : undefined,
    label,
    releaseDate: isDefined(releaseDate) ? (releaseDate ? new Date(releaseDate) : null) : undefined,
    lyrics,
    artwork,
  };

  // drop only undefined keys; keep nulls (explicit clears)
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
  return patch;
};


// helper to extract url of s3 to delete the song in case the song is being deleted

// --- helpers ---
const keyFromUrl = (url, expectedPrefix = null) => {
  try {
    if (!url) return null;
    const u = new URL(url);

    // strip leading slash and URL-decode (so spaces become spaces again)
    let key = decodeURIComponent(u.pathname.replace(/^\/+/, ''));

    // If you expect a prefix (e.g. "original_songs/" or "for-streaming/")
    // and the key is just a bare filename, prepend the prefix.
    if (expectedPrefix) {
      if (!key.startsWith(expectedPrefix)) {
        // If key has no folder (bare filename), add the prefix
        if (!key.includes('/')) key = `${expectedPrefix}${key}`;
        // If it already has some folder but not the one you expect,
        // leave it as-is to avoid deleting the wrong object.
      }
    }
    return key || null;
  } catch {
    return null;
  }
};




// for handle play counts
// ---------------------

function getViewerId(context) {
  if (context?.user?._id)   return `user:${String(context.user._id)}`;
  if (context?.artist?._id) return `artist:${String(context.artist._id)}`;
  const ip =
    (context?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()) ||
    context?.req?.ip ||
    '0.0.0.0';
  const ua = context?.req?.headers?.['user-agent'] || '';
  const anon = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
  return `anon:${anon}`;
}

const PLAY_COOLDOWN_SECONDS = 60 * 60; 


// -------------------------

const resolvers = {
  Upload: GraphQLUpload,
Query: {


  artistProfile: async (parent, args, context) => {
  try {
    // Debugging: Log the entire artistContext to see what it contains
    // console.log('context in artist profile:', context);

    // Check if the artist is authenticated
    if (!context.artist) {
      throw new Error("Unauthorized: You must be logged in to view your profile.");
    }

    // Debugging: Log the artist's ID from the context
    // console.log('Artist ID from Context:', context.artist._id);

    // Find the artist's profile using the artist's ID from the context
    const artist = await Artist.findById(context.artist._id)
      .populate("songs")
      .populate('followers');

    // Debugging: Check if the artist was found
    if (!artist) {
      console.error('Artist not found in the database.');
      throw new Error("Artist not found.");
    }

    // Return artist's data
    return artist;
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching artist profile:', error);

    // Throw a general error message for the GraphQL response
    throw new Error("Failed to fetch artist profile.");
  }
},

// Query / Song
// --------------

songsOfArtist: async (parent, args, context) => {

    // Check if the artist is logged in by verifying the context
    if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to fetch your songs.');
    }

    // Use the artist's ID from the context
    const artistId = context.artist._id;

    try {
        // Fetch songs associated with the artist's ID and populate the album details
        const songs = await Song.find({ artist: artistId })
        .populate('album')
        .populate('likedByUsers');

        // Return the list of songs with populated album information
        return songs;
    } catch (error) {
        console.error('Error fetching songs:', error);

        // Throw a general error message for the GraphQL response
        throw new Error("Failed to fetch songs.");
    }
},


songById : async (parent, { songId }, context) => {
  // Ensure that the user (artist) is logged in
  if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to fetch your song.');
  }

  const artistId = context.artist._id;

  try {
    // Query the song by both artistId and songId
    const song = await Song.findOne({
      artistId: artistId,
      songId: songId,
    });

    if (!song) {
      throw new Error('Song not found.');
    }

    // Return the song if found
    return song;
  } catch (error) {
    console.error('Error fetching song:', error);
    // Provide a generic error message for the client
    throw new Error('Failed to fetch song.');
  }
},


getSongMetadata: async (parent, { songId }, context) => {
  try {
    // No artist authentication required
    // Just fetch the public metadata needed for playback
    
    const song = await Song.findOne({ songId })
      .populate('artist', 'artistAka country languages') 
      .populate('album', 'title releaseDate albumCoverImage') 
      .lean();
    
    if (!song) {
      throw new Error('Song not found');
    }

    // Return the complete metadata with populated artist and album data
    return {
      songId: song.songId,
      title: song.title,
      artist: song.artist?._id || song.artist, // Return artist ID
      artistAka: song.artist?.artistaka || '', // From populated artist
      country: song.artist?.country || '', // From populated artist
      languages: song.artist?.languages || [], // From populated artist
      genre: song.genre || '',
      mood: song.mood || '',
      subMoods: song.subMoods || '',
      country: song.artist.country,
      tempo: song.tempo || 0,
      album: song.album || null, // Return album object
      albumTitle: song.album?.title || '', // From populated album
      duration: song.duration || 0
    };

  } catch (error) {
    console.error('Error fetching song metadata:', error);
    throw new Error('Failed to fetch song metadata');
  }
},








albumOfArtist: async (parent, args, context) => {
   if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to fetch your songs.');
    }

     // Use the artist's ID from the context
    const artistId = context.artist._id;

     try {
        // Fetch albums associated with the artist's ID and populate the songs details
        const albums = await Album.find({ artist: artistId  })
        .populate('songs')
        

        // Return the list of albums with populated songs information
        return albums.length > 0 ? albums : [];
    } catch (error) {
        console.error('Error fetching albums:', error);

        // Throw a general error message for the GraphQL response
        throw new Error("Failed to fetch albums.");
    }

},


// trendingSongs: async (context) => {
//       const limit = 20;
//       const userId = context.user?._id?.toString();
//      console.log("check if the context conatain user id:", userId)

//       try {
//         const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//           Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist'),
//           Song.aggregate([
//             { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//             { $sort: { likesCount: -1, createdAt: -1 } },
//             { $limit: limit }
//           ]),
//           Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist'),
//           Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist')
//         ]);

//         const likedIds = topLikesAgg.map(s => s._id);
//         const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist');

//         const merged = [];
//         const seen = new Set();
//         const addUnique = (songs) => {
//           for (const s of songs) {
//             const id = s._id.toString();
//             if (!seen.has(id)) {
//               seen.add(id);
//               merged.push(s);
//               if (merged.length === limit) break;
//             }
//           }
//         };

//         addUnique(topPlays);
//         addUnique(topLikes);
//         addUnique(topDownloads);
//         addUnique(latestSongs);

//         return merged.slice(0, limit);
//       } catch (err) {
//         console.error('❌ Trending songs error:', err);
//         return [];
//       }
//     },



// trendingSongs: async () => {
//       const limit = 20;

//       // 1) Try Redis first
//       try {
//         const fromRedis = await redisTrending(limit);
//         if (fromRedis && fromRedis.length) {
//           return fromRedis; // already shaped like your Mongo doc
//         }
//       } catch (e) {
//         console.warn("[trendingSongs] Redis fetch failed, falling back:", e.message);
//       }

//       // 2) DB fallback (your existing merge logic)
//       try {
//         const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//           Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist').lean(),
//           Song.aggregate([
//             { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//             { $sort: { likesCount: -1, createdAt: -1 } },
//             { $limit: limit }
//           ]),
//           Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist').lean(),
//           Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist').lean(),
//         ]);

//         // Re-fetch full docs for liked ones
//         const likedIds = topLikesAgg.map(s => s._id);
//         const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist').lean();

//         const merged = [];
//         const seen = new Set();
//         const addUnique = (songs) => {
//           for (const s of songs) {
//             const id = s._id.toString();
//             if (!seen.has(id)) {
//               seen.add(id);
//               merged.push({
//                 ...s,
//                 likesCount: s.likedByUsers?.length || s.likesCount || 0,
//               });
//               if (merged.length === limit) break;
//             }
//           }
//         };

//         addUnique(topPlays);
//         addUnique(topLikes);
//         addUnique(topDownloads);
//         addUnique(latestSongs);

//         const result = merged.slice(0, limit);

//         // 3) Best-effort backfill Redis so next call is fast
//         (async () => {
//           try {
//             const r = await getRedis();
//             for (const doc of result) {
//               try {
//                 await createSongRedis(doc);
//                 // optional: recompute trending in case your create path didn’t
//                 if (typeof recomputeTrendingFor === "function") {
//                   await recomputeTrendingFor(r, String(doc._id));
//                 }
//               } catch (e) {
//                 console.warn("[trendingSongs] backfill for", doc._id, "failed:", e.message);
//               }
//             }
//             // optionally enforce cap:
//             // await enforceSongLimit();
//           } catch (e) {
//             console.warn("[trendingSongs] Redis backfill skipped:", e.message);
//           }
//         })();

//         return result;
//       } catch (err) {
//         console.error("❌ Trending songs DB fallback error:", err);
//         return [];
//       }
//     },



// trendingSongs: async () => {
//   const limit = 20;

//   // 1) Try Redis first
//   try {
//     const fromRedis = await redisTrending(limit);

//     if (fromRedis && fromRedis.length) {
//       const enrichedSongs = [];
//       const artistCache = new Map();
//       const albumCache = new Map();

//       for (const song of fromRedis) {
//         if (!song?._id || !song?.artist) continue;

//         // Get artist from Redis cache/helper
//         let artist = artistCache.get(song.artist);
//         if (!artist) {
//           artist = await getArtistRedis(song.artist);
//           if (artist) artistCache.set(song.artist, artist);
//         }

//         if (!artist || !artist._id) continue;

//         // Get album from Redis cache/helper
//         let album = null;
//         if (song.album) {
//           album = albumCache.get(song.album);
//           if (!album) {
//             album = await getAlbumRedis(song.album);
//             if (album) albumCache.set(song.album, album);
//           }
//         }

//         enrichedSongs.push({
//           ...song,
//           artist,
//           album: album || { _id: 'unknown', title: 'Unknown Album' },
//         });

//         if (enrichedSongs.length >= limit) break;
//       }

//       if (enrichedSongs.length) {
//         console.log(`✅ Returning ${enrichedSongs.length} trending songs from Redis`);
//         return enrichedSongs;
//       }
//     }
//   } catch (e) {
//     console.warn("[trendingSongs] Redis fetch failed, falling back:", e.message);
//   }



//   try {
//     console.log('🎵 Starting trending songs query...');

//     // Step 1: Get all candidate songs first
//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find()
//         .sort({ playCount: -1, createdAt: -1 })
//         .limit(limit)
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
//         .lean(),

//       Song.aggregate([
//         { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find()
//         .sort({ downloadCount: -1, createdAt: -1 })
//         .limit(limit)
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
//         .lean(),

//       Song.find()
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
//         .lean(),
//     ]);

//     // Step 2: Re-fetch liked songs with population
//     const likedIds = topLikesAgg.map(s => s._id);
//     const topLikes = likedIds.length > 0 ? await Song.find({ 
//       _id: { $in: likedIds }
//     })
//       .populate({ 
//         path: 'artist', 
//         select: 'artistAka country'
//       })
//       .populate({ 
//         path: 'album',
//         select: 'title'
//       })
//       .lean() : [];

//     // Step 3: Collect all songs and identify ones with population issues
//     const allSongs = [...topPlays, ...topLikes, ...topDownloads, ...latestSongs];
    
//     console.log(`📊 Initial songs found: ${allSongs.length}`);
    
//     // Identify songs with population issues
//     const songsWithPopulationIssues = allSongs.filter(song => {
//       const hasArtistIssue = !song.artist || typeof song.artist !== 'object' || !song.artist._id;
//       return hasArtistIssue;
//     });

//     console.log(`❌ Songs with population issues: ${songsWithPopulationIssues.length}`);
    
//     if (songsWithPopulationIssues.length > 0) {
//       console.log('🔍 Sample of problematic songs:');
//       songsWithPopulationIssues.slice(0, 3).forEach(song => {
//         console.log(`   - ${song._id}: "${song.title}"`, {
//           artistType: typeof song.artist,
//           artistValue: song.artist
//         });
//       });
//     }

//     // Step 4: Batch fix population issues (single database query)
//     const problematicArtistIds = songsWithPopulationIssues
//       .map(song => {
//         // Extract ObjectId from problematic artist field
//         if (song.artist && song.artist.constructor && song.artist.constructor.name === 'ObjectId') {
//           return song.artist;
//         }
//         return null;
//       })
//       .filter(id => id !== null);

//     let fixedArtists = new Map();
    
//     if (problematicArtistIds.length > 0) {
//       console.log(`🔄 Batch populating ${problematicArtistIds.length} problematic artists...`);
      
//       try {
//         const Artist = Song.model('Artist');
//         const artists = await Artist.find({ 
//           _id: { $in: problematicArtistIds } 
//         }).select('artistAka country').lean();
        
//         artists.forEach(artist => {
//           fixedArtists.set(artist._id.toString(), artist);
//         });
        
//         console.log(`✅ Successfully populated ${artists.length} artists`);
//       } catch (error) {
//         console.error('❌ Batch population failed:', error.message);
//       }
//     }

//     // Step 5: Process songs with fixed population data
//     const merged = [];
//     const seen = new Set();
//     let skippedCount = 0;

//     const processSongs = (songs) => {
//       for (const s of songs) {
//         const id = s._id.toString();
//         if (seen.has(id)) continue;
        
//         let artistData = s.artist;
        
//         // Check if this song has a population issue that we can fix
//         if (s.artist && s.artist.constructor && s.artist.constructor.name === 'ObjectId') {
//           const artistId = s.artist.toString();
//           if (fixedArtists.has(artistId)) {
//             artistData = fixedArtists.get(artistId);
//             console.log(`✅ Fixed population for song ${s._id} with artist ${artistId}`);
//           } else {
//             console.warn(`❌ Skipping song ${s._id} - artist ${artistId} not found in batch population`);
//             skippedCount++;
//             continue;
//           }
//         }
        
//         // Final check for valid artist data
//         if (!artistData || typeof artistData !== 'object' || !artistData._id) {
//           console.warn(`❌ Skipping song ${s._id} - invalid artist data`);
//           skippedCount++;
//           continue;
//         }

//         // Create the song object with all required fields
//         const songWithDefaults = {
//           ...s,
//           artist: artistData,
//           album: s.album && typeof s.album === 'object' && s.album._id ? s.album : { _id: 'unknown', title: 'Unknown Album' },
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
//         };

//         seen.add(id);
//         merged.push(songWithDefaults);

//         if (merged.length >= limit) break;
//       }
//     };

//     // Process all song batches
//     processSongs(topPlays);
//     if (merged.length < limit) processSongs(topLikes);
//     if (merged.length < limit) processSongs(topDownloads);
//     if (merged.length < limit) processSongs(latestSongs);

//     const result = merged.slice(0, limit);

//     console.log('📊 FINAL RESULT:');
//     console.log(`   ✅ Valid songs returned: ${result.length}`);
//     console.log(`   ❌ Songs skipped: ${skippedCount}`);
    
//     if (result.length > 0) {
//       console.log('✅ Successfully returned trending songs');
//     }

//     // Step 6: Async Redis backfill (non-blocking)
//     if (result.length > 0) {
//       (async () => {
//         try {
//           const r = await getRedis();
//           for (const doc of result) {
//             try {
//               await createSongRedis(doc);
//               if (typeof recomputeTrendingFor === "function") {
//                 await recomputeTrendingFor(r, String(doc._id));
//               }
//             } catch (e) {
//               console.warn("[trendingSongs] Redis backfill failed for", doc._id);
//             }
//           }
//         } catch (e) {
//           console.warn("[trendingSongs] Redis backfill skipped");
//         }
//       })();
//     }

//     return result;
//   } catch (err) {
//     console.error("❌ Trending songs error:", err);
//     return [];
//   }
// },

// trendingSongs: async () => {
//   const limit = 20;
//   let source = 'unknown';

//   // 1) Try Redis first
//   try {
//     console.log('🔍 Attempting to fetch from Redis...');
//     const fromRedis = await redisTrending(limit);

//     if (fromRedis && fromRedis.length > 0) {
//       console.log(`✅ Redis returned ${fromRedis.length} songs, enriching data...`);
      
//       const enrichedSongs = [];
//       const artistCache = new Map();
//       const albumCache = new Map();

//       for (const song of fromRedis) {
//         if (!song?._id || !song?.artist) continue;

//         // Get artist from Redis
//         let artist = artistCache.get(song.artist);
//         if (!artist) {
//           artist = await getArtistRedis(song.artist);
//           if (artist) artistCache.set(song.artist, artist);
//         }

//         if (!artist || !artist._id) continue;

//         // Get album from Redis
//         let album = null;
//         if (song.album) {
//           album = albumCache.get(song.album);
//           if (!album) {
//             album = await getAlbumRedis(song.album);
//             if (album) albumCache.set(song.album, album);
//           }
//         }

//         enrichedSongs.push({
//           ...song,
//           artist,
//           album: album || { _id: 'unknown', title: 'Unknown Album' },
//         });

//         if (enrichedSongs.length >= limit) break;
//       }

//       if (enrichedSongs.length > 0) {
//         source = 'redis';
//         console.log(`🎵 RETURNING FROM REDIS: ${enrichedSongs.length} songs`);
//         return enrichedSongs;
//       }
//     } else {
//       console.log('❌ Redis returned no songs or empty result');
//     }
//   } catch (e) {
//     console.warn('Redis fetch failed, falling back to DB');
//   }



//   // 2) Database Fallback
//   try {
//     console.log('🔄 Falling back to database query...');
//     source = 'database';

//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find({ artist: { $exists: true, $ne: null } })
//         .sort({ playCount: -1, createdAt: -1 })
//         .limit(limit)
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
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
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
//         .lean(),

//       Song.find({ artist: { $exists: true, $ne: null } })
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .populate({ 
//           path: 'artist', 
//           select: 'artistAka country'
//         })
//         .populate({ 
//           path: 'album',
//           select: 'title'
//         })
//         .lean(),
//     ]);

//     // Re-fetch liked songs
//     const likedIds = topLikesAgg.map(s => s._id);
//     const topLikes = likedIds.length > 0 ? await Song.find({ 
//       _id: { $in: likedIds },
//       artist: { $exists: true, $ne: null } 
//     })
//       .populate({ 
//         path: 'artist', 
//         select: 'artistAka country'
//       })
//       .populate({ 
//         path: 'album',
//         select: 'title'
//       })
//       .lean() : [];

//     // Merge and deduplicate
//     const merged = [];
//     const seen = new Set();

//     const addUnique = (songs) => {
//       for (const s of songs) {
//         const id = s._id.toString();
//         if (seen.has(id)) continue;
        
//         if (!s.artist || typeof s.artist !== 'object' || !s.artist._id) {
//           continue; // Skip invalid songs
//         }

//         const songWithDefaults = {
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
//         };

//         seen.add(id);
//         merged.push(songWithDefaults);

//         if (merged.length >= limit) break;
//       }
//     };

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

//     const result = merged.slice(0, limit);

//     console.log(`🎵 RETURNING FROM DATABASE: ${result.length} songs`);

//     // Cache results in Redis for next time (async)
//     (async () => {
//       try {
//         for (const song of result) {
//           await createSongRedis(song).catch(e => null);
//         }
//         console.log(`💾 Cached ${result.length} songs in Redis for next request`);
//       } catch (e) {
//         // Silent fail for caching
//       }
//     })();

//     return result;

//   } catch (err) {
//     console.error("❌ Database query failed:", err);
//     source = 'error';
//     return [];
//   } finally {
//     console.log(`📊 TRENDING SONGS SOURCE: ${source.toUpperCase()}`);
//   }
// },



// trendingSongs: async () => {

//   const limit = 20;
//   let source = 'unknown';

//   // 1) Try Redis first with parallel enrichment
//   try {
//     console.log('🔍 Attempting to fetch from Redis...');
//     const fromRedis = await redisTrending(limit);

//     if (fromRedis?.length > 0) {
//       console.log(`✅ Redis returned ${fromRedis.length} songs, enriching data...`);
      
//       // Get unique artist and album IDs for batch fetching
//       const artistIds = new Set();
//       const albumIds = new Set();
      
//       fromRedis.forEach(song => {
//         if (song?.artist) artistIds.add(song.artist);
//         if (song?.album) albumIds.add(song.album);
//       });

//       // Parallel batch fetching
//       const [artistsMap, albumsMap] = await Promise.all([
//         // Fetch all artists in parallel
//         (async () => {
//           const artistPromises = Array.from(artistIds).map(id => 
//             getArtistRedis(id).catch(() => null)
//           );
//           const artists = await Promise.all(artistPromises);
//           const map = new Map();
//           artists.forEach(artist => {
//             if (artist?._id) map.set(artist._id, artist);
//           });
//           return map;
//         })(),
        
//         // Fetch all albums in parallel
//         (async () => {
//           const albumPromises = Array.from(albumIds).map(id => 
//             getAlbumRedis(id).catch(() => null)
//           );
//           const albums = await Promise.all(albumPromises);
//           const map = new Map();
//           albums.forEach(album => {
//             if (album?._id) map.set(album._id, album);
//           });
//           return map;
//         })()
//       ]);

//       // Enrich songs with parallel processing
//       const enrichmentPromises = fromRedis.slice(0, limit).map(async (song) => {
//         if (!song?._id || !song?.artist) return null;

//         const artist = artistsMap.get(song.artist);
//         if (!artist?._id) return null;

//         const album = song.album ? albumsMap.get(song.album) : null;

//         return {
//           ...song,
//           artist,
//           album: album || { _id: 'unknown', title: 'Unknown Album' },
//         };
//       });

//       const enrichedSongs = (await Promise.all(enrichmentPromises))
//         .filter(song => song !== null);

//       if (enrichedSongs.length > 0) {
//         source = 'redis';
//         console.log(`🎵 RETURNING FROM REDIS: ${enrichedSongs.length} songs`);
//         return enrichedSongs;
//       }
//     } else {
//       console.log('❌ Redis returned no songs or empty result');
//     }
//   } catch (e) {
//     console.warn('Redis fetch failed, falling back to DB:', e.message);
//   }

//   // 2) Optimized Database Fallback
//   try {
//     console.log('🔄 Falling back to optimized database query...');
//     source = 'database';

//     // Single optimized aggregation query instead of multiple separate queries
//     const trendingSongs = await Song.aggregate([
//       { 
//         $match: { 
//           artist: { $exists: true, $ne: null },
//           // Add any other filters you need
//         } 
//       },
//       {
//         $addFields: {
//           likesCount: { $size: { $ifNull: ['$likedByUsers', []] } },
//           // Calculate a combined trending score
//           trendingScore: {
//             $add: [
//               { $multiply: ['$playCount', 0.4] },
//               { $multiply: ['$downloadCount', 0.3] },
//               { $multiply: [{ $size: { $ifNull: ['$likedByUsers', []] } }, 0.2] },
//               { 
//                 $multiply: [
//                   { $dateDiff: { startDate: '$createdAt', endDate: new Date(), unit: 'day' } },
//                   -0.1 // Penalize older songs
//                 ]
//               }
//             ]
//           }
//         }
//       },
//       {
//         $sort: { 
//           trendingScore: -1,
//           createdAt: -1 
//         }
//       },
//       { $limit: limit * 2 }, // Get extra for filtering
//       {
//         $lookup: {
//           from: 'artists', // Replace with actual collection name
//           localField: 'artist',
//           foreignField: '_id',
//           as: 'artistData'
//         }
//       },
//       {
//         $lookup: {
//           from: 'albums', // Replace with actual collection name
//           localField: 'album',
//           foreignField: '_id',
//           as: 'albumData'
//         }
//       },
//       {
//         $addFields: {
//           artist: { $arrayElemAt: ['$artistData', 0] },
//           album: { $arrayElemAt: ['$albumData', 0] }
//         }
//       },
//       {
//         $project: {
//           artistData: 0,
//           albumData: 0,
//           likedByUsers: 0 // Exclude large array if not needed
//         }
//       },
//       {
//         $match: {
//           'artist._id': { $exists: true }
//         }
//       }
//     ]);

//     // Apply defaults and limit
//     const result = trendingSongs.slice(0, limit).map(song => ({
//       ...song,
//       mood: song.mood || [],
//       subMoods: song.subMoods || [],
//       tempo: song.tempo || 0,
//       likesCount: song.likesCount || 0,
//       trendingScore: song.trendingScore || 0,
//       downloadCount: song.downloadCount || 0,
//       playCount: song.playCount || 0,
//       featuringArtist: song.featuringArtist || [],
//       genre: song.genre || '',
//       duration: song.duration || 0,
//       artwork: song.artwork || '',
//       streamAudioFileUrl: song.streamAudioFileUrl || '',
//       audioFileUrl: song.audioFileUrl || '',
//       createdAt: song.createdAt || new Date(),
//       album: song.album || { _id: 'unknown', title: 'Unknown Album' }
//     }));

//     console.log(`🎵 RETURNING FROM DATABASE: ${result.length} songs`);

//     // Cache results asynchronously without blocking response
//     if (result.length > 0) {
//       process.nextTick(async () => {
//         try {
//           const cachePromises = result.map(song => 
//             createSongRedis(song).catch(() => null)
//           );
//           await Promise.all(cachePromises);
//           console.log(`💾 Cached ${result.length} songs in Redis for next request`);
//         } catch (e) {
//           console.warn('Caching failed silently:', e.message);
//         }
//       });
//     }

//     return result;

//   } catch (err) {
//     console.error("❌ Database query failed:", err);
//     source = 'error';
//     return [];
//   } finally {
//     console.log(`📊 TRENDING SONGS SOURCE: ${source.toUpperCase()}`);
//   }
// },

trendingSongs,


    similarSongs,



},



  Mutation: {
createArtist: async (parent, { fullName, artistAka, email, password }) => {
  try {
    // Check if the artist already exists
    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      throw new Error("Artist with this email already exists");
    }

    // Create the new artist
    const newArtist = await Artist.create({
      fullName,
      artistAka,
      email,
      password,
      confirmed: false,
       selectedPlan: false,
      role: 'artist'
    });

    // Generate the token for email verification
    const artistToken = signArtistToken(newArtist);

    // Create the verification link
    const verificationLink = `http://localhost:3001/confirmation/${artistToken}`;

    // Send the response to the user immediately
    // The email sending happens asynchronously in the background
    setTimeout(async () => {
      try {
        // Send the verification email asynchronously
        await sendEmail(
          newArtist.email,
          "Verify Your Email",
          `
            <p>Welcome to AfroFeel, ${newArtist.fullName}!</p>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
          `
        );
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Optionally, log the error or handle retries
      }
    }, 0);

    // Explicitly include the 'confirmed' field in the return object


    return {
      artistToken,
      confirmed: newArtist.confirmed, 
      selectedPlan: newArtist.selectedPlan, 
      email: newArtist.email, 
      fullName: newArtist.fullName,
      artistAka: newArtist.artistAka,
      role: 'artist'
    };
    
  } catch (error) {
    console.error("Failed to create artist:", error);
    throw new Error("Failed to create artist");
  }
},


// resend verfication link
// --------------------
resendVerificationEmail: async (parent, { email }) => {
  try {
    // Find the artist by email
    const artist = await Artist.findOne({ email });
    if (!artist) {
      throw new Error("Artist not found");
    }

    // Check if the email is already verified
    if (artist.confirmed) {
      return { success: false, message: "Email is already verified" };
    }

    // Generate a new token using signToken
    const artistToken = signToken(artist);

    // Construct the verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${artistToken}`;

//  console.log(process.env.FRONTEND_URL) ;
  // console.log(verificationLink) ;

    // Send the verification email
    await sendEmail(artist.email, "Verify Your Email", `
      <p>Hello, ${artist.fullName}!</p>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
    `);

    return { success: true, message: "Verification email resent successfully" };
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    throw new Error("Failed to resend verification email");
  }
},




// verifyEmail: async (parent, { token }) => {
//   try {
//     // Verify the JWT token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Find the artist by ID
//     const artist = await Artist.findById(decoded._id);
//     if (!artist) {
//       throw new Error('Artist not found');
//     }

//     // Check if the artist is already confirmed
//     if (artist.confirmed) {
//       return { success: false, message: 'Email is already verified' };
//     }

//     // Update the `confirmed` field to true
//     artist.confirmed = true;
//     await artist.save();

//     return { success: true, message: 'Email verified successfully' };
//   } catch (error) {
//     console.error('Failed to verify email:', error);

//     // Handle different errors based on the error type or message
//     if (error.name === 'JsonWebTokenError' || error.message === 'invalid token') {
//       return { success: false, message: 'Invalid token. Please request a new verification email.' };
//     }
//     if (error.message === 'jwt expired') {
//       return { success: false, message: 'Verification token has expired. Please request a new one.' };
//     }

//     // Generic error message
//     return { success: false, message: 'An error occurred while verifying your email' };
//   }
// },


// ------------------------------------------------------------------------------

// addProfileImage
// --------------


verifyEmail: async (parent, { token }) => {
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find artist
    const artist = await Artist.findById(decoded._id);
    if (!artist) {
      throw new Error('Artist not found');
    }

    // Already confirmed?
    if (artist.confirmed) {
      return { success: false, message: 'Email is already verified' };
    }

    // Confirm the artist
    artist.confirmed = true;
    await artist.save();

    // Fetch updated artist with related data
    const populatedArtist = await Artist.findById(artist._id)
      .populate('songs', '_id title')
      .populate('albums', '_id title')
      .populate('followers', '_id username')
      .lean();

    // ✅ Mirror into Redis
    await artistCreateRedis(populatedArtist);

    return { success: true, message: 'Email verified successfully' };
    
  } catch (error) {
    console.error('Failed to verify email:', error);

    if (error.name === 'JsonWebTokenError' || error.message === 'invalid token') {
      return { success: false, message: 'Invalid token. Please request a new verification email.' };
    }
    if (error.message === 'jwt expired') {
      return { success: false, message: 'Verification token has expired. Please request a new one.' };
    }

    return { success: false, message: 'An error occurred while verifying your email' };
  }},










getPresignedUrl: async (_, { bucket, key, region }) => {
      try {
        // Generate presigned URL using the utility function
        const url = await CreatePresignedUrl({ bucket, key, region });

        // Return the URL and expiration time
        return {
          url,
          expiration: '3600', // Expiration time in seconds
        };
      } catch (error) {
        console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
      }
    },

   getPresignedUrlDownload: async(_, {bucket, key, region}) =>{
    try{
       const urlToDownload = await CreatePresignedUrlDownload({ bucket, key, region });

        // Return the URL and expiration time
        return {
          urlToDownload,
          expiration: '18000', // Expiration time in seconds
        };

    }catch(error){
console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
    }
   },

getPresignedUrlDownloadAudio: async(_, {bucket, key, region}) => {
  try {
    const urlToDownloadAudio = await CreatePresignedUrlDownloadAudio({ bucket, key, region });

    return {
  url: urlToDownloadAudio,
  expiration: '18000',
};

  } catch (error) {
    console.error('Error in resolver:', error);
    throw new Error('Failed to fetch presigned URL');
  }
},




 getPresignedUrlDelete: async(_, {bucket, key, region}) =>{
    try{
       const urlToDelete = await CreatePresignedUrlDelete({ bucket, key, region });

        // Return the URL and expiration time
        return {
          urlToDelete,
          expiration: '3600', // Expiration time in seconds
        };

    }catch(error){
console.error('Error in resolver:', error);
        throw new Error('Failed to fetch presigned URL');
    }
   },


  

 // Artist Login
   artist_login : async (parent, { email, password }) => {
  try {
    // Step 1: Find the artist by email
    const artist = await Artist.findOne({
      email
    });

    // Step 2: If no artist is found, throw an authentication error
    if (!artist) {
      throw new AuthenticationError('Artist not found.');
    }

    // Step 3: Check if the password is correct
    const correctPw = await artist.isCorrectPassword(password);
    
    if (!correctPw) {
      throw new AuthenticationError('Incorrect password.');
    }

    // Step 4: Generate a JWT token for the artist
    const artistToken = signArtistToken(artist);

    // Step 5: Return the token and artist object
    return { artistToken, artist };
    
  } catch (error) {
    console.error("Login failed:", error);
  }
},





// Select plan
// -----------

selectPlan: async (parent, { artistId, plan }) => {
  try {
    const afroFeelPlans = ['Free Plan', 'Premium Plan', 'Pro Plan'];

    // Validate the plan type
    if (!afroFeelPlans.includes(plan)) {
      throw new Error('Invalid plan type selected.');
    }

    // Update the artist's plan in the database
    const artist = await Artist.findByIdAndUpdate(
      artistId,
      {
        selectedPlan: true,
        plan: plan,
      },
      { new: true }
    );

await artistUpdateRedis(artist); 

    if (!artist) {
      throw new Error('Artist not found.');
    }

    return artist;
  } catch (error) {
    console.error('Selecting plan failed:', error);
    throw new GraphQLError('Selecting plan failed.', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
},


updateArtistProfile: async (
  parent,
  { artistId, bio, country, languages, genre, mood, profileImage, coverImage },
  context
) => {
  try {
    // Check if the artist is authenticated through the context
    if (!context.artist) {
      throw new Error('Unauthorized: You must be logged in to update your profile.');
    }

    // console.log('Context:', context);
    // console.log('Artist ID from Context:', context.artist._id);
    // console.log('Update Payload:', { bio, country, languages, genre, mood, profileImage, coverImage });

    // Create an object to hold the fields to update
    const updateFields = {};
    if (bio) updateFields.bio = bio;
    if (country) updateFields.country = country;
    if (languages) updateFields.languages = languages;
    if (genre) updateFields.genre = genre;
    if (mood) updateFields.mood = mood;
    if (profileImage) updateFields.profileImage = profileImage;
    if (coverImage) updateFields.coverImage = coverImage;

    // Update the artist's profile using the provided details
    const newArtist = await Artist.findOneAndUpdate(
      { _id: context.artist._id }, // Find the artist by their unique ID
      updateFields, // Use the dynamically created updateFields object
      { new: true } // Return the updated document
    );
// keep Redis in sync
    await artistUpdateRedis(newArtist); 


    if (!newArtist) {
      throw new Error('Artist not found or update failed.');
    }

    return newArtist; // Return the updated artist profile
  } catch (error) {
    // Handle any errors that occur during the update
    console.error('Error updating artist profile:', error);
    throw new Error('Failed to update artist profile: ' + error.message);
  }
},

addBio: async (parent, { bio }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { bio },
        { new: true }
      );
// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


addCountry: async (parent, { country }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { country },
        { new: true }
      );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


    addLanguages: async (parent, { languages }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { languages },
        { new: true }
      );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },

    addGenre: async (parent, { genre }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { genre },
        { new: true }
      );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },


removeGenre: async (_, { genre }, context) => {
      try {
        const artistId = context.artist._id; // Get the user ID from the context

        // Fetch the artist profile from the database
        const artist = await Artist.findById(artistId);
        if (!artist) {
          throw new Error("Artist not found");
        }

        // Remove the specified genres from the artist's genre list
        artist.genre = artist.genre.filter((g) => !genre.includes(g));

        // Save the updated artist profile
        await artist.save();
        await artistUpdateRedis(artist); 


        return {
          _id: artist._id,
          genre: artist.genre,
        };
      } catch (error) {
        console.error("Error removing genre:", error);
        throw new Error("Failed to remove genre");
      }
    },



    addMood: async (parent, { mood }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { mood },
        { new: true }
      );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      return updatedArtist;
    },





 addCategory: async (parent, { category }, context) => {
  // Check if the artist is logged in
  if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to update your profile.');
  }

  // Validate category input to ensure it is one of the allowed options
  const validCategories = ['gospel', 'secular', 'mixed'];
  if (!validCategories.includes(category.toLowerCase())) {
    throw new Error('Invalid category. Please choose between "gospel", "secular", or "mixed".');
  }

  // Attempt to update the artist's profile with the chosen category
  try {
    const updatedArtist = await Artist.findOneAndUpdate(
      { _id: context.artist._id },
      { category },
      { new: true }  // Ensures the returned object is the updated one
    );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 

    // If no artist is found or update fails
    if (!updatedArtist) {
      throw new Error('Artist not found or update failed.');
    }

    // Return the updated artist
    return updatedArtist;
  } catch (error) {
    // If there's an error with the database operation
    throw new Error('Something went wrong while updating the category: ' + error.message);
  }
},



addProfileImage: async (parent , {profileImage}, context) =>{
  try{
if (!context.artist) {
    throw new Error('Unauthorized: You must be logged in to update your profile.');
  }

 


const updatedArtist = await Artist.findOneAndUpdate(
  {_id: context.artist._id},
  { profileImage},
  { new: true } 
  );

// keep Redis in sync
    await artistUpdateRedis(updatedArtist); 
    // If no artist is found or update fails
    if (!updatedArtist) {
      throw new Error('Artist not found or update failed.');
    }

    // Return the updated artist
    return updatedArtist;

  }catch(error)
  {
    throw new Error('Something went wrong while updating the profile image: ' + error.message);

  }
},

// CREATE SONG
// -------------





// updateSong: async (
//   parent,
//   {
//     songId,
//     title,
//     featuringArtist,
//     album,
//     trackNumber,
//     genre,
//     mood,
//     subMoods,          // array (we’ll pick the first as primary unless you upgraded upsertSongMeta to index multiple)
//     producer,
//     composer,
//     label,
//     releaseDate,
//     lyrics,
//     artwork
//   },
//   context
// ) => {
//   try {
//     if (!context.artist) {
//       throw new Error('Unauthorized: You must be logged in to update a song.');
//     }

//     const updatedSong = await Song.findByIdAndUpdate(
//       songId,
//       {
//         title,
//         featuringArtist,
//         album,
//         trackNumber,
//         genre,
//         mood,
//         subMoods,
//         producer,
//         composer,
//         label,
//         releaseDate,
//         lyrics,
//         artwork,
//       },
//       { new: true }
//     );

//     console.log('✅ Updated song document:', updatedSong);


//     // ---------- we need to find this song in redis and update it ----------
// //  we use updateSongRedis here




//     return updatedSong;
//   } catch (error) {
//     console.error('Error updating song:', error);
//     throw new Error('Failed to update song.');
//   }
// },

updateSong: async (
      _parent,
      args, // includes songId and optional fields
      context
    ) => {
      try {
        if (!context.artist) {
          throw new Error('Unauthorized: You must be logged in to update a song.');
        }

        const {
          songId,
          title,
          featuringArtist,
          album,
          trackNumber,
          genre,
          mood,
          subMoods,
          producer,
          composer,
          label,
          releaseDate,
          lyrics,
          artwork,
        } = args;

        // 1) Update MongoDB (source of truth)
        const updatedSong = await Song.findByIdAndUpdate(
          songId,
          {
            ...(isDefined(title) && { title }),
            ...(isDefined(featuringArtist) && { featuringArtist }),
            ...(isDefined(album) && { album }),
            ...(isDefined(trackNumber) && { trackNumber }),
            ...(isDefined(genre) && { genre }),
            ...(isDefined(mood) && { mood }),
            ...(isDefined(subMoods) && { subMoods }),
            ...(isDefined(producer) && { producer }),
            ...(isDefined(composer) && { composer }),
            ...(isDefined(label) && { label }),
            ...(isDefined(releaseDate) && { releaseDate }),
            ...(isDefined(lyrics) && { lyrics }),
            ...(isDefined(artwork) && { artwork }),
            updatedAt: new Date(),
          },
          { new: true }
        );

        if (!updatedSong) {
          throw new Error('Song not found.');
        }

        console.log('✅ Updated song document:', updatedSong._id);

        // 2) Sync Redis (best-effort)
        try {
          const patch = buildRedisPatch({
            title,
            featuringArtist,
            album,
            trackNumber,
            genre,
            mood,
            subMoods,
            producer,
            composer,
            label,
            releaseDate,
            lyrics,
            artwork,
          });

          // try to update; if missing in Redis, mirror fresh doc
          await updateSongRedis(String(updatedSong._id), patch).catch(async (err) => {
            if (/song not found/i.test(err.message)) {
              // Not in cache yet → put a trimmed doc
              await createSongRedis(shapeForRedis(updatedSong));
            } else {
              throw err;
            }
          });
        } catch (redisErr) {
          console.warn('[Redis] updateSongRedis failed (non-blocking):', redisErr.message);
        }

        return updatedSong;
      } catch (error) {
        console.error('Error updating song:', error);
        throw new Error('Failed to update song.');
      }
    },
  



songUpload: async (parent, { file, tempo, beats, timeSignature }, context) => {
  // Initialize with proper directory setup
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const uploadsDir = path.join(__dirname, "uploads");
  
  // console.log('🚀 Starting songUpload resolver');
  // console.time('⏱️ Total upload time');
  
  if (!context.artist) {
    throw new Error("Unauthorized: You must be logged in to create a song.");
  }

  const loggedInArtistId = context.artist._id;
  let tempFilePath, processedFilePath;
  let songData;

  // Enhanced cleanup function
  const cleanupFiles = async () => {
    // console.log('🧹 Starting cleanup procedure');
    
    const cleanupTasks = [];
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      cleanupTasks.push(
        fs.promises.unlink(tempFilePath)
          .then(() => console.log(`✅ Deleted temp file: ${tempFilePath}`))
          .catch(err => console.error(`❌ Error deleting temp file: ${err.message}`))
      );
    }
    if (processedFilePath && fs.existsSync(processedFilePath)) {
      cleanupTasks.push(
        fs.promises.unlink(processedFilePath)
          .then(() => console.log(`✅ Deleted processed file: ${processedFilePath}`))
          .catch(err => console.error(`❌ Error deleting processed file: ${err.message}`))
      );
    }
    
    await Promise.allSettled(cleanupTasks);
  };

  const updateProgress = async (step, status, message, percent, isComplete = false) => {
    try {
      await pubsub.publish(SONG_UPLOAD_UPDATE, {
        songUploadProgress: {
          artistId: loggedInArtistId.toString(),
          step,
          status,
          message,
          percent,
          isComplete,
          timestamp: Date.now()
        }
      });
      // console.log(`📢 Progress sent: ${step} (${percent}%) - ${status}`);
    } catch (pubError) {
      console.error('❌ Failed to publish progress:', pubError.message);
      // Don't throw - continue upload even if progress fails
    }
  };

  try {
    // ===== INITIALIZATION =====
    await updateProgress('INITIATED', 'IN_PROGRESS', 'Starting upload process...', 5);

    // ===== FILE UPLOAD HANDLING =====
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if file is properly provided
    if (!file) {
      throw new Error("No file provided for upload.");
    }

    const { createReadStream, filename, mimetype } = await file;
    if (!createReadStream || !filename) {
      throw new Error("Invalid file input.");
    }

    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mp3'];
    if (mimetype && !allowedMimeTypes.includes(mimetype)) {
      throw new Error("Invalid file type. Please upload an audio file (MP3 or WAV).");
    }

    const sanitizedFilename = filename.replace(/[^\w.-]/g, '_');
    tempFilePath = path.join(uploadsDir, `${Date.now()}_${sanitizedFilename}`);

    // Save uploaded file
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempFilePath);
      const readStream = createReadStream();
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      readStream.pipe(writeStream);
    });

    // Verify file
    const stats = fs.statSync(tempFilePath);
    if (stats.size === 0) throw new Error("Uploaded file is empty");

    // ===== DUPLICATE CHECK =====
    await updateProgress('CHECKING_DUPLICATES', 'IN_PROGRESS', 'Checking for duplicate songs...', 25);

    // Ensure these functions are properly imported/defined
    const fingerprint = await FingerprintGenerator(fs.createReadStream(tempFilePath));
    const matchingResults = await FingerprintMatcher.findMatches(fingerprint, loggedInArtistId, { minMatches: 5 });

    if (matchingResults.finalDecision) {
      const { status } = matchingResults.finalDecision;
      const publishStatus = status === 'artist_duplicate' ? 'DUPLICATE' : 
                          status === 'copyright_issue' ? 'COPYRIGHT_ISSUE' : 
                          status.toUpperCase();

      await updateProgress('CHECKING_DUPLICATES', publishStatus, matchingResults.finalDecision.message, 30);
      await updateProgress('COMPLETED', publishStatus, matchingResults.finalDecision.message, 100, true);
      
      await cleanupFiles();
      return {
        status: publishStatus,
        ...matchingResults.finalDecision,
        _id: "BLOCKED",
        title: matchingResults.finalDecision.title || 'Untitled',
      };
    }

    // ===== AUDIO PROCESSING =====
    await updateProgress('PROCESSING', 'IN_PROGRESS', 'Analyzing audio features...', 40);

    // Ensure these functions are properly imported/defined
    const [resultFromTempoDetect, duration, features] = await Promise.all([
      tempoDetect(tempFilePath),
      extractDuration(tempFilePath),
      extractFeatures(tempFilePath)
    ]);

    // Process chroma features with proper normalization
    const allChroma = features.map(feature => {
      if (!feature.chroma) return Array(12).fill(0);
      const chroma = feature.chroma.map(Number);
      const norm = Math.sqrt(chroma.reduce((sum, x) => sum + x * x, 0));
      return norm > 0 ? chroma.map(x => x / norm) : chroma;
    });

    // Process MFCC features with proper normalization
    const allMfcc = features.map(feature => {
      if (!feature.mfcc) return Array(13).fill(0);
      const mfcc = feature.mfcc.map(Number);
      const norm = Math.sqrt(mfcc.reduce((sum, x) => sum + x * x, 0));
      return norm > 0 ? mfcc.map(x => x / norm) : mfcc;
    });

    // Generate structure hash (ensure this function exists)
    const hash = generateStructureHash({ allMfcc, allChroma, tempo, beats });
    
    // Detect musical key (ensure this function exists)
    const { key, mode } = await detectKey(allChroma);
    
    // Generate harmonic fingerprint (ensure this function exists)
    const harmonicFingerprint = await generateHarmonicFingerprint(allChroma, beats);
    const maxHarmonic = Math.max(...harmonicFingerprint);
    const normalizedHarmonic = maxHarmonic > 0 ? 
      harmonicFingerprint.map(v => v / maxHarmonic) : 
      harmonicFingerprint;

    // Get chroma peaks (top 2 peaks per frame)
    const chromaPeaks = allChroma.map(chroma => {
      return chroma
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 2)
        .map(entry => entry.idx);
    });

    // ===== FILE PROCESSING =====
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Preparing final files...', 70);

    processedFilePath = path.join(uploadsDir, `${fingerprint[0].hash}_${path.basename(filename)}`);
    await processAudio(tempFilePath, processedFilePath);

    // ===== S3 UPLOAD =====
    await updateProgress('UPLOADING', 'IN_PROGRESS', 'Uploading to cloud storage...', 80);

    const fileKey = `for-streaming/${fingerprint[0].hash}_${path.basename(filename)}`;
    const originalSongKey = `original_songs/${fingerprint[0].hash}_${path.basename(filename)}`;

    // Ensure S3 client is properly configured
    await Promise.all([
      s3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME_STREAMING,
        Key: fileKey,
        Body: fs.createReadStream(processedFilePath),
        ContentType: "audio/mpeg"
      })),
      
      s3.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME_ORIGINAL_SONGS,
        Key: originalSongKey,
        Body: fs.createReadStream(tempFilePath),
        ContentType: "audio/mpeg"
      }))
    ]);

    // ===== DATABASE RECORDS =====
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Creating database record...', 90);

    // Find or create album
    let album = await Album.findOne({ artist: loggedInArtistId });
    if (!album) {
      album = await Album.create({
        title: "Uncategorized",
        artist: loggedInArtistId,
        releaseDate: new Date()
      });
    }

    songData = await Song.create({
      title: path.basename(filename, path.extname(filename)),
      album: album._id,
      artist: loggedInArtistId,
      audioFileUrl: `https://${process.env.BUCKET_NAME_ORIGINAL_SONGS}.s3.amazonaws.com/${originalSongKey}`,
      streamAudioFileUrl: `https://${process.env.BUCKET_NAME_STREAMING}.s3.amazonaws.com/${fileKey}`,
      timeSignature: timeSignature || "4/4",
      key,
      mode,
      duration,
      tempo: resultFromTempoDetect || tempo,
      beats: beats || [],
      releaseDate: new Date()
    });



    try {
      // added





      await checkRedisHealth();
  await createSongRedis({
    ...songData.toObject(),
    _id: songData._id
  });
  console.log('Cached in Redis successfully');
} catch (redisError) {
  console.warn('Redis caching failed (continuing anyway):', redisError);
}


// try {
//   // Check if artist or album are missing required populated fields
//   if (
//     !songData.artist?.country || typeof songData.artist === 'string' ||
//     !songData.album?.title || typeof songData.album === 'string'
//   ) {
//     songData = await Song.findById(songData._id)
//       .populate('artist', 'country artistAka genre profileImage')
//       .populate('album', 'title albumCoverImage releaseDate')
//       .lean();
//   }

//   // Cache enriched song data in Redis
//   await createSongRedis({
//     ...songData,
//     _id: songData._id  // just to be sure _id is included
//   });

//   console.log('Cached in Redis successfully');
// } catch (redisError) {
//   console.warn('Redis caching failed (continuing anyway):', redisError);
// }







  
    await Fingerprint.create({
      song: songData._id,
      audioHash: fingerprint,
      structureHash: hash,
      chromaPeaks,
      harmonicFingerprint: normalizedHarmonic,
      beats: beats || []
    });

    // Final steps with proper sequencing
    await updateProgress('FINALIZING', 'IN_PROGRESS', 'Finalizing upload...', 95);
    await new Promise(resolve => setTimeout(resolve, 200)); // Ensure progress update is processed
    await cleanupFiles();
    await updateProgress('COMPLETED', 'SUCCESS', 'Upload completed successfully!', 100, true);

    console.timeEnd('⏱️ Total upload time');
    return {
      status: 'SUCCESS',
      _id: songData._id,
      title: songData.title
    };

  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    // Cleanup in case of error
    try {
      if (songData?._id) await Song.deleteOne({ _id: songData._id });
      await cleanupFiles();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    await updateProgress('FAILED', 'FAILED', error.message, 100, true);
    
    return {
      status: 'FAILED',
      _id: songData?._id || `FAILED-${Date.now()}`,
      title: songData?.title || 'Untitled',
      message: error.message
    };
  }
},



// ====================
addLyrics:  async (_parent, { songId, lyrics }, context) => {
      try {
        if (!context.artist) throw new Error('Unauthorized: You are not logged in.');

        const updatedSong = await Song.findByIdAndUpdate(
          songId,
          { $set: { lyrics }, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true }
        );
        if (!updatedSong) throw new Error('Song not found.');

        // Redis: only lyrics changed

        try {

         await ensureSongCached(String(songId));
await updateSongRedis(String(songId), { lyrics }); 
        } catch (e) {

         console.warn('[Redis] addArtwork update failed:', e.message);
        }

        return updatedSong;
      } catch (error) {
        console.error('Error updating song (lyrics):', error);
        throw new Error('Failed to add lyrics.');
      }
    },

    addArtwork: async (_parent, { songId, artwork }, context) => {
      try {
        if (!context.artist) throw new Error('Unauthorized: You are not logged in.');

        const updatedSong = await Song.findByIdAndUpdate(
          songId,
          { $set: { artwork }, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true }
        );
        if (!updatedSong) throw new Error('Song not found.');

        // Redis: only artwork changed
        try {
        await ensureSongCached(String(songId));
   
await updateSongRedis(String(songId), { artwork });


        } catch (e) {
          console.warn('[Redis] addArtwork update failed:', e.message);
        }

        return updatedSong;
      } catch (error) {
        console.error('Error updating song (artwork):', error);
        throw new Error('Failed to add artwork.');
      }
    },





toggleVisibility: async (_, { songId, visibility }, context) => {
  try {
    // 1. Ensure the artist is authenticated
    if (!context.artist) {
      throw new Error("Unauthorized: You are not logged in.");
    }

    // 2. Validate visibility value
    if (!["public", "private"].includes(visibility)) {
      throw new Error("Invalid visibility value. Must be 'public' or 'private'.");
    }

    // 3. Update the song visibility
    const updatedSong = await Song.findOneAndUpdate(
      { _id: songId, artist: context.artist._id }, // Optional: ensure artist owns the song
      { visibility },
      { new: true }
    );

    // 4. Check if song was found and updated
    if (!updatedSong) {
      throw new Error("Song not found or you are not authorized to update it.");
    }

    return updatedSong;

  } catch (error) {
    console.error("Failed to toggle the visibility:", error);
    throw new Error("Failed to toggle the visibility.");
  }
},


deleteSong: async (_parent, { songId }, context) => {
  if (!context.artist) throw new Error("Unauthorized");

  // 1) Read first so we have URLs/album
  const song = await Song.findOne({ _id: songId, artist: context.artist._id }).lean();
  if (!song) throw new Error("Song not found");

  // 2) Mongo delete (SoT)
  await Song.deleteOne({ _id: songId });

  // 3) S3 deletes (best-effort)
  const originalKey  = keyFromUrl(song.audioFileUrl, 'original_songs/');  // expects prefix
  const streamingKey = keyFromUrl(song.streamAudioFileUrl, 'for-streaming/'); // expects prefix
    const albumId      = song.album || null;

  const artworkUrl = typeof song.artwork === 'string' ? song.artwork : song?.artwork?.url;
  const artworkKey = keyFromUrl(artworkUrl); // no prefix for cover images

  const toDelete = [
    originalKey  && { Bucket: process.env.BUCKET_NAME_ORIGINAL_SONGS,   Key: originalKey  },
    streamingKey && { Bucket: process.env.BUCKET_NAME_STREAMING,        Key: streamingKey },
    artworkKey   && { Bucket: process.env.BUCKET_NAME_COVER_IMAGE_SONG, Key: artworkKey   },
  ].filter(Boolean);

  for (const params of toDelete) {
    try { await s3.send(new DeleteObjectCommand(params)); }
    catch (e) { console.warn('[S3] Delete failed:', params.Bucket, params.Key, e?.message || e); }
  }

  // 4) Best-effort Redis cleanup
  try {
    await deleteSongRedis(String(songId));
  } catch (e) {
    console.warn("[Redis] deleteSong cache cleanup failed:", e.message);
  }


  if (albumId) {
    const remaining = await Song.countDocuments({ album: albumId });
    if (remaining === 0) {
      const albumDoc = await Album.findById(albumId).lean();
      const albumCoverUrl = typeof albumDoc?.coverImage === "string"
        ? albumDoc.coverImage
        : albumDoc?.coverImage?.url || null;
      const albumKey = keyFromUrl(albumCoverUrl);

      // delete album doc
      await Album.deleteOne({ _id: albumId });

      // delete album cover in S3 (best-effort)
      if (albumKey) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET_ALBUM_COVER_IMAGE,
            Key: albumKey
          }));
        } catch (e) {
          console.warn("[S3] Album cover delete failed:", e?.message || e);
        }
      }
    }
  }

  return song;
},




// ========================


createAlbum: async (parent, { title }, context) => {
  try {
    if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }

    const artistId = context.artist._id;

    // Check if the artist already has an album
    const existingAlbum = await Album.findOne({ artist: artistId });

    if (!existingAlbum) {
      // Create default album if none exist
      const defaultAlbum = await Album.create({
        title: "Unknown",
        artist: artistId, 
      });
      await albumCreateRedis(defaultAlbum);

      return defaultAlbum(defaultAlbum);
    }

    return existingAlbum; 
  } catch (error) {
    console.error("Failed to create a default album:", error);
    throw new Error("Failed to create an album.");
  }
},


createCustomAlbum: async (parent, { title, releaseDate, albumCoverImage }, context) => {
  try {
    // Ensure the artist is authenticated
    if (!context.artist) {
      throw new Error('Unauthorized: You are not logged in.');
    }

    const artistId = context.artist._id;

    // Validate title
    if (!title) {
      throw new Error("Album title is required.");
    }

    // Check if the album with the same title already exists for the artist
    const existingAlbum = await Album.findOne({ title, artist: artistId });
    if (existingAlbum) {
      throw new Error("An album with this title already exists.");
    }

    // Create new album
    const customAlbum = await Album.create({
      title,
      artist: artistId,
      releaseDate: releaseDate || new Date().toISOString(), // Set current date if no release date is provided
      albumCoverImage: albumCoverImage || "", // Handle default if no cover image is provided
      createdAt: new Date().toISOString(), // Automatically set created date
    });

  await albumCreateRedis(customAlbum);
    // Return the created album
    return customAlbum;

  } catch (error) {
    console.error("Failed to create a custom album:", error);
    throw new Error(error.message || "Failed to create custom album.");
  }
},


 

updateAlbum: async (parent, { albumId, songId, albumCoverImage }, context) => {
  try {
    if (!context.artist) {
      throw new Error("Unauthorized: You are not logged in.");
    }

    const artistId = context.artist._id;

    // Prepare update object dynamically
    let updateFields = {};
    if (songId) updateFields.$addToSet = { songs: songId }; 
    if (albumCoverImage) updateFields.albumCoverImage = albumCoverImage; 

    // Ensure there is something to update
    if (Object.keys(updateFields).length === 0) {
      throw new Error("No update fields provided.");
    }

    // Find and update the album
    const updatedAlbum = await Album.findOneAndUpdate(
      { _id: albumId, artist: artistId }, 
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedAlbum) {
      throw new Error("Album not found or unauthorized.");
    }

await albumUpdateRedis(updatedAlbum);
    return updatedAlbum;
  } catch (error) {
    console.error("Failed to update album:", error);
    throw new Error("Update failed.");
  }
},



nextSongAfterComplete: async (_p, { input }) => {
      // your existing recommender
      const { recommendNextAfterFull } = await import('../../../utils/AdEngine/reco/nextSong.js');
      const songId = await recommendNextAfterFull(input);
      return { ok: true, songId };
    },
  // ----------------------------------------------------------------------



 handlePlayCount: async (_parent, { songId }, context) => {
      // Load song first (we need artist id and to fail fast if missing)
      const song = await Song.findById(songId).lean();
      if (!song) throw new Error('Song not found');

      // Don’t count the artist’s own plays
      if (context.artist && String(song.artist) === String(context.artist._id)) {
        await Song.findByIdAndUpdate(songId, { $set: { lastPlayedAt: new Date() } });
        // Optional: also reflect in Redis doc
        try { await updateSongRedis(String(songId), { lastPlayedAt: new Date() }); } catch {}
        return await Song.findById(songId).lean();
      }

      const viewerId = getViewerId(context);
      const r = await getRedis();

      const cooldownKey = `cooldown:song:${songId}:viewer:${viewerId}`;
      const onCooldown = await r.exists(cooldownKey);

      if (onCooldown) {
        // No increment; just keep lastPlayedAt fresh
        const fresh = await Song.findByIdAndUpdate(
          songId,
          { $set: { lastPlayedAt: new Date() } },
          { new: true, runValidators: true }
        );
        try { await updateSongRedis(String(songId), { lastPlayedAt: new Date() }); } catch {}
        return fresh;
      }

      // Count this as a play (Mongo = source of truth)
      const updatedSong = await Song.findByIdAndUpdate(
        songId,
        { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
        { new: true, runValidators: true }
      );
      if (!updatedSong) throw new Error('Song not found');

      // Mirror to Redis (best-effort)
      try {
        let next = await incrementPlayCount(String(songId));
        if (!next) {
          const cached = await ensureSongCached(String(songId));
          if (cached) next = await incrementPlayCount(String(songId));
        }
        await updateSongRedis(String(songId), { lastPlayedAt: new Date() });
      } catch (e) {
        console.warn('[Redis] playCount sync skipped:', e.message);
      }

      // Start cooldown window
      try {
        // NX to avoid overwriting a running TTL
        await r.set(cooldownKey, '1', { EX: PLAY_COOLDOWN_SECONDS, NX: true });
      } catch {}

      return updatedSong;
    },






    // Update user (username or password)
    updateUser: async (parent, { userId, username, password }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId }, // Find user by ID
          { ...(username && { username }), ...(password && { password }) }, // Update only the fields provided
          { new: true } // Return the updated user
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        return updatedUser;
      } catch (error) {
        console.error("Failed to update username or password:", error);
        throw new Error("Failed to update user.");
      }
    },

    // Delete user
    deleteUser: async (parent, { userId }) => {
      try {
        const deletedUser = await User.findOneAndDelete({ _id: userId });
        if (!deletedUser) {
          throw new Error("User not found");
        }
        return "User deleted successfully";
      } catch (error) {
        console.error("Failed to delete user:", error);
        throw new Error("Failed to delete user.");
      }
    },





  },




Subscription: {
  songUploadProgress: {
    subscribe: withFilter(
      () => {
        console.log('🎯 Subscription created for:', SONG_UPLOAD_UPDATE);
        return pubsub.asyncIterableIterator([SONG_UPLOAD_UPDATE]);
      },
      (payload, variables, context) => {
        // Debug logging
        const payloadArtistId = payload.songUploadProgress?.artistId;
        const contextArtistId = context.artist?._id?.toString();
        
        console.log('🔍 Filter check:', {
          payloadArtistId,
          contextArtistId,
          matches: payloadArtistId === contextArtistId
        });

        if (!context.artist) {
          console.error('❌ No artist in context - rejecting subscription');
          return false;
        }

        if (!payload.songUploadProgress?.artistId) {
          console.error('❌ No artistId in payload - rejecting');
          return false;
        }

        // Only send to the specific artist
        const shouldDeliver = payload.songUploadProgress.artistId === context.artist._id.toString();
        
        if (shouldDeliver) {
          /*
          console.log('✅ Delivering progress to artist:', contextArtistId);
          */
        } else {
          console.log('🚫 Blocking progress for different artist');
        }
        
        return shouldDeliver;
      }
    )
  }
},


  Song: {
    likesCount: (parent) => {
      return parent.likedByUsers?.length || 0;
    },
  },





  };


export default resolvers;
