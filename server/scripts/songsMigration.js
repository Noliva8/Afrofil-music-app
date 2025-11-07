
import { withTimeout } from "../schemas/Artist_schema/Redis/songCreateRedis.js";
import { getRedis } from "../utils/AdEngine/redis/redisClient.js";
import { createSongIndex } from "../schemas/Artist_schema/Redis/songCreateRedis.js";
import {Song} from "../models/Artist/index_artist.js"
import { createSongRedis } from "../schemas/Artist_schema/Redis/songCreateRedis.js";



// Flush everything, rebuild the SONG index, and reimport all songs as JSON
export async function flushAllAndReimportSongs({
  batchSize = 200,        // Mongo cursor batch size
  logEvery = 100,         // progress log cadence
  limit = 0               // stop after N (0 = all)
} = {}) {
  const r = await withTimeout(getRedis(), 5000, "Redis connection timeout");
  const startedAt = new Date().toISOString();
  const summary = {
    ok: true,
    startedAt,
    finishedAt: null,
    flushed: false,
    indexCreated: false,
    mongo: { total: 0, sample: [] },
    inserted: 0,
    errors: [],
  };

  // 0) Quick Mongo sanity check
  try {
    summary.mongo.total = await Song.estimatedDocumentCount();
  } catch (e) {
    // fallback
    try { summary.mongo.total = await Song.countDocuments(); } catch {}
  }
  console.log(`[reimport:songs] Mongo total ~ ${summary.mongo.total}`);

  // 1) FLUSHALL (version-safe)
  try {
    await flushAllSafe(r);
    summary.flushed = true;
    console.log("[reimport:songs] Redis FLUSHALL done");
  } catch (e) {
    summary.ok = false;
    summary.errors.push(`FLUSHALL failed: ${e?.message || String(e)}`);
    summary.finishedAt = new Date().toISOString();
    return summary;
  }

  // 2) Re-create the SONG index (empty DB → quick)
  try {
    await createSongIndex();
    summary.indexCreated = true;
    console.log("[reimport:songs] idx:songs created");
  } catch (e) {
    // if it already exists somehow, continue; otherwise bail
    const msg = String(e?.message || "");
    if (!/already exists/i.test(msg)) {
      summary.ok = false;
      summary.errors.push(`createSongIndex failed: ${msg}`);
      summary.finishedAt = new Date().toISOString();
      return summary;
    }
    console.log("[reimport:songs] idx:songs already existed");
  }

  // 3) Stream-import songs (first, log a tiny sample so we know data is there)
  try {
    const sampleDocs = await Song.find().select("_id title artist album createdAt").limit(3).lean();
    summary.mongo.sample = sampleDocs.map(s => ({
      _id: String(s?._id || ""),
      title: s?.title || "",
      artist: s?.artist ? String(s.artist) : "",
      album: s?.album ? String(s.album) : "",
    }));
    console.log("[reimport:songs] Sample from Mongo:", summary.mongo.sample);
  } catch (e) {
    console.warn("[reimport:songs] Could not fetch sample:", e?.message || e);
  }

  // 4) Stream everything (or up to `limit`)
  try {
    const cursor = Song.find().lean().cursor({ batchSize });
    let n = 0;
    for await (const song of cursor) {
      try {
        await createSongRedis(song); // your JSON-first writer builds all sets/zsets too
        n++;
        if (logEvery && n % logEvery === 0) {
          console.log(`[reimport:songs] inserted ${n}/${summary.mongo.total}`);
        }
        if (limit && n >= limit) break;
      } catch (e) {
        const sid = String(song?._id || "");
        console.warn(`[reimport:songs] createSongRedis failed for ${sid}:`, e?.message || e);
        summary.errors.push({ id: sid, error: e?.message || String(e) });
      }
    }
    summary.inserted = n;
  } catch (e) {
    summary.ok = false;
    summary.errors.push(`Mongo cursor failed: ${e?.message || String(e)}`);
  }

  summary.finishedAt = new Date().toISOString();
  console.log(`[reimport:songs] Done. Inserted=${summary.inserted}, Errors=${summary.errors.length}`);
  return summary;
}

/* ---------- tiny helper: version-safe FLUSHALL ---------- */
async function flushAllSafe(r) {
  // prefer low-level sendCommand to avoid wrong options signature
  try {
    await withTimeout(r.sendCommand(['FLUSHALL', 'ASYNC']), 15000, 'FLUSHALL ASYNC timeout');
    return;
  } catch (e) {
    const msg = String(e?.message || e);
    // Try synchronous
    try {
      await withTimeout(r.sendCommand(['FLUSHALL']), 15000, 'FLUSHALL timeout');
      return;
    } catch (e2) {
      // If FLUSHALL is forbidden by the host, fall back to SCAN-delete
      console.warn("[reimport:songs] FLUSHALL not permitted; falling back to SCAN+DEL");
      await deleteAllKeysByScan(r);
    }
  }
}

/** Brutal fallback: delete ALL keys via SCAN + DEL (one-by-one, safest). */
async function deleteAllKeysByScan(r, chunk = 1000) {
  let cursor = 0;
  do {
    const [next, keys] = await r.scan(cursor, { MATCH: '*', COUNT: chunk });
    cursor = Number(next) || 0;
    if (Array.isArray(keys) && keys.length) {
      for (const k of keys) {
        const key = String(k);
        try { await r.unlink?.(key); } catch { await r.del(key); }
      }
    }
  } while (cursor !== 0);
}
