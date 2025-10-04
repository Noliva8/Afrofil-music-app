// graphql/resolvers/telemetryAds.resolvers.js

import { getGeo } from '../../../utils/locationDetectorServerSide.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';

import {
  getUserProfile,
  upsertUserProfile,
  K,
  markEventSeen,
} from '../../../utils/AdEngine/redis/redisSchema.js';

import {
  chooseAdForUser,
  trackAdEvent as trackAdTelemetry,
} from '../../../utils/AdEngine/telemetry/adOps.js';
import { normalizeGeo } from '../../../utils/AdEngine/redis/redisSchema.js';
import {Ad} from '../../Advertizer_schema/../../models/Advertizer/index_advertizer.js'


import {
  onTrackStart,
  onTrackComplete,
  onTrackSkip,
} from '../../../utils/AdEngine/telemetry/telemetryOps.js';

import { pickAdForPlayback } from '../../../utils/pickAdsForPlayback.js';



// helper: top N genres from affinity zset
const topGenresForUser = async (userId, n = 3) => {
  const r = await getRedis();
  return r.zRange(K.userGenreAffinity(userId), -n, -1, { REV: true });
};









const LOG = (...args) => {
  if (process.env.NODE_ENV !== 'test') console.log('[telemetry/trackStart]', ...args);
};
const WARN = (...args) => console.warn('[telemetry/trackStart]', ...args);

const tierToRole = (tier) => {
  const t = String(tier || '').toUpperCase();
  if (t === 'PREMIUM') return 'premium';
  if (t === 'FREE') return 'regular';
  return 'guest';
};



// mutation start.

export const trackStart = async (_p, { input }, ctx) => {
  const nowIso = new Date().toISOString();

  try {
    // 🧩 Destructure playbackContext safely
    const {
      source: playbackSource = 'UNKNOWN',
      sourceId = '',
      sourceName = '',
      queuePosition = 0,
      queueLength = 0,
      shuffle = false,
      repeat = 'OFF',
      contextUri = '',
      radioSeed = '',
      searchQuery = '',
      recommendationType = ''
    } = input?.playbackContext || {};

    // 🪵 Log input received
    LOG('received input:', {
      // Core Identity
      userId: input?.userId,
      sessionId: input?.sessionId,

      // Device & Tier
      device: input?.device,
      platform: input?.platform,
      userTier: input?.userTier,

      // Location
      geo: input?.geo ? {
        country: input.geo.country,
        city: input.geo.city,
        state: input.geo.state,
        latitude: input.geo.latitude,
        longitude: input.geo.longitude
      } : null,

      // Current Song
      trackId: input?.trackId,
      trackGenre: input?.trackGenre,
      trackMood: input?.trackMood,
      trackSubMood: input?.trackSubMood,
      artistId: input?.artistId,
      albumId: input?.albumId,
      tempo: input?.tempo,
      duration: input?.duration,
      country: input.country,

      // Playback Context
      playbackSource,
      sourceId,
      sourceName,
      queuePosition,
      queueLength,
      shuffle,
      repeat,
      contextUri,
      radioSeed,
      searchQuery,
      recommendationType,

      // Technical
      eventId: input?.eventId
    });

    // ✅ Idempotency check
    if (input?.eventId) {
      const fresh = await markEventSeen(input.eventId);
      if (!fresh) {
        LOG('deduped eventId:', input.eventId);
        return { ok: true, deduped: true, ad: null, now: nowIso };
      }
    }

    // 🌍 Geo preference: client → server fallback
    const clientGeo = normalizeGeo(input?.geo);
    const serverGeo = normalizeGeo(getGeo(ctx?.req));
    const geo = clientGeo?.country ? clientGeo : serverGeo;

    LOG('geo chosen:', geo);

    // 🎭 Map tier → role
    const role = tierToRole(input?.userTier);

    // 🧠 Persist telemetry
    await onTrackStart({
      // identity
      userId: input.userId,
      sessionId: input.sessionId,

      // device / role / geo
      device: input.device || 'web',
      platform: input.platform || 'web',
      role,
      country: geo.country || '',
      city: geo.city || '',

      // song attrs
      trackId: input.trackId,
      trackGenre: input.trackGenre || '',
      trackMood: input.trackMood || '',
      trackSubMood: input.trackSubMood || '',
      artistId: input.artistId || '',
      albumId: input.albumId || '',
      tempo: Number(input.tempo || 0),
      duration: Number(input.duration || 0),

      // playback context
      playbackSource,
      sourceId,
      sourceName,
      queuePosition,
      queueLength,
      shuffle,
      repeat,
      contextUri,
      radioSeed,
      searchQuery,
      recommendationType,

      // optional idempotency
      eventId: input.eventId || null,
    });

    // 👤 Ensure user profile is current
    try {
      const profile = await getUserProfile(input.userId);
      const mustUpsert =
        !profile ||
        (geo.country && geo.country !== (profile.country || '')) ||
        (geo.city && geo.city !== (profile.city || '')) ||
        (role && role !== (profile.role || ''));

      if (mustUpsert) {
        await upsertUserProfile({
          userId: input.userId,
          role: role || (profile?.role ?? 'guest'),
          country: geo.country || (profile?.country ?? ''),
          state: geo.state || (profile?.state ?? ''),
          city: geo.city || (profile?.city ?? ''),
          lat: geo.latitude ?? profile?.lat ?? null,
          lon: geo.longitude ?? profile?.lon ?? null,
        });
        LOG('profile upserted for user:', input.userId);
      }
    } catch (e) {
      WARN('profile upsert failed:', e?.message || e);
    }

    // 📺 Preview Ad (if enabled)
    let ad = null;
    if (String(process.env.AD_PREVIEW_ON_TRACKSTART || '0') === '1') {
      try {
        const topGenres =
          typeof topGenresForUser === 'function'
            ? await topGenresForUser(input.userId, 3)
            : [];

        if (typeof chooseAdForUser === 'function') {
          ad = await chooseAdForUser(
            {
              userId: input.userId,
              role,
              country: geo.country || null,
              mood: input.trackMood || null,
              subMood: input.trackSubMood || null,
              age: undefined,
              topGenres,
            },
            { reserve: false }
          );
        }
        LOG('ad preview:', ad ? 'found' : 'none');
      } catch (e) {
        WARN('ad preview failed:', e?.message || e);
      }
    }

    LOG('completed for session:', input.sessionId);
    return { ok: true, deduped: false, ad, now: nowIso };

  } catch (err) {
    console.error('[telemetry/trackStart] error:', err);
    return { ok: false, error: 'trackStart failed', now: nowIso };
  }
};

// helper for ads in track comple to feed ad

// --- helpers to upsert from a Mongo Ad doc into your existing Redis structure

function adDocToCampaignPayload(ad) {
  return {
    campaignId: ad.campaignId,           // e.g. "afrofeel_xxx"
    status: ad.status,                   // 'active', etc.
    advertiserId: String(ad.advertiserId || ''),
    adId: String(ad._id),
    isCostConfirmed: !!ad.isCostConfirmed,
    isPaid: !!ad.isPaid,
    isApproved: !!ad.isApproved,
    priority: 1,                         // choose your default or ad.priority
    floorCpm: 0,                         // optional
    durationSec: Math.round((ad.audioDurationMs || 0) / 1000) || 15,
    maxPerUserPerDay: 0,                 // optional freq cap from schema if you have it
    targeting: ad.targeting || {},
    schedule: ad.schedule || {},
  };
}

async function warmOneAdIntoRedis(ad) {
  // upsert campaign
  await upsertCampaign(adDocToCampaignPayload(ad));
  // upsert creative – NOTE: map schema names to Redis fields your code expects
  await upsertCreative(String(ad._id), {
    streamingAudioAdUrl:       ad.streamingAudioAdUrl,
    streamingFallBackAudioUrl: ad.streamingFallBackAudioUrl, // exact schema name
    masterAudionAdUrl:         ad.masterAudionAdUrl,         // exact schema name
    adArtWorkUrl:              ad.adArtWorkUrl,
    streamingOverlayAdUrl:     ad.streamingOverlayAdUrl,
    originalOverlayUrl:        ad.originalOverlayUrl,
    streamingBannerAdUrl:      ad.streamingBannerAdUrl,
    originalBannerAdUrl:       ad.originalBannerAdUrl,
  });
}

// Fetch eligible ads from Mongo (very simple filters) and warm them all
async function warmEligibleAdsFromMongo({ geo }) {
  const now = new Date();
  const q = {
    isApproved: true,
    isPaid: true,
    isCostConfirmed: true,
    status: 'active',
    adType: 'audio',
    'schedule.startDate': { $lte: now },
    'schedule.endDate':   { $gte: now },
  };

  // optional: basic geo filter (keeps worldwide or matching country/state/city)
  if (geo?.country || geo?.state || geo?.city) {
    q.$or = [
      { 'targeting.scope': 'worldwide' },
      { 'targeting.countries': { $in: [geo.country].filter(Boolean) } },
      { 'targeting.state': { $exists: true, $eq: geo.state || '' } },
      { 'targeting.city':  { $exists: true, $eq: geo.city  || '' } },
    ];
  }

  const docs = await Ad.find(q).lean();
  await Promise.all(docs.map(warmOneAdIntoRedis));
  return docs.length;
}

// --------




export const trackComplete = async (_p, { input }, ctx) => {
  try {
    if (!input) throw new Error('Input is required');
    if (!input.trackId) throw new Error('trackId is required');

    if (input.eventId) {
      const fresh = await markEventSeen(input.eventId);
      if (!fresh) {
        console.log('TrackComplete event deduplicated:', input.eventId);
        return { ok: true, deduped: true, ad: null };
      }
    }

    // record analytics (non-blocking)
    await onTrackComplete({
      userId: input.userId,
      sessionId: input.sessionId,
      songId: input.trackId,
      genre: input.trackGenre || '',
      ms_listened: Math.max(0, Math.floor(input.ms_listened ?? 0))
    }).catch(err => console.warn('onTrackComplete failed:', err));

    // build geo/facets
    const serverGeo = ctx?.req?.geo || {};
    const geo = {
      country: input?.geo?.country || serverGeo.country || '',
      state:   input?.geo?.state   || serverGeo.state   || '',
      city:    input?.geo?.city    || serverGeo.city    || '',
    };

    const facets = {
      role: 'regular',
      genres: input.trackGenre ? [input.trackGenre] : [],
      moods:  input.mood ? [input.mood] : [],
      subMoods: input.subMoods ? [input.subMoods] : [],
    };

    // 1st attempt: try Redis
    let pickedAd = await pickAdForPlayback({ userId: input.userId, geo, facets });

    // Miss? Warm from Mongo then retry once
    if (!pickedAd) {
      const warmed = await warmEligibleAdsFromMongo({ geo });
      if (warmed > 0) {
        pickedAd = await pickAdForPlayback({ userId: input.userId, geo, facets });
      }
    }

    if (pickedAd) {
      return {
        ok: true,
        deduped: false,
        ad: {
          adId:       pickedAd._id || pickedAd.id,
          campaignId: pickedAd.campaignId || null,
          adTitle:    pickedAd.adTitle || '',
          adType:     pickedAd.adType || 'audio',
          audioDurationMs: Number(pickedAd.audioDurationMs || 0),
          creative: {
            streamingAudioAdUrl:       pickedAd.streamingAudioAdUrl       || null,
            streamingFallBackAudioUrl: pickedAd.streamingFallBackAudioUrl || null,
            masterAudionAdUrl:         pickedAd.masterAudionAdUrl         || null,
            adArtWorkUrl:              pickedAd.adArtWorkUrl              || null,
            streamingOverlayAdUrl:     pickedAd.streamingOverlayAdUrl     || null,
            originalOverlayUrl:        pickedAd.originalOverlayUrl        || null,
            streamingBannerAdUrl:      pickedAd.streamingBannerAdUrl      || null,
            originalBannerAdUrl:       pickedAd.originalBannerAdUrl       || null,
          }
        }
      };
    }

    // Still nothing
    return { ok: true, deduped: false, ad: null };

  } catch (error) {
    console.error('Error in trackComplete:', error);
    return { ok: true, deduped: false, ad: null };
  }
};



export const trackSkip = async (_p, { input }, ctx) => {
      if (input.eventId) {
        const fresh = await markEventSeen(input.eventId);
        if (!fresh) return { ok: true, deduped: true, ad: null };
      }

      await onTrackSkip({
        userId: input.userId,
        sessionId: input.sessionId,
        songId: input.trackId,
        genre: input.trackGenre || ''
      });

      // pick REAL ad now (reserve)
      const profile = await getUserProfile(input.userId);
      const serverGeo = ctx?.req?.geo ?? {};
      const country   = profile?.country || serverGeo.country || '';
      const topGenres = await topGenresForUser(input.userId, 3);

      const ad = await chooseAdForUser({
        userId: input.userId,
        role: profile?.role || 'regular',
        country,
        mood: input.mood || null,
        subMood: input.subMood || null,
        age: profile?.age,
        topGenres
      }, { reserve: true });

      return { ok: true, ad };
    };

export const trackAdEvent = async (_p, { input }) => {
      await trackAdTelemetry({
        userId: input.userId,
        campaignId: input.campaignId,
        adId: input.adId,
        event: input.event,
        completed: !!input.completed,
        clicked: !!input.clicked
      });
      // no ad to serve here; keep shape compatible
      return { ok: true, ad: null };
    };


export const  trackEnd = async (_p, { input }) => {
      // lightweight marker (optional), mirror whatever you need
      return { ok: true, now: new Date().toISOString() };
    };