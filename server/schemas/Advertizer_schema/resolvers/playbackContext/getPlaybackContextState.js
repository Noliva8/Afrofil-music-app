
import { getRedis } from "../../../../utils/AdEngine/redis/redisClient.js";
import { createSongRedis, getSongRedis } from "../../../Artist_schema/Redis/songCreateRedis.js";



const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ---------- Key helpers ----------
export const normalizeSessionId = (sid) =>
  sid && sid.startsWith("sess_") ? sid.slice(5) : sid;

export const userKey = (userId) => (userId ? `ctx:user:${userId}` : null);

export const sessionKey = (sidRaw) => {
  const sid = normalizeSessionId(sidRaw);
  return sid ? `ctx:session:${sid}` : null;
};

export const keyCandidates = ({ userId, sessionId }) => {
  const ks = [];
  if (userId) ks.push(userKey(userId));
  if (sessionId) ks.push(sessionKey(sessionId));
  return ks.filter(Boolean);
};

// ---------- Song normalizer (match your GraphQL Song type) ----------
/**
 * Ensures `_id` is present and `duration` is never null (fallback = 0)
 * Returns only fields your client actually needs to resume.
 */
function normalizeSong(doc, fallbackId) {
  if (!doc) return null;

  const _id = String(doc._id ?? doc.id ?? doc.trackId ?? fallbackId ?? "");
  if (!_id) return null; // avoids "non-nullable Song._id" GraphQL error

  const coerceNum = (v) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
  };
  const pickDuration = () => {
    const cands = [
      doc.duration,
      doc.audioDuration,
      doc.meta?.duration,
      doc.streamAudioFileDuration,
      doc.streamInfo?.duration,
    ];
    for (const c of cands) {
      const n = coerceNum(c);
      if (n != null) return n;
    }
    return 0; // schema-safe fallback
  };

  return {
    _id,
    title: doc.title ?? null,
    duration: pickDuration(),
    artwork: doc.artwork ?? doc.artworkUrl ?? null,
    audioFileUrl: doc.audioFileUrl ?? null,
    streamAudioFileUrl: doc.streamAudioFileUrl ?? doc.audioUrl ?? null,
  };
}

// ---------- Queue reconstruction ----------
async function resolveQueueIdsFromContext(ctx, context) {
  const { source, contextUri, sourceId } = ctx || {};
  try {
    switch (source) {
      case "TRENDING": {
        // e.g. "afrofeel:trending" → "trending"
        const key = (contextUri && contextUri.split(":")[1]) || "trending";
        if (typeof context?.fetchTrendingIds === "function") {
          return await context.fetchTrendingIds(key);
        }
        return [];
      }
      case "PLAYLIST":
        if (typeof context?.fetchPlaylistIds === "function") {
          return await context.fetchPlaylistIds(sourceId);
        }
        return [];
      case "ALBUM":
        if (typeof context?.fetchAlbumIds === "function") {
          return await context.fetchAlbumIds(sourceId);
        }
        return [];
      case "ARTIST":
        if (typeof context?.fetchArtistTopIds === "function") {
          return await context.fetchArtistTopIds(sourceId);
        }
        return [];
      // TODO: add SEARCH, RADIO, GENRE, MOOD, STATION when your data layer is ready
      default:
        return [];
    }
  } catch {
    return [];
  }
}

// ---------- DB fallback helper ----------
async function fetchSongFromDatabase(trackId, context) {
  try {
    if (typeof context?.fetchTrackById === "function") {
      return await context.fetchTrackById(trackId);
    } else if (context?.TrackModel) {
      return await context.TrackModel.findById(trackId).lean();
    }
  } catch (e) {
    // non-fatal
  }
  return null;
}

// ---------- Main resolver ----------
export async function getPlaybackContextState(_, { userId, sessionId }, context) {
  // console.log("[getPlaybackContextState] invoked with:", { userId, sessionId });

  try {
    const redis = await getRedis();
    const candidates = keyCandidates({ userId, sessionId });

    if (!candidates.length) {
      // console.log("[getPlaybackContextState] no valid key candidates");
      return null;
    }

    // console.log("[getPlaybackContextState] checking keys:", candidates);

    let saved = null;
    let raw = null;
    let hitKey = null;

    for (const key of candidates) {
      const val = await redis.get(key);
      if (!val) continue;
      try {
        saved = JSON.parse(val);
        raw = val;
        hitKey = key;
        // console.log("[getPlaybackContextState] found data in key:", key);
        break;
      } catch {
        console.warn("[getPlaybackContextState] corrupted JSON, deleting key:", key);
        try { await redis.del(key); } catch {}
      }
    }

    if (!saved) {
      // console.log("[getPlaybackContextState] no saved data found");
      return null;
    }

    if (!saved?.trackId || !saved?.playbackContext?.source) {
      // console.log("[getPlaybackContextState] missing trackId/source in snapshot");
      return null;
    }

    // Opportunistic copy session → user key
    if (userId && hitKey?.startsWith("ctx:session:")) {
      try {
        await redis.set(userKey(userId), raw, { EX: TTL_SECONDS });
        // console.log("[getPlaybackContextState] copied session snapshot to user key");
      } catch {}
    }

    const trackId = String(saved.trackId);
    // console.log("[getPlaybackContextState] processing track:", trackId);

    // 1) hydrate song from Redis
    let songDoc = await getSongRedis(trackId);
    // console.log("[getPlaybackContextState] song from redis:", !!songDoc);

    // 2) DB fallback + seed Redis
    if (!songDoc) {
      const dbSong = await fetchSongFromDatabase(trackId, context);
      if (dbSong) {
        try { await createSongRedis(dbSong); } catch {}
        songDoc = (await getSongRedis(trackId)) || dbSong;
      }
    }

    // 3) optionally mint short-lived stream URL (NOT stored in Redis)
    if (songDoc && typeof context?.fetchStreamForTrack === "function") {
      try {
        const s = await context.fetchStreamForTrack({
          trackId,
          userTier: context.userTier,
          device: context.device,
          platform: context.platform,
        });
        if (s?.url) {
          songDoc = {
            ...songDoc,
            streamAudioFileUrl: s.url, // preferred field for the client
            audioUrl: s.url,           // backward compat if needed
            isTeaser: !!s.isTeaser,
          };
        }
      } catch {
        // resume without fresh URL if needed
      }
    }

    // 4) rebuild queue ids so Next/Prev work immediately
    const queueIds = await resolveQueueIdsFromContext(saved.playbackContext, context);

    return {
      v: saved.v ?? 1,
      userId: saved.userId ?? null,
      sessionId: saved.sessionId ?? null,
      trackId,
      positionSec: Number(saved.positionSec ?? 0),
      updatedAt: new Date(Number(saved.updatedAt ?? Date.now())),
      playbackContext: saved.playbackContext,
      song: normalizeSong(songDoc, trackId),
      queueIds, // <-- add this to your GraphQL type if you plan to query it
    };
  } catch (error) {
    console.error("[getPlaybackContextState] unexpected error:", error);
    return null;
  }
}
