import { Ad, Advertizer } from '../../../models/Advertizer/index_advertizer.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { AVAILABLE_ADS_KEY, CACHE_TTL_SECONDS } from '../../Artist_schema/Redis/keys.js';


const SUPPORTED_COUNTRIES = ["United States", "Rwanda", "Uganda"];


const serializeAd = (ad) => JSON.stringify(ad);

const deserializeAd = (adString) => {
  try {
    return JSON.parse(adString);
  } catch (error) {
    console.error('Failed to deserialize ad:', error);
    return null;
  }
};

const buildCacheKey = (userId, normalizedLocation) => {
  const { country, state, city } = normalizedLocation || {};
  const safeUser = userId || 'anonymous';
  const safeCountry = country || 'unknown';
  const safeState = state || 'none';
  const safeCity = city || 'none';
  return `${AVAILABLE_ADS_KEY(safeUser)}:${safeCountry}:${safeState}:${safeCity}`;
};

async function readCachedAds(client, cacheKey) {
  if (!client || !cacheKey) return [];
  const members = await client.sMembers(cacheKey);
  return members.map(deserializeAd).filter(Boolean);
}

async function writeCachedAds(client, cacheKey, ads) {
  if (!client || !cacheKey || !ads?.length) return;
  const pipe = client.multi();
  ads.forEach((ad) => pipe.sAdd(cacheKey, serializeAd(ad)));
  pipe.expire(cacheKey, CACHE_TTL_SECONDS);
  await pipe.exec();
}

// ===== PER-USER AD FREQUENCY CAP HELPERS =====
const MAX_PER_DAY = 5;
const SAME_AD_COOLDOWN_SEC = 2 * 60 * 60; // 2 hours

const dayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

const ttlToMidnightSec = () => {
  const end = new Date(); end.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((end - Date.now()) / 1000));
};

const userAdCountKey = (userId, adId, day) => `user:${userId}:ad:${adId}:count:${day}`;
const userAdLastTsKey = (userId, adId) => `user:${userId}:ad:${adId}:last_ts`;

async function filterByFrequencyCaps(redisClient, ads, userId) {
  if (!redisClient || !userId || !ads?.length) return ads;

  const day = dayStamp();
  const nowSec = Math.floor(Date.now() / 1000);

  const countKeys = ads.map((ad) => userAdCountKey(userId, ad.id, day));
  const lastKeys = ads.map((ad) => userAdLastTsKey(userId, ad.id));

  const [countVals, lastVals] = await Promise.all([
    redisClient.mGet(countKeys),
    redisClient.mGet(lastKeys)
  ]);

  const allowedAds = [];

  ads.forEach((ad, idx) => {
    const count = Number(countVals[idx] || 0);
    const lastTs = Number(lastVals[idx] || 0);

    const withinCooldown = lastTs && (nowSec - lastTs < SAME_AD_COOLDOWN_SEC);
    const atDailyCap = count >= MAX_PER_DAY;

    if (!withinCooldown && !atDailyCap) {
      allowedAds.push(ad);
    }
  });

  return allowedAds;
}

// ===== LOCATION NORMALIZATION =====
const normalizeCountry = (country) => {
  if (!country) return null;
  
  const countryMap = {
    'US': 'United States',
    'USA': 'United States',
    'U.S.A.': 'United States',
    'U.S.': 'United States',
    'United States of America': 'United States',
    'America': 'United States',
    'RW': 'Rwanda',
    'RWA': 'Rwanda',
    'UG': 'Uganda',
    'UGA': 'Uganda',
  };
  
  const cleanCountry = country.trim();
  return countryMap[cleanCountry] || cleanCountry;
};

const normalizeUSState = (state) => {
  if (!state) return null;
  
  const stateMap = {
    'AL': 'Alabama', 'Ala.': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona', 'Ariz.': 'Arizona',
    'AR': 'Arkansas', 'Ark.': 'Arkansas',
    'CA': 'California', 'Calif.': 'California', 'Cal.': 'California',
    // add more as needed
  };
  
  const cleanState = state.trim();
  const normalized = stateMap[cleanState] || cleanState;
  
  return normalized.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const normalizeCity = (city) => {
  if (!city) return null;
  
  const cityMap = {
    'NYC': 'New York City',
    'LA': 'Los Angeles',
    'SF': 'San Francisco',
    'PHX': 'Phoenix',
    'KGL': 'Kigali',
    'KLA': 'Kampala',
  };
  
  const cleanCity = city.trim();
  const normalized = cityMap[cleanCity] || cleanCity;
  
  return normalized.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const normalizeLocation = (location) => {
  if (!location) return {};
  
  const normalizedCountry = normalizeCountry(location.country);
  const isUS = normalizedCountry === 'United States';

  return {
    country: normalizedCountry,
    // For US, we care about state; city is ignored in targeting rules
    state: isUS ? normalizeUSState(location.state) : null,
    // For non-US, we care about city (where you use city-level targeting)
    city: !isUS ? normalizeCity(location.city) : null
  };
};

// ===== LOCATION CLAUSE BUILDER =====
function buildLocationConditions(normalizedLocation) {
  const { country, state, city } = normalizedLocation || {};
  const clauses = [];

  // If we have no detected country, do not serve ads.
  if (!country) {
    return [];
  }

  // 1) Worldwide ads (only for supported countries; country already validated)
  clauses.push({
    "targeting.scope": "worldwide",
  });

  // 2) Whole-country ads
  clauses.push({
    "targeting.scope": "country",
    "targeting.countries": country,       // array contains this country
    "targeting.wholeCountry": true,       // run everywhere in that country
  });

  // 3) State-level ads (e.g. US + Arizona)
  if (state) {
    clauses.push({
      "targeting.scope": "country",
      "targeting.countries": country,
      "targeting.state": state,
    });
    // NOTE: we DO NOT also push city when state exists, to avoid confusion.
  }

  // 4) City-level ads (e.g. Kenya + Nairobi, Rwanda + Kigali, etc.)
  if (city && !state) {
    // Only use city-clause when there is no state (your "state = city" logic)
    clauses.push({
      "targeting.scope": "city",
      "targeting.countries": country,
      "targeting.city": city,
    });
  }

  return clauses;
}

// ===== MAIN RESOLVER =====
export const getAudioAd = async (_, { userLocation }, context) => {

  try {
    const redisClient = await getRedis().catch((err) => {
      console.warn('⚠️ Redis unavailable, skipping cache for getAudioAd:', err.message);
      return null;
    });

    // 1. Normalize all location inputs
    const normalizedLocation = normalizeLocation(userLocation);
    const { country, state, city } = normalizedLocation;
    
    // 2. Reject if we cannot determine country
    if (!country) {
      return {
        success: true,
        ads: [],
        error: "Unable to determine user country so ads cannot be served."
      };
    }

    // 3. Validate supported countries
    if (!SUPPORTED_COUNTRIES.includes(country)) {
      return { 
        success: false, 
        ads: [], 
        error: `Ads not supported in ${country}. Supported: ${SUPPORTED_COUNTRIES.join(', ')}` 
      };
    }

    console.log('📍 Normalized Location:', {
      original: userLocation,
      normalized: normalizedLocation
    });

    // 3.5. Try cache first – keyed by user + normalized location
    const userId = context?.user?._id || context?.req?.user?._id || null;
    const cacheKey = buildCacheKey(userId, normalizedLocation);

    if (redisClient) {
      try {
        const cachedAds = await readCachedAds(redisClient, cacheKey);
        if (cachedAds.length) {
          return {
            success: true,
            ads: cachedAds,
            error: null
          };
        }
      } catch (cacheErr) {
        console.warn('⚠️ Failed to read ads cache:', cacheErr.message);
      }
    }

    // 4. Build location matching conditions (world + country + state OR city tiers)
    const locationConditions = buildLocationConditions(normalizedLocation);

    // 5. Base ad conditions - ONLY ACTIVE, NON-EXPIRED ADS
    const now = new Date();
    const baseConditions = {
      adType: 'audio',
      status: 'active',
      isPaid: true,
      isApproved: true,
      // 'schedule.startDate': { $lte: now },
      // 'schedule.endDate': { $gte: now }
    };

    // 6. Final query object
    const finalConditions = locationConditions.length > 0 
      ? { ...baseConditions, $or: locationConditions }
      : baseConditions;

    console.log('🔍 Final ad query:', JSON.stringify(finalConditions, null, 2));

    // 7. Execute query with prioritization
    const ads = await Ad.find(finalConditions)
      .populate('advertiserId', '_id brandType companyName companyWebsite country')
      .sort({
        'targeting.scope': 1,          // adjust ordering if needed
        'targeting.wholeCountry': 1,
        'pricing.totalCost': -1,
        'analytics.clickThroughRate': -1
      })
      .limit(5)
      .lean();

    // 8. Double-check expiration and status + ensure we have a playable audio URL
    // const validAds = ads.filter(ad => {
    //   try {
    //     const startDate = new Date(ad.schedule.startDate);
    //     const endDate = new Date(ad.schedule.endDate);
    //     const isActive = ad.status === 'active' && ad.isPaid && ad.isApproved;
    //     const isInSchedule = now >= startDate && now <= endDate;
    //     const hasAudioUrl = ad.streamingAudioAdUrl && ad.streamingAudioAdUrl.trim() !== '';
        
    //     return isActive && isInSchedule && hasAudioUrl;
    //   } catch (error) {
    //     console.warn('Invalid ad detected, filtering out:', ad._id, error.message);
    //     return false;
    //   }
    // });

// we just muted time because ads are expired for now.
// --------------------------------------------------

const validAds = ads.filter(ad => {
  try {
    const hasAudioUrl =
      ad.streamingAudioAdUrl &&
      ad.streamingAudioAdUrl.trim() !== '';

    // Only skip URLs — ignore schedule completely
    return hasAudioUrl;
  } catch (error) {
    console.warn('Invalid ad detected, filtering out:', ad._id, error.message);
    return false;
  }
});


    console.log(`✅ Found ${validAds.length} valid ads out of ${ads.length} total`);

    // 9. Format response EXACTLY as specified in query
    const formattedAds = validAds.map(ad => ({
      // Core ad fields
      id: ad._id,
      adTitle: ad.adTitle,
      adType: ad.adType,
      campaignId: ad.campaignId,
      description: ad.description,
      duration: ad.audioDurationMs,
      
      // URLs
      masterAudionAdUrl: ad.masterAudionAdUrl,
      streamingAudioAdUrl: ad.streamingAudioAdUrl,
      streamingFallBackAudioAdUrl: ad.streamingFallBackAudioUrl,
      adArtWorkUrl: ad.adArtWorkUrl,
      
      // Advertiser info
      advertiser: ad.advertiserId ? {
        _id: ad.advertiserId._id,
        brandType: ad.advertiserId.brandType,
        companyName: ad.advertiserId.companyName,
        companyWebsite: ad.advertiserId.companyWebsite,
        country: ad.advertiserId.country
      } : null,
      
      // Schedule
      schedule: {
        startDate: ad.schedule.startDate,
        endDate: ad.schedule.endDate
      },
      
      // Targeting
      targeting: {
        city: ad.targeting.city,
        countries: ad.targeting.countries,
        scope: ad.targeting.scope,
        state: ad.targeting.state,
        wholeCountry: ad.targeting.wholeCountry
      }
    }));

    // 10. Frequency caps temporarily disabled for testing; serve all formatted ads
    const cappedAds = formattedAds;

    // Cache the formatted ads for this user/location combo
    if (redisClient && cappedAds.length) {
      try {
        await writeCachedAds(redisClient, cacheKey, cappedAds);
      } catch (cacheErr) {
        console.warn('⚠️ Failed to write ads cache:', cacheErr.message);
      }
    }

    return {
      success: true,
      ads: cappedAds,
      error: cappedAds.length ? null : 'Frequency capped for available ads'
    };

  } catch (error) {
    console.error('❌ Error fetching audio ads:', error);
    return { 
      success: false, 
      ads: [], 
      error: 'Failed to fetch ads. Please try again.'
    };
  }
};




// ===== HELPER: Normalize existing ads =====
export const normalizeExistingAds = async () => {
  try {
    const ads = await Ad.find({});
    let updatedCount = 0;
    
    for (const ad of ads) {
      const normalizedTargeting = {
        scope: ad.targeting.scope,
        countries: ad.targeting.countries.map(normalizeCountry),
        wholeCountry: ad.targeting.wholeCountry,
        state: ad.targeting.state ? normalizeUSState(ad.targeting.state) : null,
        city: ad.targeting.city ? normalizeCity(ad.targeting.city) : null
      };
      
      await Ad.updateOne(
        { _id: ad._id },
        { $set: { targeting: normalizedTargeting } }
      );
      updatedCount++;
    }
    
    console.log(`✅ Normalized ${updatedCount} existing ads`);
    return { success: true, normalized: updatedCount };
  } catch (error) {
    console.error('Error normalizing ads:', error);
    return { success: false, error: error.message };
  }
};
