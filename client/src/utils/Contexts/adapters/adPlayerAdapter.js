import { GET_AUDIO_AD } from "../../queries";
import { previewPointer, BUCKETS } from "../../previewSupport";
import { toBucketKey } from "../../bucketKeySupport";
import { getAudioSupport } from "../../audioSupport";
import { GET_PRESIGNED_URL_DOWNLOAD, AD_DECISION_ENGINE, AD_BUMPER, TRACK_AD_EVENT } from "../../mutations";
import { resolveAdCoverLocation } from "../../adArtworkPointer";
import { eventBus } from "./eventBus.js";

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




