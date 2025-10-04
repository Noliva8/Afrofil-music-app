

import { getRedis } from "../../../../utils/AdEngine/redis/redisClient.js";



/** ---------- Config ---------- */
const AC = {
  // Memory alert threshold (MB) for all "ad:*" keys combined
  ADS_MAX_MB: 10,

  // Index keys
  AD_PREFIX: "ad:",                 // HASH per ad

//   other queries
  IDX_ACTIVE: "index:ads:active",   // SET of active adIds
  IDX_READY:  "index:ads:ready",    // ZSET adId -> nextEligibleAt (ms epoch)
  byAdvertiser: (advId) => `index:advertiser:${advId}:ads`,

  // query by location
  byWoldwide: (ww) => `index:ads:worldwide:${ww}`,
  byCountry: (cc) => `index:ads:country:${cc}`,
  byCity: (city) => `index:ads:city:${city}`,
  byState: (state) => `index:ads:state:${state}`,

//   query by type
byType: (type) => `index:ads:type:${type}`,
// platform
  byPlatform: (p) => `index:ads:platform:${p}`,
  byLanguage: (l) => `index:ads:lang:${l}`,

  // Per-user cap/cooldown keys
  freqKey: (userId, adId, hourKey) => `freq:${userId}:${adId}:${hourKey}`, // TTL ~1h
  coolKey: (userId, adId) => `cool:${userId}:${adId}`,                      // TTL = minGapSec

  // Candidate scan limits
  READY_BATCH_SIZE: 50,      // how many ready ads to consider each pick
  WATCH_RETRY: 2,            // retry times for optimistic transaction
  TTL_BUFFER_SEC: 48 * 3600, // expire ad hash this much after endAt
};





/** ---------- Small utils ---------- */
const toMs = (v) => (v instanceof Date ? v.getTime() : Number(v) || 0);
const nowMs = () => Date.now();
const hourKey = (ms = nowMs()) => {
  const d = new Date(ms);
  // yyyyMMddHH
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}${m}${day}${h}`;
};


const withTimeout = (promise, timeoutMs = 5000, errorMessage = "Operation timeout") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);

async function notifyAdmin(subject, details) {
  // Wire Slack/email if you want; this is non-blocking logging
  console.warn("[ADMIN]", subject, details || {});
}


function adKey(id) {
  return `${AC.AD_PREFIX}${id}`;
}


// this function calculates the space between ads to achieve desired impressions within campain period.
function computeIdealIntervalSec(targetImpressions, startAtMs, endAtMs) {
  const tImpr = Math.max(1, Number(targetImpressions || 0));
  const start = Number(startAtMs || 0);
  const end = Number(endAtMs || 0);
  if (!start || !end || end <= start) return 60; // fallback: 1 minute
  const totalSec = Math.max(1, Math.floor((end - start) / 1000));
  return Math.max(5, Math.floor(totalSec / tImpr)); // ≥5s spacing
}


/** Engagement-weighted + pacing-aware scoring */
function scoreCandidate(ad, now = nowMs()) {
  const priority = Number(ad.priority || 0);
  const eCPM = Number(ad.eCPM || 0);

  const startAt = toMs(ad.startAt);
  const endAt = toMs(ad.endAt);
  const delivered = Number(ad.deliveredImpressions || 0);
  const target = Math.max(1, Number(ad.targetImpressions || 0));

  // Expected progress by now
  let underdeliveryIndex = 0;
  if (startAt && endAt && now >= startAt) {
    const frac = Math.min(1, Math.max(0, (now - startAt) / (endAt - startAt)));
    const shouldHave = Math.floor(frac * target);
    underdeliveryIndex = Math.max(0, shouldHave - delivered) / target; // 0..1
  }

  // Recent penalty if we served too recently vs ideal interval
  const lastServedAt = toMs(ad.lastServedAt) || 0;
  const idealSec = Number(ad.idealIntervalSec || 60);
  const recentPenalty =
    lastServedAt && now - lastServedAt < idealSec * 1000
      ? (idealSec * 1000 - (now - lastServedAt)) / (idealSec * 1000)
      : 0; // 0..1

  // Simple linear combination
  const w = { P: 2.0, B: 1.5, U: 2.5, R: 1.0 };
  const base = w.P * priority + w.B * eCPM + w.U * underdeliveryIndex - w.R * recentPenalty;
  return base;
}


/** TTL based on endAt (+buffer). If endAt is in the past, expire soon (1h). */
async function setAdTTL(r, adId, endAtMs) {
  try {
    const key = adKey(adId);
    const now = nowMs();
    let expireAtSec;
    if (endAtMs) {
      const when = Math.floor((Number(endAtMs) + AC.TTL_BUFFER_SEC * 1000) / 1000);
      expireAtSec = when;
    } else {
      // if no endAt, keep; or set long TTL (optional). We'll skip TTL in this case.
      return;
    }
    if (expireAtSec <= Math.floor(now / 1000)) {
      // already ended — expire in 1 hour
      await r.expire(key, 3600);
    } else {
      await r.expireAt(key, expireAtSec);
    }
  } catch (e) {
    console.warn("[ads] setAdTTL failed:", e?.message || e);
  }
}

/** Light memory accounting of all ad:* keys; alerts if > ADS_MAX_MB */
async function checkAdsMemory(r) {
  try {
    let cursor = "0";
    let bytes = 0;
    do {
      const res = await r.scan(cursor, { MATCH: `${AC.AD_PREFIX}*`, COUNT: 200 });
      cursor = res.cursor;
      const keys = res.keys || res[1] || []; // node-redis returns {cursor, keys}
      if (keys.length) {
        const pipeline = r.multi();
        for (const k of keys) pipeline.memoryUsage(k);
        const sizes = await pipeline.exec();
        for (const s of sizes) {
          const sz = Array.isArray(s) ? s[1] : s;
          if (Number.isFinite(sz)) bytes += Number(sz);
        }
      }
    } while (cursor !== "0");

    const mb = bytes / (1024 * 1024);
    if (mb > AC.ADS_MAX_MB) {
      await notifyAdmin("Ad cache memory above threshold", { usedMB: +mb.toFixed(2) });
    }
  } catch (e) {
    console.warn("[ads] memory scan failed:", e?.message || e);
  }
}



/** Normalize input ad doc into fields we store in hash */

function shapeAdForHash(adDoc = {}) {

  const id = String(adDoc?._id ?? adDoc?.id ?? "");

  // Basics
  const advertiser = adDoc?.advertiserId ? String(adDoc.advertiserId) : "";
  const campaign   = adDoc?.campaignId ? String(adDoc.campaignId) : "";
  const adTitle    = adDoc?.adTitle ? String(adDoc.adTitle) : "";
  const description= adDoc?.description ? String(adDoc.description) : "";
  const adType     = adDoc?.adType ? String(adDoc.adType) : ""; // 'audio' | 'banner' | 'overlay'

  // Targeting (inline object)
  const targetingScope = adDoc?.targeting?.scope ? String(adDoc.targeting.scope) : ""; // 'worldwide' | 'country' | 'city'
  const targetingCountries = Array.isArray(adDoc?.targeting?.countries)
    ? adDoc.targeting.countries.map(String).join(",")
    : (adDoc?.targeting?.countries ? String(adDoc.targeting.countries) : "");
  const targetingWholeCountry = adDoc?.targeting?.wholeCountry === true ? "1" : "0";
  const targetingState = adDoc?.targeting?.state ? String(adDoc.targeting.state) : "";
  const targetingCity  = adDoc?.targeting?.city  ? String(adDoc.targeting.city)  : "";

  // Schedule
  const startAt = toMs(adDoc?.schedule?.startDate) ?? null;
  const endAt   = toMs(adDoc?.schedule?.endDate) ?? null;

  // Pricing / Payment
  const isCostConfirmed = adDoc?.isCostConfirmed === true ? "1" : "0";
  const pricingDailyRate = adDoc?.pricing?.dailyRate != null ? Number(adDoc.pricing.dailyRate) : null;
  const pricingTotalCost = adDoc?.pricing?.totalCost != null ? Number(adDoc.pricing.totalCost) : null;

  const isPaid = adDoc?.isPaid === true ? "1" : "0";
  const paidAt = toMs(adDoc?.paidAt) ?? null;

  // Creative (keep URLs/ids only — small payload)
  const streamingOverlayAdUrl    = adDoc?.streamingOverlayAdUrl    || "";
  const originalOverlayUrl       = adDoc?.originalOverlayUrl        || "";
  const streamingBannerAdUrl     = adDoc?.streamingBannerAdUrl     || "";
  const originalBannerAdUrl      = adDoc?.originalBannerAdUrl      || "";
  const masterAudionAdUrl        = adDoc?.masterAudionAdUrl        || ""; // (schema spelling)
  const streamingAudioAdUrl      = adDoc?.streamingAudioAdUrl      || "";
  const streamingFallBackAudioUrl= adDoc?.streamingFallBackAudioUrl|| ""; // ✅ correct key per schema
  const adArtWorkUrl             = adDoc?.adArtWorkUrl             || "";

  const bannerFormat = adDoc?.bannerFormat || "";
  const audioFormat  = adDoc?.audioFormat  || "";

  // Analytics
  const analyticsImpressions     = Math.max(0, Number(adDoc?.analytics?.impressions || 0));
  const analyticsClicks          = Math.max(0, Number(adDoc?.analytics?.clicks || 0));
  const analyticsPlays           = Math.max(0, Number(adDoc?.analytics?.plays || 0));
  const analyticsSkips           = Math.max(0, Number(adDoc?.analytics?.skips || 0));
  const analyticsAvgPlayDuration = Math.max(0, Number(adDoc?.analytics?.avgPlayDuration || 0));
  const analyticsUniqueUsers     = Math.max(0, Number(adDoc?.analytics?.uniqueUsers || 0));
  const analyticsConversions     = Math.max(0, Number(adDoc?.analytics?.conversions || 0));
  const analyticsCTR             = Number(adDoc?.analytics?.clickThroughRate || 0);
  const analyticsLastUpdated     = toMs(adDoc?.analytics?.lastUpdated) ?? null;

  // Status/approval
  const status       = adDoc?.status ? String(adDoc.status) : "draft"; // enum in schema
  const isApproved   = adDoc?.isApproved === true ? "1" : "0";
  const approvedBy   = adDoc?.approvedBy ? String(adDoc.approvedBy) : "";
  const approvedAt   = toMs(adDoc?.approvedAt) ?? null;
  const rejectionReason = adDoc?.rejectionReason ? String(adDoc.rejectionReason) : "";

  // Misc / platform
  const platform = adDoc?.platform ? String(adDoc.platform) : "all";

  // Dimension/duration hints (if present)
  const audioDurationMs   = adDoc?.audioDurationMs != null ? Math.max(0, Number(adDoc.audioDurationMs)) : null;
  const bannerAdWidthPx   = adDoc?.bannerAdWidthPx != null ? Number(adDoc.bannerAdWidthPx) : null;
  const bannerAdHeghtPx   = adDoc?.bannerAdHeghtPx != null ? Number(adDoc.bannerAdHeghtPx) : null;

  // Timestamps
  const createdAt = toMs(adDoc?.createdAt) ?? nowMs();
  const updatedAt = toMs(adDoc?.updatedAt) ?? nowMs();

  // Return ONLY primitives/strings; nulls are fine for missing numbers
  return {
    _id: id,
    advertiser,
    campaign,
    adTitle,
    description,
    adType,

    targetingScope,
    targetingCountries,   // comma-joined for Redis hash
    targetingWholeCountry,
    targetingState,
    targetingCity,

    startAt,
    endAt,

    isCostConfirmed,
    pricingDailyRate,
    pricingTotalCost,

    isPaid,
    paidAt,

    streamingOverlayAdUrl,
    originalOverlayUrl,
    streamingBannerAdUrl,
    originalBannerAdUrl,
    masterAudionAdUrl,
    streamingAudioAdUrl,
    streamingFallBackAudioUrl,
    adArtWorkUrl,
    bannerFormat,
    audioFormat,

    analyticsImpressions,
    analyticsClicks,
    analyticsPlays,
    analyticsSkips,
    analyticsAvgPlayDuration,
    analyticsUniqueUsers,
    analyticsConversions,
    analyticsCTR,
    analyticsLastUpdated,

    status,
    isApproved,
    approvedBy,
    approvedAt,
    rejectionReason,

    platform,

    audioDurationMs,
    bannerAdWidthPx,
    bannerAdHeghtPx,

    createdAt,
    updatedAt
  };
}


export async function createOrUpdateAdRedis(adDoc) {
  if (!adDoc) throw new Error("adDoc required");

  // Bail fast if Redis is down
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
  } catch {
    throw new Error("Redis unavailable");
  }

  // Flatten doc -> hashable object
  const shaped = shapeAdForHash(adDoc);
  const id = shaped._id;
  if (!id) throw new Error("ad id missing");
  const key = adKey(id);
  const now = nowMs();

  // Status gating (schema enum)
  // valid: 'draft','waiting_for_approval','rejected','active','paused','completed'
  const isActive = shaped.status === "active";

  // Compute nextEligibleAt (store on hash)
  // - inactive: 0 (not schedulable)
  // - active but future start: startAt
  // - active and started: now
  let nextEligibleAt;
  if (!isActive) {
    nextEligibleAt = 0;
  } else if (shaped.startAt && now < Number(shaped.startAt)) {
    nextEligibleAt = Number(shaped.startAt);
  } else {
    nextEligibleAt = now;
  }

  // Prepare field map (stringify for HSET)
  const fields = {
    ...Object.fromEntries(
      Object.entries(shaped).map(([k, v]) => [k, String(v)])
    ),
    nextEligibleAt: String(nextEligibleAt)
  };

  // Targeting indexes
  const scope = shaped.targetingScope || "";
  const countriesCSV = shaped.targetingCountries || ""; // comma-joined by shaper
  const state = shaped.targetingState || "";
  const city  = shaped.targetingCity  || "";

  // Split countries safely
  const countryList = countriesCSV
    ? countriesCSV.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  // Type / platform
  const adType   = shaped.adType || "";
  const platform = shaped.platform || "";

  try {
    const m = r.multi();

    // 1) Store the ad hash
    m.hSet(key, fields);

    // 2) Status & scheduling indexes
    if (isActive) {
      // Active set + ready zset
      m.sAdd(AC.IDX_ACTIVE, id);
      m.zAdd(AC.IDX_READY, [{ score: nextEligibleAt, value: id }]);
    } else {
      m.sRem(AC.IDX_ACTIVE, id);
      m.zRem(AC.IDX_READY, id);
    }

    // 3) Advertiser index
    if (shaped.advertiser) {
      m.sAdd(AC.byAdvertiser(shaped.advertiser), id);
    }

    // 4) Type/platform indexes
    if (adType)   m.sAdd(AC.byType(adType), id);
    if (platform) m.sAdd(AC.byPlatform(platform), id);

    // 5) Targeting indexes (only index when ad is active to keep candidate scans lean)
    //    If you prefer to index regardless of status, remove the `isActive` check.
    if (isActive) {
      if (scope === "worldwide") {
        m.sAdd(AC.byWoldwide("1"), id);
      } else {
        // Ensure not in worldwide index
        m.sRem(AC.byWoldwide("1"), id);

        if (scope === "country" || scope === "city") {
          // Countries
          for (const cc of countryList) m.sAdd(AC.byCountry(cc), id);

          // State (US-like flows)
          if (scope !== "worldwide" && state) m.sAdd(AC.byState(state), id);

          // City
          if (scope === "city" && city) m.sAdd(AC.byCity(city), id);
        }
      }
    } else {
      // Remove from location indexes when not active
      m.sRem(AC.byWoldwide("1"), id);
      for (const cc of countryList) m.sRem(AC.byCountry(cc), id);
      if (state) m.sRem(AC.byState(state), id);
      if (city)  m.sRem(AC.byCity(city), id);
    }

    // 6) Exec transaction
    await withTimeout(m.exec(), 4000, "Ad upsert transaction timeout");

    // 7) TTL: expire hash after endAt + buffer
    if (shaped.endAt) {
      await setAdTTL(r, id, Number(shaped.endAt));
    }

    // 8) Async memory check (non-blocking)
    setTimeout(() => checkAdsMemory(r), 0);

    return { adId: id, nextEligibleAt };
  } catch (e) {
    console.error("[ads] upsert failed:", e?.message || e);
    throw new Error(`Failed to upsert ad: ${e.message}`);
  }
}






/** Delete ad from Redis (hash + indexes) */
export async function deleteAdRedis(adId) {
  if (!adId) return false;
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
  } catch {
    throw new Error("Redis unavailable");
  }
  const key = adKey(adId);
  try {
    const h = await r.hGetAll(key);
    const adv = h?.advertiser || "";
    const country = h?.country || "";
    const platform = h?.platform || "";
    const language = h?.language || "";

    const m = r.multi();
    m.sRem(AC.IDX_ACTIVE, adId);
    m.zRem(AC.IDX_READY, adId);
    if (adv) m.sRem(AC.byAdvertiser(adv), adId);
    if (country) m.sRem(AC.byCountry(country), adId);
    if (platform) m.sRem(AC.byPlatform(platform), adId);
    if (language) m.sRem(AC.byLanguage(language), adId);
    m.del(key);
    await withTimeout(m.exec(), 3000, "Ad delete transaction timeout");
    return true;
  } catch (e) {
    console.error("[ads] delete failed:", e?.message || e);
    throw new Error(`Failed to delete ad: ${e.message}`);
  }
}




/** Pick the next ad, respecting pacing, caps, window, and priority */
export async function pickNextAd(userCtx = {}) {
  const { userId = "", country = "", platform = "", language = "" } = userCtx;
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
  } catch {
    throw new Error("Redis unavailable");
  }

  const now = nowMs();

  // 1) Pull a batch of ready candidates (<= now)
  let ids = [];
  try {
    ids = await withTimeout(
      r.zRangeByScore(AC.IDX_READY, 0, now, { LIMIT: { offset: 0, count: AC.READY_BATCH_SIZE } }),
      2000,
      "Ready ads fetch timeout"
    );
  } catch (e) {
    console.error("[ads] ready fetch failed:", e?.message || e);
    return null;
  }
  if (!ids?.length) return null;

  // 2) Load ad hashes in a pipeline
  const pipe = r.multi();
  ids.forEach((id) => pipe.hGetAll(adKey(id)));
  const rows = await withTimeout(pipe.exec(), 3000, "Ad rows pipeline timeout");
  const ads = rows.map((res, i) => {
    const h = Array.isArray(res) ? res[1] : res;
    return { id: ids[i], ...Object.fromEntries(Object.entries(h || {}).map(([k, v]) => [k, v])) };
  });

  // 3) Filter eligibility quickly on the app side
  const hour = hourKey(now);
  const eligibles = [];
  const freqKeys = [];
  const coolKeys = [];

  for (const a of ads) {
    const status = a.status || "active";
    if (status !== "active") continue;

    const startAt = Number(a.startAt || 0);
    const endAt = Number(a.endAt || 0);
    if ((startAt && now < startAt) || (endAt && now > endAt)) continue;

    // Targeting (simple equality; tweak as needed)
    if (a.country && country && a.country !== country) continue;
    if (a.platform && platform && a.platform !== platform) continue;
    if (a.language && language && a.language !== language) continue;

    // Frequency cap & cooldown
    const cap = Math.max(0, Number(a.freqCapUserPerHour || 0));
    const minGapSec = Math.max(0, Number(a.minGapSec || 0));

    // Pre-build keys
    const fKey = AC.freqKey(userId || "anon", a.id, hour);
    const cKey = AC.coolKey(userId || "anon", a.id);
    freqKeys.push(fKey);
    coolKeys.push(cKey);

    eligibles.push({ ...a, _fKey: fKey, _cKey: cKey, _minGapSec: minGapSec });
  }

  if (!eligibles.length) return null;

  // 4) Check per-user caps (pipeline GETs)
  const capPipe = r.multi();
  for (const e of eligibles) {
    capPipe.get(e._cKey); // cooldown
    capPipe.get(e._fKey); // freq
  }
  const capRes = await withTimeout(capPipe.exec(), 2000, "Cap check timeout");

  const filtered = [];
  for (let i = 0; i < eligibles.length; i++) {
    const e = eligibles[i];
    const cool = Array.isArray(capRes[i * 2]) ? capRes[i * 2][1] : capRes[i * 2];
    const freq = Array.isArray(capRes[i * 2 + 1]) ? capRes[i * 2 + 1][1] : capRes[i * 2 + 1];

    if (cool) continue; // under cooldown
    if (e.freqCapUserPerHour > 0 && Number(freq || 0) >= e.freqCapUserPerHour) continue;

    filtered.push(e);
  }

  if (!filtered.length) return null;

  // 5) Score candidates and pick the best
  filtered.sort((a, b) => scoreCandidate(b, now) - scoreCandidate(a, now));
  const chosen = filtered[0];

  // 6) Atomic commit (WATCH → MULTI → EXEC)
  for (let attempt = 0; attempt <= AC.WATCH_RETRY; attempt++) {
    await r.watch(adKey(chosen.id));
    const snap = await r.hGetAll(adKey(chosen.id));
    // Re-check essential fields
    const status = snap?.status || "active";
    const delivered = Number(snap?.deliveredImpressions || 0);
    const target = Math.max(1, Number(snap?.targetImpressions || 0));
    const startAt = Number(snap?.startAt || 0);
    const endAt = Number(snap?.endAt || 0);

    if (status !== "active") {
      await r.unwatch();
      return null;
    }
    if ((startAt && now < startAt) || (endAt && now > endAt)) {
      await r.unwatch();
      // take it out of ready
      await r.zRem(AC.IDX_READY, chosen.id);
      return null;
    }

    const nextDelivered = delivered + 1;
    const lastServedAt = now;
    const idealSec = Number(snap?.idealIntervalSec || 60);
    const minGapSec = Number(snap?.minGapSec || 0);
    const pacing = snap?.pacing || "even";
    const nextEligibleAt =
      pacing === "even"
        ? lastServedAt + idealSec * 1000
        : lastServedAt + Math.max(5, minGapSec) * 1000;

    const m = r.multi();
    m.hIncrBy(adKey(chosen.id), "deliveredImpressions", 1);
    m.hSet(adKey(chosen.id), { lastServedAt: String(lastServedAt), updatedAt: String(now) });

    // Cooldown/frequency tracking for this user
    const fKey = AC.freqKey(userId || "anon", chosen.id, hour);
    const cKey = AC.coolKey(userId || "anon", chosen.id);

    m.incr(fKey);
    m.expire(fKey, 3700);
    if (minGapSec > 0) m.setEx(cKey, minGapSec, "1");

    // Reschedule or end
    const endNow = (endAt && now > endAt) || nextDelivered >= target;
    if (endNow) {
      m.sRem(AC.IDX_ACTIVE, chosen.id);
      m.zRem(AC.IDX_READY, chosen.id);
      m.hSet(adKey(chosen.id), { status: "ended" });
    } else {
      m.zAdd(AC.IDX_READY, [{ score: nextEligibleAt, value: chosen.id }]);
    }

    const ok = await m.exec(); // null if watched key changed
    if (ok) {
      await r.unwatch();
      // Ensure TTL post-commit
      if (endAt) await setAdTTL(r, chosen.id, endAt);

      // Return a compact ad payload to the player
      return {
        _id: chosen.id,
        creativeUrl: chosen.creativeUrl || "",
        clickUrl: chosen.clickUrl || "",
        advertiser: chosen.advertiser || "",
        campaign: chosen.campaign || "",
        // (add more creative fields if you store them)
      };
    }
    // retry
  }

  // Couldn’t commit under contention
  return null;
}

/** Mark a click (optional metric) */
export async function markAdClick(adId) {
  if (!adId) return false;
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
  } catch {
    return false;
  }
  try {
    await r.hIncrBy(adKey(adId), "clicks", 1);
    await r.hSet(adKey(adId), "updatedAt", String(nowMs()));
    return true;
  } catch {
    return false;
  }
}

/** Optional periodic cleanup: expire ended/old, memory alerts */
export async function runAdsCleanupTask() {
  let r;
  try {
    r = await getRedis();
  } catch {
    return;
  }
  try {
    // Remove READY entries for ended/expired ads proactively
    const now = nowMs();
    const ids = await r.zRangeByScore(AC.IDX_READY, 0, now, {
      LIMIT: { offset: 0, count: 500 },
    });
    if (ids?.length) {
      const pipe = r.multi();
      for (const id of ids) pipe.hGetAll(adKey(id));
      const rows = await pipe.exec();
      const stale = [];
      rows.forEach((res, i) => {
        const h = Array.isArray(res) ? res[1] : res;
        const status = h?.status || "active";
        const endAt = Number(h?.endAt || 0);
        if (status !== "active" || (endAt && now > endAt)) stale.push(ids[i]);
      });
      if (stale.length) {
        const m = r.multi();
        stale.forEach((id) => m.zRem(AC.IDX_READY, id));
        await m.exec();
      }
    }
  } catch (e) {
    console.warn("[ads] cleanup pass failed:", e?.message || e);
  }

  // Memory alert
  try {
    await checkAdsMemory(r);
  } catch {}
}

/** Convenience: read back an ad hash (for debugging) */
export async function getAdRedis(adId) {
  if (!adId) return null;
  let r;
  try {
    r = await withTimeout(getRedis(), 3000, "Redis connection timeout");
  } catch {
    return null;
  }
  try {
    const h = await r.hGetAll(adKey(adId));
    if (!h || !Object.keys(h).length) return null;
    // Convert numeric strings to numbers where obvious
    const out = {};
    for (const [k, v] of Object.entries(h)) {
      if (v === null || v === undefined) continue;
      const n = Number(v);
      out[k] = Number.isFinite(n) && `${n}` === v ? n : v;
    }
    return out;
  } catch {
    return null;
  }
}
