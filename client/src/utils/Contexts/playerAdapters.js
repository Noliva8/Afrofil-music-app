export { createMusicPlayerAdapter } from "./adapters/musicAdapter.js";
export { createAdPlayerAdapter } from "./adapters/adPlayerAdapter.js";
export { eventBus } from "./adapters/eventBus.js";

// Ad adapter factory (AdAudioProvider -> PlayerManager)
export const createAdAdapterFactoryFromContext = (adCtx) => {
  if (!adCtx?.adapter) {
    console.warn('createAdAdapterFactoryFromContext: No ad adapter provided, creating mock adapter');
    return createMockAdAdapter();
  }

  return ({ identity, environment }) => {
    const adapter = adCtx.adapter;
    
    try {
      // Update adapter with current context
      adapter.updateIdentity?.(identity);
      adapter.updateEnvironment?.(environment);
    } catch (error) {
      console.error('AdAdapterFactory: Failed to update context', error);
    }

    // Wrap the adapter with error handling and safety checks
    return createSafeAdAdapter(adapter);
  };
};

// Safe wrapper for any ad adapter
const createSafeAdAdapter = (adapter) => {
  const safeAdapter = {
    // Required methods
    playAd: async (adType, context) => {
      if (!adapter.playAd) {
        throw new Error('Ad adapter missing playAd method');
      }

      try {
        console.log(`🎯 Playing ${adType} ad with context:`, {
          identity: context.identity,
          genre: context.genre,
          location: context.location?.country
        });

        const result = await adapter.playAd(adType, context);
        return result;
      } catch (error) {
        console.error(`AdAdapter: playAd failed for ${adType}`, error);
        
        // Enhanced error information
        const enhancedError = new Error(`Ad playback failed: ${error.message}`);
        enhancedError.adType = adType;
        enhancedError.context = context;
        enhancedError.originalError = error;
        
        throw enhancedError;
      }
    },

    // Optional methods with safe fallbacks
    stopAd: () => {
      try {
        adapter.stopAd?.();
      } catch (error) {
        console.error('AdAdapter: stopAd failed', error);
      }
    },

    onComplete: (callback) => {
      try {
        adapter.onComplete?.(callback);
      } catch (error) {
        console.error('AdAdapter: onComplete setup failed', error);
      }
    },

    onError: (callback) => {
      try {
        adapter.onError?.(callback);
      } catch (error) {
        console.error('AdAdapter: onError setup failed', error);
      }
    },

    updateIdentity: (identity) => {
      try {
        adapter.updateIdentity?.(identity);
      } catch (error) {
        console.error('AdAdapter: updateIdentity failed', error);
      }
    },

    updateEnvironment: (environment) => {
      try {
        adapter.updateEnvironment?.(environment);
      } catch (error) {
        console.error('AdAdapter: updateEnvironment failed', error);
      }
    },

    // Utility methods
    isValid: () => {
      return !!(adapter && typeof adapter.playAd === 'function');
    },

    getSupportedAdTypes: () => {
      try {
        return adapter.getSupportedAdTypes?.() || ['preroll', 'midroll', 'postroll'];
      } catch (error) {
        console.error('AdAdapter: getSupportedAdTypes failed', error);
        return ['preroll', 'midroll', 'postroll'];
      }
    }
  };

  return safeAdapter;
};

// Mock ad adapter for development/testing
export const createMockAdAdapter = (config = {}) => {
  const {
    failRate = 0,
    networkDelay = [1000, 3000],
    logEvents = true
  } = config;

  let identity = { userType: 'guest', userId: null };
  let environment = { location: null };
  let completeCallback = null;
  let errorCallback = null;
  let isPlaying = false;
  let timeoutId = null;

  const AD_DURATIONS = {
    preroll: 5,
    midroll: 10,
    postroll: 5,
    branded_content: 15,
    premium_midroll: 10,
    interactive: 8,
    default: 10
  };

  const clearPlayback = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isPlaying = false;
  };

  const simulateNetworkDelay = () => {
    const [min, max] = networkDelay;
    return Math.random() * (max - min) + min;
  };

  return {
    async playAd(adType, context) {
      if (isPlaying) {
        throw new Error('Ad already playing');
      }

      clearPlayback();
      isPlaying = true;

      if (logEvents) {
        console.log(`🎬 MockAd: Starting ${adType} ad`, {
          duration: AD_DURATIONS[adType] || AD_DURATIONS.default,
          identity,
          genre: context.genre,
          location: environment.location
        });
      }

      // Simulate network delay before ad starts
      await new Promise(resolve => setTimeout(resolve, simulateNetworkDelay()));

      // Random failure simulation
      if (Math.random() < failRate) {
        isPlaying = false;
        const error = new Error(`Mock ad failed for ${adType}`);
        errorCallback?.(error);
        throw error;
      }

      const duration = AD_DURATIONS[adType] || AD_DURATIONS.default;

      return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          if (logEvents) {
            console.log(`✅ MockAd: Completed ${adType} ad`);
          }
          clearPlayback();
          completeCallback?.();
          resolve();
        }, duration * 1000);
      });
    },

    stopAd() {
      if (logEvents) {
        console.log('⏹️ MockAd: Stopped manually');
      }
      clearPlayback();
    },

    onComplete(callback) {
      completeCallback = callback;
    },

    onError(callback) {
      errorCallback = callback;
    },

    updateIdentity(newIdentity) {
      identity = { ...identity, ...newIdentity };
      if (logEvents) {
        console.log('👤 MockAd: Identity updated', identity);
      }
    },

    updateEnvironment(newEnvironment) {
      environment = { ...environment, ...newEnvironment };
      if (logEvents) {
        console.log('🌍 MockAd: Environment updated', environment);
      }
    },

    // Mock-specific methods
    simulateAdError(errorMessage = 'Simulated ad error') {
      if (isPlaying) {
        const error = new Error(errorMessage);
        errorCallback?.(error);
        clearPlayback();
      }
    },

    getState() {
      return { isPlaying, identity, environment };
    }
  };
};

// Real ad adapter for production (Google IMA, etc.)
export const createRealAdAdapter = (adConfig = {}) => {
  // This would integrate with your actual ad SDK (Google IMA, etc.)
  const config = {
    adTagUrl: adConfig.adTagUrl,
    adUnitPath: adConfig.adUnitPath,
    ...adConfig
  };

  let identity = { userType: 'guest', userId: null };
  let environment = { location: null };
  let completeCallback = null;
  let errorCallback = null;
  let adManager = null;

  // Initialize your ad SDK here
  const initializeAdManager = () => {
    if (adManager) return adManager;

    try {
      // Example: Google IMA initialization
      // adManager = new google.ima.AdManager(...);
      console.log('AdAdapter: Initializing real ad manager', config);
      
      // Mock implementation - replace with real SDK
      adManager = {
        playAd: async (adType) => {
          console.log(`🎬 RealAd: Playing ${adType} via ${config.adTagUrl || config.adUnitPath}`);
          // Real ad playback implementation would go here
        },
        stopAd: () => {
          console.log('⏹️ RealAd: Stopping current ad');
        }
      };

      return adManager;
    } catch (error) {
      console.error('AdAdapter: Failed to initialize ad manager', error);
      throw error;
    }
  };

  return {
    async playAd(adType, context) {
      try {
        const manager = initializeAdManager();
        
        // Apply targeting based on identity and context
        const targetingParams = {
          ...identity,
          genre: context.genre,
          country: environment.location?.country,
          ...context
        };

        console.log('🎯 RealAd: Playing with targeting', targetingParams);
        
        await manager.playAd(adType, targetingParams);
        
      } catch (error) {
        console.error(`RealAd: playAd failed for ${adType}`, error);
        errorCallback?.(error);
        throw error;
      }
    },

    stopAd() {
      try {
        adManager?.stopAd();
      } catch (error) {
        console.error('RealAd: stopAd failed', error);
      }
    },

    onComplete(callback) {
      completeCallback = callback;
      // Hook into your ad SDK's completed event
    },

    onError(callback) {
      errorCallback = callback;
      // Hook into your ad SDK's error event
    },

    updateIdentity(newIdentity) {
      identity = { ...identity, ...newIdentity };
      // Update ad SDK with new targeting
    },

    updateEnvironment(newEnvironment) {
      environment = { ...environment, ...newEnvironment };
      // Update ad SDK with new targeting
    },

    // Real ad-specific methods
    preloadAd(adType) {
      // Preload ads for better performance
    },

    destroy() {
      // Clean up ad manager resources
      adManager?.destroy?.();
      adManager = null;
    }
  };
};

/**
 * Seed identity into PlayerManager and optionally seed current genre
 */
export const attachAudioProviderToManager = (pm, identity, audioCtx) => {
  if (!pm || typeof pm.setIdentity !== 'function') {
    console.error('attachAudioProviderToManager: Invalid PlayerManager');
    return;
  }

  const safeIdentity = identity || { userType: 'guest', userId: null };
  
  try {
    pm.setIdentity(safeIdentity);

    // Extract genre from current track if available
    const genre = audioCtx?.playerState?.currentTrack?.genre;
    if (genre && typeof pm.updateCurrentGenre === 'function') {
      pm.updateCurrentGenre(genre);
    }

    console.log('🔗 AudioProvider attached to PlayerManager', {
      userType: safeIdentity.userType,
      genre: genre || 'none'
    });
  } catch (error) {
    console.error('attachAudioProviderToManager: Failed to attach', error);
  }
};

/**
 * Prime manager with initial track and location data
 */
export const primeManagerFromAudioContext = (pm, audioCtx, geo) => {
  if (!pm) {
    console.error('primeManagerFromAudioContext: PlayerManager required');
    return;
  }

  try {
    // Set location if available
    if (geo?.country && typeof pm.setLocation === 'function') {
      pm.setLocation(geo);
    }

    // Set current track if available
    const track = audioCtx?.playerState?.currentTrack;
    if (track?.id) {
      const trackMeta = {
        id: track.id,
        title: track.title,
        genre: track.genre,
        duration: track.duration,
        artist: track.artist
      };

      // Use the appropriate method based on PlayerManager version
      if (typeof pm.onTrackStart === 'function') {
        pm.onTrackStart(trackMeta);
      } else if (typeof pm.onTrackLoaded === 'function') {
        pm.onTrackLoaded(trackMeta);
      }

      console.log('🎵 Primed PlayerManager with track', {
        title: track.title,
        genre: track.genre,
        duration: track.duration
      });
    } else {
      console.log('🎵 No current track available for priming');
    }
  } catch (error) {
    console.error('primeManagerFromAudioContext: Failed to prime', error);
  }
};

// Utility function to create the right adapter based on environment
export const createEnvironmentAwareAdAdapter = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const useMockAds = process.env.REACT_APP_USE_MOCK_ADS === 'true';
  
  if (isDevelopment || useMockAds) {
    console.log('🔧 Using mock ad adapter for development');
    return createMockAdAdapter({
      logEvents: true,
      failRate: 0.1, // 10% failure rate in development
      networkDelay: [500, 2000]
    });
  }
  
  console.log('🚀 Using real ad adapter for production');
  return createRealAdAdapter({
    adTagUrl: process.env.REACT_APP_AD_TAG_URL,
    adUnitPath: process.env.REACT_APP_AD_UNIT_PATH
  });
};
