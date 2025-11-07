import { songKey } from "./keys.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
// import { shapeForRedis} from "../artist_resolvers.js"
import {Song} from "../../../models/Artist/index_artist.js"
import { songHashExpiration } from "./redisExpiration.js";





const shapeForRedis = (songDoc) => {
  if (!songDoc) return null;

  const song = songDoc.toObject ? songDoc.toObject() : songDoc;

  const artist = song.artist || null;
  const album  = song.album  || null;

  return {
    _id: song._id?.toString(),
    title: song.title || "",

    // nested
    artist: artist ? { 
      _id: artist._id?.toString(), 
      artistAka: artist.artistAka, 
      bio: artist.bio, 
      country: artist.country, 
      profileImage: artist.profileImage, 
      coverImage: artist.coverImage 
    } : null,

    // ✅ flat ids for the player/queue (no name fields)
    artistId: artist?._id ? artist._id.toString() : null,

    featuringArtist: Array.isArray(song.featuringArtist) ? song.featuringArtist : [],

    album: album ? { 
      _id: album._id?.toString(), 
      title: album.title, 
      albumCoverImage: album.albumCoverImage 
    } : null,

    // ✅ flat albumId for the player/queue
    albumId: album?._id ? album._id.toString() : null,

    trackNumber: song.trackNumber || 0,
    genre: song.genre || "",
    mood: Array.isArray(song.mood) ? song.mood : [],
    subMoods: Array.isArray(song.subMoods) ? song.subMoods : [],

    producer: Array.isArray(song.producer)
      ? song.producer.map(p => ({ name: p.name, role: p.role }))
      : [],

    composer: Array.isArray(song.composer)
      ? song.composer.map(c => ({ name: c.name, contribution: c.contribution }))
      : [],

    label: song.label || "",
    releaseDate: song.releaseDate || null,
    lyrics: song.lyrics || "",
    artwork: song.artwork || "",
    audioFileUrl: song.audioFileUrl || "",
    streamAudioFileUrl: song.streamAudioFileUrl || "",

    playCount: song.playCount || 0,
    downloadCount: song.downloadCount || 0,
    likesCount: song.likesCount || 0,

    // ✅ add duration as a flat number (no name fields involved)
    durationSeconds: Number(song.durationSeconds ?? song.duration ?? 0) || 0,

    createdAt: song.createdAt || new Date(),
    updatedAt: song.updatedAt || new Date(),

    // version to detect legacy hashes
    __vShape: 2,
  };
};





const serialize = (obj) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      out[key] = JSON.stringify(value);
    } else if (value === null || value === undefined) {
      out[key] = "";
    } else if (typeof value === 'object' && value !== null) {
      // For objects, stringify them to preserve structure
      out[key] = JSON.stringify(value);
    } else {
      out[key] = String(value);
    }
  }
  return out;
};



export const fieldTypes = {
  _id: "string",
  title: "string",
  artist: "json",
  featuringArtist: "json",
  album: "json",
  // ✅ new flat IDs
  artistId: "string",
  albumId: "string",

  trackNumber: "number",
  genre: "string",
  mood: "json",
  subMoods: "json",
  producer: "json",
  composer: "json",
  label: "string",
  releaseDate: "date",
  lyrics: "string",
  artwork: "string",
  audioFileUrl: "string",
  streamAudioFileUrl: "string",
  playCount: "number",
  downloadCount: "number",
  likesCount: "number",
  createdAt: "date",
  updatedAt: "date",

  // ✅ duration for playback/UI timelines
  durationSeconds: "number",

  // optional if your serializer supports it
  __vShape: "number",
};





export const deserializeFromRedisStorage = (hash, typeMap) => {
  const obj = {};

  for (const [key, value] of Object.entries(hash)) {
    if (value === "") {
      obj[key] = null;
      continue;
    }

    const type = typeMap[key];

    switch (type) {
      case "number":
        obj[key] = Number(value);
        break;

      case "date":
        obj[key] = new Date(value);
        break;

      case "boolean":
        obj[key] = value === "1" || value === "true" || value === true;
        break;

      case "json":
        try {
          obj[key] = JSON.parse(value);
        } catch {
          // If parsing fails, return the raw value
          obj[key] = value;
        }
        break;

      case "idObject":
        try {
          const parsed = JSON.parse(value);
          obj[key] = parsed;
        } catch {
          obj[key] = { _id: value };
        }
        break;

      case "idObjectArray":
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            obj[key] = parsed.map(item => 
              typeof item === 'string' ? { _id: item } : item
            );
          } else {
            obj[key] = [];
          }
        } catch {
          obj[key] = [];
        }
        break;

      case "string":
      default:
        obj[key] = value;
        break;
    }
  }

  return obj;
};






export const addSongRedis = async (id, client) => {
  
  console.log('id sent to redis:', id);

  try {
  
    const songDoc = await Song.findById(id)
      .populate('artist', '_id artistAka bio country profileImage coverImage') 
      .populate('album', '_id title albumCoverImage')
      .lean();  

    if (!songDoc) {
      console.error('❌ Song not found in MongoDB:', id);
      return false;
    }

    const shaped = shapeForRedis(songDoc);
    console.log("🔷 Shaped data:", JSON.stringify(shaped, null, 2));
    
    const redisSafe = serialize(shaped);
    console.log("🔶 Serialized for Redis:", Object.keys(redisSafe).length, "fields");

    // Set the song data AND expiration in one operation
    await client
      .multi()
      .hSet(songKey(id), redisSafe)
      .expire(songKey(id), songHashExpiration)
      .exec();
    
    console.log(`✅ Song ${id} saved to Redis with ${songHashExpiration} second TTL.`);
    return true;
    
  } catch (error) {
    console.error("❌ Error saving to Redis:", error);
    return false;
  }
};







export const getSongRedis = async (id, client) => {
  try {
    const song = await client.hGetAll(songKey(id));

    if (!song || Object.keys(song).length === 0) {
      console.log(`🚫 Song ${id} not found in Redis.`);
      return null; // Explicitly return null
    }
    
    // console.log(`🎵 Raw Redis hash for ${id}:`, Object.keys(song).length, "fields");
    
    const deserialized = deserializeFromRedisStorage(song, fieldTypes);
    
    // Validate we got a proper song object
    if (!deserialized._id) {
      console.warn(`⚠️ Deserialized song missing _id for ${id}`);
      return null;
    }
    
    // console.log(`✅ Successfully retrieved song ${id} from Redis`);
    return deserialized;
    
  } catch (error) {
    console.error(`❌ Error fetching song ${id} from Redis:`, error);
    return null;
  }
};









// 24-char hex ObjectId check
const isObjectId = (s) => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);

/**
 * Scan all song hashes and repair each one by reloading from Mongo.
 * - Derives prefix/suffix from songKey("SAMPLE_ID") to correctly slice out the id.
 * - Uses scanIterator to avoid iterable issues and handle Buffers.
 * - Calls addSongRedis for each id (never passes arrays).
 */
export const songsHashRepair = async (client) => {
  try {
    // Derive prefix/suffix from a probe
    const PROBE_ID = "SAMPLE_ID";
    const probe = String(songKey(PROBE_ID));      // e.g., "song#SAMPLE_ID" or "s:SAMPLE_ID"
    const [prefix, suffix = ""] = probe.split(PROBE_ID); // before and after ID

    // Build a pattern without depending on songKey("*")
    const pattern = `${prefix}*${suffix}`;

    const ids = [];
    for await (const rawKey of client.scanIterator({ MATCH: pattern, COUNT: 1000 })) {
      const key = typeof rawKey === "string" ? rawKey : rawKey?.toString?.() || "";
      if (!key) continue;
      if (!key.startsWith(prefix)) continue;
      if (suffix && !key.endsWith(suffix)) continue;

      // extract id between prefix and suffix
      const id = key.slice(prefix.length, suffix ? -suffix.length : undefined);

      if (!isObjectId(id)) {
        // Skip anything that isn't a clean Mongo ObjectId
        // Uncomment for debugging:
        // console.warn(`[songsHashRepair] Skipping non-ObjectId key: ${key}`);
        continue;
      }
      ids.push(id);
    }

    if (ids.length === 0) {
      console.log("[songsHashRepair] No song keys matched.", { pattern, prefix, suffix });
      return { inspected: 0, repaired: 0 };
    }

    console.log(`[songsHashRepair] Found ${ids.length} song hashes. Repairing...`);

    const BATCH = 25;
    let repaired = 0;

    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH);

      // IMPORTANT: call addSongRedis **per id** (never pass arrays)
      const results = await Promise.allSettled(slice.map((id) => addSongRedis(id, client)));

      let ok = 0;
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) ok++;
      }
      repaired += ok;

      console.log(
        `[songsHashRepair] Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(ids.length / BATCH)}: `
        + `repaired ${ok}/${slice.length}`
      );
    }

    console.log(`[songsHashRepair] Done. Repaired ${repaired}/${ids.length}.`);
    return { inspected: ids.length, repaired };
  } catch (err) {
    console.error("[songsHashRepair] Failed:", err);
    return { inspected: 0, repaired: 0, error: err?.message };
  }
};
