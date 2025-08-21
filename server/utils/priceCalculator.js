import { isMajorCity } from '../utils/cityLookUp.js';
import { cityLookUp } from '../utils/cityLookUp.js';
// -----------------------------
const PRICE_CONFIG = {
  worldwide: { audio: 25, overlay: 18, banner: 15 },
  country: {
    US: { audio: 20, overlay: 12, banner: 10 },
    UK: { audio: 18, overlay: 11, banner: 10 },
    Rwanda: { audio: 12, overlay: 8, banner: 5 },
    Kenya: { audio: 12, overlay: 9, banner: 7 },
    Uganda: { audio: 10, overlay: 5, banner: 5 },
    default: { audio: 15, overlay: 12, banner: 8 }
  },
  city: { major: 1.5, minor: 0.8 }
};

// -----------------------------

export async function calculateAdPrice({ adType, scope, country, state, city, days, wholeCountry }) {
  // Validate input parameters
  const t = String(adType || '').toLowerCase();
  if (!['audio', 'overlay', 'banner'].includes(t)) {
    throw new Error('Unsupported adType');
  }
  if (!days || days <= 0) {
    throw new Error('days must be > 0');
  }

  let perDay = 0;
  let basis = '';
  let locationName = '';
  let locationType = '';

  // Calculate base price based on scope
  if (scope === 'worldwide') {
    perDay = PRICE_CONFIG.worldwide[t] || 0;
    basis = 'worldwide';
    locationName = 'Worldwide';
    locationType = 'worldwide';
  } 
  else if (scope === 'country') {
    const table = PRICE_CONFIG.country[country] || PRICE_CONFIG.country.default;
    const countryPerDay = table[t];
    
    if (!countryPerDay) {
      throw new Error('Pricing not configured for country/adType');
    }

    if (country === 'United States' && state && wholeCountry === false) {
      // For US states
      const isMajorState = await cityLookUp(country, state);
      perDay = countryPerDay * PRICE_CONFIG.city.major;
      basis = `country:${country}, state:${state} (major)`;
      locationName = `${country}, ${state}`;
      locationType = 'state';
    } 
    else if (city && wholeCountry === false) {
      // For cities in other countries
      const isMajor = await cityLookUp(country, city);
      const mult = isMajor ? PRICE_CONFIG.city.major : PRICE_CONFIG.city.minor;
      perDay = countryPerDay * mult;
      basis = `city:${isMajor ? 'major' : 'minor'}`;
      locationName = `${country}, ${city}`;
      locationType = 'city';
    } 
    else {
      // Country-wide pricing
      perDay = countryPerDay;
      basis = `country:${country || 'default'}`;
      locationName = country;
      locationType = 'country';
    }
  }
  else {
    throw new Error('Unsupported scope');
  }

  if (perDay <= 0) {
    throw new Error('Pricing not configured');
  }

  return {
    currency: 'USD',
    days,
    perDay,
    totalPrice: perDay * days,
    scope,
    adType: t,
    basis,
    location: {
      name: locationName,
      type: locationType,
      country,
      city: country === 'United States' ? null : city,
      state: country === 'United States' ? state : null
    },
    marketSize: basis.includes('major') ? 'major' : 
               basis.includes('minor') ? 'minor' : 'country-wide'
  };
}