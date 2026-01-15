
// AudioPlayerProvider.jsx
import React, { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useLazyQuery } from '@apollo/client';

import { useUser } from './userContext';
import { useLocationContext } from './useLocationContext.jsx';
import { ensureSessionId } from '../sessions/sessionGenerator.js';
import UserAuth from "../auth.js";

import { SAVE_PLAYBACK_SESSION, GET_PRESIGNED_URL_DOWNLOAD_AUDIO, GET_PRESIGNED_URL_DOWNLOAD } from '../mutations.js';
import { GET_PLAYBACK_SESSION } from '../queries.js';
import { getClientDeviceInfo } from '../detectDevice/getClientDeviceInfo.js';

// ad integration
import { PlayerManager } from './playerManager.js';

import { createMusicPlayerAdapter,
createAdPlayerAdapter,
  attachAudioProviderToManager,
  primeManagerFromAudioContext } from './playerAdapters.js';
import { eventBus } from './playerAdapters.js';

const sanitizeArtworkUrl = (url) => {
  if (!url) return null;
  const lower = String(url).toLowerCase();
  if (lower.includes('placehold.co')) return null;
  return url;
};

const normalizeArtworkTrack = (track) => {
  if (!track) return null;
  const artwork = sanitizeArtworkUrl(track.artworkUrl || track.artworkPresignedUrl || track.cover);
  return {
    ...track,
    artworkUrl: artwork || null,
    artworkPresignedUrl: artwork || null,
  };
};



// Derive an audio stream key from any known locator (URL or key).
const deriveAudioStreamKey = (item = {}) => {
  const raw = item.audioKey || item.audioStreamKey || item.streamAudioFileUrl || item.audioUrl || item.url || item.fullUrl || item.fullUrlWithAds || null;
  if (!raw) return null;

  // If it's already a key (no scheme), normalize leading slash and ensure for-streaming prefix.
  if (!/^https?:\/\//i.test(raw)) {
    const cleaned = raw.replace(/^\/+/, '');
    return cleaned.startsWith('for-streaming/') ? cleaned : `for-streaming/${cleaned}`;
  }

  try {
    const u = new URL(raw);
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    if (path.startsWith('for-streaming/')) return path;
    const filename = path.split('/').pop();
    return filename ? `for-streaming/${filename}` : null;
  } catch {
    return null;
  }
};

const RepeatMode = {
  OFF: "none",
  ALL: "all",
  ONE: "one",
};



// Trim GraphQL meta fields and blank rows from credits before saving to server
const normalizeCredits = (credits) => {
  if (!Array.isArray(credits)) return null;
  const cleaned = credits
    .map((c) => {
      if (!c) return null;
      const name = c.name ?? null;
      const role = c.role ?? null;
      const type = c.type ?? null;
      if (!name && !role && !type) return null;
      return { name, role, type };
    })
    .filter(Boolean);
  return cleaned.length ? cleaned : null;
};




// Only fields allowed by PlaybackTrackInput (strip __typename and extras)
const toPlaybackTrackInput = (t) => {
  if (!t) return null;
  const artwork = sanitizeArtworkUrl(t.artworkUrl ?? t.artworkPresignedUrl ?? t.cover);

  // Prefer explicit keys, then derive from any locator (URL or path)
  const audioKey =
    t.audioKey ||
    t.audioStreamKey ||
    deriveAudioStreamKey(t);

  const artworkKey = (() => {
    const src = t.artworkKey || artwork || t.artwork;
    if (!src) return null;
    if (!/^https?:\/\//i.test(src)) return src.replace(/^\/+/, '');
    try {
      const u = new URL(src);
      return decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
    } catch {
      return null;
    }
  })();

  return {
    id: String(t.id || t._id || ''),
    title: t.title ?? null,
    // Avoid saving presigned URLs; keep only keys so resume can re-sign.
    url: null,
    audioUrl: null,
    audioKey,
    isTeaser: typeof t.isTeaser === 'boolean' ? t.isTeaser : false,
    // Do not persist potentially expired artwork URLs; rely on key for presign
    artworkUrl: null,
    artworkPresignedUrl: null,
    artworkKey,
    // Preserve rich metadata so resume/currentSong stays complete
    artist: t.artist ?? t.artistName ?? null,
    artistName: t.artistName ?? t.artist ?? null,
    artistId: t.artistId ?? (t.artist && t.artist._id) ?? null,
    artistBio: t.artistBio ?? t.artist?.bio ?? null,
    artistFollowers: typeof t.artistFollowers === 'number' ? t.artistFollowers : null,
    artistDownloadCounts: typeof t.artistDownloadCounts === 'number' ? t.artistDownloadCounts : null,
    isFollowing: t.isFollowing ?? t.artist?.isFollowing ?? null,
    albumId: t.albumId ?? t.album?._id ?? null,
    albumName: t.albumName ?? t.album?.title ?? null,
    releaseYear: t.releaseYear ?? (t.album?.releaseDate ? new Date(t.album.releaseDate).getFullYear() : null),
    label: t.label ?? null,
    featuringArtist: Array.isArray(t.featuringArtist) ? t.featuringArtist : [],
    duration: typeof t.duration === 'number' ? t.duration : null,
    durationSeconds: typeof t.durationSeconds === 'number' ? t.durationSeconds : null,
    country: t.country ?? t.artist?.country ?? null,
    mood: t.mood ?? [],
    subMood: t.subMood ?? t.subMoods ?? [],
    tempo: t.tempo ?? null,
    playCount: t.playCount ?? null,
    likesCount: t.likesCount ?? null,
    likedByMe: t.likedByMe ?? null,
    shareCount: t.shareCount ?? null,
    downloadCount: t.downloadCount ?? null,
    credits: normalizeCredits(t.credits),
    lyrics: t.lyrics ?? null,
  };
};




const normalizeTrackForResume = (t) => {
  if (!t) return null;
  
  const audioKey = t.audioKey || deriveAudioStreamKey(t);
  const artwork = sanitizeArtworkUrl(t.artworkUrl || t.artworkPresignedUrl || t.cover);
  const artworkKey = t.artworkKey || (artwork ? (() => {
    try {
      const u = new URL(artwork);
      return decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
    } catch {
      return null;
    }
  })() : null);

  const result = {
    ...t,
    // Drop presigned URLs; rely on key so we can re-sign on demand
    url: null,
    audioUrl: null,
    audioKey: audioKey || null,
    audioStreamKey: t.audioStreamKey || audioKey || null,
    artworkKey,
    artworkPresignedUrl: artwork || null,
    artworkUrl: artwork || null,
    isTeaser: !!t.isTeaser,
  };

  return result;
};



const AudioPlayerContext = createContext();

// Safe fallback so consumer components don't crash if provider fails to mount
const noop = () => {};
const defaultAudioContext = {
  playerState: {
    currentTrack: null,
    queue: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    isTeaser: false,
    isLoading: false,
    error: null,
    hasTeaserEnded: false,
    isAdPlaying: false,
  },
  pause: noop,
  handlePlaySong: noop,
  handlePlayAlbum: noop,
  handlePlayPlaylist: noop,
  handlePlayArtistTopSongs: noop,
  handlePlayGenrePlaylist: noop,
  handlePlayMoodPlaylist: noop,
  handlePlaySongDirect: noop,
  handlePlayNext: noop,
  handlePlayPrev: noop,
  handleSeek: noop,
  handleVolumeChange: noop,
  handleMuteToggle: noop,
  handlePause: noop,
  resume: noop,
  setQueue: noop,
  setCurrentTrack: noop,
  setIsPlaying: noop,
  isPlayingAd: false,
  currentAd: null,
};

export const AudioPlayerProvider = ({ children, onRequireAuth = () => {} }) => {
  const userContext = useUser();
  const { isGuest, isPremium, isRegular } = userContext;
  const isUserLoggedIn = !isGuest;

  const audioRef = useRef(null);
  const canonicalQueueRef = useRef([]);        // full canonical queue
  const suppressAutoAdvanceRef = useRef(false);
  const currentIndexRef = useRef(0);
  const currentSongIdRef = useRef(null);
  const lastArtworkRef = useRef(null);

  const setCanonicalQueue = (tracks = []) => {
    canonicalQueueRef.current = (tracks || [])
      .map(normalizeArtworkTrack)
      .filter(Boolean);
    return canonicalQueueRef.current;
  };

  // keep the currentTrack outside of state for stable access inside callbacks
  const currentTrackRef = useRef(null);

  // throttle + dedupe for save
  const lastSaveRef = useRef(0);
  const lastSigRef = useRef('');

  const SAVE_EVERY_MS = 3000;

  const [savePlaybackSession] = useMutation(SAVE_PLAYBACK_SESSION);
  const [fetchPlaybackSession, { data: resumeData }] =
    useLazyQuery(GET_PLAYBACK_SESSION, { fetchPolicy: 'network-only' });

  const [presignAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO, {
    onError: (err) => console.warn('[AUDIO] presign on resume failed:', err?.message || err),
  });
  const [presignArtwork] = useMutation(GET_PRESIGNED_URL_DOWNLOAD, {
    onError: (err) => console.warn('[AUDIO] presign artwork on resume failed:', err?.message || err),
  });

  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  const sessionId = ensureSessionId(); // optional for analytics if you need

  const { geo } = useLocationContext();

  const authState = useMemo(() => ({
    isGuest: !isUserLoggedIn,
    isPremium
  }), [isUserLoggedIn, isPremium]);




  const buildRemainingFrom = (idx) => {
    if (!Array.isArray(canonicalQueueRef.current)) return [];
    if (idx >= canonicalQueueRef.current.length - 1) return [];
    return canonicalQueueRef.current
      .slice(idx + 1)
      .map(normalizeArtworkTrack)
      .filter(Boolean);
  };

  const [playerState, setPlayerState] = useState({
    currentTrack: null,
    queue: [], // remaining queue (not including currentTrack)
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    isTeaser: false,
    isLoading: false,
    error: null,
    hasTeaserEnded: false,
    wasManuallyPaused: false,
    buffering: false,
    repeatMode: RepeatMode.OFF,
    shuffle: false,
    playedOnce: false,
    initialAuthLevel: null,
    playbackContext: null,
    playbackSource: null,
    playbackSourceId: null,
    isAdPlaying: false,
    currentAd: null
  });

  const TEASER_DURATION = 30;

// part 1 ad integration
// ----------------------------------------------------

// AD INTEGRATION (create once)
const musicAdapterRef = useRef(null);
const playerManagerRef = useRef(null);
const detachBridgeRef = useRef(null);

const audioCtxSnapshot = () => ({
  play, pause, seek, audioRef, playerState,
  isPremium,
  isRegular,
  isGuest,
  profile,
  geo
});

const progressRafRef = useRef(null);

useEffect(() => {
  if (!audioRef.current) return; // wait until <audio> is mounted

  if (!musicAdapterRef.current) {
    musicAdapterRef.current = createMusicPlayerAdapter(audioCtxSnapshot());
  }

  if (!playerManagerRef.current) {
    // pass a factory so PlayerManager can feed identity/environment into ad adapter
    const adFactory = (initial) => createAdPlayerAdapter(initial);
    playerManagerRef.current = new PlayerManager(musicAdapterRef.current, adFactory);
  }

  // attach telemetry bridge
  detachBridgeRef.current?.();
  detachBridgeRef.current = attachAudioProviderToManager(
    playerManagerRef.current,
    musicAdapterRef.current,
    audioCtxSnapshot
  );

  // push initial identity + location
  primeManagerFromAudioContext(playerManagerRef.current, audioCtxSnapshot());

  return () => {
    detachBridgeRef.current?.();
    detachBridgeRef.current = null;
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioRef.current]);
// --------------------------------------------------------------

// part 2 : ad integration
useEffect(() => {
  const mgr = playerManagerRef.current;
  if (!mgr) return;
  mgr.setIdentity({
    userType: isPremium ? 'premium' : (isRegular ? 'regular' : 'guest'),
    userId
  });
  if (geo) mgr.setLocation(geo);
}, [isRegular, isPremium, userId, geo]);

// --------------------------------------------------------------



const toggleShuffle = useCallback(() => {
  setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }));
}, []);







const cycleRepeatMode = useCallback(() => {
  console.log('cycleRepeatMode called, current mode:', playerState.repeatMode);
  setPlayerState(prev => {
    const next =
      prev.repeatMode === RepeatMode.OFF ? RepeatMode.ALL :
      prev.repeatMode === RepeatMode.ALL ? RepeatMode.ONE :
      RepeatMode.OFF;
    console.log('Changing repeat mode from', prev.repeatMode, 'to', next);
    return { ...prev, repeatMode: next };
  });
}, [playerState.repeatMode]);







// ---------------

// const pickNextIndex = useCallback((reason = "auto") => {
//   const total = canonicalQueueRef.current.length;
//   if (!total) return -1;

//   const cur = currentIndexRef.current;

//   // Repeat ONE: stay on current track when auto-ended
//   if (playerState.repeatMode === RepeatMode.ONE && reason === "ended") {
//     return cur;
//   }

//   // Shuffle: pick a random different index if possible
//   if (playerState.shuffle && total > 1) {
//     let idx = cur;
//     let guard = 0;
//     while (idx === cur && guard < 12) {
//       idx = Math.floor(Math.random() * total);
//       guard++;
//     }
//     return idx;
//   }

//   // Normal next
//   const next = cur + 1;

//   // End reached
//   if (next >= total) {
//     return playerState.repeatMode === RepeatMode.ALL ? 0 : cur; // cur means "no move"
//   }

//   return next;
// }, [playerState.shuffle, playerState.repeatMode]);


// -------------
const pickNextIndex = useCallback((reason = "auto") => {


 console.log('=== pickNextIndex ===');
  console.log('Reason:', reason);
  console.log('Current repeatMode:', playerState.repeatMode);
  console.log('Current shuffle:', playerState.shuffle);
  console.log('Queue length:', canonicalQueueRef.current.length);
  console.log('Current index:', currentIndexRef.current);

    console.log('pickNextIndex called:', {
    reason,
    total: canonicalQueueRef.current.length,
    current: currentIndexRef.current,
    repeatMode: playerState.repeatMode,
    shuffle: playerState.shuffle
  });


  const total = canonicalQueueRef.current.length;
    if (!total) {
    console.log('No tracks in queue');
    return -1;
  }



  const cur = currentIndexRef.current;
   console.log('Current index:', cur, 'of', total);

  // Repeat ONE: stay on current track when auto-ended
  if (playerState.repeatMode === RepeatMode.ONE && reason === "ended") {
    return cur; // Loop the same track
  }

  // Shuffle mode
  if (playerState.shuffle && total > 1) {
    let idx = cur;
    let guard = 0;
    
    // Try to pick a different random track
    while (idx === cur && guard < 12) {
      idx = Math.floor(Math.random() * total);
      guard++;
    }
    
    // If we got a different track, return it
    if (idx !== cur) {
      return idx;
    }
    
    // If all random picks failed (unlikely), fall through to normal logic
  }

  // Calculate next index
  const next = cur + 1;

  // Check if we reached the end
  if (next >= total) {
    // END OF QUEUE REACHED
    
    // Repeat ALL: start from beginning
    if (playerState.repeatMode === RepeatMode.ALL) {
      return 0;
    }
    
    // Repeat ONE: should have been caught above, but just in case
    if (playerState.repeatMode === RepeatMode.ONE) {
      return cur;
    }
    
    // Repeat OFF: stop playback (return -1)
    return -1;
  }

  // Normal case: play next track
  return next;
}, [playerState.shuffle, playerState.repeatMode]);





  // device info (one-time)
  useEffect(() => {
    const deviceInfo = getClientDeviceInfo();
    console.log('the device the user is using:', deviceInfo);
  }, []);

  // Init audio element (one-time)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    const handleAudioError = (e) => {
      const error = audio.error;
      console.error('[Audio] error', e);
      if (error) {
        console.error('🎯 Audio error code:', error.code);
        switch (error.code) {
          case 1: console.error('MEDIA_ERR_ABORTED'); break;
          case 2: console.error('MEDIA_ERR_NETWORK'); break;
          case 3: console.error('MEDIA_ERR_DECODE'); break;
          case 4: console.error('MEDIA_ERR_SRC_NOT_SUPPORTED'); break;
          default: break;
        }
        console.log('Audio src:', audio.src);
      }
    };

    audio.addEventListener('error', handleAudioError);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener('error', handleAudioError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Teaser watchdog
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const checkTeaserEnd = () => {
      setPlayerState(prev => {
        const shouldStop = prev.isTeaser &&
          !prev.wasManuallyPaused &&
          !prev.hasTeaserEnded && // avoid re-firing once handled
          audio.currentTime >= TEASER_DURATION;

        if (shouldStop) {
          audio.pause();
          onRequireAuth('teaser-end');
          setTimeout(() => skipNext(), 3000);
          return { ...prev, isPlaying: false, hasTeaserEnded: true };
        }
        return prev;
      });
    };

    audio.addEventListener('timeupdate', checkTeaserEnd);
    return () => audio.removeEventListener('timeupdate', checkTeaserEnd);
  }, [onRequireAuth]);



  // progress sync into state (listeners only; no deps that change every render)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setPlayerState(prev => {
        if (
          Math.abs(prev.currentTime - audio.currentTime) < 0.01 &&
          prev.duration === audio.duration
        ) return prev;

        return {
          ...prev,
          currentTime: audio.currentTime,
          duration: audio.duration || prev.duration
        };
      });
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  // smoother UI progress while playing (throttled to one rAF per frame)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let frameId = null;

    const pushProgress = () => {
      frameId = null;
      setPlayerState(prev => {
        const ct = audio.currentTime;
        const dur = audio.duration || prev.duration;
        if (Math.abs(prev.currentTime - ct) < 0.02 && prev.duration === dur) return prev;
        return { ...prev, currentTime: ct, duration: dur };
      });
    };

    const schedule = () => {
      if (frameId || !playerState.isPlaying) return;
      frameId = requestAnimationFrame(pushProgress);
    };

    if (playerState.isPlaying) {
      schedule(); // prime once immediately
      audio.addEventListener('timeupdate', schedule);
    }

    return () => {
      audio.removeEventListener('timeupdate', schedule);
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };
  }, [playerState.isPlaying]);

  

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const getAudioConfig = useCallback((track) => {
    if (!track) return null;

    // If resuming with a saved URL, respect explicit isTeaser flag; guests default to teaser.
    if (track.url) {
      const guestTeaser = authState.isGuest ? track.isTeaser !== false : !!track.isTeaser;
      return { url: track.url, isTeaser: guestTeaser };
    }

    if (authState.isGuest) {
      if (track.teaserUrl) {
        return { url: track.teaserUrl, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      if (track.audioUrl) {
        return { url: track.audioUrl, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      if (track.fullUrlWithAds || track.fullUrl) {
        const url = track.fullUrlWithAds || track.fullUrl;
        return { url, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      return null;
    }

    if (!authState.isPremium) {
      const url = track.fullUrlWithAds || track.fullUrl || track.audioUrl || null;
      return url ? { url, isTeaser: false } : null;
    }

    const url = track.fullUrl || track.audioUrl || null;
    return url ? { url, isTeaser: false } : null;
  }, [authState.isGuest, authState.isPremium]);

  // Prefetch a small window of upcoming tracks so "Next" stays warm without signing the whole queue.
  const prefetchUpcomingAudio = useCallback(async () => {
    const queue = canonicalQueueRef.current;
    if (!queue?.length) return;

    const start = (currentIndexRef.current ?? 0) + 1;
    const end = Math.min(start + 4, queue.length); // 4 ahead keeps network light
    const slice = queue.slice(start, end);
    if (!slice.length) return;

    await Promise.all(
      slice.map(async (item, offset) => {
        if (!item || item.audioUrl || item.url) return;
        const key = deriveAudioStreamKey(item);
        if (!key) return;
        try {
          const { data } = await presignAudio({
            variables: {
              bucket: 'afrofeel-songs-streaming',
              key,
              region: 'us-west-2',
            },
          });
          const signed = data?.getPresignedUrlDownloadAudio?.url || null;


          if (!signed) return;
          const idx = start + offset;
          canonicalQueueRef.current[idx] = { ...item, audioUrl: signed, url: signed };
        } catch (err) {
          console.warn('[AUDIO] prefetch presign failed', err?.message || err);
        }
      })
    );
  }, [presignAudio]);

  // ---- Play: stable identity, uses ref fallback ----

  const play = useCallback(async (trackArg = null, playbackContext = null) => {
    if (playerState.isAdPlaying) {
      try {
        eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
          message: "Playback will resume after the advertisement finishes."
        });
      } catch {}
      return;
    }
    const track = trackArg || currentTrackRef.current;
    if (!track) return;

    if (shouldBlockPlayback()) {
      onRequireAuth('teaser-end');
      return;
    }

    try {
      const audio = audioRef.current;
      if (!audio) return;

      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));
      await audio.play();

      setPlayerState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        hasTeaserEnded: false,
        wasManuallyPaused: false,
        ...(playbackContext && {
          playbackContext,
          playbackSource: playbackContext.source,
          playbackSourceId: playbackContext.sourceId
        })
      }));
    } catch (error) {
      console.error('audio.play() failed:', error?.message || error);
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: error?.message || 'Playback error'
      }));
    }
  }, []); // <- stable

  // Auto-resume on buffer issues
  const lastAutoResumeRef = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryResume = () => {
      const shouldResume =
        playerState.isPlaying &&
        !playerState.wasManuallyPaused &&
        !(playerState.isTeaser && playerState.hasTeaserEnded);

      const now = Date.now();
      if (!shouldResume || (now - lastAutoResumeRef.current) < 1500) return;
      lastAutoResumeRef.current = now;

      if (audio.readyState < 3) {
        audio.play().catch(() => {});
      }
    };

    const onWaiting = () => tryResume();
    const onStalled = () => tryResume();
    const onSuspend = () => {};
    const onPlaying = () => { lastAutoResumeRef.current = Date.now(); };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('suspend', onSuspend);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('suspend', onSuspend);
      audio.removeEventListener('playing', onPlaying);
    };
  }, [
    playerState.isPlaying,
    playerState.wasManuallyPaused,
    playerState.isTeaser,
    playerState.hasTeaserEnded
  ]);



  const load = useCallback(async (track, newQueue = []) => {
    try {
      const normalizedTrack = normalizeArtworkTrack(track);
console.log('see normalize track:', normalizedTrack)

      let config = getAudioConfig(normalizedTrack);

      // If we don't have a playable URL yet, try to presign on demand.
      if (!config?.url) {
        const key = deriveAudioStreamKey(normalizedTrack);
        if (key) {
          try {
            const { data } = await presignAudio({
              variables: {
                bucket: 'afrofeel-songs-streaming',
                key,
                region: 'us-west-2',
              },
            });
            const signed = data?.getPresignedUrlDownloadAudio?.url || null;
            if (signed) {
              normalizedTrack.url = signed;
              normalizedTrack.audioUrl = signed;
              config = getAudioConfig(normalizedTrack);
            }
          } catch (err) {
            console.warn('[AUDIO] on-demand presign failed', err?.message || err);
          }
        }
      }

      if (!config) {
        setPlayerState(prev => ({ ...prev, error: 'No valid audio config' }));
        return false;
      }

      let artwork = normalizedTrack.artworkUrl || normalizedTrack.artworkPresignedUrl || null;

      if (!normalizedTrack.artworkKey) {
        const keyFromUrl = (() => {
          const raw = normalizedTrack.artworkUrl || normalizedTrack.artworkPresignedUrl || normalizedTrack.cover || null;
          if (!raw) return null;
          if (!/^https?:\/\//i.test(String(raw))) return String(raw).replace(/^\/+/, '');
          try {
            const u = new URL(raw);
            return decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
          } catch {
            return null;
          }
        })();
        if (keyFromUrl) normalizedTrack.artworkKey = keyFromUrl;
      }

      // If artwork is missing/expired but we have a key, presign on-demand.
      if (!artwork && normalizedTrack.artworkKey) {
        try {
          const { data } = await presignArtwork({
            variables: {
              bucket: 'afrofeel-cover-images-for-songs',
              key: normalizedTrack.artworkKey,
              region: 'us-east-2',
             
            },
          });
          const signed = data?.getPresignedUrlDownload?.url || null;
          if (signed) {
            artwork = signed;
          }
        } catch (err) {
          // non-fatal: fall back to whatever we had
        }
      }

      const hydratedTrack = {
        ...normalizedTrack,
        artworkUrl: artwork || normalizedTrack.artworkUrl || normalizedTrack.artworkPresignedUrl || null,
        artworkPresignedUrl: artwork || normalizedTrack.artworkPresignedUrl || normalizedTrack.artworkUrl || null
      };
      if (artwork) {
        lastArtworkRef.current = artwork;
      } else {
        lastArtworkRef.current = null;
      }

      const audio = audioRef.current;
      audio.pause();
      audio.src = config.url;
      audio.load();
      audio.currentTime = 0;

      currentSongIdRef.current = hydratedTrack.id;

      // keep the ref in sync with the next currentTrack
      currentTrackRef.current = { ...hydratedTrack, ...config };

      setPlayerState(prev => ({
        ...prev,
        currentTrack: { ...hydratedTrack, ...config },
        isTeaser: config.isTeaser,
        currentTime: 0,
        isPlaying: false,
        isLoading: true,
        hasTeaserEnded: false,
        wasManuallyPaused: false,
        error: null,
        queue: (newQueue || []).map(normalizeArtworkTrack)
      }));

      const canPlayPromise = new Promise((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };
        const onError = (e) => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error('Audio load error'));
        };
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
      });

      await canPlayPromise;
      setPlayerState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (err) {
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: err?.message || 'Playback error'
      }));
      return false;
    }
  }, [getAudioConfig]);







// Keep refs in sync with state
useEffect(() => {
  if (playerState.currentTrack) {
    currentTrackRef.current = playerState.currentTrack;
    currentSongIdRef.current = playerState.currentTrack.id;
  }

  // Warm up the next few tracks whenever the current track changes.
  prefetchUpcomingAudio();
}, [playerState.currentTrack]);

useEffect(() => {
  if (playerState.queue && canonicalQueueRef.current) {
    // Find current index based on track ID
    const currentTrack = currentTrackRef.current;
    if (currentTrack) {
      const idx = canonicalQueueRef.current.findIndex(
        t => t?.id === currentTrack.id
      );
      if (idx >= 0) {
        currentIndexRef.current = idx;
      }
    }
  }
}, [playerState.queue, playerState.currentTrack]);





  // ======== RESUME: fetch saved session on mount (only for logged-in users) ========
  useEffect(() => {
    if (!isUserLoggedIn) return;
    fetchPlaybackSession().catch(() => {});
  }, [isUserLoggedIn, fetchPlaybackSession]);




// run resume exactly once per fetched payload
const didResumeRef = useRef(false);
const pendingUserResumeRef = useRef(false);
useEffect(() => {
  if (didResumeRef.current) return;
  const session = resumeData?.playbackSession;
  console.log('check resumed data:', session);
  if (!session || !session.track) return;

  didResumeRef.current = true;

  // On resume, keep keys only; presign on-demand during load/play.
  const normalizeForResume = (raw) => ({
    ...normalizeTrackForResume(raw),
    url: null,
    audioUrl: null,
    isTeaser: raw.isTeaser || false,
  });


  (async () => {
    const current = normalizeForResume(session.track);
    console.log('the song to play:', current);
    console.log('URL signed?', current.url?.includes('Signature=') ? 'YES' : 'NO');

    const restRaw = Array.isArray(session.queue) ? session.queue : [];
    console.log('see queue length:', restRaw.length);
    const rest = restRaw.map(normalizeForResume);

    // reconstruct canonical queue: currentTrack + remaining
    const fullQueue = setCanonicalQueue([current, ...rest]);
    currentIndexRef.current = 0;

    // Restore shuffle/repeat flags from session
    setPlayerState(prev => ({
      ...prev,
      shuffle: !!session.shuffle,
      repeatMode: session.repeat ? RepeatMode.ALL : RepeatMode.OFF,
    }));

    // Hydrate ad scheduler state if available
    const pm = playerManagerRef.current;
    if (pm && session.adState) {
      try {
        pm.restoreAdResumeState(session.adState);
      } catch (e) {
        console.warn("[AUDIO] Failed to restore ad state", e);
      }
    }

    const ok = await load(current, fullQueue.slice(1));
    if (!ok) return;

    if (typeof session.currentTime === 'number' && session.currentTime > 0) {
      // seek after load so metadata is ready
      seek(session.currentTime);
    }

    // Ensure ad flag is cleared on restore
    setPlayerState(prev => ({ ...prev, isAdPlaying: false }));

    if (session.wasPlaying) {
      try {
        await play(current);
      } catch (err) {
        // Autoplay might be blocked; defer until user interacts
        console.warn("[AUDIO] Autoplay blocked on resume; waiting for user interaction");
        pendingUserResumeRef.current = true;
      }
    } else {
      setPlayerState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
    }
  })();
}, [resumeData, load, seek, play]); 



  // Fallback: if autoplay was blocked on resume, resume on first user interaction
  useEffect(() => {
    const resumeOnUser = async () => {
      if (!pendingUserResumeRef.current) return;
      pendingUserResumeRef.current = false;
      const track = currentTrackRef.current;
      if (!track) return;
      await play(track);
    };
    window.addEventListener('pointerdown', resumeOnUser, { once: true });
    return () => window.removeEventListener('pointerdown', resumeOnUser);
  }, [play]);

  // Handle play song
  const handlePlaySong = useCallback(
    async (track, _newQueue = [], incomingContext = null, extras = {}) => {
      if (playerState.isAdPlaying) {
        // Block starting another track while an ad is running
        try {
          eventBus.emit("AD_BLOCK_PLAY_ATTEMPT", {
            message: "Playback will resume after the advertisement finishes."
          });
        } catch {}
        return false;
      }
      const trackToPlay = normalizeArtworkTrack(track);
      if (!trackToPlay) return false;
      let targetIndex = currentIndexRef.current;

      // If caller provided an explicit queue, seed canonical queue with it (track + remainder).
      const incomingQueue = Array.isArray(_newQueue)
        ? _newQueue.map(normalizeArtworkTrack).filter(Boolean)
        : [];
      if (incomingQueue.length) {
        setCanonicalQueue([trackToPlay, ...incomingQueue]);
        targetIndex = 0;
      }

      const preparedQueue = extras?.prepared?.queue
        ? extras.prepared.queue.map(normalizeArtworkTrack).filter(Boolean)
        : null;

      if (extras?.prepared?.queue && Array.isArray(extras.prepared.queue)) {
        const newQ = preparedQueue || [];
        const newQueueIds = newQ.map(t => t.id).join(',');
        const currentQueueIds = canonicalQueueRef.current.map(t => t.id).join(',');
        if (newQueueIds !== currentQueueIds) setCanonicalQueue(newQ);

        if (typeof extras.prepared.currentIndex === 'number') {
          targetIndex = extras.prepared.currentIndex;
        }
      } else {
        const foundIndex = canonicalQueueRef.current.findIndex(t => t?.id === trackToPlay?.id);
        if (foundIndex >= 0) targetIndex = foundIndex;
      }

      currentIndexRef.current = targetIndex;
      const remainingQueue = buildRemainingFrom(targetIndex);

      const contextToUse = incomingContext ? {
        ...incomingContext,
        queuePosition: targetIndex,
        queueLength: canonicalQueueRef.current.length
      } : null;

      // keep ref in sync *before* attempting load/play
      currentTrackRef.current = trackToPlay;

      // 🔌 AD INTEGRATION — let manager know about the upcoming track
try {
  playerManagerRef.current?.onTrackLoaded?.({
    id: trackToPlay?.id || trackToPlay?._id,
    title: trackToPlay?.title,
    genre: trackToPlay?.genre,
    duration: trackToPlay?.duration ?? 0
  });
  playerManagerRef.current?.recordSongPlay?.({
    id: trackToPlay?.id || trackToPlay?._id,
    genre: trackToPlay?.genre,
    duration: trackToPlay?.duration ?? 0
  });
} catch {}



      setPlayerState(prev => ({
        ...prev,
        currentTrack: trackToPlay,
        queue: remainingQueue,
        playbackSource: contextToUse?.source ?? null,
        playbackSourceId: contextToUse?.sourceId ?? null,
        playbackContext: contextToUse,
        isLoading: true,
        error: null
      }));

      const loaded = await load(trackToPlay, remainingQueue);
      if (!loaded) {
        setPlayerState(prev => ({ ...prev, isLoading: false, error: 'Failed to load track', isPlaying: false }));
        return false;
      }

      try {
        await play(trackToPlay, contextToUse);
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false, playedOnce: true }));
        return true;
      } catch (err) {
        setPlayerState(prev => ({ ...prev, isLoading: false, error: err.message, isPlaying: false }));
        return false;
      }
    },
    [load, play]
  );

  const startManualNav = () => {
    suppressAutoAdvanceRef.current = true;
    setTimeout(() => { suppressAutoAdvanceRef.current = false; }, 600);
  };

  // const skipNext = useCallback(async () => {
  //   startManualNav();
  //   const total = canonicalQueueRef.current.length;
  //   if (!total) return;

  //   const nextIndex = Math.min(currentIndexRef.current + 1, total - 1);
  //   if (nextIndex === currentIndexRef.current) {
  //     seek(0);
  //     return;
  //   }

  //   currentIndexRef.current = nextIndex;
  //   const nextTrack = canonicalQueueRef.current[nextIndex];
  //   const remainingQueue = buildRemainingFrom(nextIndex);

  //   const updatedContext = playerState.playbackContext ? {
  //     ...playerState.playbackContext,
  //     queuePosition: nextIndex,
  //     queueLength: total
  //   } : null;

  //   // sync currentTrackRef before play
  //   currentTrackRef.current = nextTrack;

  //   await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
  //     prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex }
  //   });
  // }, [handlePlaySong, playerState.playbackContext, seek]);


// notifies player manager if song skipped
// -------------------------------------

//   const skipNext = useCallback(async () => {
//     startManualNav();
    
//     // 🔥 NOTIFY PlayerManager that current track ended (manual skip)
//     const currentTrack = currentTrackRef.current;
//   if (currentTrack && playerManagerRef.current) {
//     console.log("[AUDIO] ⏭️ Manual skip, notifying track end");
//     try {
//       await playerManagerRef.current.onTrackEnd({
//         id: currentTrack.id || currentTrack._id,
//         title: currentTrack.title,
//         genre: currentTrack.genre,
//         duration: currentTrack.duration,
//         artist: currentTrack.artist,
//       });
//       console.log("[AUDIO] ✅ Track end notified to PlayerManager");
//     } catch (error) {
//       console.error("[AUDIO] Error notifying track end on skip:", error);
//     }
//   }

//   const total = canonicalQueueRef.current.length;
//   if (!total) return;

//   const nextIndex = Math.min(currentIndexRef.current + 1, total - 1);
//   if (nextIndex === currentIndexRef.current) {
//     seek(0);
//     return;
//   }

//   currentIndexRef.current = nextIndex;
//   const nextTrack = normalizeArtworkTrack(canonicalQueueRef.current[nextIndex]);
//   const remainingQueue = buildRemainingFrom(nextIndex);

//   const updatedContext = playerState.playbackContext ? {
//     ...playerState.playbackContext,
//     queuePosition: nextIndex,
//     queueLength: total
//   } : null;

//   // sync currentTrackRef before play
//   currentTrackRef.current = nextTrack;

//   await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
//     prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex }
//   });
// }, [handlePlaySong, playerState.playbackContext, seek]);

// new one with shuffle and reapet


const skipNext = useCallback(async () => {
  startManualNav();

  // 🔥 NOTIFY PlayerManager that current track ended (manual skip)
  const currentTrack = currentTrackRef.current;
  if (currentTrack && playerManagerRef.current) {
    console.log("[AUDIO] ⏭️ Manual skip, notifying track end");
    try {
      await playerManagerRef.current.onTrackEnd({
        id: currentTrack.id || currentTrack._id,
        title: currentTrack.title,
        genre: currentTrack.genre,
        duration: currentTrack.duration,
        artist: currentTrack.artist,
      });
      console.log("[AUDIO] ✅ Track end notified to PlayerManager");
    } catch (error) {
      console.error("[AUDIO] Error notifying track end on skip:", error);
    }
  }

  const total = canonicalQueueRef.current.length;
  if (!total) return;

  // ✅ shuffle / repeat-aware next index
  const nextIndex = pickNextIndex({ reason: "manual" });
  if (nextIndex < 0) return;

  // If repeat OFF and at end, just restart current
  if (nextIndex === currentIndexRef.current) {
    seek(0);
    return;
  }

  currentIndexRef.current = nextIndex;

  const nextTrack = normalizeArtworkTrack(canonicalQueueRef.current[nextIndex]);
  const remainingQueue = buildRemainingFrom(nextIndex);

  const updatedContext = playerState.playbackContext
    ? {
        ...playerState.playbackContext,
        queuePosition: nextIndex,
        queueLength: total,
      }
    : null;

  // sync currentTrackRef before play
  currentTrackRef.current = nextTrack;

  await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
    prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex },
  });
}, [handlePlaySong, playerState.playbackContext, seek, pickNextIndex]);





  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;



    // const handleEnded = async () => {
    //   if (suppressAutoAdvanceRef.current) return;
    //   await skipNext();
    // };

// const handleEnded = async () => {
//   if (suppressAutoAdvanceRef.current) return;
  
//   // 🔥 ADD THIS: Notify PlayerManager that the current track ended
//   const currentTrack = currentTrackRef.current;
//   if (currentTrack && playerManagerRef.current) {
//     console.log("[AUDIO] 🎵 Track ended naturally, notifying PlayerManager");
//     try {
//       await playerManagerRef.current.onTrackEnd({
//         id: currentTrack.id || currentTrack._id,
//         title: currentTrack.title,
//         genre: currentTrack.genre,
//         duration: currentTrack.duration,
//         artist: currentTrack.artist,
//       });
//     } catch (error) {
//       console.error("[AUDIO] Error notifying track end:", error);
//     }
//   }
  
//   await skipNext();
// };

// with shuffle and reapet

const handleEnded = async () => {
  if (suppressAutoAdvanceRef.current) return;

  // 🔥 Notify PlayerManager that the current track ended
  const currentTrack = currentTrackRef.current;
  if (currentTrack && playerManagerRef.current) {
    console.log("[AUDIO] 🎵 Track ended naturally, notifying PlayerManager");
    try {
      await playerManagerRef.current.onTrackEnd({
        id: currentTrack.id || currentTrack._id,
        title: currentTrack.title,
        genre: currentTrack.genre,
        duration: currentTrack.duration,
        artist: currentTrack.artist,
      });
    } catch (error) {
      console.error("[AUDIO] Error notifying track end:", error);
    }
  }

  const total = canonicalQueueRef.current.length;
  if (!total) return;

  console.log('PICK INDEX IS CALLED IN HANDLEENDED ...');
  
  // ✅ Decide next index based on shuffle/repeat
  const nextIndex = pickNextIndex("ended");

  console.log('Next index determined:', nextIndex);
  
  if (nextIndex < 0) {
    // Repeat OFF at end - stop playback
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    return;
  }

  // Special handling for repeat ONE
  if (playerState.repeatMode === RepeatMode.ONE && nextIndex === currentIndexRef.current) {
    console.log('Repeat ONE mode: restarting current track');
    
    // Option 1: Seek to beginning and play again
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      } catch (error) {
        console.error('Failed to restart track:', error);
      }
    }
    return;
  }

  // For all other cases (including shuffle)
  if (nextIndex === currentIndexRef.current) {
    // This shouldn't happen for non-ONE repeat modes, but handle gracefully
    seek(0);
    await play(currentTrackRef.current, playerState.playbackContext);
    return;
  }

  currentIndexRef.current = nextIndex;

  const nextTrack = normalizeArtworkTrack(canonicalQueueRef.current[nextIndex]);
  const remainingQueue = buildRemainingFrom(nextIndex);

  const updatedContext = playerState.playbackContext
    ? {
        ...playerState.playbackContext,
        queuePosition: nextIndex,
        queueLength: total,
      }
    : null;

  currentTrackRef.current = nextTrack;

  await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
    prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex },
  });
};





    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [skipNext]);

  // const skipPrevious = useCallback(async () => {
  //   startManualNav();
  //   const total = canonicalQueueRef.current.length;
  //   if (!total) return;

  //   const audio = audioRef.current;
  //   if (audio?.currentTime > 3) {
  //     seek(0);
  //     return;
  //   }

  //   const currentIndex = currentIndexRef.current;
  //   if (currentIndex <= 0) {
  //     seek(0);
  //     return;
  //   }

  //   const prevIndex = currentIndex - 1;
  //   const prevTrack = canonicalQueueRef.current[prevIndex];
  //   const remainingQueue = buildRemainingFrom(prevIndex);

  //   currentIndexRef.current = prevIndex;

  //   const updatedContext = playerState.playbackContext ? {
  //     ...playerState.playbackContext,
  //     queuePosition: prevIndex,
  //     queueLength: total
  //   } : null;

  //   currentTrackRef.current = prevTrack;

  //   await handlePlaySong(prevTrack, remainingQueue, updatedContext, {
  //     prepared: { queue: canonicalQueueRef.current, currentIndex: prevIndex }
  //   });
  // }, [handlePlaySong, playerState.playbackContext, seek]);








// notifies player manger if song is previous
// -----------------------------------------
  const skipPrevious = useCallback(async () => {
    startManualNav();
    
    // 🔥 NOTIFY PlayerManager that current track ended (manual previous)
    const currentTrack = currentTrackRef.current;
  if (currentTrack && playerManagerRef.current) {
    console.log("[AUDIO] ⏮️ Manual previous, notifying track end");
    try {
      await playerManagerRef.current.onTrackEnd({
        id: currentTrack.id || currentTrack._id,
        title: currentTrack.title,
        genre: currentTrack.genre,
        duration: currentTrack.duration,
        artist: currentTrack.artist,
      });
      console.log("[AUDIO] ✅ Track end notified to PlayerManager");
    } catch (error) {
      console.error("[AUDIO] Error notifying track end on previous:", error);
    }
  }

  const total = canonicalQueueRef.current.length;
  if (!total) return;

  const audio = audioRef.current;
  if (audio?.currentTime > 3) {
    seek(0);
    return;
  }

  const currentIndex = currentIndexRef.current;
  if (currentIndex <= 0) {
    seek(0);
    return;
  }

  const prevIndex = currentIndex - 1;
  const prevTrack = normalizeArtworkTrack(canonicalQueueRef.current[prevIndex]);
  const remainingQueue = buildRemainingFrom(prevIndex);

  currentIndexRef.current = prevIndex;

  const updatedContext = playerState.playbackContext ? {
    ...playerState.playbackContext,
    queuePosition: prevIndex,
    queueLength: total
  } : null;

  currentTrackRef.current = prevTrack;

  await handlePlaySong(prevTrack, remainingQueue, updatedContext, {
    prepared: { queue: canonicalQueueRef.current, currentIndex: prevIndex }
  });
}, [handlePlaySong, playerState.playbackContext, seek]);



// new added to manage ad end
// ----------------------

const handleAdEnded = useCallback(async (adIndex) => {
  console.log(`[AUDIO] ✅ Ad ${adIndex} completed, preparing to resume music`);
  
  const currentTrack = currentTrackRef.current;
  const currentIndex = currentIndexRef.current;
  
  if (!currentTrack) {
    console.log("[AUDIO] No current track to resume after ad");
    return;
  }

  console.log(`[AUDIO] Resuming music after ad: ${currentTrack.title}`);

  // Resume the existing audio element where it left off
  if (audioRef.current) {
    try {
      if (typeof audioRef.current.playAsync === "function") {
        await audioRef.current.playAsync();
      } else {
        await audioRef.current.play();
      }
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        isAdPlaying: false,
      }));
      console.log("[AUDIO] ✅ Resumed main audio after ad");
      return;
    } catch (err) {
      console.warn("[AUDIO] Fallback resume after ad failed, trying fresh play", err);
    }
  }

  // If for some reason the element could not resume, try reloading the current track
  try {
    const remainingQueue = buildRemainingFrom(currentIndex);
    await handlePlaySong(currentTrack, remainingQueue, playerState.playbackContext, {
      prepared: {
        queue: canonicalQueueRef.current,
        currentIndex: currentIndex,
      },
      fromAd: true,
    });
    setPlayerState((prev) => ({
      ...prev,
      isAdPlaying: false,
      currentAd: null,
    }));
    console.log(`[AUDIO] ✅ Started fresh playback after ad: ${currentTrack.title}`);
  } catch (error) {
    console.error("[AUDIO] ❌ Failed to restart after ad:", error);
  }
}, [handlePlaySong, buildRemainingFrom, playerState.playbackContext]);






// Persist a snapshot so refresh can resume even if an ad pauses playback
  const saveSnapshotForAd = useCallback(
  
    async (overrideWasPlaying = null) => {
       console.log('hello 1 ..')
      if (!isUserLoggedIn) return;
      const audio = audioRef.current;

     console.log('hello 2 ..')
      if (!audio || !playerState.currentTrack) return;

      const adState =
        playerManagerRef.current?.getAdResumeSnapshot?.() || null;


     console.log('hello 3..')

      const trackInput = toPlaybackTrackInput(playerState.currentTrack);
      if (!trackInput?.id) {
        console.warn("[AUDIO] saveSnapshotForAd: missing track id, skipping snapshot");
        return;
      }

      const queueInput = (playerState.queue || [])
        .map(toPlaybackTrackInput)
        .filter(Boolean);

      const data = {

        track: trackInput,
        currentTime: audio.currentTime,
        queue: queueInput,
        wasPlaying: Boolean(
          typeof overrideWasPlaying === "boolean"
            ? overrideWasPlaying
            : playerState.isPlaying || playerState.isAdPlaying
        ),
        volume: playerState.volume,
        isMuted: playerState.isMuted,
        shuffle: playerState.shuffle,
        repeat: playerState.repeatMode,
        adState,
      };


    try {
      await savePlaybackSession({ variables: { data } });
    } catch (e) {
      console.warn("[AUDIO] saveSnapshotForAd failed:", e?.message || e);
    }
  },
  [isUserLoggedIn, playerState, savePlaybackSession]
);








// Listen for ad completion events
useEffect(() => {
  const handleAdPlaybackFinished = (payload) => {
    console.log("[AUDIO] 🎯 Ad playback finished, resuming music");
    handleAdEnded(payload?.adIndex);
  };

  eventBus.on("AD_PLAYBACK_FINISHED", handleAdPlaybackFinished);

  return () => {
    eventBus.off("AD_PLAYBACK_FINISHED", handleAdPlaybackFinished);
  };
}, [handleAdEnded]);




// Listen for ad start to hard-pause main audio and flag ad state
useEffect(() => {
  const handleAdStarted = async (payload) => {
    console.log("[AUDIO] 🚦 AD_STARTED received, pausing main audio", payload);
    if (audioRef.current) {
      try {
        if (typeof audioRef.current.pauseAsync === "function") {
          await audioRef.current.pauseAsync();
        } else {
          audioRef.current.pause();
        }
      } catch (err) {
        console.warn("[AUDIO] Failed to pause on AD_STARTED", err);
      }
    }
    setPlayerState((prev) => ({
      ...prev,
      isPlaying: false,
      isAdPlaying: true,
      currentAd:
        (payload && (payload.title || payload.advertiser || payload.artwork) ? payload : prev.currentAd),
    }));
    // Save snapshot so refresh can resume where music paused for the ad
    saveSnapshotForAd(true);
  };

  eventBus.on("AD_STARTED", handleAdStarted);
  return () => eventBus.off("AD_STARTED", handleAdStarted);
}, [saveSnapshotForAd]);


// useEffect to your main audio provider
useEffect(() => {
  const handleAdPauseRequest = async (payload) => {
    console.log("[AUDIO] Ad system requesting pause");
    if (audioRef.current && playerState.isPlaying) {
      try {
        if (typeof audioRef.current.pauseAsync === "function") {
          await audioRef.current.pauseAsync();
        } else {
          audioRef.current.pause();
        }
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        console.log("[AUDIO] Paused main audio for ad");
      } catch (error) {
        console.log("[AUDIO] Error pausing for ad:", error);
      }
    }
  };

  eventBus.on("AD_PAUSE_REQUESTED", handleAdPauseRequest);

  return () => {
    eventBus.off("AD_PAUSE_REQUESTED", handleAdPauseRequest);
  };
}, [playerState.isPlaying]);


// useEffect to coordinate ad completion
useEffect(() => {
  const handleAdCompleted = async (payload) => {
    console.log("[AUDIO] Received AD_COMPLETED, waiting before resuming...");
    
    // 🔥 Wait a bit to ensure ad system is fully cleaned up
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 🔥 Only resume if we're actually in an ad state
    if (playerState.isAdPlaying) {
      console.log("[AUDIO] Triggering resume after ad completion");
      handleAdEnded(payload.adIndex);
    } else {
      console.log("[AUDIO] Not in ad state, ignoring completion event");
    }
  };

  eventBus.on("AD_COMPLETED", handleAdCompleted);

  return () => {
    eventBus.off("AD_COMPLETED", handleAdCompleted);
  };
}, [handleAdEnded, playerState.isAdPlaying]);

// Sync ad metadata into playerState so UI can read it
useEffect(() => {
  const handleAdMetadata = (payload) => {
    setPlayerState(prev => ({ ...prev, currentAd: payload }));
  };
  eventBus.on("AD_METADATA_LOADED", handleAdMetadata);
  return () => eventBus.off("AD_METADATA_LOADED", handleAdMetadata);
}, []);



  const setVolume = useCallback((newVolume) => {
    const vol = Math.min(1, Math.max(0, newVolume));
    if (audioRef.current) audioRef.current.volume = vol;
    setPlayerState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      setPlayerState(prev => {
        const nextMuted = !prev.isMuted;
        audioRef.current.muted = nextMuted;
        return { ...prev, isMuted: nextMuted };
      });
    }
  }, []);

  const addToQueue = useCallback((tracks) => {
    const validTracks = tracks.map(track => {
      const normalized = normalizeArtworkTrack(track);
      const config = getAudioConfig(normalized);
      return config ? { ...normalized, ...config } : null;
    }).filter(Boolean);
    setPlayerState(prev => ({ ...prev, queue: [...prev.queue, ...validTracks] }));
  }, [getAudioConfig]);

  const clearQueue = useCallback(() => {
    setPlayerState(prev => ({ ...prev, queue: [] }));
  }, []);

  const clearError = useCallback(() => {
    setPlayerState(prev => ({ ...prev, error: null }));
  }, []);

  const pause = useCallback((manually = false) => {
    audioRef.current?.pause();
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      wasManuallyPaused: manually ? true : prev.wasManuallyPaused
    }));
  }, []);

  const shouldBlockPlayback = useCallback(() => {
    const block =
      playerState.hasTeaserEnded &&
      playerState.isTeaser &&
      !playerState.wasManuallyPaused;
    return block;
  }, [playerState.hasTeaserEnded, playerState.isTeaser, playerState.wasManuallyPaused]);

  const togglePlay = useCallback(() => {
    if (shouldBlockPlayback()) {
      onRequireAuth('teaser-end');
      return;
    }
    // use the stable play/pause
    playerState.isPlaying ? pause(true) : play();
  }, [playerState.isPlaying, play, pause, shouldBlockPlayback, onRequireAuth]);

  // ======= Persist progress (single source of truth) =======
  useEffect(() => {
    if (!isUserLoggedIn) return; // guests: no persistence

    const audio = audioRef.current;
    if (!audio || !playerState.currentTrack) return;

    const persist = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastSaveRef.current < SAVE_EVERY_MS) return;
console.log('VERIFY CURRENT TRACK', playerState.queue)

        const trackInput = toPlaybackTrackInput(playerState.currentTrack);
        if (!trackInput?.id) {
          console.warn("[AUDIO] persist: missing track id, skipping snapshot");
          return;
        }

        const queueInput = (playerState.queue || [])
          .map(toPlaybackTrackInput)
          .filter(Boolean);

        const data = {
        track: trackInput,
        currentTime: audio.currentTime,
        queue: queueInput,
        // If an ad temporarily paused content, still treat the session as "playing"
        // so refresh resumes where music left off.
        wasPlaying: Boolean(playerState.isPlaying || playerState.isAdPlaying),
        volume: playerState.volume,
        isMuted: playerState.isMuted,
        shuffle: playerState.shuffle,
        repeat: playerState.repeatMode && playerState.repeatMode !== RepeatMode.OFF,
        adState: playerManagerRef.current?.getAdResumeSnapshot?.() || null,
      };
      

console.log('check data to resume', data)




      // dedupe by coarse signature to avoid chatty writes
        const sig = [
        data.track?.id,
        Math.floor(data.currentTime),
        data.queue?.map(q => q.id).join(','),
        data.wasPlaying ? 1 : 0,
        Math.round((data.volume ?? 0) * 100),
        data.isMuted ? 1 : 0,
        data.shuffle ? 1 : 0,
        data.repeat ? 1 : 0,
      ].join('|');

      if (!force && sig === lastSigRef.current) return;
      lastSigRef.current = sig;
      lastSaveRef.current = now;

      try {
        await savePlaybackSession({ variables: { data } });
      } catch (e) {
        console.warn('savePlaybackSession failed:', e?.message || e);
      }
    };




    const onTime = () => persist(false);
    const onSeeked = () => persist(true);
    const onPause = () => persist(true);
    const onEnded = () => persist(true);
    const onHidden = () => persist(true);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('beforeunload', onHidden);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('beforeunload', onHidden);
    };
  }, [
    isUserLoggedIn,
    playerState.currentTrack?.id,
    playerState.isPlaying,
    playerState.queue,
    playerState.volume,
    playerState.isMuted,
    playerState.shuffle,
    playerState.repeat,
    savePlaybackSession
  ]);

  return (
    <AudioPlayerContext.Provider
      value={{
        ...playerState,
        audioRef,
        playerState,
        load,
        play,
        pause,
        togglePlay,
        seek,
        skipNext,
        skipPrevious,
        handleAdEnded,
        handlePlaySong,
        setVolume,
        toggleMute,
        addToQueue,
        clearQueue,
        clearError,
        getAudioConfig,
        shouldBlockPlayback,
         toggleShuffle,
      cycleRepeatMode,
       RepeatMode, 
      }}
    >
      {children}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </AudioPlayerContext.Provider>
  );
};

AudioPlayerProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onRequireAuth: PropTypes.func
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    console.warn('useAudioPlayer called without AudioPlayerProvider; returning no-op context');
    return defaultAudioContext;
  }
  return context;
};
