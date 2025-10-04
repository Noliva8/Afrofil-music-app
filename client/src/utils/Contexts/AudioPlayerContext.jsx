import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useUser } from './userContext';
import PropTypes from 'prop-types';
import { useAudioPersistence } from './useAudioPersistence.js';
import { useMutation } from '@apollo/client';
import { useLazyQuery } from '@apollo/client';

import { sessionManager } from '../sessions/sessionGenerator.js';
import { ensureSessionId } from '../sessions/sessionGenerator.js';
import UserAuth from "../auth.js"
import { TRACK_START } from '../mutations.js';
import { useLocationContext } from './useLocationContext.jsx';
import { getClientDeviceInfo } from '../detectDevice/getClientDeviceInfo.js';

import { getCurrentPosition } from '../plabackUtls/playbackSources.js';
import { getQueueLength } from '../plabackUtls/playbackSources.js';
import { GET_PLAYBACK_CONTEXT_STATE } from '../queries.js';
import { SAVE_PLAYBACK_CONTEXT_STATE, CLEAR_PLAYBACK_CONTEXT_STATE } from '../mutations.js';
import { buildPlaybackPayload } from '../plabackUtls/buildPlaybackPayload.js';
import { writeCtxPointer } from '../plabackUtls/presistancePointer.js';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children, onRequireAuth = () => {} }) => {
  const userContext = useUser();
  const { isUser, isPremium } = userContext;
  const isUserLoggedIn = isUser || isPremium;

  const audioRef = useRef(null);
  const canonicalQueueRef = useRef([]);
  const suppressAutoAdvanceRef = useRef(false);
  const currentIndexRef = useRef(0);
  const lastSaveRef = useRef(0);
  const SAVE_EVERY_MS = 3000;

  const [SavePlaybackContextState] = useMutation(SAVE_PLAYBACK_CONTEXT_STATE);
  const [clearCtxMutation] = useMutation(CLEAR_PLAYBACK_CONTEXT_STATE);

  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
  const sessionId = ensureSessionId();

  const [clientDeviceInfo, setClientDeviceInfo] = useState(null);
  const { geo } = useLocationContext();

  const [authState, setAuthState] = useState({
    isGuest: !isUserLoggedIn,
    isPremium: isPremium
  });

  // Stable per-tab session id
  const sessionIdRef = useRef(null);
  if (typeof window !== 'undefined' && sessionIdRef.current === null) {
    try {
      let sessionId = sessionStorage.getItem('af_sess_id');
      if (!sessionId) {
        sessionId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        sessionStorage.setItem('af_sess_id', sessionId);
      }
      sessionIdRef.current = sessionId;
    } catch (error) {
      console.warn('Session storage unavailable:', error);
      sessionIdRef.current = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    }
  }
  if (sessionIdRef.current === null) {
    sessionIdRef.current = 'server-session-placeholder';
  }

  // Apollo mutation
  const [trackStart] = useMutation(TRACK_START);

  useEffect(() => {
    const deviceInfo = getClientDeviceInfo();
    setClientDeviceInfo(deviceInfo);
    console.log('the device the user is using:', deviceInfo);
  }, []);

  const currentSongIdRef = useRef(null);
  const handleNextSongRef = useRef(null);

  const buildRemainingFrom = (idx) => {
    if (!Array.isArray(canonicalQueueRef.current)) {
      console.warn('Canonical queue is not an array');
      return [];
    }
    
    if (idx >= canonicalQueueRef.current.length - 1) {
      console.log('At or beyond last position, returning empty queue');
      return [];
    }
    
    const remaining = canonicalQueueRef.current.slice(idx + 1);
    console.log(`Built remaining queue from index ${idx}:`, remaining.map(t => t.id));
    return remaining;
  };

  // State
  const [playerState, setPlayerState] = useState({
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

  // FIXED: This useEffect was causing infinite loops
  useEffect(() => {
    try {
      const uid = profile?.data?._id || null;
      const sid = sessionIdRef.current || null;
      if (!uid && !sid) return;
      writeCtxPointer({ userId: uid, sessionId: sid }); // FIXED: Use sid instead of sessionId
    } catch (error) {
      console.error('Error writing context pointer:', error);
    }
  }, [profile?.data?._id, sessionIdRef.current]); // FIXED: Added proper dependency

  // FIXED: Memoized savePlaybackContext with proper dependencies
  const savePlaybackContext = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && now - lastSaveRef.current < SAVE_EVERY_MS) return;

      const payload = buildPlaybackPayload({
        playerState,
        audioRef,
        userId,
        sessionId: sessionIdRef.current, // FIXED: Use sessionIdRef.current
        canonicalQueueRef,
        currentIndexRef,
      });
      
      if (!payload) return;

      lastSaveRef.current = now;

      SavePlaybackContextState({ variables: { input: payload } })
        .catch(err => {
          console.error('savePlaybackContextState FAILED:', {
            message: err?.message,
            graphQLErrors: err?.graphQLErrors?.map(e => e.message),
            networkError: err?.networkError,
          });
        })
        .finally(() => {
          writeCtxPointer({ userId, sessionId: sessionIdRef.current }); // FIXED: Use sessionIdRef.current
        });
    },
    [playerState, audioRef, userId, SavePlaybackContextState] // FIXED: Removed sessionId dependency
  );

  // FIXED: Event listeners with proper cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.currentTrack) return;

    const onTime = () => savePlaybackContext(false);
    const onPause = () => savePlaybackContext(true);
    const onSeeked = () => savePlaybackContext(true);
    const onEnded = () => savePlaybackContext(true);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioRef, playerState.currentTrack?.id, savePlaybackContext]);

  // FIXED: Save when track changes
  useEffect(() => {
    if (playerState.currentTrack) {
      savePlaybackContext(true);
    }
  }, [playerState.currentTrack?.id, savePlaybackContext]);

  // FIXED: Page visibility and unload events
  useEffect(() => {
    const onHide = () => savePlaybackContext(true);
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [savePlaybackContext]);

  // Init audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    console.log('[Audio Init] Created new <audio> element');

    const handleAudioError = (e) => {
      const error = audio.error;
      console.error('[Audio] error', e);
      if (error) {
        console.error('🎯 Audio error code:', error.code);
        switch (error.code) {
          case 1: console.error('🧨 MEDIA_ERR_ABORTED: Playback was aborted'); break;
          case 2: console.error('🧨 MEDIA_ERR_NETWORK: Network error'); break;
          case 3: console.error('🧨 MEDIA_ERR_DECODE: Decoding error'); break;
          case 4: console.error('🧨 MEDIA_ERR_SRC_NOT_SUPPORTED: Format/URL unsupported'); break;
        }
        console.log('📡 Audio src:', audio.src);
      }
    };

    audio.addEventListener('error', handleAudioError);
    audioRef.current = audio;

    return () => {
      console.log('[Audio Cleanup] Cleaning up audio element');
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
          setTimeout(() => {
            console.log("🕒 Skipping to next song after teaser...");
            skipNext();
          }, 3000);
          return { ...prev, isPlaying: false, hasTeaserEnded: true };
        }
        return prev;
      });
    };

    audio.addEventListener('timeupdate', checkTeaserEnd);
    return () => audio.removeEventListener('timeupdate', checkTeaserEnd);
  }, [onRequireAuth]);

  // Progress sync
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

    if (authState.isGuest) {
      if (track.teaserUrl) {
        return { url: track.teaserUrl, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      if (track.audioUrl) {
        console.warn('[AudioPlayer] Guest mode: no teaserUrl; falling back to audioUrl as teaser (capped).');
        return { url: track.audioUrl, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      if (track.fullUrlWithAds || track.fullUrl) {
        const url = track.fullUrlWithAds || track.fullUrl;
        console.warn('[AudioPlayer] Guest mode: no teaserUrl/audioUrl; falling back to fullUrl as teaser (capped).');
        return { url, isTeaser: true, maxDuration: TEASER_DURATION };
      }
      console.warn('[AudioPlayer] Guest mode: no playable URL available for teaser.');
      return null;
    }

    if (!authState.isPremium) {
      const url = track.fullUrlWithAds || track.fullUrl || track.audioUrl || null;
      return url ? { url, isTeaser: false } : null;
    }

    const url = track.fullUrl || track.audioUrl || null;
    return url ? { url, isTeaser: false } : null;
  }, [authState.isGuest, authState.isPremium]);

  // Soft teaser timeout
  useEffect(() => {
    if (!playerState.isTeaser || !playerState.isPlaying) return;

    const timer = setTimeout(() => {
      if (
        playerState.isPlaying &&
        playerState.isTeaser &&
        !playerState.wasManuallyPaused
      ) {
        pause();
        setPlayerState(prev => ({ ...prev, hasTeaserEnded: true }));
        onRequireAuth('teaser-end');
      }
    }, TEASER_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [playerState.isTeaser, playerState.isPlaying, playerState.wasManuallyPaused, onRequireAuth]);

  const shouldBlockPlayback = useCallback(() => {
    const block =
      playerState.hasTeaserEnded &&
      playerState.isTeaser &&
      !playerState.wasManuallyPaused;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AudioPlayer] shouldBlockPlayback:', {
        hasTeaserEnded: playerState.hasTeaserEnded,
        isTeaser: playerState.isTeaser,
        wasManuallyPaused: playerState.wasManuallyPaused,
        result: block
      });
    }
    return block;
  }, [playerState.hasTeaserEnded, playerState.isTeaser, playerState.wasManuallyPaused]);

  // Play function
  const play = useCallback(async (trackArg = null, playbackContext = null) => {
    const track = trackArg || playerState?.currentTrack;
    if (!track) {
      console.warn('⚠️ No track provided. Cannot play.');
      return;
    }

    if (playbackContext) {
      console.log('🎯 Playback Context:', playbackContext);
    }

    try {
      const audio = audioRef.current;
      if (!audio) {
        console.error('❌ audioRef is null!');
        return;
      }

      console.log('🔊 Attempting to play audio:', track.title, '- URL:', audio.src);

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

      // Analytics and tracking code would go here
      // (commented out for brevity)

    } catch (error) {
      console.error('❌ audio.play() failed:', error.message || error);
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: error.message || 'Playback error'
      }));
    }
  }, [playerState?.currentTrack, playerState.queue, geo]);




  // Auto-resume on buffer issues
  const lastAutoResumeRef = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryResume = (label) => {
      const shouldResume =
        playerState.isPlaying &&
        !playerState.wasManuallyPaused &&
        !(playerState.isTeaser && playerState.hasTeaserEnded);

      const now = Date.now();
      if (!shouldResume || (now - lastAutoResumeRef.current) < 1500) {
        return;
      }
      lastAutoResumeRef.current = now;

      if (audio.readyState < 3) {
        console.log(`${label}… trying resume (readyState=${audio.readyState})`);
        audio.play().catch(() => {});
      }
    };

    const onWaiting = () => tryResume('⏳ Audio waiting (buffering)');
    const onStalled = () => tryResume('🛑 Audio stalled');
    const onSuspend = () => console.log('🧊 Audio suspend (network)…');
    const onPlaying = () => {
      lastAutoResumeRef.current = Date.now();
    };

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
        console.warn('⚠️ No audio config available for this track');
        setPlayerState(prev => ({ ...prev, error: 'No valid audio config' }));
        return false;
      }

      console.log('🎼 load() Track:', track.title);
      console.log('📡 Audio URL:', config.url);

      const audio = audioRef.current;
      audio.pause();
      audio.src = config.url;
      audio.load();
      audio.currentTime = 0;

      currentSongIdRef.current = track.id;

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
          console.log('✅ Audio canplay event fired');
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };
        const onError = (e) => {
          console.error('❌ Audio failed to load:', e);
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
      console.error('🧨 load() failed:', err.message || err);
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: err.message || 'Playback error'
      }));
      return false;
    }
  }, [getAudioConfig]);

  useAudioPersistence({
    audioRef,
    playerState,
    load,
    setPlayerState,
    play,
    isUserLoggedIn: isUser || isPremium
  });

  // Handle play song
  const handlePlaySong = useCallback(
    async (track, newQueue = [], incomingContext = null, extras = {}) => {
      console.log('▶️ handlePlaySong called...');

      let targetIndex = currentIndexRef.current;

      if (extras?.prepared?.queue && Array.isArray(extras.prepared.queue)) {
        const newQueueIds = extras.prepared.queue.map(t => t.id).join(',');
        const currentQueueIds = canonicalQueueRef.current.map(t => t.id).join(',');
        
        if (newQueueIds !== currentQueueIds) {
          canonicalQueueRef.current = extras.prepared.queue;
        }
        
        if (typeof extras.prepared.currentIndex === 'number') {
          targetIndex = extras.prepared.currentIndex;
        }
      } else {
        const foundIndex = canonicalQueueRef.current.findIndex(t => t?.id === track?.id);
        if (foundIndex >= 0) {
          targetIndex = foundIndex;
          console.log('Track found in canonical queue at position:', targetIndex);
        }
      }

      currentIndexRef.current = targetIndex;
      const remainingQueue = buildRemainingFrom(targetIndex);

      const contextToUse = incomingContext ? {
        ...incomingContext,
        queuePosition: targetIndex,
        queueLength: canonicalQueueRef.current.length
      } : null;

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
      if (loaded) {
        try {
          await play(track, contextToUse);
          setPlayerState(prev => ({
            ...prev,
            isPlaying: true,
            isLoading: false,
            playedOnce: true
          }));
          return true;
        } catch (err) {
          console.error('🚫 Failed to play after loading:', err);
          setPlayerState(prev => ({
            ...prev,
            isLoading: false,
            error: err.message,
            isPlaying: false
          }));
          return false;
        }
      } else {
        setPlayerState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load track',
          isPlaying: false
        }));
        return false;
      }
    },
    [load, play, setPlayerState]
  );

  const skipNext = useCallback(async () => {
    savePlaybackContext(true);
    startManualNav();
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

    await handlePlaySong(nextTrack, remainingQueue, updatedContext, {
      prepared: { queue: canonicalQueueRef.current, currentIndex: nextIndex }
    });
    savePlaybackContext(true);
  }, [handlePlaySong, playerState.playbackContext, seek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      console.log('🎵 Track ended');
      if (suppressAutoAdvanceRef.current) {
        console.log('⏸️ Auto-advance suppressed (manual nav in progress)');
        return;
      }
      if (handleNextSongRef.current) {
        console.log('➡️ Auto-advance to next');
        await handleNextSongRef.current();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const startManualNav = () => {
    suppressAutoAdvanceRef.current = true;
    setTimeout(() => { suppressAutoAdvanceRef.current = false; }, 600);
  };

  useEffect(() => {
    handleNextSongRef.current = skipNext;
  }, [skipNext]);

  const skipPrevious = useCallback(async () => {
    savePlaybackContext(true);
    startManualNav();
    const total = canonicalQueueRef.current.length;

    if (!total) {
      console.log('No queue available');
      return;
    }

    const audio = audioRef.current;
    if (audio?.currentTime > 3) {
      console.log('Restarting current track (currentTime > 3s)');
      seek(0);
      return;
    }

    const currentIndex = currentIndexRef.current;
    
    if (currentIndex <= 0) {
      console.log('Already at first track, restarting');
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

    await handlePlaySong(prevTrack, remainingQueue, updatedContext, {
      prepared: { 
        queue: canonicalQueueRef.current, 
        currentIndex: prevIndex 
      }
    });
    savePlaybackContext(true);
  }, [handlePlaySong, playerState.playbackContext, seek]);

  const setVolume = useCallback((newVolume) => {
    const vol = Math.min(1, Math.max(0, newVolume));
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setPlayerState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !playerState.isMuted;
      setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [playerState.isMuted]);

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

  const togglePlay = useCallback(() => {
    if (shouldBlockPlayback()) {
      onRequireAuth('teaser-end');
      return;
    }

    playerState.isPlaying
      ? pause(true)
      : play();
  }, [playerState.isPlaying, play, pause, shouldBlockPlayback, onRequireAuth]);

  // Persist progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playerState.currentTrack) return;

    const saveProgress = () => {
      const data = {
        track: playerState.currentTrack,
        currentTime: audio.currentTime,
        queue: playerState.queue,
        wasPlaying: playerState.isPlaying
      };
      localStorage.setItem('lastPlayedTrack', JSON.stringify(data));
    };

    audio.addEventListener('timeupdate', saveProgress);
    return () => audio.removeEventListener('timeupdate', saveProgress);
  }, [playerState.currentTrack, playerState.queue, playerState.isPlaying]);

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
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};