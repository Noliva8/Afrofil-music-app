// ESM module
import geoip from 'geoip-lite';

/**
 * Normalize IPv6-mapped IPv4 addresses, strip brackets, etc.
 */
function normalizeIp(ip) {
  if (!ip) return null;
  let v = String(ip).trim();

  // Remove enclosing brackets for IPv6 literals, if any
  if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1);

  // If it's a comma-separated list (X-Forwarded-For), take the first hop
  if (v.includes(',')) v = v.split(',')[0].trim();

  // IPv6 localhost
  if (v === '::1') return null;

  // IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1)
  const m = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (m) return m[1];

  // Plain localhost
  if (v === '127.0.0.1') return null;

  return v;
}

/** Extract client IP from Node/Apollo/Express request */
export function extractIp(req) {
  // 1) explicit query param for testing
  if (req?.query?.ip) {
    const queryIp = normalizeIp(req.query.ip);
    if (queryIp) {
      console.log('[extractIp] query ip =', queryIp);
      return queryIp;
    }
  }

  // 2) common proxy/CDN headers
  const headersToCheck = [
    'x-client-ip',
    'x-forwarded-for',
    'cf-connecting-ip',
    'fastly-client-ip',
    'true-client-ip',
    'x-real-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const h of headersToCheck) {
    const val = req.headers[h] || req.headers[h.toLowerCase()];
    if (val) {
      const ip = normalizeIp(val);
      if (ip) {
        console.log('[extractIp] header', h, '=', ip);
        return ip;
      }
    }
  }

  // 3) connection fallback (will often be localhost in dev)
  const fallback =
    normalizeIp(req.connection?.remoteAddress) ||
    normalizeIp(req.socket?.remoteAddress) ||
    normalizeIp(req.connection?.socket?.remoteAddress) ||
    null;

  console.log('[extractIp] fallback ip =', fallback);
  return fallback;
}

/** Returns { source,country,state,city,latitude,longitude,accuracy } or null-ish */
export function getGeo(req, specificIp = null) {
  try {
    const ip = specificIp || extractIp(req);
    console.log('[getGeo] lookup for ip:', ip);
    if (!ip) return { country: null, state: null, city: null };

    const rec = geoip.lookup(ip);
    console.log('[getGeo] geoip-lite result:', rec);

    if (!rec) return { country: null, state: null, city: null };

    const [lat, lon] = Array.isArray(rec.ll) ? rec.ll : [null, null];

    return {
      source: 'server-geoip',
      country: rec.country || null,
      state: rec.region || null,
      city: rec.city || null,
      latitude: lat,
      longitude: lon,
      accuracy: 10000
    };
  } catch (e) {
    console.error('[getGeo] error:', e);
    return { country: null, state: null, city: null };
  }
}
