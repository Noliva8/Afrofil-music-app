

import { useCallback } from 'react';

export const PlaybackSource = {
  TRENDING: 'TRENDING',          // UPPERCASE to match enum
  PLAYLIST: 'PLAYLIST',
  ALBUM: 'ALBUM',
  RADIO: 'RADIO',
  SEARCH: 'SEARCH',
  RECOMMENDATION: 'RECOMMENDATION',
  RECENT: 'RECENT',
  LIKED: 'LIKED',
  HISTORY: 'HISTORY',
  STATION: 'STATION',
  ARTIST: 'ARTIST',
  GENRE: 'GENRE',
  MOOD: 'MOOD',
  CHART: 'CHART',
  DISCOVER: 'DISCOVER',
  USER_GENERATED: 'USER_GENERATED',
  PODCAST: 'PODCAST',
  UNKNOWN: 'UNKNOWN'
};

export const RepeatModes = {
  OFF: 'off',
  TRACK: 'track',
  CONTEXT: 'context'
};



// Helper to create playback context

export const createPlaybackContext = (context = {}) => {
  // Default values
  const defaults = {
    source: PlaybackSource.UNKNOWN,
    sourceId: null,
    sourceName: 'Unknown',
    queuePosition: 0,
    queueLength: 0,
    shuffle: false,
    repeat: RepeatModes.OFF,
    contextUri: ''
  };

  // Merge defaults with provided context
  return {
    ...defaults,
    ...context
  };
};



// Context builders for specific sources
export const buildPlaylistContext = (playlistId, playlistName, position, length, shuffle = false, repeat = RepeatModes.OFF) => {
  return createPlaybackContext({
    source: PlaybackSource.PLAYLIST,
    sourceId: playlistId,
    sourceName: playlistName,
    queuePosition: position,
    queueLength: length,
    shuffle,
    repeat,
    contextUri: `afrofeel:playlist:${playlistId}`
  });
};



export const buildRadioContext = (seed, seedType, position = 0, length = 50) => {
  return createPlaybackContext({
    source: PlaybackSource.RADIO,
    radioSeed: `${seedType}:${seed}`,
    queuePosition: position,
    queueLength: length,
    contextUri: `afrofeel:radio:${seedType}:${seed}`
  });
};



export const buildSearchContext = (query, position = 0, length = 1) => {
  return createPlaybackContext({
    source: PlaybackSource.SEARCH,
    searchQuery: query,
    queuePosition: position,
    queueLength: length
  });
};

export const buildAlbumContext = (albumId, albumName, position, length) => {
  return createPlaybackContext({
    source: PlaybackSource.ALBUM,
    sourceId: albumId,
    sourceName: albumName,
    queuePosition: position,
    queueLength: length,
    contextUri: `afrofeel:album:${albumId}`
  });
};

export const buildArtistContext = (artistId, artistName, position = 0, length = 50) => {
  return createPlaybackContext({
    source: PlaybackSource.ARTIST,
    sourceId: artistId,
    sourceName: artistName,
    queuePosition: position,
    queueLength: length,
    contextUri: `afrofeel:artist:${artistId}`
  });
};




export const buildTrendingContext = (
  queuePosition = 0,
  queueLength = 0,
  shuffle = false,
  repeat = RepeatModes.OFF
) => {
  return {
    source: PlaybackSource.TRENDING,  
    sourceId: null,
    sourceName: 'Trending',
    queuePosition,
    queueLength,
    shuffle,
    repeat,
    contextUri: 'afrofeel:trending',
    // Optional fields can be omitted or set to null/undefined
    radioSeed: null,
    searchQuery: null,
    recommendationType: null
  };
};



export const buildRecommendationContext = (recommendationType, position = 0, length = 50) => {
  return createPlaybackContext({
    source: PlaybackSource.RECOMMENDATION,
    recommendationType,
    queuePosition: position,
    queueLength: length,
    contextUri: `afrofeel:recommendation:${recommendationType}`
  });
};


export const buildMoodContext = (mood, position = 0, length = 50) => {
  return createPlaybackContext({
    source: PlaybackSource.MOOD,
    sourceId: mood,
    sourceName: mood,
    queuePosition: position,
    queueLength: length,
    contextUri: `afrofeel:mood:${mood}`
  });
};


// Helper to get current position from stored queue
export const getCurrentPosition = (currentTrackId) => {
  try {
    const savedQueue = JSON.parse(localStorage.getItem('originalTrendingQueue') || '[]');
    if (savedQueue.length > 0 && currentTrackId) {
      const currentIndex = savedQueue.findIndex(track => track.id === currentTrackId);
      return currentIndex >= 0 ? currentIndex : 0;
    }
  } catch (error) {
    console.warn('Error reading saved queue:', error);
  }
  return 0;
};

// Helper to get queue length from stored queue
export const getQueueLength = () => {
  try {
    const savedQueue = JSON.parse(localStorage.getItem('originalTrendingQueue') || '[]');
    return savedQueue.length;
  } catch (error) {
    return 0;
  }
};




// utils/playbackContextBuilder.js
// Builds a normalized PlaybackContext and (optionally) persists resume info.





// // ---------------

// const KEY = 'af_playback_v1';
// const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// const now = () => Date.now();

// export function savePlaybackState({
//   track,
//   context,
//   positionSec = 0,
//   durationSec = null,
//   queue = null
// }) {
//   try {
//     const payload = {
//       v: 1,
//       ts: now(),
//       track: track ? {
//         id: track.id ?? track._id ?? null,
//         title: track.title ?? null,
//         audioUrl: track.audioUrl ?? null,
//         artistId: track.artistId ?? null,
//         albumId: track.albumId ?? null,
//         duration: Number.isFinite(track.duration) ? Math.trunc(track.duration) : null
//       } : null,
//       context: context || null,
//       positionSec: Number.isFinite(positionSec) ? Math.max(0, Math.trunc(positionSec)) : 0,
//       durationSec: Number.isFinite(durationSec) ? Math.max(0, Math.trunc(durationSec)) : null,
//       queue: Array.isArray(queue)
//         ? queue.map(t => ({
//             id: t.id ?? t._id ?? null,
//             title: t.title ?? null,
//             audioUrl: t.audioUrl ?? null,
//             artistId: t.artistId ?? null,
//             albumId: t.albumId ?? null
//           }))
//         : null
//     };
//     localStorage.setItem(KEY, JSON.stringify(payload));
//   } catch {}
// }

// export function loadPlaybackState() {
//   try {
//     const raw = localStorage.getItem(KEY);
//     if (!raw) return null;
//     const data = JSON.parse(raw);
//     if (!data || data.v !== 1) return null;
//     if (now() - (data.ts || 0) > TTL_MS) {
//       localStorage.removeItem(KEY);
//       return null;
//     }
//     return data;
//   } catch {
//     return null;
//   }
// }

// export function clearPlaybackState() {
//   try { localStorage.removeItem(KEY); } catch {}
// }


// // ---------------



// // ---- Validation / normalization ----
// const VALID_SOURCES = new Set(Object.values(PlaybackSource));
// const VALID_REPEAT = new Set(Object.values(RepeatModes));

// const normSource = (v) => {
//   const s = String(v ?? '').trim().toUpperCase();
//   return VALID_SOURCES.has(s) ? s : PlaybackSource.UNKNOWN;
// };

// const normRepeat = (v) => {
//   const s = String(v ?? RepeatModes.OFF).trim().toLowerCase();
//   return VALID_REPEAT.has(s) ? s : RepeatModes.OFF;
// };

// const toIntOrNull = (v) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? Math.trunc(n) : null;
// };

// const prune = (obj) => {
//   const out = {};
//   for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
//   return out;
// };

// // ---- Context URI builder (covers all enum sources) ----
// const buildContextUri = (source, sourceId) => {
//   const base = 'afrofeel:';
//   switch (source) {
//     case PlaybackSource.PLAYLIST:       return `${base}playlist:${sourceId ?? ''}`;
//     case PlaybackSource.ALBUM:          return `${base}album:${sourceId ?? ''}`;
//     case PlaybackSource.ARTIST:         return `${base}artist:${sourceId ?? ''}`;
//     case PlaybackSource.TRACK:          return `${base}track:${sourceId ?? ''}`;
//     case PlaybackSource.SEARCH:         return `${base}search`;
//     case PlaybackSource.RADIO:          return `${base}radio:${sourceId ?? ''}`;
//     case PlaybackSource.RECOMMENDATION: return `${base}recommendation`;
//     case PlaybackSource.DISCOVER:       return `${base}discover`;
//     case PlaybackSource.STATION:        return `${base}station:${sourceId ?? ''}`;
//     case PlaybackSource.CHART:          return `${base}chart:${sourceId ?? ''}`;
//     case PlaybackSource.GENRE:          return `${base}genre:${sourceId ?? ''}`;
//     case PlaybackSource.MOOD:           return `${base}mood:${sourceId ?? ''}`;
//     case PlaybackSource.LIKED:          return `${base}liked`;
//     case PlaybackSource.HISTORY:        return `${base}history`;
//     case PlaybackSource.RECENT:         return `${base}recent`;
//     case PlaybackSource.USER_GENERATED: return `${base}user_generated:${sourceId ?? ''}`;
//     case PlaybackSource.PODCAST:        return `${base}podcast:${sourceId ?? ''}`;
//     case PlaybackSource.UNKNOWN:
//     default:                            return null;
//   }
// };

// // ---- Public API ----

// /**
//  * Build a normalized playback context from any UI block.
//  * You can pass either `list` (array) + `index` or `queueLength`/`queuePosition` numbers.
//  */
// export const buildPlaybackContext = ({
//   source,
//   sourceId = null,
//   sourceName,                     // optional display name
//   list = null,                    // optional: full array to infer queueLength
//   index = null,                   // optional: zero-based position to infer queuePosition
//   queuePosition,                  // optional: number alternative to index
//   queueLength,                    // optional: number alternative to list.length
//   shuffle = false,
//   repeat = RepeatModes.OFF,
//   radioSeed = null,
//   searchQuery = null,
//   recommendationType = null,
//   extra,                          // any additional diagnostics (kept under meta)
// } = {}) => {
//   const playbackSource = normSource(source);
//   const position = toIntOrNull(queuePosition ?? index);
//   const length   = toIntOrNull(queueLength ?? (Array.isArray(list) ? list.length : null));

//   const ctx = {
//     playbackSource,
//     sourceId: sourceId == null ? null : String(sourceId),
//     sourceName: sourceName || null,
//     queuePosition: position,
//     queueLength: length,
//     shuffle: !!shuffle,
//     repeat: normRepeat(repeat),
//     contextUri: buildContextUri(playbackSource, sourceId),
//     radioSeed: radioSeed || null,
//     searchQuery: searchQuery || null,
//     recommendationType: recommendationType || null
//   };

//   if (extra && typeof extra === 'object' && Object.keys(extra).length) {
//     ctx.meta = extra;
//   }

//   // Final prune to avoid undefineds
//   return prune(ctx);
// };

// /**
//  * One-liner builder for player.load(): returns { context, queue? }.
//  * If you pass a list (array), it's returned as queue for convenience.
//  */
// export const buildLoadArgs = ({
//   track,
//   list = null,
//   index = null,
//   source,
//   sourceId = null,
//   sourceName,
//   shuffle = false,
//   repeat = RepeatModes.OFF,
//   radioSeed = null,
//   searchQuery = null,
//   recommendationType = null,
//   extra
// } = {}) => {
//   const context = buildPlaybackContext({
//     source, sourceId, sourceName,
//     list, index,
//     shuffle, repeat,
//     radioSeed, searchQuery, recommendationType,
//     extra
//   });

//   const out = { context };
//   if (Array.isArray(list)) out.queue = list;
//   return out;
// };

// /**
//  * Persist the resume info (track + context + queue + position/duration).
//  * Call this in your player after load() and during timeupdates (throttled).
//  */
// export const persistResumePoint = ({
//   track, context, positionSec = 0, durationSec = null, queue = null
// }) => {
//   savePlaybackState({ track, context, positionSec, durationSec, queue });
// };

// /**
//  * Try to restore a previous session (returns {track, context, queue, positionSec, durationSec} or null).
//  */
// export const restoreResumePoint = () => loadPlaybackState();

// /** Safe default when nothing is known (used by player bar fallback). */
// export const DEFAULT_PLAYER_BAR_CONTEXT = Object.freeze({
//   playbackSource: PlaybackSource.UNKNOWN,
//   sourceId: null,
//   sourceName: null,
//   queuePosition: null,
//   queueLength: null,
//   shuffle: false,
//   repeat: RepeatModes.OFF,
//   contextUri: null,
//   radioSeed: null,
//   searchQuery: null,
//   recommendationType: null
// });




// // -----------------

// export const usePlaybackContext = () => {
//   // Look up current position in a provided queue (no LS needed)
//   const getPositionInList = useCallback((trackId, list = []) => {
//     if (!trackId || !Array.isArray(list)) return 0;
//     const idx = list.findIndex(t => (t?.id ?? t?._id) === trackId);
//     return idx >= 0 ? idx : 0;
//   }, []);

//   return {
//     buildPlaybackContext,
//     buildLoadArgs,
//     persistResumePoint,
//     restoreResumePoint,
//     DEFAULT_PLAYER_BAR_CONTEXT,
//     getPositionInList
//   };
// };

