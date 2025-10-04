import { createSongIndex, createArtistIndex, createAllIndexes } from "./songCreateRedis.js";

import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";



const ALREADY = (e) => String(e?.message || '').includes('already exists');

let initPromise = null;

export async function ensureSearchIndexes() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Quick check: if both indexes already present, exit fast
      const r = await getRedis();
      const songsOk   = await r.ft.info('idx:songs').then(() => true).catch(() => false);
      const artistsOk = await r.ft.info('idx:artists').then(() => true).catch(() => false);

      if (songsOk && artistsOk) return true;

      // Create whatever is missing; tolerate races
      if (!songsOk)   { try { await createSongIndex();   } catch (e) { if (!ALREADY(e)) throw e; } }
      if (!artistsOk) { try { await createArtistIndex(); } catch (e) { if (!ALREADY(e)) throw e; } }

      return true;
    } catch (e) {
      // fall back to the all-in-one (also tolerates 'already exists')
      try {
        await createAllIndexes();
        return true;
      } catch (err) {
        if (ALREADY(err)) return true;
        // reset so next request can retry init
        initPromise = null;
        throw err;
      }
    }
  })();

  return initPromise;
}
