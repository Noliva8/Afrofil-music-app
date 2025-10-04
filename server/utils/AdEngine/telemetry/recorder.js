// server/utils/telemetry/recorders.js
import { keys} from './key.js'
import { secondsUntilMidnightUTC } from './time.js';

const DAY_TTL  = 60 * 60 * 24;   // 24h
const HOUR_TTL = 60 * 60;        // 1h
const GEO_TTL  = 60 * 60 * 6;    // 6h
const SESS_TTL = 60 * 60 * 48;   // 48h

export async function recordTrackStart(redis, {
  userId, sessionId, userTier, device, trackId, trackGenre, geo
}) {
  const nowSec = Math.floor(Date.now() / 1000);
  const pipe = redis.multi();

  // first seen & premium cache
  pipe.setNX(keys.userFirstSeen(userId), String(nowSec));
  pipe.set(keys.userPremium(userId), userTier === 'PREMIUM' ? '1' : '0', { EX: HOUR_TTL });

  // geo (stringified)
  if (geo && typeof geo === 'object') {
    pipe.set(keys.userLastGeo(userId), JSON.stringify(geo), { EX: GEO_TTL });
  }

  // session init
  pipe.setNX(keys.sessStart(sessionId), String(nowSec));
  pipe.expire(keys.sessStart(sessionId), SESS_TTL);

  // counters
  pipe.incr(keys.sessSongs(sessionId));
  pipe.expire(keys.sessSongs(sessionId), SESS_TTL);

  // per-genre taste (7 days)
  if (trackGenre) {
    const gKey = `user:${userId}:genre:${trackGenre}:plays`;
    pipe.incr(gKey);
    pipe.expire(gKey, 60 * 60 * 24 * 7);
  }

  await pipe.exec();

  // make sure daily ad key expires at midnight UTC if already exists/created
  await ensureDailyTTL(redis, userId);
}

export async function recordTrackProgress(redis, {
  userId, sessionId, heartbeatSec = 15
}) {
  const inc = Math.max(1, Math.min(heartbeatSec, 60));

  const pipe = redis.multi();
  pipe.incrBy(keys.userTime(userId), inc);
  pipe.expire(keys.userTime(userId), DAY_TTL);

  pipe.incrBy(keys.sessTime(sessionId), inc);
  pipe.expire(keys.sessTime(sessionId), SESS_TTL);

  await pipe.exec();
}

export async function recordTrackEnd(redis, {
  sessionId, durationSec, listenedSec, finished
}) {
  const isFinished = (typeof finished === 'boolean')
    ? finished
    : (durationSec > 0 && (listenedSec / durationSec) >= 0.8);

  const pipe = redis.multi();
  if (isFinished) {
    pipe.incr(keys.sessSongsFull(sessionId));
    pipe.expire(keys.sessSongsFull(sessionId), SESS_TTL);
  } else {
    pipe.incr(keys.sessSongsSkip(sessionId));
    pipe.expire(keys.sessSongsSkip(sessionId), SESS_TTL);
  }
  await pipe.exec();
}

export async function ensureDailyTTL(redis, userId) {
  const ttl = await redis.ttl(keys.userDailyAds(userId));
  if (ttl < 0) {
    await redis.expire(keys.userDailyAds(userId), secondsUntilMidnightUTC());
  }
}
