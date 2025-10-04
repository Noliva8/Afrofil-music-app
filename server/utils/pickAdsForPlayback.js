// ---- server/ads/pickForPlayback.js
import { getRedis } from './AdEngine/redis/redisClient.js';
import { K, todayKeyUTC, normIdx, TTL  } from './AdEngine/redis/redisSchema.js';
import { cryptoRandom } from './AdEngine/redis/redisSchema.js';



import {Ad} from '../models/Advertizer/index_advertizer.js' 

// Read + JSON-parse helpers
function parseJSONSafe(s, fallback = null) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

async function loadCampaign(r, campaignId) {
  const h = await r.hGetAll(K.campaign(campaignId));
  if (!h || !h.status) return null;
  return {
    campaignId,
    status: h.status,
    advertiserId: h.advertiserId || '',
    adId: h.adId || '',
    isCostConfirmed: h.isCostConfirmed === '1',
    isPaid: h.isPaid === '1',
    isApproved: h.isApproved === '1',
    priority: Number(h.priority || 0),
    floorCpm: Number(h.floorCpm || 0),
    durationSec: Number(h.durationSec || 15),
    maxPerUserPerDay: Number(h.maxPerUserPerDay || 0),
    targeting: parseJSONSafe(h.targeting, {}),
    schedule: parseJSONSafe(h.schedule, {}),
    updatedAt: Number(h.updatedAt || 0),
  };
}

async function loadCreative(r, adId) {
  const h = await r.hGetAll(K.creative(adId));
  if (!h || !Object.keys(h).length) return null;
  return {
    // canonical to your schema:
    streamingAudioAdUrl:       h.streamingAudioAdUrl || null,
    streamingFallBackAudioUrl: h.streamingFallBackAudioUrl || null,
    masterAudionAdUrl:         h.masterAudionAdUrl || null,
    adArtWorkUrl:              h.adArtWorkUrl || null,
    // optional (not used as cover, but fine to return)
    streamingOverlayAdUrl:     h.streamingOverlayAdUrl || null,
    originalOverlayUrl:        h.originalOverlayUrl || null,
    streamingBannerAdUrl:      h.streamingBannerAdUrl || null,
    originalBannerAdUrl:       h.originalBannerAdUrl || null,
  };
}

/** frequency cap: true if allowed */
async function tryReserveFreqCap(userId, campaignId, maxPerUserPerDay = 0) {
  if (!maxPerUserPerDay || maxPerUserPerDay <= 0) return true;
  const r = await getRedis();
  const day = todayKeyUTC();
  const key = K.userCap(userId || 'anon', campaignId, day);
  const count = await r.incr(key);
  if (count === 1) await r.expire(key, TTL.AD_FREQCAP);
  if (count > maxPerUserPerDay) {
    await r.decr(key);
    return false;
  }
  return true;
}

/** intersect active with facet indexes you already maintain */
export async function eligibleCampaignIds(f = {}) {
  const r = await getRedis();
  const keys = [K.adIndexActive];
  if (f.country) keys.push(K.idxAdCountry(normIdx(f.country)));
  if (f.role)    keys.push(K.idxAdRole(normIdx(f.role)));

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
    keys.push(tmpSubMoodKey); // ✅ fixed
  }

  const ids = await r.sInter(keys);

  if (tmpGenreKey)   await r.del(tmpGenreKey);
  if (tmpMoodKey)    await r.del(tmpMoodKey);
  if (tmpSubMoodKey) await r.del(tmpSubMoodKey);

  return ids;
}

/** schedule gate (read-time check) */
function isWithinSchedule(schedule, now = Date.now()) {
  if (!schedule) return false;
  const start = +new Date(schedule.startDate || schedule.start || 0);
  const end   = +new Date(schedule.endDate   || schedule.end   || 0);
  return Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end;
}

/** main: pick a playable ad (campaign + creative), warming Redis from Mongo if needed */
export async function pickAdForPlayback({ userId, geo = {}, facets = {} }) {
  const r = await getRedis();
  const now = Date.now();

  // 1) intersect by active + targeting facets you already indexed
  const ids = await eligibleCampaignIds({
    country: geo.country,
    role:    facets.role,
    genres:  facets.genres,
    moods:   facets.moods,
    subMoods: facets.subMoods,
  });

  if (!ids.length) return null;

  // 2) load campaigns, guard by schedule & flags, then pick
  const campaigns = [];
  for (const campaignId of ids) {
    const c = await loadCampaign(r, campaignId);
    if (!c) continue;
    if (!(c.status === 'active' && c.isApproved && c.isPaid && c.isCostConfirmed)) continue;
    if (!isWithinSchedule(c.schedule, now)) continue;
    campaigns.push(c);
  }
  if (!campaigns.length) return null;

  // Example: simple random; replace with weighted by priority/floorCpm if you like
  const chosen = campaigns[Math.floor(Math.random() * campaigns.length)];
  const ok = await tryReserveFreqCap(userId, chosen.campaignId, chosen.maxPerUserPerDay);
  if (!ok) return null;

  // 3) load creative hash; lazy-warm from Mongo on miss
  let creative = await loadCreative(r, chosen.adId);
  if (!creative) {
    const adDoc = await Ad.findById(chosen.adId).lean();
    if (adDoc) {
      // warm creative + (optionally) re-upsert campaign in case schema changed
      await upsertCreative(chosen.adId, adDoc);
      // (optional) await upsertCampaign({...from adDoc/campaign...});
      creative = await loadCreative(r, chosen.adId);
    }
  }
  if (!creative) return null;

  // 4) build the exact object your client expects
  return {
    _id: chosen.adId,
    adTitle: chosen.adTitle || '',           // add to campaign payload if you want it in Redis
    adType: 'audio',                         // we’re selecting for audio use-case here
    audioDurationMs: (chosen.durationSec || 0) * 1000,
    streamingAudioAdUrl:       creative.streamingAudioAdUrl || null,
    streamingFallBackAudioUrl: creative.streamingFallBackAudioUrl || null,
    masterAudionAdUrl:         creative.masterAudionAdUrl || null,
    adArtWorkUrl:              creative.adArtWorkUrl || null,
  };
}
