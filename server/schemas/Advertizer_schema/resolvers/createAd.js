import { GraphQLError } from 'graphql';
import { Advertizer, Ad } from "../../../models/Advertizer/index_advertizer.js";
import { calculateAdPrice } from '../../../utils/priceCalculator.js';

// Define authentication error
const AuthError = new GraphQLError('Could not authenticate advertizer.', {
  extensions: { code: 'UNAUTHENTICATED' }
});

// Helper function to parse dates
const toDate = (dateString) => {
  if (!dateString) return new Date(NaN);
  return new Date(dateString);
};




export const createAdBasic = async (_, { advertiserId, input }, context) => {
  const advertizer = context.advertizer || context?.req?.advertizer;

await cleanupDraftAds(advertiserId);

  if (!advertizer) {
    throw new GraphQLError('Could not authenticate advertizer', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  if (String(advertizer._id) !== String(advertiserId)) {
    throw new GraphQLError('Advertiser ID mismatch', {
      extensions: { code: 'FORBIDDEN' }
    });
  }

  const exists = await Advertizer.exists({ _id: advertiserId });
  if (!exists) {
    throw new GraphQLError('Advertizer not found.', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (!input) {
    throw new GraphQLError('Missing input.', { 
      extensions: { code: 'BAD_USER_INPUT' } 
    });
  }

  const { adTitle = '', adType = 'audio', description = '', targeting, schedule } = input;

  // Debugging: Log the received input
  // console.log("Received input:", input);
  // console.log("Received adType:", adType);  // Log adType

  // Validate adType to ensure it's a valid enum value
  const validAdTypes = ['audio', 'banner', 'overlay'];
  if (!validAdTypes.includes(adType)) {
    console.log("Invalid adType received:", adType); // Log if adType is invalid
    throw new GraphQLError(`Unsupported adType. Allowed values: ${validAdTypes.join(', ')}`, {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (!adTitle.trim()) {
    throw new GraphQLError('adTitle is required', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  if (!targeting?.scope) {
    throw new GraphQLError('targeting.scope is required', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  if (!schedule?.startDate || !schedule?.endDate) {
    throw new GraphQLError('schedule.startDate and schedule.endDate are required', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const startDate = toDate(schedule.startDate);
  const endDate = toDate(schedule.endDate);

  if (Number.isNaN(startDate?.getTime()) || Number.isNaN(endDate?.getTime())) {
    throw new GraphQLError('Invalid date format. Expected YYYY-MM-DD.', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  if (endDate < startDate) {
    throw new GraphQLError('End date must be on or after start date.', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  // ✅ Calculate number of days
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // ✅ Calculate price quote

 const quote = await calculateAdPrice({
    adType,
    scope: targeting.scope,
    country: targeting.countries?.[0] || '',
    city: targeting.city || '',
    state: targeting.state || '',
    days,
    wholeCountry: targeting.wholeCountry || false,
  });

  // Determine location information
  let locationName, locationType;
  if (quote.basis.includes('country:') && quote.basis.includes('state:')) {
    // US format
    locationName = `${quote.basis.split('country:')[1].split(',')[0]}, ${quote.basis.split('state:')[1].split(' ')[0]}`;
    locationType = 'state';
  } else if (quote.basis.includes('city:')) {
    // Other countries format
    locationName = `${targeting.countries?.[0]}, ${targeting.city}`;
    locationType = 'city';
  } else {
    // Country-wide
    locationName = targeting.countries?.[0] || 'Country';
    locationType = 'country';
  }

  const completeQuote = {
    currency: quote.currency,
    days: quote.days,
    perDay: quote.perDay,
    totalPrice: quote.totalPrice,
    scope: quote.scope,
    adType: quote.adType,
    basis: quote.basis,
    location: {
      name: locationName,
      type: locationType,
      country: targeting.countries?.[0] || '',
      city: locationType === 'city' ? targeting.city : null,
      state: locationType === 'state' ? targeting.state : null
    },
    marketSize: quote.basis.includes('major') ? 'major' : 
               quote.basis.includes('minor') ? 'minor' : 'country-wide',
    cityPopulation: null,
    isMajorCity: quote.basis.includes('major')
  };

  // console.log('verify quote:', quote);

  // console.log("Saving ad with adType:", adType);  

  // 5) Create the ad
  const ad = await Ad.create({
    advertiserId,
    adTitle: adTitle.trim(),
    adType,  // Make sure the valid adType is used here
    description: description ?? '',
    targeting: {
      scope: targeting.scope,
      countries: targeting.countries ?? [],
      wholeCountry: !!targeting.wholeCountry,
      city: targeting.city ?? '',
      state: targeting.state ?? ''  // Store the state for USA
    },
    schedule: { startDate, endDate },
    status: 'draft',
  });

  return {
adId: ad._id,  
advertiserId: ad.advertiserId,
       ad,

    quote: completeQuote
  };
};



export const cleanupDraftAds = async (advertiserId) => {
  try {
    const result = await Ad.deleteMany({
      advertiserId,
      isCostConfirmed: false,
      
    });
    console.log(`Cleaned up ${result.deletedCount} draft ads`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up draft ads:', error);
    return 0;
  }
};