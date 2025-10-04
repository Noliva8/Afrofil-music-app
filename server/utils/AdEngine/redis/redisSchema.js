
import { getRedis } from "./redisClient.js";

/** ──────────────────────────────────────────────────────────
 * Utils (declare before K because K uses normIdx)
 * ────────────────────────────────────────────────────────── */
export function normIdx(s) {
  return (s ?? "").toString().trim().toLowerCase();
}


// exact date the user is starting to play the son
export function todayKeyUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}




const parseJSON = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };



export function normalizeGeo(raw = {}) {
  const {
    country = "", state = "", city = "",
    latitude = null, longitude = null,
    accuracyMeters = null, source = ""
  } = raw || {};
  return {
    country: country?.trim() || "",
    state: state?.trim() || "",
    city: city?.trim() || "",
    latitude: Number.isFinite(+latitude) ? +latitude : null,
    longitude: Number.isFinite(+longitude) ? +longitude : null,
    accuracyMeters: Number.isFinite(+accuracyMeters) ? +accuracyMeters : null,
    source: source?.trim() || ""
  };
}

function tempoBucketFromBpm(bpm) {
  const n = Number(bpm) || 0;
  if (n <= 0) return '';
  if (n < 85) return 'slow';
  if (n < 110) return 'mid';
  if (n < 135) return 'fast';
  return 'veryfast';
}

export function cryptoRandom(n = 6) {
  return Math.random().toString(36).slice(2, 2 + n);
}



/** ──────────────────────────────────────────────────────────
 * TTLs (seconds)
 * ────────────────────────────────────────────────────────── */
export const TTL = {
  SESSION: 48 * 3600,
  RECENT_SONGS: 30 * 24 * 3600,
  GENRE_AFFINITY: 180 * 24 * 3600,
  AD_FREQCAP: 2 * 24 * 3600,
  USER_ADS_RECENT: 14 * 24 * 3600,
};



/** ──────────────────────────────────────────────────────────
 * Keys
 * ────────────────────────────────────────────────────────── */
export const K = {
  // profile (compat: store in both)
  userProfile: (userId) => `user:${userId}`,
  userProfileDetailed: (userId) => `user:profile:${userId}`,

  idxCountryUsers: (country) => `idx:country:users:${country}`,

  session: (sid) => `session:${sid}`,
  sessionEvents: (sid) => `session:${sid}:events`,

  userAgg: (uid) => `user:agg:${uid}`,
  eventSeen: (eventId) => `evt:seen:${eventId}`,

  userGenreAffinity: (uid) => `user:genre-affinity:${uid}`,
  userMoodAffinity: (uid) => `user:mood-affinity:${uid}`,
  userRecentSongs: (uid) => `user:recent-songs:${uid}`,
  userLikedSongs: (uid) => `user:liked-songs:${uid}`,

  campaign: (cid) => `ad:campaign:${cid}`,
  creative: (adId) => `ad:creative:${adId}`,
  adIndexActive: "ad:index:active",

  idxAdCountry: (country) => `idx:ad:country:${country}`,
  idxAdRole: (role) => `idx:ad:role:${role}`,
  idxAdGenre: (genre) => `idx:ad:genre:${normIdx(genre)}`,
  idxAdMood: (mood) => `idx:ad:mood:${normIdx(mood)}`,
  idxAdSubMood: (subMood) => `idx:ad:submood:${normIdx(subMood)}`,

  userCap: (uid, cid, yyyymmdd) => `user:cap:${uid}:${cid}:${yyyymmdd}`,
  userAdsRecent: (uid) => `user:ads:${uid}:recent`,
  adAnalyticsDay: (cid, day) => `ad:analytics:${cid}:${day}`,

  genreTopTracks: (genre) => `genre:top-tracks:${genre}`,
  songMeta: (songId) => `song:meta:${songId}`,

  userEligibleAds: (uid) => `user:eligible-ads:${uid}`,

  // content indexes
  idxSongArtist   : (artistId)  => `idx:song:artist:${artistId}`,
  idxSongAlbum    : (albumId)   => `idx:song:album:${albumId}`,
  idxSongGenre    : (genre)     => `idx:song:genre:${normIdx(genre)}`,
  idxSongMood     : (mood)      => `idx:song:mood:${normIdx(mood)}`,
  idxSongSubMood  : (subMood)   => `idx:song:submood:${normIdx(subMood)}`,
  idxSongTempo    : (bucket)    => `idx:song:tempo:${normIdx(bucket)}`,
  idxSongCountry  : (country)   => `idx:song:country:${normIdx(country)}`,


  // song mirror
  


};






/** ──────────────────────────────────────────────────────────
 * 1) USER IDENTITY
 * ────────────────────────────────────────────────────────── */
export async function upsertUserProfile(p) {
  const r = await getRedis();
  const now = Date.now();
  const data = {
    role: p.role,
    country: p.country || "",
    state: p.state || "",
    city: p.city || "",
    lat: p.lat != null ? String(p.lat) : "",
    lon: p.lon != null ? String(p.lon) : "",
    age: p.age != null ? String(p.age) : "",
    updatedAt: String(now),
  };
  // write both for compatibility
  await r.hSet(K.userProfile(p.userId), data);
  await r.hSet(K.userProfileDetailed(p.userId), data);

  if (data.country) {
    await r.sAdd(K.idxCountryUsers(data.country), p.userId);
  }
}





export async function getUserProfile(userId) {
  const r = await getRedis();
  let h = await r.hGetAll(K.userProfile(userId));
  if (!h || !Object.keys(h).length) {
    h = await r.hGetAll(K.userProfileDetailed(userId));
  }
  if (!h || !Object.keys(h).length) return null;
  return {
    userId,
    role: h.role,
    country: h.country || "",
    state: h.state || "",
    city: h.city || "",
    lat: h.lat ? +h.lat : null,
    lon: h.lon ? +h.lon : null,
    age: h.age ? +h.age : null,
    updatedAt: h.updatedAt ? +h.updatedAt : 0,
  };
}

/** ──────────────────────────────────────────────────────────
 * 2) USER BEHAVIOR (SESSIONS + EVENTS + CUMULATIVE)
 * ────────────────────────────────────────────────────────── */

export async function beginOrTouchSession(p) {
  const r = await getRedis();
  const now = Date.now();
  const m = r.multi();
  m.hSet(K.session(p.sessionId), {
    userId: String(p.userId || ''),
    device: String(p.device || ''),
    role:   String(p.role   || ''),
    country: p.country || "",
    city:    p.city || "",
    lastEventTs: String(now),
  });
  m.expire(K.session(p.sessionId), TTL.SESSION);
  await m.exec();
}


export async function getSession(sessionId) {
  const r = await getRedis();
  const h = await r.hGetAll(K.session(sessionId));
  if (!h || !Object.keys(h).length) return null;
  return {
    sessionId,
    userId: h.userId,
    device: h.device,
    role: h.role,
    country: h.country || "",
    city: h.city || "",
    songsPlayed: h.songsPlayed ? +h.songsPlayed : 0,
    songsFinished: h.songsFinished ? +h.songsFinished : 0,
    songsSkipped: h.songsSkipped ? +h.songsSkipped : 0,
    ms_listened: h.ms_listened ? +h.ms_listened : 0,
    timeSecs: h.timeSecs ? +h.timeSecs : 0,
    lastEventTs: h.lastEventTs ? +h.lastEventTs : null,
  };
}

export async function incrSessionCounters(sessionId, fields = {}) {
  const r = await getRedis();
  const m = r.multi();
  for (const [k, v] of Object.entries(fields)) {
    m.hIncrBy(K.session(sessionId), k, Number(v) || 0);
  }
  m.hSet(K.session(sessionId), { lastEventTs: String(Date.now()) });
  m.expire(K.session(sessionId), TTL.SESSION);
  await m.exec();
}

/**
 * Append a session event to stream; keep ~10k most recent
 * @param {{sessionId:string, type:string, userId:string, songId?:string, genre?:string, ts?:number}} e
 */
export async function addSessionEvent(e) {
  const r = await getRedis();
  const ts = String(e.ts || Date.now());
  const streamKey = K.sessionEvents(e.sessionId);

  await r.xAdd(streamKey, "*", {
    type: String(e.type || ''),
    userId: String(e.userId || ''),
    songId: String(e.songId || ''),
    genre:  String(e.genre || ''),
    ts
  });

  // exact trim (node-redis v4 signature)
  await r.xTrim(streamKey, 'MAXLEN', 10000);

  // If you prefer approximate (~), use the raw command instead:
  // await r.sendCommand(['XTRIM', streamKey, 'MAXLEN', '~', '10000']);
}

/**
 * Increment user aggregate counters.
 * @param {{userId:string, plays?:number, skips?:number, completes?:number, previews?:number, quits?:number, ms_listened?:number}} a
 */
export async function incrUserAgg(a) {
  const r = await getRedis();
  const m = r.multi();
  const key = K.userAgg(a.userId);
  for (const [k, v] of Object.entries(a)) {
    if (k === "userId") continue;
    m.hIncrBy(key, k, Number(v) || 0);
  }
  m.hSet(key, { lastActiveTs: String(Date.now()) });
  await m.exec();
}

/** Dedup short-lived event id (SETNX semantics) */
export async function markEventSeen(eventId, ttlSec = 24 * 3600) {
  const r = await getRedis();
  const k = K.eventSeen(eventId);
  const ok = await r.set(k, "1", { NX: true, EX: ttlSec });
  return ok === "OK";
}

/** ──────────────────────────────────────────────────────────
 * 3) PREFERENCES / AFFINITY / RECENCY
 * ────────────────────────────────────────────────────────── */
export async function addRecentSong(userId, songId, cap = 50) {
  const r = await getRedis();
  const m = r.multi();
  m.lPush(K.userRecentSongs(userId), songId);
  m.lTrim(K.userRecentSongs(userId), 0, cap - 1);
  m.expire(K.userRecentSongs(userId), TTL.RECENT_SONGS);
  await m.exec();
}

export async function adjustGenreAffinity(userId, genre, delta) {
  const r = await getRedis();
  const key = K.userGenreAffinity(userId);
  await r.zIncrBy(key, Number(delta) || 0, normIdx(genre));
  await r.expire(key, TTL.GENRE_AFFINITY);
}

export async function adjustMoodAffinity(userId, mood, delta) {
  const r = await getRedis();
  const key = K.userMoodAffinity(userId);
  await r.zIncrBy(key, Number(delta) || 0, normIdx(mood));
  await r.expire(key, TTL.GENRE_AFFINITY);
}

export async function setSongLiked(userId, songId, liked = true) {
  const r = await getRedis();
  if (liked) return r.sAdd(K.userLikedSongs(userId), songId);
  return r.sRem(K.userLikedSongs(userId), songId);
}

/** ──────────────────────────────────────────────────────────
 * 4) ADS: CAMPAIGNS / INDEXES / FREQ CAP / ANALYTICS
 * ────────────────────────────────────────────────────────── */
export async function upsertCampaign(c) {
  const r = await getRedis();
  const key = K.campaign(c.campaignId);

  // fetch previous targeting to clean old index entries
  let prevTargeting = null;
  try {
    const prevStr = await r.hGet(key, "targeting");
    prevTargeting = prevStr ? JSON.parse(prevStr) : null;
  } catch {
    prevTargeting = null;
  }

  const payload = {
    status: c.status,
    advertiserId: c.advertiserId || "",
    adId: c.adId || "",
    isCostConfirmed: c.isCostConfirmed ? "1" : "0",
    isPaid: c.isPaid ? "1" : "0",
    isApproved: c.isApproved ? "1" : "0",
    priority: String(c.priority ?? 0),
    floorCpm: String(c.floorCpm ?? 0),
    durationSec: String(c.durationSec ?? 15),
    maxPerUserPerDay: String(c.maxPerUserPerDay ?? 0),
    targeting: JSON.stringify(c.targeting || {}),
    schedule: JSON.stringify(c.schedule || {}),
    updatedAt: String(Date.now()),
  };

  await r.hSet(key, payload);

  // Maintain active set
  const eligibleActive =
    c.status === "active" &&
    c.isCostConfirmed === true &&
    c.isPaid === true &&
    c.isApproved === true;

  if (eligibleActive) {
    await r.sAdd(K.adIndexActive, c.campaignId);
  } else {
    await r.sRem(K.adIndexActive, c.campaignId);
  }

  // Clean previous targeting index memberships (if any)
  if (prevTargeting) {
    const p = prevTargeting;
    const m = r.multi();
    (p.countries || []).forEach((country) => m.sRem(K.idxAdCountry(normIdx(country)), c.campaignId));
    (p.roles || []).forEach((role) => m.sRem(K.idxAdRole(normIdx(role)), c.campaignId));
    (p.genres || []).forEach((genre) => m.sRem(K.idxAdGenre(normIdx(genre)), c.campaignId));
    (p.moods || []).forEach((mood) => m.sRem(K.idxAdMood(normIdx(mood)), c.campaignId));
    (p.subMoods || []).forEach((sm) => m.sRem(K.idxAdSubMood(normIdx(sm)), c.campaignId));
    await m.exec();
  }

  // Add current targeting to indexes
  const t = c.targeting || {};
  const m2 = r.multi();
  (t.countries || []).forEach((country) => m2.sAdd(K.idxAdCountry(normIdx(country)), c.campaignId));
  (t.roles || []).forEach((role) => m2.sAdd(K.idxAdRole(normIdx(role)), c.campaignId));
  (t.genres || []).forEach((genre) => m2.sAdd(K.idxAdGenre(normIdx(genre)), c.campaignId));
  (t.moods || []).forEach((mood) => m2.sAdd(K.idxAdMood(normIdx(mood)), c.campaignId));
  (t.subMoods || []).forEach((sm) => m2.sAdd(K.idxAdSubMood(normIdx(sm)), c.campaignId));
  await m2.exec();
}

export async function upsertCreative(adId, creative) {
  const r = await getRedis();
  const f = {};

  // canonical fields (match your schema)
  if (creative.masterAudionAdUrl)        f.masterAudionAdUrl        = creative.masterAudionAdUrl;
  if (creative.streamingFallBackAudioUrl) f.streamingFallBackAudioUrl = creative.streamingFallBackAudioUrl;
  if (creative.streamingAudioAdUrl)       f.streamingAudioAdUrl       = creative.streamingAudioAdUrl;
  if (creative.adArtWorkUrl)              f.adArtWorkUrl              = creative.adArtWorkUrl;
  if (creative.streamingOverlayAdUrl)     f.streamingOverlayAdUrl     = creative.streamingOverlayAdUrl;
  if (creative.originalOverlayUrl)        f.originalOverlayUrl        = creative.originalOverlayUrl;
  if (creative.streamingBannerAdUrl)      f.streamingBannerAdUrl      = creative.streamingBannerAdUrl;
  if (creative.originalBannerAdUrl)       f.originalBannerAdUrl       = creative.originalBannerAdUrl;

  // legacy aliases → map into canonical (harmless if missing)
  if (creative.masterAudioAdUrl && !f.masterAudionAdUrl)              f.masterAudionAdUrl        = creative.masterAudioAdUrl;
  if (creative.streamingFallbackAudioUrl && !f.streamingFallBackAudioUrl) f.streamingFallBackAudioUrl = creative.streamingFallbackAudioUrl;
  if (creative.adArtworkUrl && !f.adArtWorkUrl)                       f.adArtWorkUrl              = creative.adArtworkUrl;

  await r.hSet(K.creative(adId), f);
}


/**
 * Intersect active campaigns with optional facet indexes
 * @param {{country?:string, role?:string, genres?:string[], moods?:string[], subMoods?:string[]}} f
 * @returns {Promise<string[]>}
 */
export async function eligibleCampaignIds(f = {}) {
  const r = await getRedis();
  const keys = [K.adIndexActive];

  if (f.country) keys.push(K.idxAdCountry(normIdx(f.country)));
  if (f.role) keys.push(K.idxAdRole(normIdx(f.role)));

  // union helper for multi-value facets
  let tmpGenreKey, tmpMoodKey, tmpSubMoodKey;

  if (f.genres?.length) {
    tmpGenreKey = `tmp:genre:union:${cryptoRandom(8)}`;
    await r.sUnionStore(tmpGenreKey, f.genres.map((g) => K.idxAdGenre(normIdx(g))));
    keys.push(tmpGenreKey);
  }

  if (f.moods?.length) {
    tmpMoodKey = `tmp:mood:union:${cryptoRandom(8)}`;
    await r.sUnionStore(tmpMoodKey, f.moods.map((m) => K.idxAdMood(normIdx(m))));
    keys.push(tmpMoodKey);
  }

  if (f.subMoods?.length) {
    tmpSubMoodKey = `tmp:submood:union:${cryptoRandom(8)}`;
    await r.sUnionStore(tmpSubMoodKey, f.subMoods.map((sm) => K.idxAdSubMood(normIdx(sm))));
   keys.push(tmpSubMoodKey);
  }

  const ids = await r.sInter(keys);

  // cleanup
  if (tmpGenreKey) await r.del(tmpGenreKey);
  if (tmpMoodKey) await r.del(tmpMoodKey);
  if (tmpSubMoodKey) await r.del(tmpSubMoodKey);

  return ids;
}

/** Frequency cap: try to reserve an impression slot (returns true if allowed) */
export async function tryReserveFreqCap(userId, campaignId, maxPerUserPerDay = 0) {
  if (!maxPerUserPerDay || maxPerUserPerDay <= 0) return true;
  const r = await getRedis();
  const day = todayKeyUTC();
  const key = K.userCap(userId, campaignId, day);
  const count = await r.incr(key);
  if (count === 1) await r.expire(key, TTL.AD_FREQCAP);
  if (count > maxPerUserPerDay) {
    await r.decr(key);
    return false;
  }
  return true;
}

/** Record a lightweight ad event on user + aggregate analytics */
export async function recordAdImpression({
  userId,
  campaignId,
  adId,
  event = "impression",
  completed = false,
  clicked = false
}) {
  const r = await getRedis();
  const day = todayKeyUTC();
  const now = Date.now();
  const m = r.multi();

  // per-user recent log
  m.lPush(K.userAdsRecent(userId), `${campaignId}|${adId || ""}|${event}|${now}`);
  m.lTrim(K.userAdsRecent(userId), 0, 49);
  m.expire(K.userAdsRecent(userId), TTL.USER_ADS_RECENT);

  // per-campaign daily hash
  const aggKey = K.adAnalyticsDay(campaignId, day);
  if (event === "impression") m.hIncrBy(aggKey, "impressions", 1);
  if (completed) m.hIncrBy(aggKey, "completed", 1);
  if (clicked) m.hIncrBy(aggKey, "clicks", 1);

  await m.exec();
}

/** Cache a per-user shortlist of eligible ads (priority as score) */
export async function cacheEligibleAds(userId, campaignIdsWithPriority = [], ttlSec = 1200) {
  const r = await getRedis();
  const key = K.userEligibleAds(userId);
  if (!campaignIdsWithPriority.length) {
    await r.del(key);
    return;
  }
  const m = r.multi();
  m.del(key);
  campaignIdsWithPriority.forEach(([cid, priority]) => {
    m.zAdd(key, [{ score: Number(priority) || 0, value: cid }]);
  });
  m.expire(key, ttlSec);
  await m.exec();
}

export async function getCachedEligibleAds(userId, limit = 10) {
  const r = await getRedis();
  return r.zRange(K.userEligibleAds(userId), -limit, -1, { REV: true });
}

/** ──────────────────────────────────────────────────────────
 * SONG META + INDEXES
 * ────────────────────────────────────────────────────────── */
export async function upsertSongMeta(s) {
  const r = await getRedis();

  // previous values to clean old memberships
  const prev = await r.hGetAll(K.songMeta(s.songId));
  const prevGenre   = prev?.genre || '';
  const prevMood    = prev?.mood || '';
  const prevSubsArr = parseJSON(prev?.subMoodsJson) || (prev?.subMood ? [prev.subMood] : []);
  const prevTempo   = prev?.tempoBucket || '';
  const prevArtist  = prev?.artistId || '';
  const prevAlbum   = prev?.albumId || '';
  const prevCountry = prev?.artistCountry || '';

  const subsNorm = Array.isArray(s.subMoods)
    ? s.subMoods.filter(Boolean).map((x) => normIdx(x)).filter(Boolean)
    : (s.subMood ? [normIdx(s.subMood)] : []);
  const primarySub = subsNorm[0] || '';

  const payload = {
    artistId: s.artistId || '',
    albumId: s.albumId || '',
    title: s.title || '',
    genre: normIdx(s.genre || ''),
    mood: normIdx(s.mood || ''),
    subMood: primarySub,                         // backward compat
    subMoodsJson: JSON.stringify(subsNorm),      // full array
    tempoBpm: String(Number(s.tempoBpm || 0)),
    tempoBucket: normIdx(tempoBucketFromBpm(s.tempoBpm)),
    artistCountry: normIdx(s.artistCountry || ''),
    artworkUrl: s.artworkUrl || '',
    updatedAt: String(Date.now()),
  };

  await r.hSet(K.songMeta(s.songId), payload);

  // clean old
  const m1 = r.multi();
  if (prevArtist && prevArtist !== payload.artistId)      m1.sRem(K.idxSongArtist(prevArtist), s.songId);
  if (prevAlbum  && prevAlbum  !== payload.albumId)       m1.sRem(K.idxSongAlbum(prevAlbum), s.songId);
  if (prevGenre  && prevGenre  !== payload.genre)         m1.sRem(K.idxSongGenre(prevGenre), s.songId);
  if (prevMood   && prevMood   !== payload.mood)          m1.sRem(K.idxSongMood(prevMood), s.songId);
  if (prevTempo  && prevTempo  !== payload.tempoBucket)   m1.sRem(K.idxSongTempo(prevTempo), s.songId);
  if (prevCountry&& prevCountry!== payload.artistCountry) m1.sRem(K.idxSongCountry(prevCountry), s.songId);
  if (prevSubsArr?.length) {
    prevSubsArr.forEach((sm) => m1.sRem(K.idxSongSubMood(sm), s.songId));
  }
  await m1.exec();

  // add new
  const m2 = r.multi();
  if (payload.artistId)      m2.sAdd(K.idxSongArtist(payload.artistId), s.songId);
  if (payload.albumId)       m2.sAdd(K.idxSongAlbum(payload.albumId), s.songId);
  if (payload.genre)         m2.sAdd(K.idxSongGenre(payload.genre), s.songId);
  if (payload.mood)          m2.sAdd(K.idxSongMood(payload.mood), s.songId);
  if (payload.tempoBucket)   m2.sAdd(K.idxSongTempo(payload.tempoBucket), s.songId);
  if (payload.artistCountry) m2.sAdd(K.idxSongCountry(payload.artistCountry), s.songId);
  subsNorm.forEach((sm) => m2.sAdd(K.idxSongSubMood(sm), s.songId));
  await m2.exec();
}
