
import { upsertCampaign, upsertCreative } from "./redis/redisSchema.js";

const toBool = (v) => !!v;
const msToSec = (ms) =>
  (typeof ms === 'number' && ms > 0) ? Math.ceil(ms / 1000) : 15;

export async function mirrorAdToRedis(adDoc) {
  const now = Date.now();
  const start = adDoc.schedule?.startDate
    ? new Date(adDoc.schedule.startDate).getTime()
    : 0;
  const end = adDoc.schedule?.endDate
    ? new Date(adDoc.schedule.endDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  const inWindow =
    (start === 0 || now >= start) &&
    (end === Number.MAX_SAFE_INTEGER || now <= end);

  // Respect Mongo's status. If it's "active" but out of window, pause it in Redis.
  let statusForRedis = adDoc.status;
  if (statusForRedis === 'active' && !inWindow) {
    statusForRedis = 'paused';
  }

  // Targeting payload that matches current model (roles default to ['regular'])
  const targeting = {
    roles: ['regular'],
    countries: Array.isArray(adDoc.targeting?.countries)
      ? adDoc.targeting.countries
      : [],
    scope: adDoc.targeting?.scope || 'worldwide',
    state: adDoc.targeting?.state || '',
    city: adDoc.targeting?.city || '',
    moods: [],
    subMoods: [],
    excludedMoods: [],
    excludedSubMoods: [],
    ages: {},
  };

  await upsertCampaign({
    campaignId: adDoc.campaignId,
    status: statusForRedis,
    advertiserId: String(adDoc.advertiserId),
    adId: String(adDoc._id),
    isCostConfirmed: toBool(adDoc.isCostConfirmed),
    isPaid: toBool(adDoc.isPaid),
    isApproved: toBool(adDoc.isApproved),
    priority: adDoc.priority ?? 0,
    durationSec: msToSec(adDoc.audioDurationMs),

    // Store schedule JSON; chooser also rechecks dates at selection time
    schedule: {
      startDate: adDoc.schedule?.startDate || null,
      endDate: adDoc.schedule?.endDate || null,
      scope: targeting.scope,
      state: targeting.state,
      city: targeting.city,
    },

    targeting,
    adType: adDoc.adType,
  });

  // Creative: handle current typos when mirroring to Redis
  await upsertCreative(String(adDoc._id), {
    streamingOverlayAdUrl: adDoc.streamingOverlayAdUrl || null,
    originalOverlayUrl: adDoc.originalOverlayUrl || null,
    streamingBannerAdUrl: adDoc.streamingBannerAdUrl || null,
    originalBannerAdUrl: adDoc.originalBannerAdUrl || null,
    masterAudioAdUrl:
      adDoc.masterAudioAdUrl || adDoc.masterAudionAdUrl || null,
    streamingAudioAdUrl: adDoc.streamingAudioAdUrl || null,
    streamingFallbackAudioUrl:
      adDoc.streamingFallbackAudioUrl || adDoc.streamingFallBackAudioUrl || null,
    adArtworkUrl: adDoc.adArtWorkUrl || null,
  });
}
