import { getRedis } from '../redis/redisClient.js';
import { K} from '../redis/redisSchema.js';
import { upsertSongMeta } from '../redis/redisSchema.js';








import {
  beginOrTouchSession,
  addSessionEvent,
  incrSessionCounters,
  incrUserAgg,
  addRecentSong,
  adjustGenreAffinity,
} from '../redis/redisSchema.js';

const norm = (s) => (s ?? '').toString().trim();



/** User started playing a track */


export async function onTrackStart({
  // identity
  userId,
  sessionId,

  // device & role (role is already mapped: 'guest' | 'regular' | 'premium')
  device,
  platform, // saved on session for context
  role,

  // geo snapshot (already chosen by resolver)
  country,
  city,

  // song / artist
  trackId,
  trackGenre,
  trackMood,
  trackSubMood,
  artistId,
  albumId,
  tempo,       // bpm
  duration,    // seconds

  // playback context
  playbackSource,
  sourceId,
  queuePosition,
  queueLength,
  shuffle,
  repeat,

  // optional idempotency
  eventId
}) {
  // 1) Ensure session is alive + basic identity snapshot
  await beginOrTouchSession({
    sessionId,
    userId,
    device,
    role,
    country: country || '',
    city: city || ''
  });

  // 2) Keep rich playback context on the session hash (non-breaking)
  const r = await getRedis();
  await r.hSet(K.session(sessionId), {
    platform: platform || '',
    playbackSource: playbackSource || '',
    sourceId: sourceId || '',
    queuePosition: String(queuePosition ?? 0),
    queueLength: String(queueLength ?? 0),
    shuffle: shuffle ? '1' : '0',
    repeat: String(repeat || 'off'),

    // last-track snapshot (useful for debug / quick reads)
    lastTrackId: trackId || '',
    lastTrackGenre: norm(trackGenre),
    lastTrackMood: norm(trackMood),
    lastTrackSubMood: norm(trackSubMood),
    artistId: artistId || '',
    albumId: albumId || '',
    tempoBpm: String(Number(tempo || 0)),
    durationSec: String(Number(duration || 0))
  });
  // keep TTL fresh (optional, but nice)
  // await r.expire(K.session(sessionId), TTL.SESSION);

  // 3) Upsert song meta (maintains indexes only if facets changed)
  await upsertSongMeta({
    songId: trackId,
    artistId,
    albumId,
    title: '', // optional
    genre: trackGenre,
    mood: trackMood,
    subMoods: trackSubMood ? [trackSubMood] : [],
    tempoBpm: tempo,
    artistCountry: '',  // optional
    artworkUrl: ''      // optional
  });

  // 4) Stream event (keep it lightweight)
  await addSessionEvent({
    sessionId,
    type: 'trackStart',
    userId,
    songId: trackId,
    genre: norm(trackGenre),
    ts: Date.now()
    // We intentionally keep the stream small; rich context is on session hash.
  });

  // 5) Counters (match existing field names)
  await incrSessionCounters(sessionId, { songsPlayed: 1, songs_since_ad: 1 });
  await incrUserAgg({ userId, plays: 1 });

  // 6) Recents
  if (trackId) await addRecentSong(userId, trackId);

  // (Optional) Return nothing; resolver handles the GraphQL response
}



/** Track finished (treat as completion) */
export async function onTrackComplete({
  userId, sessionId, songId, genre, ms_listened = 0,
}) {
  const g = norm(genre);
  const listened = Math.max(0, Math.floor(ms_listened));

  await addSessionEvent({ sessionId, type: 'trackComplete', userId, songId, genre: g });
  await incrSessionCounters(sessionId, { completes: 1, ms_listened: listened });
  await incrUserAgg({ userId, completes: 1, ms_listened: listened });
  if (g) await adjustGenreAffinity(userId, g, 3);
}








/** User skipped (negative signal) */
export async function onTrackSkip({
  userId, sessionId, songId, genre,
}) {
  const g = norm(genre);

  await addSessionEvent({ sessionId, type: 'trackSkip', userId, songId, genre: g });
  await incrSessionCounters(sessionId, { skips: 1 });
  await incrUserAgg({ userId, skips: 1 });
  if (g) await adjustGenreAffinity(userId, g, -1);
}

/** Optional: teaser or short preview (counts but not a completion) */
export async function onPreview({
  userId, sessionId, songId, genre, ms_listened = 0,
}) {
  const g = norm(genre);
  const listened = Math.max(0, Math.floor(ms_listened));

  await addSessionEvent({ sessionId, type: 'preview', userId, songId, genre: g });
  await incrSessionCounters(sessionId, { previews: 1, ms_listened: listened });
  await incrUserAgg({ userId, previews: 1, ms_listened: listened });
  // no affinity change by default (use +1 if you want a mild positive)
}

/** Optional: user abandoned session/app */
export async function onQuit({
  userId, sessionId,
}) {
  await addSessionEvent({ sessionId, type: 'quit', userId });
  await incrSessionCounters(sessionId, { quits: 1 });
  await incrUserAgg({ userId, quits: 1 });
}
