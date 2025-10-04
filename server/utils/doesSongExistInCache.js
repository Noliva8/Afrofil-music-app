

// Ensure a song is cached in Redis (idempotent)
import Song from '../models/Artist/Song.js';
import { getRedis } from './AdEngine/redis/redisClient.js';
import { createSongRedis } from '../schemas/Artist_schema/Redis/songCreateRedis.js';



const REDIS_PROJECTION =
  '_id title artist album genre mood subMoods producer composer label ' +
  'releaseDate lyrics artwork audioFileUrl streamAudioFileUrl visibility ' +
  'playCount createdAt updatedAt tempo key mode timeSignature';

// Shape to the trimmed Redis doc your cache expects
const shapeForRedis = (s) => ({
  _id: String(s._id),
  title: s.title ?? null,
  artist: s.artist ? String(s.artist) : null,
  album: s.album ? String(s.album) : null,
  genre: s.genre ?? null,
  mood: s.mood ?? [],
  subMoods: s.subMoods ?? [],
  producer: Array.isArray(s.producer) ? s.producer.map(String) : [],
  composer: Array.isArray(s.composer) ? s.composer.map(String) : [],
  label: s.label ?? null,
  releaseDate: s.releaseDate ? new Date(s.releaseDate) : null,
  lyrics: s.lyrics ?? null,
  artwork: s.artwork ?? null,
  audioFileUrl: s.audioFileUrl ?? null,
  streamAudioFileUrl: s.streamAudioFileUrl ?? null,
  visibility: s.visibility ?? 'public',
  tempo: typeof s.tempo === 'number' ? s.tempo : undefined,
  key: s.key ?? undefined,
  mode: typeof s.mode === 'number' ? s.mode : undefined,
  timeSignature: typeof s.timeSignature === 'number' ? s.timeSignature : undefined,
  playCount: Number(s.playCount || 0),
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
  updatedAt: new Date(),
});

const songKey = (id) => `song:${id}`;

export async function ensureSongCached(songId) {
  const r = await getRedis();

  // already cached?
  const exists = await r.exists(songKey(songId));
  if (exists) return true;

  // fetch slim doc from Mongo
  const s = await Song.findById(songId).select(REDIS_PROJECTION).lean();
  if (!s) return false;

  await createSongRedis(shapeForRedis(s));
  return true;
}
