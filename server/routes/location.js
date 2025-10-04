// ESM module
import express from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { getGeo, extractIp } from '../utils/locationDetectorServerSide.js';








const router = express.Router();

const TTL = Number(process.env.LOCATION_CACHE_TTL_SEC || 3600); // seconds (default 1h)
const ipCache = new NodeCache({ stdTTL: TTL, useClones: false });

const ENABLE_EXTERNAL = String(process.env.GEO_ENABLE_EXTERNAL || '0') === '1';
const IPINFO_TOKEN = process.env.IPINFO_TOKEN || null;

// Optional external providers (used only if enrichment is enabled)
const SERVICES = [
  
  {
    name: 'ip-api',
    // include region & regionName so we can display "Virginia"
    url: (ip) =>
      `http://ip-api.com/json/${ip}?fields=status,message,country,city,region,regionName,lat,lon,timezone,query`,
    ok: (d) => d?.status === 'success',
    map: (d) => ({
      method: 'ip-api',
      ip: d.query,
      countryCode: d.country || null,
      region: d.regionName || d.region || null,
      city: d.city || null,
      latitude: d.lat ?? null,
      longitude: d.lon ?? null,
      accuracy: 10000
    })
  },


  IPINFO_TOKEN && {
    name: 'ipinfo',
    url: (ip) => `https://ipinfo.io/${ip}/json?token=${IPINFO_TOKEN}`,
    ok: (d) => !!d?.country,
    map: (d) => {
      const [lat, lon] = (d.loc || '').split(',');
      return {
        method: 'ipinfo',
        ip: d.ip || null,
        countryCode: d.country || null,
        region: d.region || null,
        city: d.city || null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lon ? parseFloat(lon) : null,
        accuracy: d.city ? 20000 : 500000
      };
    }
  }
].filter(Boolean);











router.get('/', async (req, res) => {
  try {
    const ip = extractIp(req);
    if (!ip) {
      return res.status(200).json({
        method: 'unknown',
        ip: null,
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        accuracy: null
      });
    }

    // cache
    const cached = ipCache.get(ip);
    if (cached) {
      console.log('[location] cache hit for ip:', ip);
      return res.json(cached);
    }

    // 1) Try local geoip first
    const local = getGeo(req); // { country, state, city, latitude, longitude, accuracy }
    let payload = null;

    if (local?.country) {
      payload = {
        method: local.source || 'server-geoip',
        ip,
        countryCode: local.country,
        region: local.state || null,
        city: local.city || null,
        latitude: local.latitude ?? null,
        longitude: local.longitude ?? null,
        accuracy: local.accuracy ?? 10000
      };
    }

    // 2) Optional enrichment (if city/region/coords missing or you explicitly want external precision)
    if (
      ENABLE_EXTERNAL &&
      SERVICES.length &&
      (!payload || !payload.city || !payload.region || !payload.latitude || !payload.longitude)
    ) {
      for (const svc of SERVICES) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);

          const resp = await fetch(svc.url(ip), { signal: controller.signal });
          clearTimeout(timeout);
          if (!resp.ok) continue;

          const data = await resp.json().catch(() => null);
          if (!svc.ok(data)) continue;

          const m = svc.map(data);

          if (!payload) {
            // No local payload? Use external result entirely
            payload = {
              method: m.method,
              ip,
              countryCode: m.countryCode || null,
              region: m.region || null,
              city: m.city || null,
              latitude: m.latitude ?? null,
              longitude: m.longitude ?? null,
              accuracy: m.accuracy ?? 50000
            };
          } else {
            // Merge/enrich local with external — prefer external coords (usually more specific)
            payload = {
              ...payload,
              method: `${payload.method}+${m.method}`,
              city: payload.city || m.city || null,
              region: payload.region || m.region || null,
              latitude: (m.latitude ?? payload.latitude) ?? null,
              longitude: (m.longitude ?? payload.longitude) ?? null,
              accuracy: Math.min(payload.accuracy ?? Infinity, m.accuracy ?? Infinity)
            };
          }

          break; // stop after first successful external
        } catch (e) {
          // try next provider
        }
      }
    }

    // 3) Last resort if nothing resolved
    if (!payload) {
      payload = {
        method: 'unknown',
        ip,
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        accuracy: null
      };
    }

    // Cache + log + respond
    ipCache.set(ip, payload);
    console.log('[location] ip:', ip);
    console.log('[location] method:', payload.method);
    console.log('[location] result:', {
      countryCode: payload.countryCode,
      region: payload.region,
      city: payload.city,
      lat: payload.latitude,
      lon: payload.longitude,
      accuracy: payload.accuracy
    });

    return res.json(payload);
  } catch (e) {
    console.error('[location] error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
