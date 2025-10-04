import { getRedis } from "./redis/redisClient";



function adToCacheShape(adDoc) {
  // keep only what the decision needs (small & serializable)
  return {
    id: String(adDoc._id),
    adType: adDoc.adType,
    status: adDoc.status,
    isApproved: adDoc.isApproved,
    isPaid: adDoc.isPaid,
    schedule: {
      startDate: adDoc.schedule?.startDate,
      endDate: adDoc.schedule?.endDate,
    },
    targeting: {
      scope: adDoc.targeting?.scope,
      countries: adDoc.targeting?.countries || [],
      wholeCountry: !!adDoc.targeting?.wholeCountry,
      state: adDoc.targeting?.state || '',
      city: adDoc.targeting?.city || '',
    },
    pricing: {
      dailyRate: adDoc.pricing?.dailyRate ?? null,
      totalCost: adDoc.pricing?.totalCost ?? null,
    },
    // creatives (pointers/keys or opaque strings you already store)
    streamingOverlayAdUrl: adDoc.streamingOverlayAdUrl,
    originalOverlayUrl:     adDoc.originalOverlayUrl,
    streamingBannerAdUrl:   adDoc.streamingBannerAdUrl,
    originalBannerAdUrl:    adDoc.originalBannerAdUrl,
    masterAudionAdUrl:      adDoc.masterAudionAdUrl,
    streamingAudioAdUrl:    adDoc.streamingAudioAdUrl,
    streamingFallBackAudioUrl: adDoc.streamingFallBackAudioUrl,
    audioDurationMs: adDoc.audioDurationMs ?? 30000
  };
}

function indexKeysForAd(ad) {
  const setKeys = [];
  if (ad.status === 'active' && ad.isApproved && ad.isPaid) {
    setKeys.push('ad:index:active');
  }
  if ((ad.adType || '').toLowerCase() === 'audio') {
    setKeys.push('ad:index:type:audio');
  }
  // country sets (optional)
  const countries = ad.targeting?.countries || [];
  countries.forEach(cc => setKeys.push(`ad:index:loc:${cc}`));
  // worldwide: put into WORLD (optional)
  if (ad.targeting?.scope === 'worldwide') {
    setKeys.push('ad:index:loc:WORLD');
  }
  return setKeys;
}

export async function upsertAdToRedis(adDoc) {
  const redis = await getRedis();
  const ad = adToCacheShape(adDoc);
  const id = ad.id;

  // store the JSON (string)
  await redis.set(`ad:${id}`, JSON.stringify(ad));

  // index membership
  const sets = indexKeysForAd(ad);
  if (sets.length) {
    const pipe = redis.multi();
    sets.forEach(k => pipe.sAdd(k, id));
    await pipe.exec();
  }
}

export async function removeAdFromRedis(adId) {
  const redis = await getRedis();
  const id = String(adId);
  await redis.del(`ad:${id}`);
  // best-effort removal from known index sets (if many, keep a registry; MVP: remove where it matters)
  const keys = await redis.keys('ad:index:*');
  if (keys.length) {
    const pipe = redis.multi();
    keys.forEach(k => pipe.sRem(k, id));
    await pipe.exec();
  }
}



/**
 * Optional: call this from your Mongoose lifecycle or admin routes.
 * Example Mongoose hook (in your Ad model file, after Ad is defined):
 *
 * AdSchema.post('save', async function(doc) {
 *   try { await upsertAdToRedis(doc); } catch (e) { console.error('[cacheSync] save', e); }
 * });
 *
 * AdSchema.post('findOneAndUpdate', async function(doc) {
 *   try { if (doc) await upsertAdToRedis(doc); } catch (e) { console.error('[cacheSync] update', e); }
 * });
 *
 * AdSchema.post('remove', async function(doc) {
 *   try { await removeAdFromRedis(doc._id); } catch (e) { console.error('[cacheSync] remove', e); }
 * });
 */
