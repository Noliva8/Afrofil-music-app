

const LOCATION_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const GPS_TIMEOUT = 10_000; // 10s
const DEFAULT_ACCURACY = { HIGH: 50, CITY: 5000, COUNTRY: 50_000 };

const isBrowser = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';

// simple runtime flag: enable with localStorage.setItem('af:loc:debug','1')
const DEBUG = () => {
  try {
    if (process.env?.NODE_ENV === 'development') return true;
  } catch {}
  try {
    return typeof window !== 'undefined' &&
      (window.__AF_LOC_DEBUG === true || localStorage.getItem('af:loc:debug') === '1');
  } catch { return false; }
};

function dbg(...args) { if (DEBUG()) console.debug('[Location]', ...args); }
function warn(...args) { if (DEBUG()) console.warn('[Location]', ...args); }
function err(...args) { if (DEBUG()) console.error('[Location]', ...args); }

class GPSDetector {
  constructor() {
    this.isSupported = isBrowser() && 'geolocation' in navigator;
    this.CACHE_KEY = 'locationData'; // single cache key across app
  }

  async getCurrentLocation(options = {}) {
    const {
      enableHighAccuracy = true,
      timeout = GPS_TIMEOUT,
      maximumAge = LOCATION_CACHE_TTL,
      allowExternalFallback = false // set true if you want ipapi/geojs after backend
    } = options;

    if (!isBrowser()) {
      warn('Not in a browser environment; returning null.');
      return null;
    }

    dbg('getCurrentLocation start', { enableHighAccuracy, timeout, maximumAge, allowExternalFallback });

    // 1) cache
    const cached = this.getCachedLocation();
    if (cached) {
      dbg('Using cached location ✅', cached);
      return cached;
    }

    // 2) GPS
    if (this.isSupported) {
      try {
        dbg('Trying GPS…');
        const pos = await this.getGPSLocation({ enableHighAccuracy, timeout, maximumAge });
        const loc = this.formatLocation({
          source: 'gps',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy ?? DEFAULT_ACCURACY.HIGH
        });
        this.cacheLocation(loc);
        dbg('Got GPS location ✅', loc);
        return loc;
      } catch (e) {
        warn('GPS failed (user denied / timeout / unsupported):', e?.message || e);
      }
    } else {
      dbg('Navigator geolocation not supported; skipping GPS.');
    }

    // 3) Backend GeoIP (preferred)
    try {
      dbg('Fetching backend location /api/location…');
      const be = await this.getBackendLocation();
      if (be) {
        this.cacheLocation(be);
        dbg('Got backend GeoIP location ✅', be);
        return be;
      }
      warn('Backend location returned null / non-OK.');
    } catch (e) {
      warn('Backend location fetch failed:', e?.message || e);
    }

    // 4) Public IP providers (optional)
    if (allowExternalFallback) {
      dbg('Trying public IP providers…');
      try {
        const ip = await this.getIPLocation();
        if (ip) {
          this.cacheLocation(ip);
          dbg('Got IP-based location ✅', ip);
          return ip;
        }
        warn('Public IP providers returned null.');
      } catch (e) {
        warn('Public IP providers failed:', e?.message || e);
      }
    } else {
      dbg('Skipped external IP providers (allowExternalFallback=false).');
    }

    // 5) Default
    const def = this.getDefaultLocation();
    this.cacheLocation(def);
    dbg('Using default location ⚠️', def);
    return def;
  }

  getGPSLocation({ enableHighAccuracy, timeout, maximumAge }) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (e) => reject(e),
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }

  async getBackendLocation() {
    const res = await fetchWithTimeout('/api/location', 3000);
    if (!res.ok) {
      warn('Backend /api/location not OK:', res.status);
      return null;
    }
    const data = await res.json().catch(() => null);
    if (!data) {
      warn('Backend /api/location empty JSON');
      return null;
    }

    const loc = this.formatLocation({
      source: data.method || 'server-geoip',
      country: data.countryCode || data.country || null,
      region: data.region || data.state || null,
      city: data.city || null,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMeters: typeof data.accuracy === 'number' ? data.accuracy : DEFAULT_ACCURACY.COUNTRY
    });
    return loc;
  }

  async getIPLocation() {
    const providers = [
      {
        url: 'https://ipapi.co/json/',
        parser: (d) => this.formatLocation({
          source: 'ipapi',
          country: d.country || d.country_code || d.country_name || null,
          region: d.region || null,
          city: d.city || null,
          latitude: num(d.latitude),
          longitude: num(d.longitude),
          accuracyMeters: d.city ? DEFAULT_ACCURACY.CITY : DEFAULT_ACCURACY.COUNTRY
        })
      },
      {
        url: 'https://get.geojs.io/v1/ip/geo.json',
        parser: (d) => this.formatLocation({
          source: 'geojs',
          country: d.country_code || d.country || null,
          region: d.region || null,
          city: d.city || null,
          latitude: num(d.latitude),
          longitude: num(d.longitude),
          accuracyMeters: DEFAULT_ACCURACY.CITY
        })
      }
    ];

    for (const p of providers) {
      try {
        dbg('Fetching', p.url);
        const res = await fetchWithTimeout(p.url, 2000);
        if (!res.ok) {
          warn('Provider not OK:', p.url, res.status);
          continue;
        }
        const d = await res.json().catch(() => null);
        if (!d) {
          warn('Provider empty JSON:', p.url);
          continue;
        }
        const loc = p.parser(d);
        if (loc.latitude && loc.longitude) {
          dbg('IP provider success ✅', p.url, loc);
          return loc;
        }
      } catch (e) {
        warn('Provider error:', p.url, e?.message || e);
      }
    }
    return null;
  }

  getDefaultLocation() {
    const lang = (navigator.language || 'en-US');
    const cc = (lang.split('-')[1] || 'US').toUpperCase();
    const map = {
      US: { lat: 39.8283, lng: -98.5795 },
      GB: { lat: 55.3781, lng: -3.4360 },
      DE: { lat: 51.1657, lng: 10.4515 },
      FR: { lat: 46.6034, lng: 1.8883 },
      BR: { lat: -14.2350, lng: -51.9253 },
      IN: { lat: 20.5937, lng: 78.9629 },
      CN: { lat: 35.8617, lng: 104.1954 },
      JP: { lat: 36.2048, lng: 138.2529 }
    };
    const c = map[cc] || map.US;
    return this.formatLocation({
      source: 'default',
      country: cc,
      latitude: c.lat,
      longitude: c.lng,
      accuracyMeters: DEFAULT_ACCURACY.COUNTRY
    });
  }

  formatLocation(x) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const countryCode = x.country ? String(x.country).toUpperCase() : null;
    return {
      source: x.source || 'unknown',
      country: countryCode,       // ISO-2 if possible
      countryCode,                // convenience mirror
      region: x.region || null,
      city: x.city || null,
      latitude: num(x.latitude),
      longitude: num(x.longitude),
      accuracyMeters: typeof x.accuracyMeters === 'number' ? x.accuracyMeters : null,
      timeZone: tz,
      timestamp: Date.now()
    };
  }

  cacheLocation(location) {
    try {
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data: location,
        timestamp: Date.now()
      }));
      dbg('Cached location 🗂️', location);
    } catch (e) {
      warn('Failed to cache location:', e?.message || e);
    }
  }

  getCachedLocation() {
    try {
      const raw = sessionStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      const fresh = Date.now() - timestamp < LOCATION_CACHE_TTL;
      dbg('Cache check', { fresh, ageMs: Date.now() - timestamp, ttlMs: LOCATION_CACHE_TTL });
      if (fresh) return data;
      sessionStorage.removeItem(this.CACHE_KEY);
      dbg('Cache expired, removed.');
    } catch (e) {
      warn('Cache read failed:', e?.message || e);
    }
    return null;
    }

  clearCache() {
    try { sessionStorage.removeItem(this.CACHE_KEY); dbg('Cache cleared'); } catch {}
  }

  isLocationAccurate(loc, requiredAccuracy = DEFAULT_ACCURACY.CITY) {
    return loc && typeof loc.accuracyMeters === 'number' && loc.accuracyMeters <= requiredAccuracy;
  }

  getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371_000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Helper: transform to the GraphQL input shape and log it */
  asGraphQLInput(loc) {
    if (!loc) return null;
    const payload = {
      source: loc.source || null,
      country: loc.country || null,
      region: loc.region || null,
      city: loc.city || null,
      latitude: typeof loc.latitude === 'number' ? loc.latitude : null,
      longitude: typeof loc.longitude === 'number' ? loc.longitude : null,
      accuracyMeters: typeof loc.accuracyMeters === 'number' ? loc.accuracyMeters : null,
      timeZone: loc.timeZone || null
    };
    dbg('GraphQL location payload ➜', payload);
    return payload;
  }
}

function deg2rad(d) { return d * Math.PI / 180; }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(t);
  }
}

const gpsDetector = new GPSDetector();
export default gpsDetector;
export { DEFAULT_ACCURACY };
