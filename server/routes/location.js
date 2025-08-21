

import express from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

const router = express.Router();
const ipCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const SERVICES = [
  {
    name: 'ip-api',
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,timezone,query`,
    validator: (data) => data.status === 'success',
    parser: (data) => ({
      method: 'ip-api',
      ip: data.query,
      country: data.country,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      accuracy: 10000 // City-level accuracy
    })
  },
  {
    name: 'ipinfo',
    url: (ip) => `https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`,
    validator: (data) => !!data.country,
    parser: (data) => {
      const [lat, lon] = data.loc?.split(',') || [];
      return {
        method: 'ipinfo',
        ip: data.ip,
        country: data.country,
        city: data.city,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lon ? parseFloat(lon) : null,
        timezone: data.timezone,
        accuracy: data.city ? 20000 : 500000 // Country-level if no city
      };
    }
  }
];

router.get('/', async (req, res) => {
  try {
    const ip = getValidIp(req);
    if (!ip) return res.status(400).json({ error: 'Could not determine IP' });

    // Check cache
    const cached = ipCache.get(ip);
    if (cached) return res.json(cached);

    // Try services in order
    for (const service of SERVICES) {
      try {
        const result = await tryService(service, ip);
        if (result) {
          ipCache.set(ip, result);
          return res.json(result);
        }
      } catch (e) {
        console.warn(`${service.name} failed:`, e.message);
      }
    }

    res.status(500).json({ error: 'All location services failed' });
  } catch (error) {
    console.error('Location endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getValidIp(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.socket.remoteAddress;
  return ip && !ip.startsWith('::') ? ip : null;
}

async function tryService(service, ip) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(service.url(ip), {
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!service.validator(data)) throw new Error('Invalid response');

    return service.parser(data);
  } finally {
    clearTimeout(timeout);
  }
}

export default router;