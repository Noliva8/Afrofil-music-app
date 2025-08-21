const POP_CACHE = new Map();           // in-memory cache
const CACHE_TTL = 15 * 60 * 1000;      // 15 minutes cache lifetime

// Predefined country and city data
const SUPPORTED_COUNTRIES = {
  'Rwanda': {
    name: 'Rwanda',
    majorCities: ['Kigali'],
    otherCities: ['Southern Province', 'Northern Province', 'Western Province', 'Eastern Province'],
    allCities: function() { return [...this.majorCities, ...this.otherCities]; }
  },
  'United States': {
    name: 'United States',
    majorCities: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming'
    ],
    otherCities: [],
    allCities: function() { return this.majorCities; }
  },
  'Uganda': {
    name: 'Uganda',
    majorCities: ['Kampala'],
    otherCities: ['Entebbe', 'Jinja', 'Mbale', 'Mbarara', 'Gulu', 'Lira', 'Arua'],
    allCities: function() { return [...this.majorCities, ...this.otherCities]; }
  },
  'Kenya': {
    name: 'Kenya',
    majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    otherCities: ['Eldoret', 'Thika', 'Malindi', 'Kitale', 'Kakamega'],
    allCities: function() { return [...this.majorCities, ...this.otherCities]; }
  },
  'Nigeria': {
    name: 'Nigeria',
    majorCities: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Benin City'],
    otherCities: ['Ibadan', 'Enugu', 'Kaduna', 'Aba', 'Zaria', 'Jos'],
    allCities: function() { return [...this.majorCities, ...this.otherCities]; }
  }
};

// --- Helper Functions ---

function cacheKey(country, city) {
  return `${(country || '').trim().toLowerCase()}|${(city || '').trim().toLowerCase()}`;
}

function cacheGet(key) {
  const hit = POP_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL) {
    POP_CACHE.delete(key);
    return null;
  }
  return hit.v;
}

function cacheSet(key, value) {
  POP_CACHE.set(key, { v: value, t: Date.now() });
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function isSupportedCountry(country) {
  return Object.keys(SUPPORTED_COUNTRIES)
    .some(c => normalizeName(c) === normalizeName(country));
}

function getCountryData(country) {
  const normalizedCountry = normalizeName(country);
  const countryKey = Object.keys(SUPPORTED_COUNTRIES)
    .find(c => normalizeName(c) === normalizedCountry);
  return countryKey ? SUPPORTED_COUNTRIES[countryKey] : null;
}

// --- Core Functions ---

export function isMajorCity(country, city) {
  if (!country || !city) return false;
  
  const countryData = getCountryData(country);
  if (!countryData) return false;

  const normalizedCity = normalizeName(city);
  return countryData.majorCities
    .some(c => normalizeName(c) === normalizedCity);
}

// **Check for major city or state**
export async function cityLookUp(country, cityOrState) {
  if (!country || !cityOrState) return null;

  const key = cacheKey(country, cityOrState);
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  try {
    const countryData = getCountryData(country);
    
    // For USA, check if state is valid (since city field won't be used)
    if (country === 'United States') {
      // Normalized check for state
      const normalizedState = normalizeName(cityOrState);
      const isMajor = countryData.majorCities
        .some(s => normalizeName(s) === normalizedState);
      cacheSet(key, isMajor);
      return isMajor;
    }

    // For other countries, check for city
    const isMajor = isMajorCity(country, cityOrState);
    cacheSet(key, isMajor);
    return isMajor;
  } catch (error) {
    console.error('cityLookUp error:', error?.message || error);
    cacheSet(key, null);
    return null;
  }
}


