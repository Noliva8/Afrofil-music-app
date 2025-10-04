// src/player/persistence/buildPlaybackPayload.js

const norm = (s) => (s ?? "").toString().trim().toLowerCase();

// Accept already-enum'd values from your app (PlaybackSource.TRENDING, etc.)
const VALID_SOURCES = new Set([
  "PLAYLIST","ALBUM","ARTIST","TRACK",
  "SEARCH","RADIO","RECOMMENDATION","DISCOVER",
  "STATION","CHART","GENRE","MOOD",
  "LIKED","HISTORY","RECENT","USER_GENERATED",
  "PODCAST","TRENDING","UNKNOWN"
]);

/** Map loose source strings → GraphQL enum PlaybackSource */
export function toPlaybackSourceEnum(source, { contextUri, recommendationType } = {}) {
  const upper = (source ?? "").toString().trim().toUpperCase();
  if (VALID_SOURCES.has(upper)) return upper; // short-circuit if already valid

  const s = norm(source);
  const u = norm(contextUri);

  switch (s) {
    // Core
    case "playlist": return "PLAYLIST";
    case "album":    return "ALBUM";
    case "artist":
    case "artist_top":
    case "top":      return "ARTIST";
    case "track":
    case "song":     return "TRACK";

    // Dynamic
    case "search":           return "SEARCH";
    case "radio":            return "RADIO";
    case "recommendation":
    case "for_you":
    case "suggested":
    case "auto":             return "RECOMMENDATION";
    case "discover":
    case "discover_weekly":  return "DISCOVER";
    case "trending":         return "TRENDING";    // <-- FIX: trending stays TRENDING

    // Editorial
    case "station":
    case "editorial":
    case "curated":          return "STATION";
    case "chart":
    case "topcharts":
    case "top_100":          return "CHART";
    case "genre":            return "GENRE";
    case "mood":             return "MOOD";

    // User activity
    case "liked":
    case "favorites":
    case "favorite":         return "LIKED";
    case "history":          return "HISTORY";
    case "recent":           return "RECENT";
    case "ugc":
    case "user_generated":
    case "user":             return "USER_GENERATED";

    // Other
    case "podcast":          return "PODCAST";
    case "manual":
    case "unknown":
    default: {
      // Heuristics from URI or recommendationType — prefer TRENDING over CHART
      if (u.includes("trending"))    return "TRENDING";     // <-- FIX: trending → TRENDING
      if (u.includes("chart"))       return "CHART";
      if (u.startsWith("playlist:")) return "PLAYLIST";
      if (u.startsWith("album:"))    return "ALBUM";
      if (u.startsWith("artist:"))   return "ARTIST";
      if (u.startsWith("track:"))    return "TRACK";
      if (u.includes("radio"))       return "RADIO";
      if (norm(recommendationType))  return "RECOMMENDATION";
      return "UNKNOWN";
    }
  }
}

/** OFF | TRACK | CONTEXT */
export function toRepeatModeEnum(repeatMode, flags = {}) {
  const s = norm(repeatMode);
  if (s === "off" || s === "none" || s === "false") return "OFF";
  if (s === "track" || s === "one" || s === "song") return "TRACK";
  if (s === "context" || s === "all" || s === "queue" || s === "playlist") return "CONTEXT";

  const { repeatOne, repeatAll, repeat } = flags || {};
  if (repeatOne === true) return "TRACK";
  if (repeatAll === true) return "CONTEXT";
  if (repeat === true)    return "TRACK";
  return "OFF";
}

export function buildPlaybackPayload({
  playerState,
  audioRef,
  userId,
  sessionId,
  canonicalQueueRef,
  currentIndexRef,
}) {
  const a = audioRef?.current;
  const track = playerState?.currentTrack;
  if (!track) return null;

  const baseCtx = playerState?.playbackContext || {};
  const rawSource =
    playerState?.playbackSource ??
    baseCtx.source ??
    baseCtx.sourceName ?? // last-ditch hint
    null;

  const sourceEnum = toPlaybackSourceEnum(rawSource, {
    contextUri: baseCtx.contextUri,
    recommendationType: baseCtx.recommendationType,
  });

  const sourceId =
    playerState?.playbackSourceId || baseCtx.sourceId || null;

  const queuePosition = Number.isFinite(currentIndexRef?.current)
    ? currentIndexRef.current
    : 0;

  const queueLength =
    (Array.isArray(canonicalQueueRef?.current) && canonicalQueueRef.current.length)
      ? canonicalQueueRef.current.length
      : ((playerState.queue?.length || 0) + 1);

  const repeatEnum = toRepeatModeEnum(playerState?.repeatMode, {
    repeatOne: playerState?.repeatOne,
    repeatAll: playerState?.repeatAll,
    repeat: playerState?.repeat,
  });

  const position = Math.max(0, Math.floor((a && a.currentTime) || 0));

  return {
    userId: userId || undefined,
    sessionId,
    trackId: track.id,
    positionSec: position,
    playbackContext: {
      source: sourceEnum,           // will now be TRENDING for trending
      sourceId,
      sourceName: baseCtx.sourceName || null,
      queuePosition,
      queueLength,
      shuffle: !!playerState?.shuffle,
      repeat: repeatEnum,
      contextUri: baseCtx.contextUri || null,
      radioSeed: baseCtx.radioSeed || null,
      searchQuery: baseCtx.searchQuery || null,
      recommendationType: baseCtx.recommendationType || null,
    },
  };
}
