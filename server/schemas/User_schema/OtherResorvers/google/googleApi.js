


export async function reverseGeocode({ lat, lon }) {
  const API_KEY = process.env.UMUTI_WA_GOOGLE;
  const BASE_URL = process.env.UMUTI_URL || 'https://maps.googleapis.com/maps/api/geocode/json';

  const hasLat = Number.isFinite(Number(lat));
  const hasLon = Number.isFinite(Number(lon));
  if (!hasLat || !hasLon) {
    throw new Error('Missing or invalid coordinates for reverse geocoding');
  }

  const _lat = +Number(lat).toFixed(6);
  const _lon = +Number(lon).toFixed(6);

  const url = `${BASE_URL}?latlng=${encodeURIComponent(_lat)},${encodeURIComponent(_lon)}&key=${API_KEY}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return {
          country: null, countryCode: null, region: null, state: null, province: null, city: null,
          lat: _lat, lon: _lon
        };
      }
      throw new Error(`Google Geocoding API error: ${data.status}`);
    }

    if (!Array.isArray(data.results) || data.results.length === 0) {
      return {
        country: null, countryCode: null, region: null, state: null, province: null, city: null,
        lat: _lat, lon: _lon
      };
    }

    const first = data.results[0];
    const comps = Array.isArray(first.address_components) ? first.address_components : [];

    const pick = (type) => comps.find((c) => Array.isArray(c.types) && c.types.includes(type));

    const countryC = pick('country');
    const admin1 = pick('administrative_area_level_1');
    const admin2 = pick('administrative_area_level_2');
    const locality = pick('locality') || pick('postal_town') || pick('sublocality') || pick('neighborhood');

    return {
      country: countryC?.long_name || null,
      countryCode: countryC?.short_name || null,
      region: admin1?.long_name || null,
      state: admin1?.short_name || null,
      province: admin2?.long_name || null,
      city: locality?.long_name || null,
      lat: _lat,
      lon: _lon
    };

  } catch (error) {
    clearTimeout(timeout);
    const msg = error?.name === 'AbortError' ? 'Google request timed out' : (error?.message || String(error));
    throw new Error(`Google vendor failed: ${msg}`);
  }
}
