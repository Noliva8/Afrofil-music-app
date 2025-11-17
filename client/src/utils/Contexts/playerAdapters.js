

import { GET_AUDIO_AD } from "../queries";
import { previewPointer } from "../previewSupport";
import { toBucketKey } from "../bucketKeySupport";
import { getAudioSupport } from "../audioSupport";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../mutations";
import { resolveAdCoverLocation } from "../adArtworkPointer";




// Music adapter (AudioPlayerProvider -> PlayerManager)
export const createMusicPlayerAdapter = (audio) => {
  if (!audio) {
    throw new Error('createMusicPlayerAdapter: audio context is required');
  }

  return {
    play: async () => {
      try {
        if (!audio.playerState?.isPlaying) {
          await audio.play();
        }
        return true;
      } catch (error) {
        console.error('MusicAdapter: play failed', error);
        throw new Error(`Failed to play music: ${error.message}`);
      }
    },

    pause: async () => {
      try {
        await audio.pause?.(true);
        return true;
      } catch (error) {
        console.error('MusicAdapter: pause failed', error);
        throw new Error(`Failed to pause music: ${error.message}`);
      }
    },

    isPlaying: () => {
      try {
        return !!audio.playerState?.isPlaying;
      } catch (error) {
        console.error('MusicAdapter: isPlaying check failed', error);
        return false;
      }
    },

    getCurrentTime: () => {
      try {
        return audio.playerState?.currentTime ?? 0;
      } catch (error) {
        console.error('MusicAdapter: getCurrentTime failed', error);
        return 0;
      }
    },

    seek: (time) => {
      try {
        if (typeof audio.seek === 'function') {
          audio.seek(time);
          return true;
        }
        return false;
      } catch (error) {
        console.error('MusicAdapter: seek failed', error);
        return false;
      }
    },

    getCurrentTrack: () => {
      try {
        return audio.playerState?.currentTrack || null;
      } catch (error) {
        console.error('MusicAdapter: getCurrentTrack failed', error);
        return null;
      }
    },

    getQueue: () => {
      try {
        return audio.playerState?.queue || [];
      } catch (error) {
        console.error('MusicAdapter: getQueue failed', error);
        return [];
      }
    },

    // Additional utility methods
    getVolume: () => {
      try {
        return audio.playerState?.volume ?? 1;
      } catch (error) {
        console.error('MusicAdapter: getVolume failed', error);
        return 1;
      }
    },

    setVolume: (volume) => {
      try {
        if (typeof audio.setVolume === 'function') {
          audio.setVolume(volume);
          return true;
        }
        return false;
      } catch (error) {
        console.error('MusicAdapter: setVolume failed', error);
        return false;
      }
    },

    // State validation
    isValid: () => {
      return !!(audio && typeof audio.play === 'function');
    }
  };
};






class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();







// export const createAdPlayerAdapter = (initial = {}) => {
//   let identity = initial.identity || { userType: "guest", userId: null };
//   let environment = initial.environment || { location: null };
//   let apolloClient = initial.apolloClient || null; 
//   let completeCb = null;
//   let errorCb = null;

//   let _playing = false;
//   let _currentAudio = null;
//   let _currentAd = null;
//   let _progressTimer = null;

//   const clearProgressTimer = () => {
//     if (_progressTimer) {
//       clearInterval(_progressTimer);
//       _progressTimer = null;
//     }
//   };

//   const stopAudio = () => {
//     try {
//       if (_currentAudio) {
//         _currentAudio.onplay = null;
//         _currentAudio.onended = null;
//         _currentAudio.onerror = null;
//         _currentAudio.pause();
//         _currentAudio.src = "";
//       }
//     } catch {}
//     _currentAudio = null;
//   };

//   return {
//     // optional, but now mostly redundant since we inject in AdAudioProvider
//     setApolloClient(client) {
//       apolloClient = client;
//       console.log("🔗 Adapter: Apollo Client set");
//     },

//     async playAd(adType, context) {
//       try {
//         if (!apolloClient) {
//           console.error("❌ Adapter: apolloClient is missing in playAd");
//           throw new Error("Apollo Client not initialized in ad adapter");
//         }

//         this.stopAd();
//         _playing = true;

//         const userLocation = {
//           country: context?.location?.country || environment?.location?.country || null,
//           state:   context?.location?.state   || environment?.location?.state   || null,
//           city:    context?.location?.city    || environment?.location?.city    || null,
//         };

//         console.log("🎯 Adapter: Fetching ads…", userLocation);

//         const { data } = await apolloClient.query({
//           query: GET_AUDIO_AD,
//           variables: { userLocation },
//           fetchPolicy: "network-only",
//           errorPolicy: "all",
//         });

//         console.log("📥 Adapter: raw ads response:", data);

//         const resp = data?.getAudioAd;
//         console.log("📥 Adapter: normalized ads response:", resp);

//         if (!resp?.success) {
//           throw new Error(resp?.error || "Failed to fetch ads");
//         }
//         if (!Array.isArray(resp?.ads) || resp.ads.length === 0) {
//           throw new Error("No ads available");
//         }

//         const ad = resp.ads[0];
//         _currentAd = ad;

//         const title = ad.adTitle || "Sponsored message";
//         const durationMs = Number.isFinite(ad.duration)
//           ? ad.duration
//           : ad.audioDurationMs ?? 0;

//         const audioUrl =
//           ad.streamingAudioAdUrl ||
//           ad.streamingFallBackAudioUrl ||
//           ad.masterAudionAdUrl ||
//           null;

//         if (!audioUrl) throw new Error("Ad has no playable audio source");

//         eventBus.emit("AD_METADATA_LOADED", {
//           id: ad.id,
//           title,
//           advertiser: ad.advertiser?.companyName,
//           artwork: ad.adArtWorkUrl,
//           duration: durationMs,
//           description: ad.description,
//           targeting: ad.targeting,
//         });

//         eventBus.emit("AD_STARTED", {
//           adId: ad.id,
//           duration: durationMs,
//           type: adType,
//         });

//         await this.playAudioAd(audioUrl, durationMs);

//         eventBus.emit("AD_COMPLETED", { adId: ad.id });
//         _playing = false;
//         completeCb?.();

//         return ad;
//       } catch (error) {
//         console.error("❌ Adapter error:", error);
//         eventBus.emit("AD_ERROR", { error: error?.message || String(error) });
//         _playing = false;
//         errorCb?.(error);
//         throw error;
//       }
//     },

//     async playAudioAd(audioUrl, declaredDurationMs) {
//       return new Promise((resolve, reject) => {
//         if (!audioUrl) {
//           reject(new Error("No audio URL provided"));
//           return;
//         }

//         stopAudio();
//         clearProgressTimer();

//         const audio = new Audio();
//         _currentAudio = audio;
//         audio.preload = "auto";
//         audio.src = audioUrl;

//         const startProgress = () => {
//           clearProgressTimer();
//           _progressTimer = setInterval(() => {
//             if (!_currentAudio) return;
//             const ct = _currentAudio.currentTime || 0;
//             const dur =
//               Number.isFinite(_currentAudio.duration) &&
//               _currentAudio.duration > 0
//                 ? _currentAudio.duration
//                 : declaredDurationMs
//                 ? declaredDurationMs / 1000
//                 : 0;

//             const payload = {
//               currentTime: ct * 1000,
//               duration: dur * 1000,
//               percent: dur > 0 ? (ct / dur) * 100 : 0,
//             };
//             eventBus.emit("AD_PROGRESS", payload);
//           }, 250);
//         };

//         audio.onplay = () => {
//           console.log("🔊 Adapter: Audio playback started");
//           startProgress();
//         };

//         audio.onended = () => {
//           console.log("✅ Adapter: Audio ended");
//           clearProgressTimer();
//           stopAudio();
//           resolve();
//         };

//         audio.onerror = (e) => {
//           console.error("🔊 Adapter: Audio error:", e);
//           clearProgressTimer();
//           const err = new Error("Audio playback failed");
//           stopAudio();
//           reject(err);
//         };

//         audio.play().catch((err) => {
//           reject(err);
//         });
//       });
//     },

//     stopAd() {
//       console.log("⏹️ Adapter: Stopping ad");
//       clearProgressTimer();
//       stopAudio();
//       if (_playing) {
//         eventBus.emit("AD_STOPPED", { adId: _currentAd?.id });
//       }
//       _playing = false;
//       _currentAd = null;
//     },

//     onComplete(cb) {
//       completeCb = cb;
//     },
//     onError(cb) {
//       errorCb = cb;
//     },

//     updateIdentity(next) {
//       identity = { ...identity, ...next };
//     },

//     updateEnvironment(next) {
//       environment = { ...environment, ...next };
//     },

//     getCurrentAd() {
//       return _currentAd;
//     },
//     isPlaying() {
//       return _playing;
//     },
//   };
// };





const REGION = "us-west-2";

// 🔑 SINGLETON HOLDER
let _adAdapterSingleton = null;

export const createAdPlayerAdapter = (initial = {}) => {
  // If we already have an instance, reuse it and optionally update the client

  console.log('adapter is being called ...')
  if (_adAdapterSingleton) {
    if (initial.apolloClient) {
      _adAdapterSingleton.setApolloClient(initial.apolloClient);
    }
    return _adAdapterSingleton;
  }

  let identity = initial.identity || { userType: "guest", userId: null };
  let environment = initial.environment || { location: null };
  let apolloClient = initial.apolloClient || null;

  let completeCb = null;
  let errorCb = null;

  let _playing = false;
  let _currentAudio = null;
  let _currentAd = null;
  let _progressTimer = null;

  const clearProgressTimer = () => {
    if (_progressTimer) {
      clearInterval(_progressTimer);
      _progressTimer = null;
    }
  };

  const stopAudio = () => {
    try {
      if (_currentAudio) {
        _currentAudio.onplay = null;
        _currentAudio.onended = null;
        _currentAudio.onerror = null;
        _currentAudio.pause();
        _currentAudio.src = "";
      }
    } catch (e) {
      console.warn("🔊 Adapter: stopAudio error", e);
    }
    _currentAudio = null;
  };

  const getClient = () => {
    if (apolloClient) return apolloClient;
    console.error("[AD] ❌ getClient(): apolloClient is NULL in adapter");
    throw new Error("Apollo Client not initialized in ad adapter");
  };

  console.log("🎧 Adapter: createAdPlayerAdapter() created", {
    hasClient: !!apolloClient,
    identity,
    environment,
  });

  const adapter = {
    // ---------- wiring ----------
    setApolloClient(client) {
      apolloClient = client || null;
      console.log(
        "🔗 Adapter: Apollo Client set. hasClient =",
        !!apolloClient
      );
    },

    updateIdentity(next) {
      identity = { ...identity, ...next };
      console.log("👤 Adapter: identity updated", identity);
    },

    updateEnvironment(next) {
      environment = { ...environment, ...next };
      console.log("🌍 Adapter: environment updated", environment);
    },

    onComplete(cb) {
      completeCb = cb;
    },

    onError(cb) {
      errorCb = cb;
    },


    // ---------- main ad entry ----------
    async playAd(adType, context) {
      console.log("📡 Adapter: playAd() called", {
        adType,
        hasClient: !!apolloClient,
        ctxLocation: context?.location,
        envLocation: environment?.location,
        clientReadyState: apolloClient ? 'READY' : 'MISSING'
      });

      try {
        const client = getClient(); // 🔑 will throw if null

        console.log("✅ Adapter: Apollo Client acquired", { 
      clientId: client?.clientId,
      version: client?.version 
    });



        // hard stop any prior ad
        this.stopAd();
        _playing = true;

        // 1) Location to query
        const userLocation = {
          country:
            context?.location?.country || environment?.location?.country || null,
          state:
            context?.location?.state || environment?.location?.state || null,
          city: context?.location?.city || environment?.location?.city || null,
        };

        console.log("🎯 Adapter: Making GET_AUDIO_AD query...", { userLocation });

        // 2) Fetch ads
        const { data } = await client.query({
          query: GET_AUDIO_AD,
          variables: { userLocation },
          fetchPolicy: "network-only",
          errorPolicy: "all",
        });

    console.log("📥 Adapter: GET_AUDIO_AD response received", { 
      hasData: !!data,
      success: data?.getAudioAd?.success,
      adCount: data?.getAudioAd?.ads?.length 
    });

        const resp = data?.getAudioAd;
        console.log("📥 Adapter: normalized ads response:", resp);

        if (!resp?.success) {
          throw new Error(resp?.error || "Failed to fetch ads");
        }
        if (!Array.isArray(resp?.ads) || resp.ads.length === 0) {
          throw new Error("No ads available");
        }

        // 3) Pick first ad
        const ad = resp.ads[0];
        _currentAd = ad;

        const title = ad.adTitle || "Sponsored message";
        const durationMs = Number.isFinite(ad.duration)
          ? ad.duration
          : ad.audioDurationMs ?? 0;

        // 4) Decide which AUDIO asset to play
        const support = getAudioSupport();
        const picked = previewPointer(ad, support); // { pointer, defaultBucket } | null

        if (!picked?.pointer) {
          throw new Error("No asset available to play for this ad");
        }

        const { bucket, key } = toBucketKey(
          picked.pointer,
          picked.defaultBucket
        );

        if (!bucket || !key) {
          throw new Error("Invalid asset pointer for ad audio");
        }

        // 5) Presign AUDIO via GraphQL mutation
        const audioPresignResult = await client.mutate({
          mutation: GET_PRESIGNED_URL_DOWNLOAD,
          variables: {
            bucket,
            key,
            region: REGION,
          },
        });

        const signedAudioUrl =
          audioPresignResult?.data?.getPresignedUrlDownload?.urlToDownload ||
          null;

        if (!signedAudioUrl) {
          throw new Error("Could not get presigned URL for ad audio");
        }

        console.log("🔑 Adapter: got presigned ad AUDIO URL:", signedAudioUrl);

        // 6) Presign ARTWORK (if any)
        let artworkSignedUrl = null;
        try {
          const coverLoc = resolveAdCoverLocation(ad); // { bucket, key, region } | null
          if (coverLoc && coverLoc.bucket && coverLoc.key) {
            const artworkPresignResult = await client.mutate({
              mutation: GET_PRESIGNED_URL_DOWNLOAD,
              variables: {
                bucket: coverLoc.bucket,
                key: coverLoc.key,
                region: coverLoc.region || REGION,
              },
            });

            artworkSignedUrl =
              artworkPresignResult?.data?.getPresignedUrlDownload
                ?.urlToDownload || null;

            console.log(
              "🖼 Adapter: got presigned ARTWORK URL:",
              artworkSignedUrl
            );
          } else {
            console.log("🖼 Adapter: no cover artwork to presign for this ad");
          }
        } catch (artErr) {
          console.warn("🖼 Adapter: failed to presign artwork:", artErr);
          // non-fatal → we just show no image
        }

        // 7) Emit metadata → UI can show title/artwork/etc
        eventBus.emit("AD_METADATA_LOADED", {
          id: ad.id,
          title,
          advertiser: ad.advertiser?.companyName,
          artwork: artworkSignedUrl || null,
          duration: durationMs,
          description: ad.description,
          targeting: ad.targeting,
        });

        // 8) Emit start
        eventBus.emit("AD_STARTED", {
          adId: ad.id,
          duration: durationMs,
          type: adType,
        });

        // 9) actually play the audio (using presigned URL)
        await this.playAudioAd(signedAudioUrl, durationMs);

        // 10) Emit completion + PM callback
        eventBus.emit("AD_COMPLETED", { adId: ad.id });
        _playing = false;
        completeCb?.();

        return ad;
      } catch (error) {
        console.error("❌ Adapter error:", error);
        eventBus.emit("AD_ERROR", { error: error?.message || String(error) });
        _playing = false;
        errorCb?.(error);
        throw error;
      }
    },

    

    async playAudioAd(audioUrl, declaredDurationMs) {
      return new Promise((resolve, reject) => {
        if (!audioUrl) {
          reject(new Error("No audio URL provided"));
          return;
        }

        // Fresh audio element per ad
        stopAudio();
        clearProgressTimer();

        const audio = new Audio();
        _currentAudio = audio;
        audio.preload = "auto";
        audio.src = audioUrl;

        const startProgress = () => {
          clearProgressTimer();
          _progressTimer = setInterval(() => {
            if (!_currentAudio) return;
            const ct = _currentAudio.currentTime || 0;
            const dur =
              Number.isFinite(_currentAudio.duration) &&
              _currentAudio.duration > 0
                ? _currentAudio.duration
                : declaredDurationMs
                ? declaredDurationMs / 1000
                : 0;

            const payload = {
              currentTime: ct * 1000,
              duration: dur * 1000,
              percent: dur > 0 ? (ct / dur) * 100 : 0,
            };
            eventBus.emit("AD_PROGRESS", payload);
          }, 250);
        };

        audio.onplay = () => {
          console.log("🔊 Adapter: Audio playback started");
          startProgress();
        };

        audio.onended = () => {
          console.log("✅ Adapter: Audio ended");
          clearProgressTimer();
          stopAudio();
          resolve();
        };

        audio.onerror = (e) => {
          console.error("🔊 Adapter: Audio error:", e);
          clearProgressTimer();
          const err = new Error("Audio playback failed");
          stopAudio();
          reject(err);
        };

        audio.play().catch((err) => {
          const msg = String(err?.message || err);
          if (
            err?.name === "AbortError" ||
            msg.includes(
              "The play() request was interrupted by a call to pause()."
            )
          ) {
            console.warn(
              "⚠️ Adapter: play() was aborted (likely due to pause/cleanup). Treating as completed."
            );
            clearProgressTimer();
            stopAudio();
            resolve();
            return;
          }

          console.error("🔊 Adapter: play() failed:", err);
          clearProgressTimer();
          stopAudio();
          reject(err);
        });
      });
    },
    

    stopAd() {
      console.log("⏹️ Adapter: Stopping ad");
      clearProgressTimer();
      stopAudio();
      if (_playing) {
        eventBus.emit("AD_STOPPED", { adId: _currentAd?.id });
      }
      _playing = false;
      _currentAd = null;
    },

    getCurrentAd() {
      return _currentAd;
    },

    isPlaying() {
      return _playing;
    },

    // tiny helper so you can debug from console if needed
    __debug() {
      console.log("[AD adapter debug]", {
        hasClient: !!apolloClient,
        identity,
        environment,
        playing: _playing,
        currentAd: _currentAd?.id,
      });
    },
  };

  // 🔐 store singleton
  _adAdapterSingleton = adapter;
  return adapter;
};





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