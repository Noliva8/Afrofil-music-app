
import {
  eligibleCampaignIds,
  tryReserveFreqCap,
  recordAdImpression,
} from '../redis/redisSchema.js';
import { getRedis } from '../redis/redisClient.js';


// Treat these as "sacred" contexts and strongly demote mismatches
const PROTECTED_SUBMOODS = new Set(['worship', 'praise', 'traditional gospel']);

// weights you can tweak
const WEIGHTS = {
  basePriority: 1,      // multiplier for campaign.priority
  subMoodMatch: 40,     // exact subMood hit
  moodMatch: 20,        // mood hit
  neutralMood: 10,      // campaign has no mood targeting
  mismatch: 0,          // campaign targets moods but not this one
  protectedPenalty: -50 // strong demotion on sacred contexts
};

const MAX_CANDIDATES_TO_SCORE = 200; // safety cap so we don't sort huge sets

// normalize labels: trim, lower, convert _ and - to spaces ("Traditional_Gospel" -> "traditional gospel")
const norm = (s) => (s ?? '').toString().trim().replace(/[_-]+/g, ' ').toLowerCase();
const safeParse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

function normalizeTargeting(targeting = {}) {
  const incMoods = (targeting.moods || []).map(norm);
  const incSub   = (targeting.subMoods || []).map(norm);
  const excMoods = (targeting.excludedMoods || []).map(norm);
  const excSub   = (targeting.excludedSubMoods || []).map(norm);
  return {
    incMoods, incSub, excMoods, excSub,
    ages: targeting.ages || null,
    scope: targeting.scope || 'worldwide',
    state: targeting.state || '',
    city: targeting.city || ''
  };
}

/**
 * Score mood relevance with soft preferences (not hard exclusions).
 * Exclusions in campaign.targeting.excludedMoods / excludedSubMoods are respected hard.
 */
function moodRelevanceScore(targeting = {}, currentMoodLC, currentSubMoodLC) {
  const { incMoods, incSub, excMoods, excSub } = normalizeTargeting(targeting);

  // hard blocks if advertiser explicitly excluded
  if (currentSubMoodLC && excSub.includes(currentSubMoodLC)) return -Infinity;
  if (currentMoodLC && excMoods.includes(currentMoodLC))     return -Infinity;

  // soft preferences
  if (currentSubMoodLC && incSub.includes(currentSubMoodLC)) return WEIGHTS.subMoodMatch;
  if (currentMoodLC && incMoods.includes(currentMoodLC))     return WEIGHTS.moodMatch;

  // neutral (no mood targeting at all) is ok
  if (!incMoods.length && !incSub.length) return WEIGHTS.neutralMood;

  // campaign has mood targets but not ours -> allow, but no bonus
  let score = WEIGHTS.mismatch;

  // extra brand-safety caution for sacred submoods
  if (currentSubMoodLC && PROTECTED_SUBMOODS.has(currentSubMoodLC)) {
    score += WEIGHTS.protectedPenalty;
  }

  return score;
}

// Stable-ish tie-break so one campaign doesn't starve others on equal score
function stableTieBreak(a, b, userId) {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const hash = (str) => [...(str + day)].reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0);
  return (hash(userId + a.cid) % 11) - (hash(userId + b.cid) % 11);
}

// Quick creative sanity check for an AUDIO placement
function hasPlayableAudioCreative(creative) {
  return Boolean(creative?.streamingAudioAdUrl || creative?.masterAudioAdUrl);
}

/**
 * Pick the best-scored eligible campaign.
 * If opts.reserve === true (default), we pre-reserve the freq cap here.
 * If opts.reserve === false, we do NOT reserve here (reserve later on 'impression').
 *
 * Prefers mood/subMood matches, then neutral, then (last resort) mismatched.
 * Ads are served ONLY to 'regular' users.
 */


export async function chooseAdForUser({
  userId,
  role,
  country,
  topGenres = [],
  mood,
  subMood,
  age
}, opts = { reserve: true }) {
  if (role !== 'regular') return null;

  const r = await getRedis();

  let candidates = await eligibleCampaignIds({ role, country, genres: topGenres });
  if (!candidates.length) return null;
  if (candidates.length > 200) candidates = candidates.sort().slice(0, 200);

  const moodLC = norm(mood);
  const subMoodLC = norm(subMood);

  const scored = [];
  for (const cid of candidates) {
    const c = await r.hGetAll(`ad:campaign:${cid}`);
    if (!c || !Object.keys(c).length) continue;

    const targeting = safeParse(c.targeting) || {};
    if (typeof age === 'number' && targeting.ages) {
      const { min, max } = targeting.ages;
      if (typeof min === 'number' && age < min) continue;
      if (typeof max === 'number' && age > max) continue;
    }

    const moodScore = moodRelevanceScore(targeting, moodLC, subMoodLC);
    if (moodScore === -Infinity) continue;

    const priority = Number(c.priority || 0);
    const finalScore = priority * WEIGHTS.basePriority + moodScore;

    scored.push({ cid, c, finalScore });
  }

  if (!scored.length) return null;
  scored.sort((a, b) => {
    const diff = b.finalScore - a.finalScore;
    return diff !== 0 ? diff : stableTieBreak(a, b, userId);
  });

  for (const { cid, c } of scored) {
    // only enforce freq-cap when reserving (real serve)
    if (opts?.reserve !== false) {
      const maxPerUserPerDay = Number(c.maxPerUserPerDay || 0);
      const ok = await tryReserveFreqCap(userId, cid, maxPerUserPerDay);
      if (!ok) continue;
    }

    const adId = c.adId || '';
    const creative = adId ? await r.hGetAll(`ad:creative:${adId}`) : {};
    if (!hasPlayableAudioCreative(creative)) continue;

    return {
      campaignId: cid,
      adId,
      durationSec: Number(c.durationSec || 15),
      priority: Number(c.priority || 0),
      creative
    };
  }

  return null;
}


/**
 * Call after the ad starts/completes/clicks.
 * We reserve the per-user-per-day cap on 'impression' to keep caps accurate.
 */
export async function trackAdEvent({
  userId,
  campaignId,
  adId,
  event,
  completed = false,
  clicked = false
}) {
  if (event === 'impression') {
    const r = await getRedis();
    const c = await r.hGetAll(`ad:campaign:${campaignId}`);
    const maxPerUserPerDay = Number(c?.maxPerUserPerDay || 0);

    if (maxPerUserPerDay > 0) {
      const ok = await tryReserveFreqCap(userId, campaignId, maxPerUserPerDay);
      if (!ok) {
        // already capped: skip logging the impression to avoid overcounting
        return { ok: false, reason: 'capped' };
      }
    }
  }

  await recordAdImpression({ userId, campaignId, adId, event, completed, clicked });
  return { ok: true };
}
