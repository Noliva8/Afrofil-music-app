
import fs from 'fs'
import { pipeline } from 'stream';
import { ApolloError } from 'apollo-server-express';
import util from 'util';
import  { Artist, Album, Song, User, Fingerprint, RadioStation , Message} from '../../models/Artist/index_artist.js';
import BookArtist from '../../models/Artist/bookArtist.js';
import { getMessages } from './MessagingSystem/Queries/getmessages.js';
import { getConversations } from './MessagingSystem/Queries/conversation.js';
import { getUnreadCount } from './MessagingSystem/Queries/unreadCount.js';


import { PlayCount } from '../../models/User/user_index.js';
import dotenv from 'dotenv';
import { AuthenticationError } from '../../utils/artist_auth.js';
import {signArtistToken} from '../../utils/AuthSystem/tokenUtils.js'
import { USER_TYPES } from '../../utils/AuthSystem/constant/systemRoles.js';

import sendEmail from '../../utils/emailTransportation.js';
// import awsS3Utils from '../../utils/awsS3.js';
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
import { CreatePresignedUrl, CreatePresignedUrlDelete } from '../../utils/awsS3.js';


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
import { createSongRedis, getSongRedis, updateSongRedis, incrementPlayCount, deleteSongRedis, redisTrending, searchSongsRedis } from './Redis/songCreateRedis.js';
import { checkRedisHealth } from '../../utils/AdEngine/redis/redisClient.js';
import { ensureSongCached } from '../../utils/doesSongExistInCache.js';
import { artistCreateRedis, artistUpdateRedis, deleteArtistRedis,getArtistRedis, getArtistsByCountryRedis, getTopArtistsRedis, searchArtistsRedis,} from './Redis/artistCreateRedis.js';

import { albumCreateRedis, albumUpdateRedis, deleteAlbumRedis, getLatestAlbumsRedis,getAlbumsByReleaseDateRedis, getAlbumsBySongCountRedis, searchAlbumsRedis,getMultipleAlbumsRedis, addSongToAlbumRedis,getAlbumRedis, removeSongFromAlbumRedis } from './Redis/albumCreateRedis.js';

import { getRedis } from '../../utils/AdEngine/redis/redisClient.js';
import { processedTrendingSongs } from './trendingSongs/trendings.js';

import { trendingSongsV2 } from './trendingSongs/trendingV2.js';

import { newUploads } from './newUploads/newUploads.js';
import { suggestedSongs as fetchSuggestedSongs } from './suggestedSongs/suggestedSongs.js';
import { songOfMonth } from './songOfMonth/songOfMonth.js';
// import { similarSongs } from './similarSongs/similarSongs.js';

import { similarSongs } from './similarSongs/similasongResolver.js'
import { songsLikedByMe } from '../User_schema/OtherResorvers/songsLikedByMe.js';
import { addSongRedis } from './Redis/addSongRedis.js';
import { songKey } from './Redis/keys.js';
import { songHashExpiration } from './Redis/redisExpiration.js';
import { addSongToTrendingOnUpload } from './Redis/redisTrendingOnUpload.js';
import { INITIAL_RECENCY_SCORE } from './Redis/keys.js';
import { TRENDING_WEIGHTS } from './Redis/keys.js';
import { trendIndexZSet } from './Redis/keys.js';
import { PLAY_COOLDOWN_SECONDS } from './Redis/keys.js';
import { generateSimilarSongs} from './similarSongs/similasongResolver.js';
import { savePlaybackSession } from './playbackRestore/savePlaybackSession.js';

import { playbackSession } from './playbackRestore/getPlaybackSession.js';
import { handleFollowers } from './followers/handleFollowers.js';

import { handleArtistDownloadCounts } from './downloads/handleArtistDownloadCounts.js';
import { getArtistSongs } from './getArtistSongs/getArtistSongs.js';
import{getAlbum, otherAlbumsByArtist} from '../Artist_schema/songsOfAlbum.js'
import { CLOUDFRONT_EXPIRATION } from './Redis/keys.js';
import { getPresignedUrlDownload, getPresignedUrlDownloadAudio } from '../../utils/cloudFrontUrl.js';
import { getFallbackArtworkUrl } from './similarSongs/similasongResolver.js';
import { RADIO_TYPES } from '../../utils/radioTypes.js';
import { createBookArtist } from './bookingArtist/createBookArtist.js';
import { respondToBooking } from './bookingArtist/respondToBooking.js';
import { sendMessage } from './MessagingSystem/Mutations/sendMessage.js';
import jwt from 'jsonwebtoken';


const pipe = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeBookingForResponse = (booking) => {
  if (!booking) return booking;
  const copy = booking.toObject ? booking.toObject() : { ...booking };
  if (copy.status) copy.status = copy.status.toUpperCase();
  if (copy.eventType) copy.eventType = copy.eventType.toUpperCase();
  if (copy.budgetRange) {
    const budgetMap = {
      "500-1000": "RANGE_500_1000",
      "1000-3000": "RANGE_1000_3000",
      "3000-5000": "RANGE_3000_5000",
      "5000+": "RANGE_5000_PLUS",
      flexible: "FLEXIBLE",
    };
    copy.budgetRange = budgetMap[copy.budgetRange] || copy.budgetRange;
  }
  if (copy.setLength) {
    const lengthMap = {
      30: "MIN_30",
      60: "MIN_60",
      90: "MIN_90",
    };
    copy.setLength = lengthMap[copy.setLength] || copy.setLength;
  }
  if (copy.performanceType) {
    const perfMap = {
      DJ: "DJ",
      Live: "LIVE",
      Acoustic: "ACOUSTIC",
      "Backing-track": "BACKING_TRACK",
    };
    copy.performanceType = perfMap[copy.performanceType] || copy.performanceType;
  }
  return copy;
};

/** Safely derive an S3 object key from a URL or key string. */
const s3KeyFromUrl = (urlOrKey) => {
  if (!urlOrKey) return null;
  if (typeof urlOrKey === 'string' && !urlOrKey.includes('://')) {
    return urlOrKey.startsWith('/') ? urlOrKey.slice(1) : urlOrKey;
  }
  try {
    const u = new URL(urlOrKey);
    const path = decodeURIComponent(u.pathname || '');
    return path.startsWith('/') ? path.slice(1) : path;
  } catch {
    return null;
  }
};

/** Build streaming key from stream/original URLs. */
const buildStreamingKey = (streamAudioFileUrl, audioFileUrl) => {
  let key = s3KeyFromUrl(streamAudioFileUrl);
  if (!key) {
    const raw = s3KeyFromUrl(audioFileUrl);
    if (raw) {
      const filename = raw.split('/').pop();
      key = filename ? `for-streaming/${filename}` : null;
    }
  }
  return key || null;
};

const normalizeRadioType = (value) => {
  if (!value) return null;
  return RADIO_TYPES[value] || value;
};

const normalizeSeedType = (value) => {
  if (!value) return null;
  return String(value).toLowerCase();
};

const parseEraRange = (seedId) => {
  if (!seedId) return null;
  const match = String(seedId).match(/(\\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  if (!Number.isFinite(year)) return null;
  const startYear = year - (year % 10);
  const start = new Date(Date.UTC(startYear, 0, 1));
  const end = new Date(Date.UTC(startYear + 9, 11, 31, 23, 59, 59, 999));
  return { start, end };
};

const normalizeComposerList = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const mapSongListPayload = (songs) =>
  (songs || []).map((song) => ({
    ...song,
    artistFollowers: Array.isArray(song.artist?.followers) ? song.artist.followers.length : 0,
    mood: song.mood || [],
    subMoods: song.subMoods || [],
    composer: normalizeComposerList(song.composer),
    producer: Array.isArray(song.producer) ? song.producer : [],
    likesCount: song.likedByUsers?.length || song.likesCount || 0,
    downloadCount: song.downloadCount || 0,
    playCount: song.playCount || 0,
    shareCount: song.shareCount || 0,
    artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
  }));

const mapRadioTypeToEnum = (value) => {
  if (!value) return null;
  const match = Object.entries(RADIO_TYPES).find(([, typeValue]) => typeValue === value);
  return match ? match[0] : value;
};

const mapSeedTypeToEnum = (value) => {
  if (!value) return null;
  return String(value).toUpperCase();
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildCaseInsensitiveMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

const buildStationSongQuery = (station) => {
  const or = [];
  for (const seed of station?.seeds || []) {
    const seedType = normalizeSeedType(seed?.seedType);
    const seedId = seed?.seedId;
    if (!seedType || !seedId) continue;
    if (seedType === "artist") {
      or.push({ artist: seedId });
      continue;
    }
    if (seedType === "genre") {
      or.push({ genre: seedId });
      continue;
    }
    if (seedType === "mood") {
      or.push({ mood: seedId });
      continue;
    }
    if (seedType === "track") {
      or.push({ _id: seedId });
      continue;
    }
    if (seedType === "era") {
      const range = parseEraRange(seedId);
      if (range) {
        or.push({ releaseDate: { $gte: range.start, $lte: range.end } });
      }
    }
  }

  const query = { visibility: { $ne: "private" } };
  if (or.length) query.$or = or;
  return query;
};
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
const NEW_MESSAGE = 'NEW_MESSAGE';
dotenv.config();

// Normalize any incoming audio path so the resolver can accept raw keys or full S3/CloudFront URLs.
const normalizeAudioKey = ({ bucket, key }) => {
  const stripLeadingSlash = (val = '') => String(val || '').replace(/^\/+/, '');
  let derivedBucket = bucket;
  let rawKey = stripLeadingSlash(key);

  // If the client passed a full URL, extract just the path portion.
  if (/^https?:\/\//i.test(rawKey)) {
    try {
      const urlObj = new URL(rawKey);
      rawKey = stripLeadingSlash(urlObj.pathname);
    } catch {
      /* leave rawKey as-is */
    }
  }

  // Infer bucket if it was omitted, based on the common prefixes we use.
  if (!derivedBucket) {
    if (rawKey.startsWith('for-streaming/')) derivedBucket = 'afrofeel-songs-streaming';
    else if (rawKey.startsWith('ads/')) derivedBucket = 'audio-ad-streaming';
    else if (rawKey.startsWith('artwork/')) derivedBucket = 'audio-ad-artwork';
    else if (rawKey.startsWith('original-songs/')) derivedBucket = 'afrofeel-original-songs';
  }

  // Ensure the key has the correct prefix expected by the bucket.
  const ensurePrefix = (prefix) => (rawKey.startsWith(prefix) ? rawKey : `${prefix}${rawKey}`);
  let pathToSign = rawKey;
  if (derivedBucket === 'afrofeel-songs-streaming') pathToSign = ensurePrefix('for-streaming/');
  else if (derivedBucket === 'audio-ad-streaming') pathToSign = ensurePrefix('ads/');
  else if (derivedBucket === 'audio-ad-streaming-fallback') pathToSign = ensurePrefix('ads/');
  else if (derivedBucket === 'audio-ad-original') pathToSign = ensurePrefix('ads/');
  else if (derivedBucket === 'audio-ad-artwork') pathToSign = ensurePrefix('artwork/');
  else if (derivedBucket === 'afrofeel-original-songs') pathToSign = ensurePrefix('original-songs/');

  return { derivedBucket, pathToSign };
};

// Generic normalizer for artwork/asset keys; accepts raw key or full URL.
const normalizeDownloadKey = ({ bucket, key }) => {
  const stripLeadingSlash = (val = '') => String(val || '').replace(/^\/+/, '');
  let derivedBucket = bucket;
  let rawKey = stripLeadingSlash(key);

  if (/^https?:\/\//i.test(rawKey)) {
    try {
      const urlObj = new URL(rawKey);
      rawKey = stripLeadingSlash(urlObj.pathname);
      // If bucket not provided, try to infer from host (simple heuristic)
      if (!derivedBucket && urlObj.hostname.includes('cloudfront')) {
        // leave bucket null; mapping layer handles path
        derivedBucket = bucket;
      }
    } catch {
      /* leave rawKey as-is */
    }
  }

  return { derivedBucket, pathToSign: rawKey };
};



// Redis update helpers
// -----------------



/** Helpers */
export const isDefined = (v) => v !== undefined;           
export const asId = (v) => (v && typeof v === 'object' && v._id ? String(v._id) : (v != null ? String(v) : v));
export const asIdArray = (arr) => Array.isArray(arr) ? arr.map(asId) : arr;


export const shapeForRedis = (songDoc) => ({
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




// -------------------------

const resolvers = {
  Artist: {
    followerCount: (artist) => {
      if (Array.isArray(artist.followers)) return artist.followers.length;
      return 0;
    },
    artistDownloadCounts: async (artist) => {
      try {
        const client = await getRedis();
        if (client) {
          const key = ARTIST_DOWNLOADS(artist._id);
          const redisVal = await client.get(key);
          if (redisVal != null) return Number(redisVal) || 0;
        }
      } catch {
        // fall back to DB value
      }
      return Number(artist.artistDownloadCounts || 0);
    },
  },
  RadioStation: {
    type: (station) => mapRadioTypeToEnum(station.type),
  },
  RadioSeed: {
    seedType: (seed) => mapSeedTypeToEnum(seed.seedType),
  },
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

// Added booking query for artist messaging
artistBookings: async (_parent, { status }, context) => {
  if (!context.artist) {
    throw new AuthenticationError("Unauthorized: You must be logged in to view bookings.");
  }
  const query = { artist: context.artist._id };
  if (status) {
    query.status = status.toLowerCase();
  }

  const bookings = await BookArtist.find(query)
    .sort({ createdAt: -1 })
    .populate("user", "username")
    .populate("song", "title");

  return bookings.map(normalizeBookingForResponse);
},

bookingMessages: getMessages,
messageConversations: getConversations,
unreadMessages: getUnreadCount,

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

getAlbum,
otherAlbumsByArtist,












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

publicSong: async (_parent, { songId }) => {
  try {
    const song = await Song.findById(songId)
      .populate({
        path: 'artist',
        select: 'artistAka bio country bookingAvailability',
      })
      .populate({ path: 'album', select: 'title releaseDate' })
      .lean();
    if (!song) throw new Error('Song not found.');
    return song;
  } catch (error) {
    console.error('Error fetching public song:', error);
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


  trendingSongsV2,
  processedTrendingSongs,
  newUploads,
  suggestedSongs: async (_parent, { limit }) => {
    return fetchSuggestedSongs({ limit });
  },
songOfMonth,
radioStations: async (_parent, { type, visibility = "public" }) => {
  const query = {};
  if (visibility) query.visibility = visibility;
  const normalizedType = normalizeRadioType(type);
  if (normalizedType) query.type = normalizedType;

  const stations = await RadioStation.find(query)
    .sort({ updatedAt: -1 })
    .populate({ path: "createdBy", select: "artistAka profileImage country" })
    .lean();

  const enriched = await Promise.all(
    stations.map(async (station) => {
      const song = await Song.findOne(buildStationSongQuery(station))
        .sort({ trendingScore: -1, createdAt: -1 })
        .select("artwork")
        .lean();

      if (!song) return null;

      if (station.coverImage) return station;
      return { ...station, coverImage: song?.artwork || "" };
    })
  );

  return enriched.filter(Boolean);
},
radioStation: async (_parent, { stationId }) => {
  const station = await RadioStation.findById(stationId)
    .populate({ path: "createdBy", select: "artistAka profileImage country" })
    .lean();
  if (!station) return null;
  if (station.coverImage) return station;
  const song = await Song.findOne(buildStationSongQuery(station))
    .sort({ trendingScore: -1, createdAt: -1 })
    .select("artwork")
    .lean();
  return { ...station, coverImage: song?.artwork || "" };
},
  radioStationSongs: async (_parent, { stationId }) => {
    const station = await RadioStation.findById(stationId).lean();
    if (!station) return [];
    const query = buildStationSongQuery(station);

  const songs = await Song.find(query)
    .sort({ trendingScore: -1, createdAt: -1 })
    .limit(30)
    .populate({
      path: "artist",
      select: "artistAka country bio followers artistDownloadCounts profileImage",
    })
    .populate({ path: "album", select: "title releaseDate albumCoverImage" })
    .lean();

  return mapSongListPayload(songs);
},
exploreSongs: async (_parent, { type, value }) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return [];

  const normalizedType = String(type || "").toLowerCase();
  const match = buildCaseInsensitiveMatch(trimmed);

  let artistIds = null;
  if (normalizedType === "country" || normalizedType === "region" || normalizedType === "artist") {
    const artistQuery = {};
    if (normalizedType === "country") artistQuery.country = match;
    if (normalizedType === "region") artistQuery.region = match;
    if (normalizedType === "artist") {
      artistQuery.$or = [{ artistAka: match }, { fullName: match }];
    }
    const artists = await Artist.find(artistQuery).select("_id").lean();
    artistIds = artists.map((artist) => artist._id);
    if (!artistIds.length) return [];
  }

  const query = { visibility: { $ne: "private" } };

  if (normalizedType === "genre") query.genre = match;
  if (normalizedType === "mood") query.mood = { $elemMatch: { $regex: match } };
  if (normalizedType === "submood" || normalizedType === "sub_mood" || normalizedType === "submoods") {
    query.subMoods = { $elemMatch: { $regex: match } };
  }
  if (artistIds) {
    query.artist = { $in: artistIds };
  }

  const songs = await Song.find(query)
    .sort({ trendingScore: -1, createdAt: -1 })
    .limit(50)
    .populate({
      path: "artist",
      select: "artistAka country bio followers artistDownloadCounts profileImage",
    })
    .populate({ path: "album", select: "title releaseDate albumCoverImage" })
    .lean();

  return mapSongListPayload(songs);
},
searchCatalog: async (_parent, { query, limit = 12 }) => {
  const q = String(query || "").trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  const stop = new Set(["by", "feat", "ft", "featuring", "the", "a", "an"]);
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !stop.has(t));

  const regexes = tokens.map(
    (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
  );

  const [songHits, artistHits, albumHits] = await Promise.all([
    searchSongsRedis(q, limit),
    searchArtistsRedis(q, limit),
    searchAlbumsRedis(q, limit),
  ]);

  const matchesTokens = (value) => {
    if (!tokens.length) return true;
    const haystack = String(value || "").toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  };

  let songs = [];
  const songIds = (songHits || [])
    .map((s) => String(s?._id ?? s?.songId ?? s?.id ?? ""))
    .filter(Boolean);

  if (songIds.length) {
    const dbSongs = await Song.find({ _id: { $in: songIds }, visibility: "public" })
      .populate({ path: "artist", select: "artistAka profileImage country artistDownloadCounts followers" })
      .populate({ path: "album", select: "title releaseDate albumCoverImage" })
      .lean();
    const songMap = new Map(dbSongs.map((s) => [String(s._id), s]));
    songs = songIds.map((id) => songMap.get(id)).filter(Boolean);
  }

  if (!songs.length) {
    const artistIdsByToken = await Promise.all(
      regexes.map(async (regex) => {
        const artists = await Artist.find({
          $or: [{ artistAka: regex }, { fullName: regex }],
        })
          .select("_id")
          .lean();
        return artists.map((artist) => artist._id);
      })
    );

    const andClauses = regexes.map((regex, idx) => {
      const artistIds = artistIdsByToken[idx] || [];
      return {
        $or: [
          { title: regex },
          { genre: regex },
          { mood: regex },
          { label: regex },
          { "producer.name": regex },
          { "composer.name": regex },
          { featuringArtist: regex },
          ...(artistIds.length ? [{ artist: { $in: artistIds } }] : []),
        ],
      };
    });

    songs = await Song.find({
      visibility: "public",
      ...(andClauses.length ? { $and: andClauses } : {}),
    })
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(limit)
      .populate({ path: "artist", select: "artistAka profileImage country artistDownloadCounts followers" })
      .populate({ path: "album", select: "title releaseDate albumCoverImage" })
      .lean();
  }

  let artists = [];
  const artistIds = (artistHits || [])
    .map((a) => String(a?._id ?? a?.artistId ?? a?.id ?? ""))
    .filter(Boolean);
  if (artistIds.length) {
    const dbArtists = await Artist.find({ _id: { $in: artistIds } })
      .select("artistAka fullName profileImage country region")
      .lean();
    const artistMap = new Map(dbArtists.map((a) => [String(a._id), a]));
    artists = artistIds.map((id) => artistMap.get(id)).filter(Boolean);
  }
  if (!artists.length) {
    const artistClauses = regexes.map((regex) => ({
      $or: [{ artistAka: regex }, { fullName: regex }, { country: regex }, { region: regex }],
    }));
    artists = await Artist.find({
      ...(artistClauses.length ? { $and: artistClauses } : {}),
    })
      .limit(limit)
      .select("artistAka fullName profileImage country region")
      .lean();
  }

  let albums = [];
  const albumIds = (albumHits || [])
    .map((a) => String(a?._id ?? a?.albumId ?? a?.id ?? ""))
    .filter(Boolean);
  if (albumIds.length) {
    const dbAlbums = await Album.find({ _id: { $in: albumIds } })
      .select("title albumCoverImage releaseDate artist")
      .populate({ path: "artist", select: "artistAka" })
      .lean();
    const albumMap = new Map(dbAlbums.map((a) => [String(a._id), a]));
    albums = albumIds.map((id) => albumMap.get(id)).filter(Boolean);
  }
  if (!albums.length) {
    const albumClauses = regexes.map((regex) => ({
      $or: [{ title: regex }],
    }));
    albums = await Album.find({
      ...(albumClauses.length ? { $and: albumClauses } : {}),
    })
      .sort({ releaseDate: -1 })
      .limit(limit)
      .select("title albumCoverImage releaseDate artist")
      .populate({ path: "artist", select: "artistAka" })
      .lean();
  }

  return { songs, artists, albums };
},


    similarSongs,
    // similarSongsResolver,
    songsLikedByMe,
     playbackSession,
     
 getArtistSongs,

},



  Mutation: {
createArtist: async (parent, { fullName, artistAka, email, password, country, region }) => {
  try {
    // Check if the artist already exists
    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      throw new Error("Artist with this email already exists");
    }

    // Create the new artist
    if (!country || !region) {
      throw new Error("Country and region are required.");
    }

    const newArtist = await Artist.create({
      fullName,
      artistAka,
      email,
      password,
      country,
      region,
      confirmed: false,
      selectedPlan: false,
      role: 'artist'
    });

    // Generate the token for email verification
    const artistToken = signArtistToken(newArtist, USER_TYPES.ARTIST);

    // Create the verification link
    const baseUrl = process.env.SERVER_URL || "http://localhost:3001";
    const verificationLink = `${baseUrl}/confirmation/${artistToken}`;

    // Send the response to the user immediately
    // The email sending happens asynchronously in the background
  setTimeout(async () => {
  try {
    // Send the verification email asynchronously
    await sendEmail(
      newArtist.email,
      "Welcome to FloLup - Verify Your Email",
      `
        <div style="font-family: 'Inter', system-ui; max-width: 600px; margin: 0 auto; padding: 20px; 
                    background: linear-gradient(180deg, rgba(8,8,9,0.9), rgba(15,15,20,0.9)); border-radius: 16px; 
                    border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 60px rgba(0,0,0,0.25);">
          <div style="text-align: left; margin-bottom: 24px;">
            <h1 style="color: #fdf3e9; margin-bottom: 4px; font-size: 2.1rem;">Welcome to <span style="font-weight: 800;">FloLup</span>! 🎵</h1>
            <p style="color: rgba(255,255,255,0.72); font-size: 16px;">Hi ${newArtist.fullName},</p>
          </div>
          
          <div style=" padding: 32px;
                    ">
            <p style="color: rgba(255,255,255,0.92); font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thanks for joining FloLup! Please verify your email address to keep building your creator profile and studio.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; background: linear-gradient(90deg, #E4C421, #B25035); color: #000; text-decoration: none; 
                        padding: 14px 30px; border-radius: 999px; font-size: 16px; font-weight: bold;
                        box-shadow: 0 12px 30px rgba(0,0,0,0.35); transition: transform 0.2s;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.5; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
              This link will expire in 24 hours. If you didn't create an account with FloLup, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.6); font-size: 12px;">
            <p>© 2024 FloLup. All rights reserved.</p>
          </div>
        </div>
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
    const errorMessage = error?.message || "Failed to create artist";
    console.error("Failed to create artist:", error);
    throw new Error(errorMessage);
  }
},


// resend verfication link
// --------------------
// resendVerificationEmail: async (parent, { email }) => {
//   try {
//     // Find the artist by email
//     const artist = await Artist.findOne({ email });
//     if (!artist) {
//       throw new Error("Artist not found");
//     }

//     // Check if the email is already verified
//     if (artist.confirmed) {
//       return { success: false, message: "Email is already verified" };
//     }

//     // Generate a new token using signArtistToken
//     const artistToken = signArtistToken(artist, USER_TYPES.ARTIST);

//     // Construct the verification link
//     const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${artistToken}`;

// //  console.log(process.env.FRONTEND_URL) ;
//   // console.log(verificationLink) ;

//     // Send the verification email
//     await sendEmail(artist.email, "Verify Your Email", `
//       <p>Hello, ${artist.fullName}!</p>
//       <p>Please click the link below to verify your email:</p>
//       <a href="${verificationLink}">Verify Email</a>
//     `);

//     return { success: true, message: "Verification email resent successfully" };
//   } catch (error) {
//     console.error("Failed to resend verification email:", error);
//     throw new Error("Failed to resend verification email");
//   }
// },


// resendVerificationEmail: async (parent, { email }) => {
//   try {
//     console.log("========== RESEND VERIFICATION EMAIL ==========");
//     console.log("1. Email requested:", email);
    
//     // Find the artist by email
//     const artist = await Artist.findOne({ email });
//     if (!artist) {
//       console.log("❌ Artist not found for email:", email);
//       throw new Error("Artist not found");
//     }

//     console.log("2. Artist found:");
//     console.log("   - ID:", artist._id.toString());
//     console.log("   - Full Name:", artist.fullName);
//     console.log("   - Current confirmed status:", artist.confirmed);

//     // Check if the email is already verified
//     if (artist.confirmed) {
//       console.log("3. Artist already confirmed");
//       return { success: false, message: "Email is already verified" };
//     }

//     console.log("3. Artist needs verification, generating token...");
    
//     // Generate a new token using signArtistToken
//     const artistToken = signArtistToken(artist, USER_TYPES.ARTIST);
//     console.log("4. Token generated:", artistToken.substring(0, 50) + "...");

//     // USE SERVER_URL here (your backend)
//     const verificationLink = `${process.env.SERVER_URL}/confirmation/${artistToken}`;
    
//     console.log("5. Verification link created:", verificationLink);
//     console.log("   - This link points to your BACKEND server on port 3001");

//     // Send the verification email
//     console.log("6. Sending email to:", artist.email);
//     await sendEmail(artist.email, "Verify Your Email", `
//       <p>Hello, ${artist.fullName}!</p>
//       <p>Please click the link below to verify your email:</p>
//       <a href="${verificationLink}">Verify Email</a>
//       <p>This link will expire in 24 hours.</p>
//     `);

//     console.log("7. Email sent successfully!");
//     console.log("========== RESEND COMPLETE ==========");

//     return { success: true, message: "Verification email resent successfully" };
//   } catch (error) {
//     console.error("❌ Failed to resend verification email:", error);
//     throw new Error("Failed to resend verification email");
//   }
// },


resendVerificationEmail: async (parent, { email }) => {
  try {
    console.log("========== RESEND VERIFICATION EMAIL ==========");
    console.log("1. Email requested:", email);
    
    // Find the artist by email
    const artist = await Artist.findOne({ email });
    if (!artist) {
      console.log("❌ Artist not found for email:", email);
      throw new Error("Artist not found");
    }

    console.log("2. Artist found:");
    console.log("   - ID:", artist._id.toString());
    console.log("   - Full Name:", artist.fullName);
    console.log("   - Current confirmed status:", artist.confirmed);

    // Check if the email is already verified
    if (artist.confirmed) {
      console.log("3. Artist already confirmed");
      return { success: false, message: "Email is already verified" };
    }

    console.log("3. Artist needs verification, generating token...");
    
    // Generate a new token using signArtistToken
    const artistToken = signArtistToken(artist, USER_TYPES.ARTIST);
    console.log("4. Token generated:", artistToken.substring(0, 50) + "...");

    // USE SERVER_URL here (your backend)
    const verificationLink = `${process.env.SERVER_URL}/confirmation/${artistToken}`;
    
    console.log("5. Verification link created:", verificationLink);
    console.log("   - This link points to your BACKEND server on port 3001");

    // Send the verification email with styled template
    console.log("6. Sending email to:", artist.email);
    const logoUrl = `${process.env.FRONTEND_URL || 'https://flolup.com'}/assets/logo.png`;
    await sendEmail(artist.email, "Welcome to FloLup - Verify Your Email", `
      <div style="font-family: 'Inter', system-ui; max-width: 600px; margin: 0 auto; padding: 20px;
                  background: linear-gradient(180deg, rgba(8,8,9,0.9), rgba(15,15,20,0.9)); border-radius: 16px;
                  border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 60px rgba(0,0,0,0.25);">
        <div style="text-align:center; margin-bottom:24px;">
          <img src="${logoUrl}" alt="FloLup logo" style="width:72px; height:auto; margin-bottom:16px;" />
        </div>
        <div style="text-align: left; margin-bottom: 24px;">
          <h1 style="color: #fdf3e9; margin-bottom: 4px; font-size: 2.1rem;">Welcome to <span style="font-weight: 800;">FloLup</span>! 🎵</h1>
          <p style="color: rgba(255,255,255,0.72); font-size: 16px;">Hi ${artist.fullName},</p>
        </div>
        
        <div style=" padding: 32px;" >
                    
          <p style="color: rgba(255,255,255,0.92); font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Thanks for joining FloLup! Please verify your email address to keep building your creative studio.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="display: inline-block; background: linear-gradient(90deg, #E4C421, #B25035); color: #000; text-decoration: none;
                      padding: 14px 30px; border-radius: 999px; font-size: 16px; font-weight: bold;
                      box-shadow: 0 12px 30px rgba(0,0,0,0.35); transition: transform 0.2s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.5; margin-top: 20px;
                    border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
            This link will expire in <strong>24 hours</strong>. If you didn't create an account with FloLup, please ignore this email.
          </p>
          
          <p style="color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5; margin-top: 25px;
                    border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #E4C421; word-break: break-all;">${verificationLink}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.6); font-size: 12px;">
          <p>© 2024 FloLup. All rights reserved.</p>
          <p style="margin-top: 5px;">
            <small>This is an automated message. Please do not reply to this email.</small>
          </p>
        </div>
      </div>
    `);

    console.log("7. Email sent successfully!");
    console.log("========== RESEND COMPLETE ==========");

    return { success: true, message: "Verification email resent successfully" };
  } catch (error) {
    console.error("❌ Failed to resend verification email:", error);
    throw new Error("Failed to resend verification email");
  }
},



createRadioStation: async (_parent, { input }, context) => {
  const normalizedType = normalizeRadioType(input?.type);
  if (!normalizedType) {
    throw new Error("Invalid radio station type.");
  }

  const name = String(input?.name || "").trim();
  if (!name) {
    throw new Error("Station name is required.");
  }

  const seeds = (input?.seeds || [])
    .map((seed) => ({
      seedType: normalizeSeedType(seed?.seedType),
      seedId: String(seed?.seedId || "").trim(),
    }))
    .filter((seed) => seed.seedType && seed.seedId);

  if (!seeds.length) {
    throw new Error("At least one seed is required.");
  }

  const station = await RadioStation.create({
    name,
    description: String(input?.description || "").trim(),
    type: normalizedType,
    seeds,
    coverImage: String(input?.coverImage || "").trim(),
    visibility: input?.visibility || "public",
    createdBy: context?.artist?._id || null,
  });

  return RadioStation.findById(station._id)
    .populate({ path: "createdBy", select: "artistAka profileImage country" })
    .lean();
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

    console.log('see the token sent on verification:', token)
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



// getPresignedUrlDownload: async (_, { key, expiration }) => {
//   try {




//     if (!key || typeof key !== "string") {
//       throw new Error("key must be a string CloudFront path");
//     }

    
//     const pathOnly = key.startsWith("/") ? key : `/${key}`;

//     console.log("key sent by client:", pathOnly);

//     const { getSignedUrl } = await import("../../utils/cloudFrontUrl.js");
//     const urlToDownload = getSignedUrl(key, expiration ?? 18000);

//     console.log("check the returned url:", urlToDownload);

//     return {
//       urlToDownload,
//       expiration: String(expiration ?? 18000),
//     };
//   } catch (error) {
//     console.error("Error in resolver:", error);
//     throw new Error(`Failed to fetch signed URL: ${error?.message || error}`);
//   }
// },







// getPresignedUrlDownload: async (_, { bucket, key, region }) => {
//   try {
//     const { derivedBucket, pathToSign } = normalizeDownloadKey({ bucket, key });
//     const bucketToUse = derivedBucket || bucket;

//     if (!bucketToUse || !pathToSign) {
//       throw new Error('bucket and key are required');
//     }

//     const resolvedRegion = region || process.env.JWT_REGION_SONGS_TO_STREAM;

//     const urlToDownload = await CreatePresignedUrlDownload({
//       bucket: bucketToUse,
//       key: pathToSign,
//       region: resolvedRegion,
//     });

//     const cleanedUrlToDownload = typeof urlToDownload === 'string'
//       ? urlToDownload.replace(/([^:]\/)\/+/g, '$1')
//       : urlToDownload;

//     return {
//       url: cleanedUrlToDownload,
//       urlToDownload: cleanedUrlToDownload,
//       expiration: '18000',
//     };
//   } catch (error) {
//     console.error('Error in getPresignedUrlDownload resolver:', error);
//     throw new Error(`Failed to fetch presigned URL: ${error?.message || error}`);
//   }
// },

// getPresignedUrlDownloadAudio: async(_, {bucket, key, region}) => {
//   try {
//     // Allow the client to pass either a key or a full URL; we normalize to the expected bucket/key.
//     const { derivedBucket, pathToSign } = normalizeAudioKey({ bucket, key });

//     // Try CloudFront first; if it fails (bad key/path), fall back to direct S3 presign.
//     let urlToDownloadAudio;
//     try {
//       urlToDownloadAudio = await CreatePresignedUrlDownloadAudio({
//         region,
//         bucket: derivedBucket,
//         key: pathToSign,
//         expiresInSeconds: 18000,
//       });

//     } catch (cfErr) {
//       console.error('CloudFront signing failed, falling back to S3 presign:', cfErr?.message || cfErr);
//       urlToDownloadAudio = await CreatePresignedUrlDownloadAudioServerSide({
//         region,
//         bucket: derivedBucket || bucket,
//         key: pathToSign,
//         expiresIn: 18000,
//       });
//     }


//     return {
//       url: urlToDownloadAudio,
//       expiration: '18000',
//     };

//   } catch (error) {
//     console.error('Error in resolver:', error);
//     throw new Error(`Failed to fetch presigned URL: ${error?.message || error}`);
//   }
// },

getPresignedUrlDownload,

getPresignedUrlDownloadAudio,

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
    console.log('CHECK EMAIL RECIEVED:', email)
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
    const artistToken = signArtistToken(artist, USER_TYPES.ARTIST);

    // Step 5: Return the token and artist object
    return { artistToken, artist };
    
  } catch (error) {
    console.error("Login failed:", error);
  }
},





// Select plan
// -----------

// selectPlan: async (parent, { artistId, plan }) => {
//   try {
//     const afroFeelPlans = ['Free Plan', 'Premium Plan', 'Pro Plan'];

//     // Validate the plan type
//     if (!afroFeelPlans.includes(plan)) {
//       throw new Error('Invalid plan type selected.');
//     }

//     // Update the artist's plan in the database
//     const artist = await Artist.findByIdAndUpdate(
//       artistId,
//       {
//         selectedPlan: true,
//         plan: plan,
//       },
//       { new: true }
//     );

// await artistUpdateRedis(artist); 

//     if (!artist) {
//       throw new Error('Artist not found.');
//     }

//     return artist;
//   } catch (error) {
//     console.error('Selecting plan failed:', error);
//     throw new GraphQLError('Selecting plan failed.', {
//       extensions: {
//         code: 'UNAUTHENTICATED',
//       },
//     });
//   }
// },



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

    if (!artist) {
      throw new Error('Artist not found.');
    }

    // Check if artist already has albums using your Album model
    const existingAlbums = await Album.find({ artist: artistId });
    
    // Create default album only if none exist
    if (existingAlbums.length === 0) {
      console.log('Creating default album for artist:', artistId);
      
      const defaultAlbum = await Album.create({
        title: "Singles",
        artist: artistId,
        releaseDate: new Date(),
        // Add any other fields your Album schema requires
      });
      
      console.log('✅ Default album created:', defaultAlbum._id);
    }

    await artistUpdateRedis(artist);

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
  { artistId, bio, country, region, languages, genre, mood, profileImage, coverImage },
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
    if (region) updateFields.region = region;
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

addRegion: async (parent, { region }, context) => {
      if (!context.artist) {
        throw new Error('Unauthorized: You must be logged in to update your profile.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { region },
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


    toggleBookingAvailability: async (_parent, { available }, context) => {
      if (!context.artist) {
        throw new AuthenticationError('Unauthorized: You must be logged in to toggle booking availability.');
      }

      const updatedArtist = await Artist.findOneAndUpdate(
        { _id: context.artist._id },
        { bookingAvailability: Boolean(available) },
        { new: true }
      );

      if (!updatedArtist) {
        throw new Error('Artist not found or update failed.');
      }

      await artistUpdateRedis(updatedArtist);
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
).populate({ path: 'artist', select: 'country' }); // POPULATE ARTIST FOR COUNTRY

if (!updatedSong) {
  throw new Error('Song not found.');
}

const hasRequiredMetadata = Boolean(
  updatedSong.title &&
  updatedSong.genre &&
  updatedSong.releaseDate &&
  updatedSong.album
);

if (updatedSong.visibility !== "public" && hasRequiredMetadata) {
  updatedSong.visibility = "public";
  await updatedSong.save();
}

console.log('✅ Updated song document:', updatedSong._id);

// 2) similarity set precomputation (ONLY AFTER ALL FIELDS ARE SET)
try {
  await generateSimilarSongs(updatedSong);
  console.log('✅ Similarity precomputation completed for:', updatedSong._id);
} catch (similarityError) {
  console.warn('Similarity precomputation failed:', similarityError);
}

return updatedSong;
      } catch (error) {
        console.error('Error updating song:', error);
        const errorMessage = error?.message || 'Failed to update song.';
        throw new Error(errorMessage);
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
        title: "Single",
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
      visibility: "private",
      timeSignature: timeSignature || "4/4",
      key,
      mode,
      duration,
      trendingScore: INITIAL_RECENCY_SCORE,
      tempo: resultFromTempoDetect || tempo,
      beats: beats || [],
      releaseDate: new Date()
    });



    try {
      // added



await addSongToTrendingOnUpload(songData._id)
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
      const defaultAlbum = await Album.create({
        title: title || "Single",
        artist: artistId,
      });
      await albumCreateRedis(defaultAlbum);
      return defaultAlbum;
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



// handlePlayCount: async (_parent, { songId }, context) => {
//   // Load song first (we need artist id and to fail fast if missing)
//   const song = await Song.findById(songId).lean();
//   if (!song) throw new Error('Song not found');
//   console.log('is it being called? ...')

//   // Don't count the artist's own plays
//   if (context.artist && String(song.artist) === String(context.artist._id)) {
//     await Song.findByIdAndUpdate(songId, { $set: { lastPlayedAt: new Date() } });
//   }

//   const viewerId = getViewerId(context);
//   const r = await getRedis();

//   const cooldownKey = `cooldown:song:${songId}:viewer:${viewerId}`;
//   const onCooldown = await r.exists(cooldownKey);

//   let updatedSong;

//   if (onCooldown) {
//     console.log('🎵 On cooldown - no play count increment');
//     // No increment; just keep lastPlayedAt fresh
//     updatedSong = await Song.findByIdAndUpdate(
//       songId,
//       { $set: { lastPlayedAt: new Date() } },
//       { new: true, runValidators: true }
//     );
//   } else {
//     console.log('🎵 Not on cooldown - incrementing play count');
//     // Count this as a play (Mongo = source of truth)
//     updatedSong = await Song.findByIdAndUpdate(
//       songId,
//       { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
//       { new: true, runValidators: true }
//     );
//     if (!updatedSong) throw new Error('Song not found');

//     // Start cooldown window
//     try {
//       await r.set(cooldownKey, '1', { EX: PLAY_COOLDOWN_SECONDS, NX: true });
//     } catch {}
//   }

//   // ALWAYS update Redis cache (both cooldown and non-cooldown cases)
//   try {
//     const songCacheKey = songKey(songId);
//     const songExists = await r.exists(songCacheKey);
//     console.log(`🎵 Song ${songId} exists in Redis:`, songExists);

//     if (songExists) {
//       if (!onCooldown) {
//         console.log(`🎵 Incrementing playCount for existing song: ${songId}`);
//         // Only increment playCount if not on cooldown
//         await r
//           .multi()
//           .hIncrBy(songCacheKey, 'playCount', 1)
//           .expire(songCacheKey, songHashExpiration)
//           .exec();
//       } else {
//         console.log(`🎵 Refreshing TTL only (cooldown): ${songId}`);
//         // Just refresh TTL during cooldown
//         await r.expire(songCacheKey, songHashExpiration);
//       }
//     } else {
//       console.log(`🎵 Adding song to Redis: ${songId}`);
//       // Song not in cache - add it with current data
//       await addSongRedis(songId);
//     }
//   } catch (e) {
//     console.warn('[Redis] playCount sync skipped:', e.message);
//   }

//   return updatedSong;
// },


  handlePlayCount: async (_parent, { songId }, context) => {
  // Load song first (we need artist id and to fail fast if missing)
  const song = await Song.findById(songId).lean();
  if (!song) throw new Error('Song not found');

  // Don't count the artist's own plays
  if (context.artist && String(song.artist) === String(context.artist._id)) {
    await Song.findByIdAndUpdate(songId, { $set: { lastPlayedAt: new Date() } });
    return await Song.findById(songId).lean();
  }

  const viewerId = getViewerId(context);
  const r = await getRedis();

  const cooldownKey = `cooldown:song:${songId}:viewer:${viewerId}`;
  const onCooldown = await r.exists(cooldownKey);

  let updatedSong;

  if (onCooldown) {
    console.log('🎵 On cooldown - no play count increment');
    // No increment; just keep lastPlayedAt fresh
    updatedSong = await Song.findByIdAndUpdate(
      songId,
      { $set: { lastPlayedAt: new Date() } },
      { new: true, runValidators: true }
    );
  } else {
    console.log('🎵 Not on cooldown - incrementing play count AND trending score');
    // Count this as a play (Mongo = source of truth)
    updatedSong = await Song.findByIdAndUpdate(
      songId,
      { 
        $inc: { 
          playCount: 1, 
          trendingScore: TRENDING_WEIGHTS.PLAY_WEIGHT 
        }, 
        $set: { lastPlayedAt: new Date() } 
      },
      { new: true, runValidators: true }
    );
    if (!updatedSong) throw new Error('Song not found');

    // Start cooldown window
    try {
      await r.set(cooldownKey, '1', { EX: PLAY_COOLDOWN_SECONDS, NX: true });
    } catch (cooldownError) {
      console.warn('Cooldown setting failed:', cooldownError);
    }
  }

  // Track user play history for sidebar (update timestamp even on cooldown)
  if (context?.user?._id) {
    try {
      await PlayCount.findOneAndUpdate(
        { user: context.user._id, played_songs: songId },
        {
          $set: { createdAt: new Date() },
          $inc: { count: onCooldown ? 0 : 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.warn('PlayCount update failed:', error?.message || error);
    }
  }

  // ✅ Handle ALL Redis operations
  try {
    const songCacheKey = songKey(songId);
    const songExists = await r.exists(songCacheKey);

    // 1. Handle song cache operations
    if (songExists) {
      if (!onCooldown) {
        // Update playCount in cache
        await r.hIncrBy(songCacheKey, 'playCount', 1);
        console.log(`🎵 Updated song cache playCount for: ${songId}`);
      }
      // Always refresh TTL
      await r.expire(songCacheKey, songHashExpiration);
    } else {
      // Song not in cache - add it
      await addSongRedis(songId);
      console.log(`🎵 Added song to cache: ${songId}`);
    }

    // 2. Handle trending operations (only if not on cooldown)
    if (!onCooldown) {
      const currentScore = await r.zScore(trendIndexZSet, songId.toString());
      
      if (currentScore !== null) {
        // Song is already in trending - increment score
        const newScore = parseFloat(currentScore) + TRENDING_WEIGHTS.PLAY_WEIGHT;
        await r.zAdd(trendIndexZSet, { 
          score: newScore, 
          value: songId.toString() 
        });
        console.log(`📈 Trending updated: ${songId}: ${currentScore} → ${newScore}`);
      } else {
        // Song is NOT in trending - check if it should enter
        const songNewScore = updatedSong.trendingScore;
        console.log(`📊 Song ${songId} not in trending, current score: ${songNewScore}`);
        
        const trendingCount = await r.zCard(trendIndexZSet);
        console.log(`📊 Trending set has ${trendingCount}/20 songs`);
        
        if (trendingCount < 20) {
          // Trending has space - add directly
          await r.zAdd(trendIndexZSet, {
            score: songNewScore,
            value: songId.toString()
          });
          console.log(`🎉 Added ${songId} to trending (space available): ${songNewScore}`);
        } else {
          // Trending is full - check if this song deserves a spot
          const lowestSongs = await r.zRange(trendIndexZSet, 0, 0, {
            WITHSCORES: true
          });
          
          const lowestScore = parseFloat(lowestSongs[1]);
          console.log(`📊 Lowest score in trending: ${lowestScore}`);
          
          if (songNewScore >= lowestScore) {
            // Song qualifies - replace the oldest song with the lowest score
            const allLowestSongs = await r.zRangeByScore(trendIndexZSet, lowestScore, lowestScore, {
              WITHSCORES: true
            });
            
            console.log(`📊 Found ${allLowestSongs.length / 2} songs with score ${lowestScore}`);
            
            // Find the oldest song among those with lowest score
            let oldestSongId = allLowestSongs[0];
            
            // If multiple songs have same score, find the oldest
            if (allLowestSongs.length > 2) {
              const songIds = [];
              for (let i = 0; i < allLowestSongs.length; i += 2) {
                songIds.push(allLowestSongs[i]);
              }
              
              const oldestSong = await Song.findOne({ _id: { $in: songIds } })
                .select('_id createdAt')
                .sort({ createdAt: 1 })
                .lean();
              
              if (oldestSong) {
                oldestSongId = oldestSong._id.toString();
              }
            }
            
            // Replace the oldest lowest-scoring song
            await r.zRem(trendIndexZSet, oldestSongId);
            await r.zAdd(trendIndexZSet, {
              score: songNewScore,
              value: songId.toString()
            });
            console.log(`🔄 ${songId} replaced ${oldestSongId} in trending: ${songNewScore} >= ${lowestScore}`);
          } else {
            console.log(`📊 ${songId} not high enough for trending: ${songNewScore} < ${lowestScore}`);
          }
        }
      }
    }

    console.log(`✅ All Redis operations completed for: ${songId}`);

  } catch (redisError) {
    console.warn('[Redis] operations skipped:', redisError.message);
  }

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
    savePlaybackSession,
    handleFollowers,

    handleArtistDownloadCounts,

    shareSong: async (_parent, { songId }) => {
      const song = await Song.findById(songId);
      if (!song) throw new Error('Song not found');

      const updatedSong = await Song.findByIdAndUpdate(
        songId,
        { 
          $inc: { 
            shareCount: 1,
            trendingScore: TRENDING_WEIGHTS?.SHARE_WEIGHT ?? 1
          } 
        },
        { new: true, runValidators: true }
      );

      try {
        const r = await getRedis();
        const songCacheKey = songKey(songId);
        if (await r.exists(songCacheKey)) {
          await r.hIncrBy(songCacheKey, 'shareCount', 1);
          await r.expire(songCacheKey, songHashExpiration);
        }

        const currentScore = await r.zScore(trendIndexZSet, songId.toString());
        const inc = TRENDING_WEIGHTS?.SHARE_WEIGHT ?? 1;
        if (currentScore !== null) {
          await r.zAdd(trendIndexZSet, { score: parseFloat(currentScore) + inc, value: songId.toString() });
        }
      } catch (err) {
        console.warn('[shareSong] Redis sync skipped:', err?.message || err);
      }

      return updatedSong;
    },

    createBookArtist,
    respondToBooking,
    sendMessage,
    

//     sendBookingMessage,

// sendBookingMessage: async (_parent, { input }, context) => {
//   const { bookingId, content } = input;
//   const senderType = context.artist ? "artist" : context.user ? "user" : null;
//   if (!senderType) {
//     throw new AuthenticationError("Please log in to send a message.");
//   }

//   const booking = await BookArtist.findById(bookingId);
//   if (!booking) {
//     throw new Error("Booking not found.");
//   }

//   const isArtist = context.artist?._id?.toString() === booking.artist?.toString();
//   const isUser = context.user?._id?.toString() === booking.user?.toString();
//   if (!isArtist && !isUser) {
//     throw new AuthenticationError("You do not have permission to message this booking.");
//   }

//   if (booking.status === "pending") {
//     throw new Error("Respond to the booking request before starting a chat.");
//   }

//   const senderId = senderType === "artist" ? context.artist._id : context.user._id;
//   const message = await Message.create({
//     bookingId,
//     senderId,
//     senderType,
//     content,
//   });

//   return { message };
// },

  },




Subscription: {
  songUploadProgress: {
    subscribe: withFilter(
      () => {
        console.log('🎯 Subscription created for:', SONG_UPLOAD_UPDATE);
        return pubsub.asyncIterableIterator([SONG_UPLOAD_UPDATE]);
      },
      (payload, variables, context) => {
        const payloadArtistId = payload.songUploadProgress?.artistId;
        const contextArtistId = context.artist?._id?.toString();
        
        if (!context.artist || !payloadArtistId) return false;

        return payloadArtistId === contextArtistId;
      }
    )
  },
  newMessage: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator([NEW_MESSAGE]),
      (payload, variables, context) => {
        if (!variables?.bookingId) return false;
        const participantId = context.artist
          ? context.artist._id.toString()
          : context.user
          ? context.user._id.toString()
          : null;
        if (!participantId) return false;

        const bookingMatches =
          payload.newMessage?.bookingId?.toString() === variables.bookingId;
        const userMatches = context.user
          ? payload.newMessage?.userId?._id?.toString() === participantId
          : true;
        const artistMatches = context.artist
          ? payload.newMessage?.artistId?._id?.toString() === participantId
          : true;

        return bookingMatches && (userMatches || artistMatches);
      }
    ),
  },
},


  Song: {
    likesCount: (parent) => {
      return parent.likedByUsers?.length || 0;
    },

    composer: (song) => normalizeComposerList(song?.composer),

    // Always return CloudFront-signed artwork URL (or fallback)
    artworkPresignedUrl: async (song) => {
      if (song?.artworkPresignedUrl) return song.artworkPresignedUrl;
      const key = s3KeyFromUrl(song?.artwork);
      if (!key) return await getFallbackArtworkUrl();
      try {
        const { url } = await getPresignedUrlDownload(null, {
          bucket: 'afrofeel-cover-images-for-songs',
          key,
          region: 'us-east-2',
        });
        return url;
      } catch (err) {
        console.error(`🎨 Artwork presign failed for ${song?._id}:`, err);
        return await getFallbackArtworkUrl();
      }
    },

    // Always return CloudFront-signed audio URL (or null if not available)
    audioPresignedUrl: async (song) => {
      if (song?.audioPresignedUrl) return song.audioPresignedUrl;
      const key = buildStreamingKey(song?.streamAudioFileUrl, song?.audioFileUrl);
      if (!key) return null;
      try {
        const { url } = await getPresignedUrlDownload(null, {
          bucket: 'afrofeel-songs-streaming',
          key,
          region: 'us-west-2',
        });
        return url;
      } catch (err) {
        console.error(`🎵 Audio presign failed for ${song?._id}:`, err);
        return null;
      }
    },
  },





  };


export default resolvers;
