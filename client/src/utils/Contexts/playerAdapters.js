

import { GET_AUDIO_AD } from "../queries";
import { previewPointer, BUCKETS } from "../previewSupport";
import { toBucketKey } from "../bucketKeySupport";
import { getAudioSupport } from "../audioSupport";
import { GET_PRESIGNED_URL_DOWNLOAD, AD_DECISION_ENGINE, AD_BUMPER, TRACK_AD_EVENT } from "../mutations";
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
  let _declaredDurationMs = null;

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

  const currentProgressPayload = () => {
    if (!_currentAudio) return { currentTime: 0, duration: 0, percent: 0 };
    const ct = _currentAudio.currentTime || 0;
    const dur =
      Number.isFinite(_currentAudio.duration) && _currentAudio.duration > 0
        ? _currentAudio.duration
        : _declaredDurationMs
        ? _declaredDurationMs / 1000
        : 0;
    const percent = dur > 0 ? Math.min(100, Math.max(0, (ct / dur) * 100)) : 0;
    return {
      currentTime: ct * 1000,
      duration: dur * 1000,
      percent
    };
  };

  const startProgressTimer = () => {
    clearProgressTimer();
    _progressTimer = setInterval(() => {
      const payload = currentProgressPayload();
      eventBus.emit("AD_PROGRESS", payload);
    }, 100);
  };

  const pauseCurrentAd = () => {
    if (!_currentAudio) return;
    try {
      _currentAudio.pause();
      clearProgressTimer();
      _playing = false;
      eventBus.emit("AD_PAUSED", {
        adId: _currentAd?.id,
        adIndex: _currentAd?.effectiveIndex ?? null,
        progress: currentProgressPayload(),
      });
    } catch (err) {
      console.warn("[AD] pauseCurrentAd failed", err);
    }
  };

  const resumeCurrentAd = async () => {
    if (!_currentAudio || !_currentAudio.paused) return;
    try {
      await _currentAudio.play();
      _playing = true;
      startProgressTimer();
      eventBus.emit("AD_RESUMED", {
        adId: _currentAd?.id,
        adIndex: _currentAd?.effectiveIndex ?? null,
        progress: currentProgressPayload(),
      });
    } catch (err) {
      console.warn("[AD] resumeCurrentAd failed", err);
    }
  };

  const presignPointer = async (pointer, defaultBucket = BUCKETS.STREAMING) => {
    if (!pointer) return null;

    const client = getClient();
    const { bucket, key, passthrough } = toBucketKey(pointer, defaultBucket);

    if (passthrough) return passthrough;

    if (!bucket || !key) {
      throw new Error("Invalid asset pointer for ad audio");
    }

    const { data } = await client.mutate({
      mutation: GET_PRESIGNED_URL_DOWNLOAD,
      variables: { bucket, key, region: REGION },
    });

    return data?.getPresignedUrlDownload?.url || null;
  };

  const presignArtwork = async (ad) => {
    const client = getClient();
    const coverLoc = resolveAdCoverLocation(ad);
    if (!coverLoc?.bucket || !coverLoc?.key) return null;

    const { data } = await client.mutate({
      mutation: GET_PRESIGNED_URL_DOWNLOAD,
      variables: {
        bucket: coverLoc.bucket,
        key: coverLoc.key,
        region: coverLoc.region || REGION,
      },
    });

    return data?.getPresignedUrlDownload?.url || null;
  };

  const markAdServed = async (userId) => {
    if (!userId) return;
    try {
      const client = getClient();
      await client.mutate({
        mutation: AD_BUMPER,
        variables: { userId },
      });
    } catch (err) {
      console.warn("[AD] Failed to mark ad served (non-fatal)", err);
    }
  };

  const trackAdEventMetric = async (ad, event, { completed = false, clicked = false } = {}) => {
    if (!ad?.campaignId || !identity?.userId) return;
    try {
      const client = getClient();
      await client.mutate({
        mutation: TRACK_AD_EVENT,
        variables: {
          input: {
            userId: identity.userId,
            campaignId: ad.campaignId,
            adId: ad.id,
            event,
            completed,
            clicked,
          },
        },
      });
    } catch (err) {
      console.warn("[AD] trackAdEvent failed (non-fatal)", err);
    }
  };

  const getCappedAdIndex = (requestedIndex, availableAds, context) => {
    const availableCount = availableAds.length;
    if (availableCount === 0) return 0;

    let effectiveIndex = requestedIndex % availableCount;
    let selectedAd = availableAds[effectiveIndex];

    console.log(`🔍 CAPPING CHECK:`, {
      requestedIndex,
      effectiveIndex,
      availableAds: availableAds.map((ad) => ({ id: ad.id, title: ad.adTitle })),
      selectedAd: { id: selectedAd.id, title: selectedAd.adTitle },
    });

    if (context?.shouldCapAd && context.shouldCapAd(selectedAd.id)) {
      console.log(
        `🛑 AD CAPPED: "${selectedAd.adTitle}" is being skipped due to capping rules`
      );

      for (let i = 0; i < availableCount; i++) {
        const alternativeIndex = (requestedIndex + i + 1) % availableCount;
        const alternativeAd = availableAds[alternativeIndex];

        const isCapped = context.shouldCapAd(alternativeAd.id);
        console.log(
          `🔍 Checking alternative ${i}: "${alternativeAd.adTitle}" - capped: ${isCapped}`
        );

        if (!isCapped) {
          console.log(
            `✅ USING ALTERNATIVE: "${alternativeAd.adTitle}" instead of capped ad`
          );
          return alternativeIndex;
        }
      }

      console.log(
        `⚠️ ALL ADS CAPPED: No alternatives available, using originally scheduled ad`
      );
    } else {
      console.log(`✅ AD APPROVED: "${selectedAd.adTitle}" is not capped`);
    }

    return effectiveIndex;
  };

  const fetchDecisionEngineAd = async (adIndex, context, userLocation) => {
    // Decision engine requires a userId; fall back for guests
    if (!identity?.userId) {
      console.log("[AD] Decision engine skipped: no userId in identity (guest)");
      return null;
    }

    const client = getClient();
    const device =
      typeof navigator !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop";

    const availableSeconds = Math.max(
      5,
      Math.round(
        (context?.availableAdTimeMs ??
          context?.duration ??
          context?.remainingMs ??
          30000) / 1000
      )
    );

    const { data } = await client.mutate({
      mutation: AD_DECISION_ENGINE,
      variables: {
        player: {
          userId: identity.userId,
          userTier: identity.userType || "guest",
          device,
          availableAdTime: availableSeconds,
          wantType: "audio",
          locationCountry: userLocation.country,
          locationState: userLocation.state,
          locationCity: userLocation.city,
        },
      },
      fetchPolicy: "no-cache",
    });

    const resp = data?.adDecisionEngine;
    if (!resp || resp.decision !== "play_ad" || !resp.ad?.variants?.length) {
      return null;
    }

    const variant = resp.ad.variants[0];
    const signedAudioUrl = await presignPointer(
      variant.pointer,
      BUCKETS.STREAMING
    );

    if (!signedAudioUrl) {
      throw new Error("Could not presign decision-engine ad audio");
    }

    let artworkSignedUrl = null;
    if (resp.metadata?.artworkPointer) {
      try {
        artworkSignedUrl = await presignPointer(
          resp.metadata.artworkPointer,
          BUCKETS.ARTWORK
        );
      } catch (err) {
        console.warn(
          "🖼 Adapter: failed to presign decision-engine artwork",
          err
        );
      }
    }

    const durationMs = (resp.ad.duration || 0) * 1000;

    return {
      ad: {
        id: resp.ad.id,
        adTitle: resp.metadata?.adTitle || "Sponsored message",
        adType: resp.ad.type || "audio",
        campaignId: resp.metadata?.campaignId || null,
        description: resp.metadata?.description || null,
        duration: durationMs,
        adArtWorkUrl: resp.metadata?.artworkPointer || null,
        targeting: resp.metadata?.targeting || null,
        advertiser: resp.metadata?.advertiser || null,
        source: resp.metadata?.source || "decision_engine",
      },
      signedAudioUrl,
      artworkSignedUrl,
      effectiveIndex: Number.isFinite(adIndex) ? adIndex : 0,
      durationMs,
    };
  };

  const fetchLegacyAd = async (adIndex, context, userLocation) => {
    console.warn("[AD] Legacy GET_AUDIO_AD fallback engaged – server pacing not enforced");
    const client = getClient();

    const { data } = await client.query({
      query: GET_AUDIO_AD,
      variables: { userLocation },
      fetchPolicy: "network-only",
      errorPolicy: "all",
    });

    console.log("📥 Adapter: GET_AUDIO_AD response received", {
      hasData: !!data,
      success: data?.getAudioAd?.success,
      adCount: data?.getAudioAd?.ads?.length,
    });

    const resp = data?.getAudioAd;

    if (!resp?.success) {
      throw new Error(resp?.error || "Failed to fetch ads");
    }
    if (!Array.isArray(resp?.ads) || resp.ads.length === 0) {
      throw new Error("No ads available");
    }

    const availableAds = resp.ads;
    const effectiveIndex = getCappedAdIndex(adIndex, availableAds, context);
    const ad = availableAds[effectiveIndex];

    if (!ad) {
      throw new Error(`Ad at index ${effectiveIndex} is undefined`);
    }

    if (!ad.adTitle && !ad.id) {
      throw new Error(
        `Ad at index ${effectiveIndex} is missing required properties`
      );
    }

    const support = getAudioSupport();
    const picked = previewPointer(ad, support);

    if (!picked?.pointer) {
      throw new Error("No asset available to play for this ad");
    }

    const signedAudioUrl = await presignPointer(
      picked.pointer,
      picked.defaultBucket
    );

    if (!signedAudioUrl) {
      throw new Error("Could not get presigned URL for ad audio");
    }

    const artworkSignedUrl = await presignArtwork(ad);
    const durationMs = Number.isFinite(ad.duration)
      ? ad.duration
      : ad.audioDurationMs ?? 0;

    return {
      ad: { ...ad, duration: durationMs },
      signedAudioUrl,
      artworkSignedUrl,
      effectiveIndex,
      durationMs,
    };
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
    
async playAd(adIndex, context) {
  console.log("📡 Adapter: playAd() called", {
    adIndex,
    hasClient: !!apolloClient,
    ctxLocation: context?.location,
    envLocation: environment?.location,
    clientReadyState: apolloClient ? "READY" : "MISSING",
  });

  try {
    if (typeof adIndex !== "number" || isNaN(adIndex)) {
      console.warn("⚠️ Adapter: Invalid adIndex, defaulting to 0", { adIndex });
      adIndex = 0;
    }

    // hard stop any prior ad
    this.stopAd();
    _playing = true;

    const userLocation = {
      country:
        context?.location?.country || environment?.location?.country || null,
      state: context?.location?.state || environment?.location?.state || null,
      city: context?.location?.city || environment?.location?.city || null,
    };

    let prepared = null;

    // Try decision engine first (best targeting + freq cap)
    try {
      prepared = await fetchDecisionEngineAd(adIndex, context, userLocation);
      if (prepared) {
        console.log("🎯 Using decision engine ad pick", {
          adId: prepared.ad?.id,
          campaignId: prepared.ad?.campaignId,
        });
      }
    } catch (engineError) {
      console.warn("⚠️ Decision engine failed, falling back", engineError);
    }

    // Fallback to legacy catalog query (guests only, or if engine said no)
    if (!prepared) {
      prepared = await fetchLegacyAd(adIndex, context, userLocation);
    }

    const {
      ad,
      signedAudioUrl,
      artworkSignedUrl = null,
      effectiveIndex = adIndex,
      durationMs,
    } = prepared || {};

    if (!ad || !signedAudioUrl) {
      throw new Error("No ad available to play");
    }

    _currentAd = { ...ad, effectiveIndex };

    if (context?.recordAdPlay) {
      context.recordAdPlay(ad.id, ad.adTitle, effectiveIndex);
    }

    // Prevent overlap: pause main content if caller provided a hook (PlayerManager can inject one)
    if (context?.pauseContent) {
      try {
        await context.pauseContent();
        console.log("[AD] Main content paused for ad playback");
      } catch (err) {
        console.warn("[AD] Failed to pause main content before ad", err);
      }
    }

    const title = ad.adTitle || "Sponsored message";

    eventBus.emit("AD_METADATA_LOADED", {
      id: ad.id,
      title,
      advertiser: ad.advertiser?.companyName,
      artwork: artworkSignedUrl || null,
      duration: durationMs,
      description: ad.description,
      targeting: ad.targeting,
      adIndex: effectiveIndex,
    });

    eventBus.emit("AD_STARTED", {
      adId: ad.id,
      duration: durationMs,
      type: "audio",
      adIndex: effectiveIndex,
    });

    trackAdEventMetric(ad, "impression");
    markAdServed(identity?.userId);

    await this.playAudioAd(signedAudioUrl, durationMs, effectiveIndex, ad.id);

    trackAdEventMetric(ad, "complete", { completed: true });

    if (context?.resumeContent) {
      try {
        await context.resumeContent();
        console.log("[AD] Main content resume requested after ad");
      } catch (err) {
        console.warn("[AD] Failed to resume main content after ad", err);
      }
    }

    _playing = false;
    completeCb?.();

    return ad;
  } catch (error) {
    console.error("❌ Adapter error:", error);
    eventBus.emit("AD_ERROR", {
      error: error?.message || String(error),
      adIndex: adIndex,
    });
    _playing = false;
    errorCb?.(error);
    throw error;
  }
},
    
// In your adapter's _getCappedAdIndex method:

_getCappedAdIndex(requestedIndex, availableAds, context) {
  return getCappedAdIndex(requestedIndex, availableAds, context);
},




    // async playAudioAd(audioUrl, declaredDurationMs) {
    //   return new Promise((resolve, reject) => {
    //     if (!audioUrl) {
    //       reject(new Error("No audio URL provided"));
    //       return;
    //     }

    //     // Fresh audio element per ad
    //     stopAudio();
    //     clearProgressTimer();

    //     const audio = new Audio();
    //     _currentAudio = audio;
    //     audio.preload = "auto";
    //     audio.src = audioUrl;

    //     const startProgress = () => {
    //       clearProgressTimer();
    //       _progressTimer = setInterval(() => {
    //         if (!_currentAudio) return;
    //         const ct = _currentAudio.currentTime || 0;
    //         const dur =
    //           Number.isFinite(_currentAudio.duration) &&
    //           _currentAudio.duration > 0
    //             ? _currentAudio.duration
    //             : declaredDurationMs
    //             ? declaredDurationMs / 1000
    //             : 0;

    //         const payload = {
    //           currentTime: ct * 1000,
    //           duration: dur * 1000,
    //           percent: dur > 0 ? (ct / dur) * 100 : 0,
    //         };
    //         eventBus.emit("AD_PROGRESS", payload);
    //       }, 250);
    //     };

    //     audio.onplay = () => {
    //       console.log("🔊 Adapter: Audio playback started");
    //       startProgress();
    //     };

    //     audio.onended = () => {
    //       console.log("✅ Adapter: Audio ended");
    //       clearProgressTimer();
    //       stopAudio();
    //       resolve();
    //     };

    //     audio.onerror = (e) => {
    //       console.error("🔊 Adapter: Audio error:", e);
    //       clearProgressTimer();
    //       const err = new Error("Audio playback failed");
    //       stopAudio();
    //       reject(err);
    //     };

    //     audio.play().catch((err) => {
    //       const msg = String(err?.message || err);
    //       if (
    //         err?.name === "AbortError" ||
    //         msg.includes(
    //           "The play() request was interrupted by a call to pause()."
    //         )
    //       ) {
    //         console.warn(
    //           "⚠️ Adapter: play() was aborted (likely due to pause/cleanup). Treating as completed."
    //         );
    //         clearProgressTimer();
    //         stopAudio();
    //         resolve();
    //         return;
    //       }

    //       console.error("🔊 Adapter: play() failed:", err);
    //       clearProgressTimer();
    //       stopAudio();
    //       reject(err);
    //     });
    //   });
    // },
    


async playAudioAd(audioUrl, declaredDurationMs, effectiveIndex, adId) {
  return new Promise((resolve, reject) => {
    if (!audioUrl) {
      reject(new Error("No audio URL provided"));
      return;
    }

    // 🔥 ENHANCED: Ensure main audio is properly paused first
    this._ensureMainAudioPaused();

    // Fresh audio element per ad
    stopAudio();
    clearProgressTimer();
    _declaredDurationMs = declaredDurationMs || null;

    const audio = new Audio();
    _currentAudio = audio;
    audio.preload = "auto";
    audio.src = audioUrl;

    audio.onplay = () => {
      console.log("🔊 Adapter: Audio playback started");
      startProgressTimer();
    };

 
audio.onended = () => {
  console.log("✅ Adapter: Audio ended - cleaning up before completion");
  clearProgressTimer();
  stopAudio();
  
  // 🔥 Ensure cleanup is complete before emitting completion
  setTimeout(() => {
    console.log("✅ Adapter: Emitting AD_COMPLETED after cleanup");
    eventBus.emit("AD_COMPLETED", { 
      adId: adId,
      adIndex: effectiveIndex
    });
    resolve();
  }, 200);
};

    audio.onerror = (e) => {
      console.error("🔊 Adapter: Audio error:", e);
      clearProgressTimer();
      const err = new Error("Audio playback failed");
      stopAudio();
      reject(err);
    };

    // 🔥 IMPROVED: Better error handling for play() interruptions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        const msg = String(err?.message || err);
        if (
          err?.name === "AbortError" ||
          msg.includes("The play() request was interrupted by a call to pause().")
        ) {
          console.warn(
            "⚠️ Adapter: play() was aborted (likely due to pause/cleanup). Treating as completed."
          );
          clearProgressTimer();
          stopAudio();
          resolve(); // Resolve instead of reject
          return;
        }

        console.error("🔊 Adapter: play() failed:", err);
        clearProgressTimer();
        stopAudio();
        reject(err);
      });
    }
  });
},

// 🔥 ADD: Method to ensure main audio is properly paused
_ensureMainAudioPaused() {
  // This method should coordinate with your main audio player
  // to ensure it's properly paused before ad plays
  console.log("[AD] Ensuring main audio is paused before ad playback");
  eventBus.emit("AD_PAUSE_REQUESTED", { timestamp: Date.now() });
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
      _declaredDurationMs = null;
    },

    pauseAd() {
      pauseCurrentAd();
    },

    resumeAd() {
      resumeCurrentAd();
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
  eventBus.on("AD_UI_PAUSE", pauseCurrentAd);
  eventBus.on("AD_UI_PLAY", resumeCurrentAd);
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
