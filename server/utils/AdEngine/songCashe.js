// utils/AdEngine/reco/songCache.js
import { getRedis } from './redis/redisClient.js';
import { K, upsertSongMeta } from './redis/redisSchema.js';

import Song from '../../models/Artist/Song.js';

const norm = (s) => (s ?? '').toString().trim().replace(/[_-]+/g, ' ').toLowerCase();

function tempoBucketFromBpm(bpm) {
  const n = Number(bpm) || 0;
  if (n <= 0) return '';
  if (n < 85) return 'slow';
  if (n < 110) return 'mid';
  if (n < 135) return 'fast';
  return 'veryfast';
}

/** Return Redis meta if present and “usable” */
async function getMetaFromRedis(r, songId) {
  const meta = await r.hGetAll(K.songMeta(songId));
  if (!meta || !Object.keys(meta).length) return null;

  // consider “usable” if we have at least artist/genre or any indexable facet
  if (!meta.artistId && !meta.genre && !meta.mood && !meta.subMood && !meta.artistCountry) {
    return null;
  }
  return meta;
}

/**
 * Hydrate Redis from Mongo if missing/stale.
 * Returns a normalized meta object (the same shape stored in Redis hash).
 */
export async function getSongMetaCached(songId) {
  const r = await getRedis();

  // 1) Try Redis
  let meta = await getMetaFromRedis(r, songId);
  if (meta) return meta;

  // 2) Cache miss: fetch Mongo and mirror
  const doc = await Song.findById(songId).lean();
  if (!doc) return null;

  const subMoods = Array.isArray(doc.subMoods)
    ? doc.subMoods
    : (doc.subMood ? [doc.subMood] : []);

  const tempoBpm = doc.tempoBpm ?? doc.bpm;
  const artistCountry = doc.artistCountry || doc.artist?.country || '';

  await upsertSongMeta({
    songId: String(doc._id),
    artistId: String(doc.artistId || doc.artist?._id || ''), // adjust to your schema
    albumId: String(doc.album || ''),
    title: doc.title || '',
    genre: doc.genre || '',
    mood: doc.mood || '',
    subMoods,
    tempoBpm,
    artistCountry,
    artworkUrl: (doc.artwork && doc.artwork.url) ? doc.artwork.url : (doc.artwork || ''),
  });

  // 3) Read back what we just wrote (ensures normalized values)
  meta = await r.hGetAll(K.songMeta(songId));
  if (!meta) return null;

  // Fill tempoBucket if older rows
  if (!meta.tempoBucket && meta.tempoBpm) {
    const bucket = tempoBucketFromBpm(meta.tempoBpm);
    await r.hSet(K.songMeta(songId), { tempoBucket: bucket });
    meta.tempoBucket = bucket;
  }

  return meta;
}
