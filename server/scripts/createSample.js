
import dotenv from "dotenv";




import { getRedis } from "../utils/AdEngine/redis/redisClient.js";
import {  shapeForRedis } from "../schemas/Artist_schema/artist_resolvers.js";




export const songDoc = {
  _id: "652dcb15fa0a5b9a97bcf305",
  title: "Electric Dreams",
  artist: { _id: "651aefbb9f72e5e2f912d879" },
  featuringArtist: [
    { _id: "651aefbb9f72e5e2f912d870" },
    { _id: "651aefbb9f72e5e2f912d871" },
  ],
  album: { _id: "651aefbb9f72e5e2f912aabb" },
  trackNumber: 2,
  genre: "Synthpop",
  mood: ["nostalgic", "uplifting"],
  subMoods: ["dreamy", "retro"],
  producer: [{ _id: "651aefbb9f72e5e2f912aaaa" }],
  composer: [{ _id: "651aefbb9f72e5e2f912bbbb" }],
  label: "Neon Records",
  releaseDate: "2023-07-20T10:30:00.000Z",
  lyrics: "We are the sound of the future...",
  artwork: "https://example.com/art.jpg",
  audioFileUrl: "https://example.com/audio.mp3",
  streamAudioFileUrl: "https://example.com/stream.mp3",
  visibility: "public",
  playCount: 1024,
  downloadCount: 567,
  likesCount: 42,
  createdAt: "2023-07-01T08:00:00.000Z",
  updatedAt: "2023-08-01T12:00:00.000Z",
};


const songKey = (id) => `song#${id}`;


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



const fieldTypes = {
  _id: "string",
  title: "string",
  artist: "idObject", // should become { _id: value }
  featuringArtist: "idObjectArray", // should become [{ _id: value }]
  album: "idObject",
  trackNumber: "number",
  genre: "string",
  mood: "json",
  subMoods: "json",
  producer: "idObjectArray",
  composer: "idObjectArray",
  label: "string",
  releaseDate: "date",
  lyrics: "string",
  artwork: "string",
  audioFileUrl: "string",
  streamAudioFileUrl: "string",
  visibility: "string",
  playCount: "number",
  downloadCount: "number",
  likesCount: "number",
  createdAt: "date",
  updatedAt: "date",
};




const deserializeFromRedisStorage = (hash, typeMap) => {
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

      case "json":
        try {
          obj[key] = JSON.parse(value);
        } catch {
          obj[key] = value;
        }
        break;

      case "idObject":
        try {
          // Try to parse as JSON first (if it was stringified)
          const parsed = JSON.parse(value);
          obj[key] = parsed;
        } catch {
          // If not JSON, treat as simple ID string and create object
          obj[key] = { _id: value };
        }
        break;

      case "idObjectArray":
        try {
          const parsed = JSON.parse(value);
          // Handle both array of strings and array of objects
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



export const run = async (id) => {
  const client = await getRedis();

  try {
   
    const shaped = shapeForRedis(songDoc);
    console.log("🔷 Shaped data:", JSON.stringify(shaped, null, 2));
    
    const redisSafe = serialize(shaped);
    console.log("🔶 Serialized for Redis:", redisSafe);

    await client.hSet(songKey(id), redisSafe);
    console.log("✅ Song saved to Redis from script.");
  } catch (error) {
    console.error("❌ Error saving to Redis:", error);
  }

  try {
    const song = await client.hGetAll(songKey(id));

    if (!song || Object.keys(song).length === 0) {
      console.log("🚫 Song not found in Redis.");
    } else {
      console.log("🎵 Raw Redis hash:", song);
    }
    
    const deserialized = deserializeFromRedisStorage(song, fieldTypes);
    console.log("🎵 Deserialized song:", JSON.stringify(deserialized, null, 2));
    
    return deserialized;
  } catch (error) {
    console.error("❌ Error fetching from Redis:", error);
  }
};

