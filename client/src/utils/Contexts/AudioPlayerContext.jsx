import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useUser } from './userContext';
import PropTypes from 'prop-types';
import { useAudioPersistence } from './useAudioPersistence.js';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children, onRequireAuth = () => {} }) => {

  const userContext = useUser(); // ✅ safely call once
  const { isUser, isPremium } = userContext;
  const isUserLoggedIn = isUser || isPremium;
 const audioRef = useRef(null);
  const [authState, setAuthState] = useState({
    isGuest: !isUserLoggedIn, // ✅ correct default
    isPremium: isPremium
  });
 






useEffect(() => {
  if (!userContext.loading) {
    setAuthState({
      isGuest: userContext.isGuest,
      isPremium: userContext.isPremium
    });
  }
}, [userContext.loading, userContext.isGuest, userContext.isPremium]);




 

  // added
  const currentSongIdRef = useRef(null);
const handleNextSongRef = useRef(null);
const originalQueueRef = useRef([]);


  
  // states
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
  wasManuallyPaused: false,   // 🆕 Differentiates system vs user pause
  buffering: false,           // 🆕 If you want to track network-based buffering
  repeat: false,              // 🆕 Repeat mode (optional)
  shuffle: false,             // 🆕 Shuffle mode (optional)
  playedOnce: false,          // 🆕 Helpful for ads or teaser-only logic
  initialAuthLevel: null      // 🆕 Lock auth level at track load
});

  // Constants
  const TEASER_DURATION = 30; 


  // Initialize audio element
useEffect(() => {
  const audio = new Audio();
  audio.preload = 'none';
  audio.crossOrigin = 'anonymous';

  console.log('[Audio Init] Created new <audio> element');

  audio.addEventListener('canplay', () => console.log('[Audio] canplay'));
  audio.addEventListener('play', () => console.log('[Audio] play'));
  audio.addEventListener('pause', () => console.log('[Audio] pause'));
  audio.addEventListener('ended', () => console.log('[Audio] ended'));

  const handleAudioError = (e) => {
    const error = audio.error;
    console.error('[Audio] error', e);
    if (error) {
      console.error('🎯 Audio error code:', error.code);
      switch (error.code) {
        case 1:
          console.error('🧨 MEDIA_ERR_ABORTED: Playback was aborted');
          break;
        case 2:
          console.error('🧨 MEDIA_ERR_NETWORK: Network error');
          break;
        case 3:
          console.error('🧨 MEDIA_ERR_DECODE: Decoding error');
          break;
        case 4:
          console.error('🧨 MEDIA_ERR_SRC_NOT_SUPPORTED: Format/URL unsupported');
          break;
      }
      console.log('📡 Audio src:', audio.src);
    }
  };

  audio.addEventListener('error', handleAudioError);

  // Assign to ref
  audioRef.current = audio;

  return () => {
    console.log('[Audio Cleanup] Cleaning up audio element');
    audio.removeEventListener('canplay', () => {});
    audio.removeEventListener('play', () => {});
    audio.removeEventListener('pause', () => {});
    audio.removeEventListener('ended', () => {});
    audio.removeEventListener('error', handleAudioError);

    audio.pause();
    audio.src = '';
    audioRef.current = null;
  };
}, []);





// Teaser watch dog

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

  // ⏳ Wait 3s before moving to next song
  setTimeout(() => {
    console.log("🕒 Skipping to next song after teaser...");
skipNext(); // ✅ this is your new reliable helper

  }, 3000);

  return {
    ...prev,
    isPlaying: false,
    hasTeaserEnded: true
  };
}

      return prev;
    });
  };

  audio.addEventListener('timeupdate', checkTeaserEnd);

  return () => {
    audio.removeEventListener('timeupdate', checkTeaserEnd);
  };
}, [onRequireAuth]);

// Sync slider: currentTime and duration updates
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const updateProgress = () => {
    setPlayerState(prev => {
      // Avoid unnecessary updates if nothing changed
      if (
        Math.abs(prev.currentTime - audio.currentTime) < 0.01 &&
        prev.duration === audio.duration
      ) {
        return prev;
      }

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
  

  // Get audio configuration helper function
 const getAudioConfig = useCallback((track) => {
  if (!track) {
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AudioPlayer] No track provided to getAudioConfig.');
    }
    return null;
  }

  if (authState.isGuest) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AudioPlayer] Guest detected. Using teaser URL:', track.teaserUrl);
    }
    return track.teaserUrl 
      ? { url: track.teaserUrl, isTeaser: true, maxDuration: TEASER_DURATION }
      : null;
  }


  if (!authState.isPremium) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AudioPlayer] Regular user. Using fullUrlWithAds or fullUrl:', track.fullUrlWithAds || track.fullUrl);
    }
    return {
      url: track.fullUrlWithAds || track.fullUrl,
      isTeaser: false
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[AudioPlayer] Premium user. Using fullUrl:', track.fullUrl);
  }

  return {
    url: track.fullUrl,
    isTeaser: false
  };
}, [authState.isGuest, authState.isPremium]);







useEffect(() => {
  if (!playerState.isTeaser || !playerState.isPlaying) return;

  const timer = setTimeout(() => {
    if (
      playerState.isPlaying &&
      playerState.isTeaser &&
      !playerState.wasManuallyPaused
    ) {
      pause(); // ❗️ This one does NOT pass manually = true
      setPlayerState(prev => ({ ...prev, hasTeaserEnded: true }));
      onRequireAuth('teaser-end');
    }
  }, TEASER_DURATION * 1000);

  return () => clearTimeout(timer);
}, [playerState.isTeaser, playerState.isPlaying, playerState.wasManuallyPaused, onRequireAuth]);


  // Helper to check if playback should be blocked
const shouldBlockPlayback = useCallback(() => {
  const block = playerState.hasTeaserEnded && playerState.isTeaser && !playerState.wasManuallyPaused;

  if (process.env.NODE_ENV === 'development') {
    console.log('[AudioPlayer] shouldBlockPlayback:', {
      hasTeaserEnded: playerState.hasTeaserEnded,
      isTeaser: playerState.isTeaser,
      wasManuallyPaused: playerState.wasManuallyPaused,
      result: block
    });
  }

  return block;
}, [
  playerState.hasTeaserEnded,
  playerState.isTeaser,
  playerState.wasManuallyPaused
]);






  // Player controls
const play = useCallback(async (trackArg = null) => {
  const track = trackArg || playerState?.currentTrack;
  console.log('🎬 play() called — using track:', track);

  if (!track) {
    console.warn('⚠️ No track provided. Cannot play.');
    return;
  }

  try {
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ audioRef is null!');
      return;
    }

    console.log('🔊 Attempting to play audio:', audio.src);

    setPlayerState(prev => ({
      ...prev,
      isLoading: true
    }));

    await audio.play();

    setPlayerState(prev => ({
      ...prev,
      isPlaying: true,
      isLoading: false,
      hasTeaserEnded: false,
      wasManuallyPaused: false
    }));

    // 💾 Save to localStorage
    localStorage.setItem(
      'lastPlayedTrack',
      JSON.stringify({
        track,
        currentTime: audio.currentTime || 0,
        queue: playerState.queue || []
      })
    );
  } catch (error) {
    console.error('❌ audio.play() failed:', error.message || error);
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      isLoading: false,
      error: error.message || 'Playback error'
    }));
  }
}, [playerState?.currentTrack, playerState.queue]);


// soft teaser blocker
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

        console.log('⛔ Teaser ended. Triggering auth modal and skip...');

        onRequireAuth('teaser-end');

        setTimeout(() => {
          if (handleNextSongRef.current) {
            console.log('➡️ Skipping to next song...');
            handleNextSongRef.current();
          }
        }, 3000);

        return {
          ...prev,
          isPlaying: false,
          hasTeaserEnded: true
        };
      }

      return prev;
    });
  };

  audio.addEventListener('timeupdate', checkTeaserEnd);
  return () => {
    audio.removeEventListener('timeupdate', checkTeaserEnd);
  };
}, [onRequireAuth]);


const load = useCallback(async (track, newQueue = []) => {
  try {

    console.log('load is startin ...')
    const config = getAudioConfig(track);
    console.log('checking conf in load ...')
    if (!config) {
      console.warn('⚠️ No audio config available for this track');
      setPlayerState(prev => ({ ...prev, error: 'No valid audio config' }));
      return false;
    }

    console.log('🎼 load() Track:', track.title);
    console.log('📡 Audio URL:', config.url);

    const audio = audioRef.current;

    audio.pause(); // stop any ongoing
    audio.src = config.url;
    audio.load();
    audio.currentTime = 0;

    // Update ref and state
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
console.log('does load reach here? ...')

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
 console.log('✅ does load finish promises?');
    await canPlayPromise;
     console.log('✅ does load finish promises second?');

    setPlayerState(prev => ({
      ...prev,
      isLoading: false
    }));
console.log('✅ does load finish reset states?');
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

// Add handlePlaySong() helper

const handlePlaySong = useCallback(async (track, newQueue = []) => {
  console.log('▶️ handlePlaySong called...');

  // ✅ Store the original queue if it's a new session
  originalQueueRef.current = [track, ...newQueue];

  const loaded = await load(track, newQueue);
  console.log('▶️ finished loading track...');

  if (loaded) {
    try {
      await play(track);
      return true;
    } catch (err) {
      console.error('🚫 Failed to play after loading:', err);
      return false;
    }
  }

  return false;
}, [load, play]);






const skipNext = useCallback(async () => {
  const queue = playerState.queue;

  if (queue.length > 0) {
    const [nextTrack, ...remainingQueue] = queue;
    await handlePlaySong(nextTrack, remainingQueue);
  } else if (originalQueueRef.current.length > 0) {
    console.log('🔁 Replaying original queue');

    const [firstTrack, ...restQueue] = originalQueueRef.current;
    await handlePlaySong(firstTrack, restQueue);
  } else {
    console.log('🧃 No queue or originalQueueRef to replay.');
  }
}, [playerState.queue, handlePlaySong]);




// ('ended', skipNext) to allow auto loop

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const handleEnded = () => {
    console.log('🔁 Song ended — skipping to next or replaying queue');
    skipNext(); // this already handles queue and originalQueueRef
  };

  audio.addEventListener('ended', handleEnded);

  return () => {
    audio.removeEventListener('ended', handleEnded);
  };
}, [skipNext]);




// Track skipNext using ref
useEffect(() => {
  handleNextSongRef.current = skipNext;
}, [skipNext]);





    const skipPrevious = useCallback(() => {
    seek(0);
  }, [seek]);

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

// handle pause
const pause = useCallback((manually = false) => {
  audioRef.current?.pause();
  setPlayerState(prev => ({
    ...prev,
    isPlaying: false,
    wasManuallyPaused: manually ? true : prev.wasManuallyPaused // Only set if manually paused
  }));
}, []);




const togglePlay = useCallback(() => {
  if (shouldBlockPlayback()) {
    onRequireAuth('teaser-end');
    return;
  }

  playerState.isPlaying
    ? pause(true)  // ✅ manual pause
    : play();      // ✅ play (also resets manual flag)
}, [playerState.isPlaying, play, pause, shouldBlockPlayback, onRequireAuth]);




 //  Perisit playBACK
// -----------------




// 🔁 Persist playback progress during timeupdate
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
  return () => {
    audio.removeEventListener('timeupdate', saveProgress);
  };
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