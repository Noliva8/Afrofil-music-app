

const LOCATION_CACHE_TTL = 15 * 60 * 1000; // Cache location for 15 minutes
const DEFAULT_ACCURACY = {
  GPS: 50,         // Meters (best case)
  CITY: 5000,      // ~5km radius
  COUNTRY: 50000,  // ~50km radius
};

export default async function detectLocation() {
  // ✅ 1. Check for cached location first
  try {
    const cached = getCachedLocation();
    if (cached) return cached;
  } catch (error) {
    console.warn('Cache read failed:', error.message);
  }

  // ✅ 2. Attempt GPS geolocation (most accurate)
  try {
    const gpsLocation = await getGPSLocation();
    if (gpsLocation) {
      cacheLocation(gpsLocation);
      return gpsLocation;
    }
  } catch (error) {
    console.warn('GPS location failed:', error.message);
  }

  // ✅ 3. Try browser-based IP geolocation services
  try {
    const ipLocation = await getIPLocation();
    if (ipLocation) {
      cacheLocation(ipLocation);
      return ipLocation;
    }
  } catch (error) {
    console.warn('IP location services failed:', error.message);
  }

  // ✅ 4. Final fallback to backend service
  try {
    const backendLocation = await getBackendLocation();
    if (backendLocation) {
      cacheLocation(backendLocation);
      return backendLocation;
    }
  } catch (error) {
    console.error('Backend location failed:', error.message);
  }

  return null;
}

// Helper Functions

function getCachedLocation() {
  const cached = sessionStorage.getItem('locationData');
  if (!cached) return null;

  const { timestamp, data } = JSON.parse(cached);
  if (Date.now() - timestamp < LOCATION_CACHE_TTL) {
    return data;
  }
  return null;
}

async function getGPSLocation() {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        method: 'gps',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
      () => resolve(null), // Silently fail if user denies
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: LOCATION_CACHE_TTL,
      }
    );
  });
}

async function getIPLocation() {
  const services = [
    {
      name: 'ipapi',
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        method: 'ipapi',
        country: data.country_name,
        region: data.region,
        city: data.city,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        accuracy: data.city ? DEFAULT_ACCURACY.CITY : DEFAULT_ACCURACY.COUNTRY,
        ip: data.ip,
      }),
    },
    {
      name: 'geojs',
      url: 'https://get.geojs.io/v1/ip/geo.json',
      parse: (data) => ({
        method: 'geojs',
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        accuracy: DEFAULT_ACCURACY.CITY,
        ip: data.ip,
      }),
    },
  ];

  for (const service of services) {
    try {
      const response = await fetchWithTimeout(service.url, 2000);
      const data = await response.json();
      return service.parse(data);
    } catch (error) {
      continue;
    }
  }
  return null;
}

async function getBackendLocation() {
  try {
    const response = await fetchWithTimeout('/api/location', 3000);
    const data = await response.json();
    return {
      method: data.method || 'backend',
      ...data,
    };
  } catch (error) {
    return null;
  }
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function cacheLocation(data) {
  try {
    sessionStorage.setItem('locationData', JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch (error) {
    console.warn('Failed to cache location:', error);
  }
}