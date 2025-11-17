









// AudioPlayerProvider.jsx
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useLazyQuery } from '@apollo/client';

import { useUser } from './userContext';
import { useLocationContext } from './useLocationContext.jsx';
import { ensureSessionId } from '../sessions/sessionGenerator.js';
import UserAuth from "../auth.js";

import { SAVE_PLAYBACK_SESSION } from '../mutations.js';
import { GET_PLAYBACK_SESSION } from '../queries.js';
import { getClientDeviceInfo } from '../detectDevice/getClientDeviceInfo.js';

// ad integration
import { PlayerManager } from './playerManager.js';

import { createMusicPlayerAdapter,
createAdPlayerAdapter,
  attachAudioProviderToManager,
  primeManagerFromAudioContext } from './playerAdapters.js';
import { eventBus } from './playerAdapters.js';





// Only fields allowed by PlaybackTrackInput (strip __typename and extras)
const toPlaybackTrackInput = (t) => {
  if (!t) return null;
  return {
    id: String(t.id || t._id || ''),
    title: t.title ?? null,
    url: t.url ?? t.fullUrl ?? t.audioUrl ?? t.fullUrlWithAds ?? null,
    audioUrl: t.audioUrl ?? null,
    fullUrl: t.fullUrl ?? null,
    fullUrlWithAds: t.fullUrlWithAds ?? null,
    teaserUrl: t.teaserUrl ?? null,
    isTeaser: typeof t.isTeaser === 'boolean' ? t.isTeaser : false,
    artworkUrl: t.artworkUrl ?? t.artworkPresignedUrl ?? null,
    artworkPresignedUrl: t.artworkPresignedUrl ?? t.artworkUrl ?? null,
  };
};

const normalizeTrackForResume = (t) => {
  if (!t) return null;
  return {
    ...t,
    url: t.url || t.fullUrl || t.audioUrl || t.fullUrlWithAds || null,
    artworkPresignedUrl: t.artworkPresignedUrl || t.artworkUrl || null,
    artworkUrl: t.artworkUrl || t.artworkPresignedUrl || null,
    isTeaser: !!t.isTeaser,
  };
};

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children, onRequireAuth = () => {} }) => {
  const userContext = useUser();
  const { isUser, isPremium } = userContext;
  const isUserLoggedIn = isUser || isPremium;

  const audioRef = useRef(null);
  const canonicalQueueRef = useRef([]);        // full canonical queue
  const suppressAutoAdvanceRef = useRef(false);
  const currentIndexRef = useRef(0);
  const currentSongIdRef = useRef(null);

  // keep the currentTrack outside of state for stable access inside callbacks
  const currentTrackRef = useRef(null);

  // throttle + dedupe for save
  const lastSaveRef = useRef(0);
  const lastSigRef = useRef('');

  const SAVE_EVERY_MS = 3000;

  const [savePlaybackSession] = useMutation(SAVE_PLAYBACK_SESSION);
  const [fetchPlaybackSession, { data: resumeData }] =
    useLazyQuery(GET_PLAYBACK_SESSION, { fetchPolicy: 'network-only' });

  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  const sessionId = ensureSessionId(); // optional for analytics if you need

  const { geo } = useLocationContext();

  const [authState] = useState({
    isGuest: !isUserLoggedIn,
    isPremium: isPremium
  });

  const buildRemainingFrom = (idx) => {
    if (!Array.isArray(canonicalQueueRef.current)) return [];
    if (idx >= canonicalQueueRef.current.length - 1) return [];
    return canonicalQueueRef.current.slice(idx + 1);
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
    repeat: false,
    shuffle: false,
    playedOnce: false,
    initialAuthLevel: null,
    playbackContext: null,
    playbackSource: null,
    playbackSourceId: null
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
  isUser, isPremium, profile, geo
});

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
    userType: isPremium ? 'premium' : (isUser ? 'regular' : 'guest'),
    userId
  });
  if (geo) mgr.setLocation(geo);
}, [isUser, isPremium, userId, geo]);

// --------------------------------------------------------------










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
        const shouldStop =
          prev.isTeaser &&
          !prev.wasManuallyPaused &&
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

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const getAudioConfig = useCallback((track) => {
    if (!track) return null;

    // If resuming with a saved URL, trust it (don’t recompute).
    if (track.url) return { url: track.url, isTeaser: !!track.isTeaser };

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

  // ---- Play: stable identity, uses ref fallback ----
  const play = useCallback(async (trackArg = null, playbackContext = null) => {
    const track = trackArg || currentTrackRef.current;
    if (!track) return;

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
      const config = getAudioConfig(track);
      if (!config) {
        setPlayerState(prev => ({ ...prev, error: 'No valid audio config' }));
        return false;
      }

      const audio = audioRef.current;
      audio.pause();
      audio.src = config.url;
      audio.load();
      audio.currentTime = 0;

      currentSongIdRef.current = track.id;

      // keep the ref in sync with the next currentTrack
      currentTrackRef.current = { ...track, ...config };

      setPlayerState(prev => ({
        ...prev,
        currentTrack: { ...track, ...config },
        isTeaser: config.isTeaser,
        currentTime: 0,
        isPlaying: false,
        isLoading: true,
        hasTeaserEnded: false,
        wasManuallyPaused: false,
        error: null,
        queue: newQueue
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


  // ======== RESUME: fetch saved session on mount (only for logged-in users) ========
  useEffect(() => {
    if (!isUserLoggedIn) return;
    fetchPlaybackSession().catch(() => {});
  }, [isUserLoggedIn, fetchPlaybackSession]);

  // run resume exactly once per fetched payload
  const didResumeRef = useRef(false);
  useEffect(() => {
    if (didResumeRef.current) return;
    const session = resumeData?.playbackSession;
    if (!session || !session.track) return;

    didResumeRef.current = true;

    const current = normalizeTrackForResume(session.track);
    const rest = Array.isArray(session.queue) ? session.queue.map(normalizeTrackForResume) : [];

    // reconstruct canonical queue: currentTrack + remaining
    const fullQueue = [current, ...rest];
    canonicalQueueRef.current = fullQueue;
    currentIndexRef.current = 0;

    (async () => {
      const ok = await load(current, fullQueue.slice(1));
      if (!ok) return;

      if (typeof session.currentTime === 'number' && session.currentTime > 0) {
        // seek after load so metadata is ready
        seek(session.currentTime);
      }

      if (session.wasPlaying) {
        await play(current);
      } else {
        setPlayerState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      }
    })();
  }, [resumeData, load, seek, play]);

  // Handle play song
  const handlePlaySong = useCallback(
    async (track, _newQueue = [], incomingContext = null, extras = {}) => {
      let targetIndex = currentIndexRef.current;

      if (extras?.prepared?.queue && Array.isArray(extras.prepared.queue)) {
        const newQ = extras.prepared.queue;
        const newQueueIds = newQ.map(t => t.id).join(',');
        const currentQueueIds = canonicalQueueRef.current.map(t => t.id).join(',');
        if (newQueueIds !== currentQueueIds) canonicalQueueRef.current = newQ;

        if (typeof extras.prepared.currentIndex === 'number') {
          targetIndex = extras.prepared.currentIndex;
        }
      } else {
        const foundIndex = canonicalQueueRef.current.findIndex(t => t?.id === track?.id);
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
      currentTrackRef.current = track;

      // 🔌 AD INTEGRATION — let manager know about the upcoming track
try {
  playerManagerRef.current?.onTrackLoaded?.({
    id: track?.id || track?._id,
    title: track?.title,
    genre: track?.genre,
    duration: track?.duration ?? 0
  });
  playerManagerRef.current?.recordSongPlay?.({
    id: track?.id || track?._id,
    genre: track?.genre,
    duration: track?.duration ?? 0
  });
} catch {}



      setPlayerState(prev => ({
        ...prev,
        currentTrack: track,
        queue: remainingQueue,
        playbackSource: contextToUse?.source ?? null,
        playbackSourceId: contextToUse?.sourceId ?? null,
        playbackContext: contextToUse,
        isLoading: true,
        error: null
      }));

      const loaded = await load(track, remainingQueue);
      if (!loaded) {
        setPlayerState(prev => ({ ...prev, isLoading: false, error: 'Failed to load track', isPlaying: false }));
        return false;
      }

      try {
        await play(track, contextToUse);
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

  const nextIndex = Math.min(currentIndexRef.current + 1, total - 1);
  if (nextIndex === currentIndexRef.current) {
    seek(0);
    return;
  }

  currentIndexRef.current = nextIndex;
  const nextTrack = canonicalQueueRef.current[nextIndex];
  const remainingQueue = buildRemainingFrom(nextIndex);

  const updatedContext = playerState.playbackContext ? {
    ...playerState.playbackContext,
    queuePosition: nextIndex,
    queueLength: total
  } : null;

  // sync currentTrackRef before play
  currentTrackRef.current = nextTrack;

  await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
    prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex }
  });
}, [handlePlaySong, playerState.playbackContext, seek]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;



    // const handleEnded = async () => {
    //   if (suppressAutoAdvanceRef.current) return;
    //   await skipNext();
    // };

const handleEnded = async () => {
  if (suppressAutoAdvanceRef.current) return;
  
  // 🔥 ADD THIS: Notify PlayerManager that the current track ended
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
  
  await skipNext();
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
  const prevTrack = canonicalQueueRef.current[prevIndex];
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
  console.log(`[AUDIO] ✅ Ad ${adIndex} completed, resuming playback`);
  
  // Get current track state
  const currentTrack = currentTrackRef.current;
  const currentIndex = currentIndexRef.current;
  const remainingQueue = buildRemainingFrom(currentIndex);
  
  if (currentTrack) {
    // Force UI to update and resume
    setPlayerState(prev => ({
      ...prev,
      isPlaying: true,
      isLoading: true, // brief loading state
      isAdPlaying: false
    }));
    
    // Resume the actual audio playback
    await handlePlaySong(currentTrack, remainingQueue, playerState.playbackContext, {
      prepared: { 
        queue: canonicalQueueRef.current, 
        currentIndex: currentIndex 
      }
    });
    
    console.log(`[AUDIO] ▶️ Resumed playback after ad: ${currentTrack.title}`);
  }
}, [handlePlaySong, buildRemainingFrom, playerState.playbackContext]);


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
      const config = getAudioConfig(track);
      return config ? { ...track, ...config } : null;
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

      const data = {
        track: toPlaybackTrackInput(playerState.currentTrack),
        currentTime: audio.currentTime,
        queue: (playerState.queue || []).map(toPlaybackTrackInput),
        wasPlaying: playerState.isPlaying,
        volume: playerState.volume,
        isMuted: playerState.isMuted,
        shuffle: playerState.shuffle,
        repeat: playerState.repeat,
      };

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
        shouldBlockPlayback
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
  if (!context) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  return context;
};
