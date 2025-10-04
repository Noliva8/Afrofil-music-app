

import { getRedis } from "./redis/redisClient.js";
import { eligible, matchesTargeting, scoreAd, pickCreativePointer } from "./adTargeting.js";

function dayStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
function ttlToMidnightSec() {
  const end = new Date(); end.setHours(24,0,0,0);
  return Math.ceil((end - Date.now())/1000);
}
async function canServeNow(redis, userId, cooldownSec = 60, dailyCap = 20) {
  const day = dayStamp();
  const [dailyStr, lastStr] = await redis.mGet([
    `user:${userId}:d:${day}:ads`,
    `user:${userId}:last_ad_ts`
  ]);
  const daily = Number(dailyStr || 0);
  if (daily >= dailyCap) return false;
  const last = Number(lastStr || 0);
  const now = Math.floor(Date.now()/1000);
  if (last && now - last < cooldownSec) return false;
  return true;
}
export async function bumpServed(redis, userId) {
  const day = dayStamp();
  const ttl = ttlToMidnightSec();
  const now = Math.floor(Date.now()/1000);
  const pipe = redis.multi();
  pipe.incr(`user:${userId}:d:${day}:ads`);
  pipe.expire(`user:${userId}:d:${day}:ads`, ttl);
  pipe.set(`user:${userId}:last_ad_ts`, String(now));
  await pipe.exec();
}

export async function decideAdMVP(ctx) {
  // ctx = { userId, userTier, location:{country,state,city}, device, availableAdTime, wantType?: 'audio'|'overlay'|'banner' }
  if (ctx.userTier === 'premium') return { decision: 'no_ad', reason: 'premium', retryAfter: 300 };

  const redis = await getRedis();
  const ok = await canServeNow(redis, ctx.userId, 60, 20);
  if (!ok) return { decision: 'no_ad', reason: 'cap_or_cooldown', retryAfter: 120 };

  // candidate sets
  const baseSets = ['ad:index:active'];
  const wantType = (ctx.wantType || 'audio').toLowerCase();
  baseSets.push(`ad:index:type:${wantType}`);
  // location: try country set; include WORLD via filter later (MVP filters anyway)
  if (ctx.location?.country) {
    baseSets.push(`ad:index:loc:${ctx.location.country}`);
  }

  // if set missing, SINTER will be empty; fallback by removing loc set
  let ids = await redis.sInter(baseSets);
  if (!ids?.length) {
    ids = await redis.sInter(baseSets.filter(k => !k.startsWith('ad:index:loc:')));
  }
  if (!ids?.length) return { decision: 'no_ad', reason: 'no_candidates', retryAfter: 120 };

  // load blobs
  const pipe = redis.multi();
  ids.forEach(id => pipe.get(`ad:${id}`));
  const rows = await pipe.exec();
  const ads = rows
    .map(([, json], i) => ({ id: ids[i], ad: json ? JSON.parse(json) : null }))
    .filter(x => x.ad);

  // filter & price-first sort
  const filtered = ads.filter(({ ad }) => eligible(ad) && matchesTargeting(ad, ctx.location));
  if (!filtered.length) return { decision: 'no_ad', reason: 'no_eligible', retryAfter: 120 };

  filtered.sort((a, b) => scoreAd(b.ad) - scoreAd(a.ad));
  const top = filtered[0];

  const creative = pickCreativePointer(top.ad, { opus: true }); // refine with UA if you want
  if (!creative) return { decision: 'no_ad', reason: 'no_creative', retryAfter: 120 };

  // return pointer (client will presign & then call bumpServed when ad starts)
  return {
    decision: 'play_ad',
    ad: {
      id: top.id,
      type: top.ad.adType,
      duration: Math.max(1, Math.round((top.ad.audioDurationMs || 30000) / 1000)),
      variants: [{ codec: creative.codec, pointer: creative.pointer }]
    },
    metadata: { decisionId: `d_${Date.now()}`, expiresAt: Date.now() + 30000 }
  };
}
