



import { createAdScheduleController } from "./adPlayer/createAdScheduleController";

export class PlayerManager {
  /**
   * @param {Object} contentPlayer - adapter from AudioPlayerProvider (play, pause, isPlaying, getCurrentTime, seek)
   * @param {Object|Function} adPlayerOrFactory - ad adapter instance OR factory ({ identity, environment }) => adAdapter
   * @param {Object} [opts]
   * @param {Object} [opts.policy] - enable/disable ad slots
   * @param {boolean} [opts.policy.preroll=false]
   * @param {boolean} [opts.policy.midroll=true]
   * @param {boolean} [opts.policy.postroll=false]
   * @param {number}  [opts.midrollDelayMs=30000] // kept for backwards compat, not used for track-end rule
   * @param {boolean} [opts.autoResume=true] - whether to auto-resume content after ads
   * @param {Object}  [opts.adSchedule] - config for createAdScheduleController
   */
  constructor(contentPlayer, adPlayerOrFactory, opts = {}) {
    // Validate required parameters
    if (!contentPlayer) {
      throw new Error("PlayerManager: contentPlayer is required");
    }

    if (!adPlayerOrFactory) {
      throw new Error("PlayerManager: adPlayerOrFactory is required");
    }

    this.content = contentPlayer;

    // Debug flag
    this._debugMode = false;

    // Identity + environment (populated by Orchestrator)
    this.identity = { userType: "guest", userId: null };
    this.environment = { location: null };

 this.adSequenceCounter = 0;

   // 🔥 ADD capping state
    this.playedAdsHistory = []; // Track which ads were played and when
    
    // Ad capping rules
    this.adCappingRules = {
      sameAdMinInterval: 10 * 60 * 1000, // 10 minutes between same ad
      maxSameAdPerSession: 2,
    };
 

    // Ad player initialization with error handling
    try {
      this.ads =
        typeof adPlayerOrFactory === "function"
          ? adPlayerOrFactory({
              identity: this.identity,
              environment: this.environment,
            })
          : adPlayerOrFactory;

      if (!this.ads || typeof this.ads.playAd !== "function") {
        console.warn(
          "[PM] Ad adapter missing playAd method. Ads will be disabled.",
          this.ads
        );
        this.ads = null;
      } else {
      }
    } catch (error) {
      console.error("[PM] Failed to initialize ad adapter:", error);
      this.ads = null;
    }

    // Who currently "owns" playback: 'content' | 'ad' | 'idle'
    this.owner = "idle";
    this._isDestroyed = false;

    // Policy & timing with validation
    this.policy = {
      preroll: Boolean(opts.policy?.preroll ?? false),
      midroll: Boolean(opts.policy?.midroll ?? true),
      postroll: Boolean(opts.policy?.postroll ?? false),
    };

    // Not used for midroll scheduling now, but kept for compat
    this.midrollDelayMs = Math.max(
      0,
      Number.isFinite(opts.midrollDelayMs) ? opts.midrollDelayMs : 30000
    );
    this.autoResume = Boolean(opts.autoResume ?? true);


    // Robust state management
    this.state = {
      isInterrupted: false,
      interruptedPosition: 0,
      pendingAd: null,
      adQueue: [],
      isAdBlocked: false,
      currentTrack: null,

      userBehavior: {
        sessionStartTime: Date.now(),
        totalPlayTime: 0,
        songsPlayed: 0,
        currentGenre: null,
        userLocation: null,
        skipCount: 0,
        lastAdPlayedAt: 0,
        consecutiveAdErrors: 0,
        playHistory: [], // { timestamp, genre, duration, trackId, title, adPlayed?, adType? }
      },

      adRules: {
        minInterval: 5 * 60 * 1000,
        maxAdsPerHour: 4,
        maxConsecutiveErrors: 3,
        genreSpecificAds: true,
        locationBasedAds: true,
        timeBasedRules: {
          peakHours: { start: 18, end: 22, multiplier: 1.5 },
          offPeak: { start: 0, end: 6, multiplier: 0.5 },
        },
      },
    };

    // Event system
    this.events = {
      onAdStart: new Set(),
      onAdComplete: new Set(),
      onAdError: new Set(),
      onContentInterrupted: new Set(),
      onContentResumed: new Set(),
      onAdDecision: new Set(),
      onAdBlocked: new Set(),
      onDestroy: new Set(),
    };

    // TEST MODE with safety limits
    this._testForceAdChance = false;
    this._testSkipTimeRule = false;
    this._testEveryNSongs = 3;
    this._isTestMode = false;

    // Timing controls
    this._trackStartAt = 0;
    this._midrollTimeout = null; // kept for destroy(), not used to trigger ads now
    this._playTimeInterval = null;
    this._adPlaybackPromise = null;

    // Track-end cadence counter
    this._songsSinceLastBreak = 0;

    // Bind methods safely
    this._handleAdComplete = this._safeBoundMethod(
      this._handleAdComplete.bind(this)
    );
    this._handleAdError = this._safeBoundMethod(
      this._handleAdError.bind(this)
    );

    // Deterministic ad schedule controller
    this.adSchedule = createAdScheduleController({
      ...(opts.adSchedule || {}),
    });

    // Initialize
    this._startSessionTimer();

  }

  // ---------- PRIVATE UTILITIES ----------

  _debug(msg, payload) {
    if (!this._debugMode) return;
    if (payload !== undefined) {
    } else {
    }
  }

// added to track the played ads
// -----------------------------


    getNextAdIndex() {
    const nextIndex = this.adSequenceCounter;
    this.adSequenceCounter++;
    return nextIndex;
  }




  _safeBoundMethod(method) {
    return (...args) => {
      if (this._isDestroyed) {
        console.warn("[PM] Method called after destroy");
        return;
      }
      return method(...args);
    };
  }

  _clearMidrollTimer() {
    if (this._midrollTimeout) {
      clearTimeout(this._midrollTimeout);
      this._midrollTimeout = null;
    }
  }

  _validateContentPlayer() {
    if (!this.content) {
      throw new Error("Content player not available");
    }
    return true;
  }

  _validateAdPlayer() {
    if (!this.ads) {
      throw new Error("Ad player not available");
    }
    return true;
  }

  // ---------- TEST / DEBUG MODE ----------

  enableTestMode({ everyNSongs = 3 } = {}) {
    this._testForceAdChance = true;
    this._testSkipTimeRule = true;
    this._testEveryNSongs = Math.max(1, everyNSongs);
    this._isTestMode = true;

    this.state.adRules.minInterval = 0;
    this.state.adRules.maxAdsPerHour = 999;

  }

  disableTestMode() {
    this._testForceAdChance = false;
    this._testSkipTimeRule = false;
    this._testEveryNSongs = 3;
    this._isTestMode = false;

    this.state.adRules.minInterval = 5 * 60 * 1000;
    this.state.adRules.maxAdsPerHour = 4;

  }

  enableDebugMode() {
    this._debugMode = true;
  }

  disableDebugMode() {
    this._debugMode = false;
  }

  // ---------- CONFIG UPDATES ----------

  setPolicy(next) {
    if (this._isDestroyed) return;
    this.policy = { ...this.policy, ...next };
  }

  setMidrollDelay(ms) {
    // kept for API compat, but not used for track-end midroll logic
    if (this._isDestroyed) return;
    if (Number.isFinite(ms) && ms >= 0) {
      this.midrollDelayMs = ms;
    }
  }

  setAdRules(partial) {
    if (this._isDestroyed) return;
    this.state.adRules = { ...this.state.adRules, ...partial };
  }

  // ---------- IDENTITY + ENVIRONMENT ----------

  setIdentity({ userType, userId = null } = {}) {
    if (this._isDestroyed || !userType) return;

    this.identity = { userType, userId };
    // Only regular users see ads; premium and guests are ad-blocked.
    this.state.isAdBlocked = userType !== "regular";

    try {
      this.ads?.updateIdentity?.(this.identity);
    } catch (error) {
      console.warn("[PM] Error updating ad identity:", error);
    }

  }

  setLocation(locationObj) {
    if (this._isDestroyed) return;

    this.environment.location = locationObj || null;
    this.state.userBehavior.userLocation = locationObj || null;

    try {
      this.ads?.updateEnvironment?.({ location: this.environment.location });
    } catch (error) {
      console.warn("[PM] Error updating ad environment:", error);
    }

  }

  setRuntimeContext({ identity, location } = {}) {
    if (this._isDestroyed) return;
    if (identity) this.setIdentity(identity);
    if (location) this.setLocation(location);
  }

  // ---------- EVENT SYSTEM ----------

  _emit(name, payload) {
    if (this._isDestroyed) return;

    const set = this.events[name];
    if (!set) {
      console.warn(`[PM] Unknown event '${name}'`);
      return;
    }

    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        console.error(
          `[PM] Error in event handler for '${name}':`,
          error
        );
      }
    });
  }

  on(event, callback) {
    if (this._isDestroyed || !this.events[event]) {
      console.warn(
        `[PM] Cannot subscribe to unknown event '${event}'`
      );
      return () => {};
    }

    this.events[event].add(callback);
    return () => this.events[event].delete(callback);
  }

  // ===== USER BEHAVIOR TRACKING =====

  _startSessionTimer() {
    this._playTimeInterval = setInterval(() => {
      if (this._isDestroyed) {
        clearInterval(this._playTimeInterval);
        return;
      }
      if (this.owner === "content" && this.content.isPlaying?.()) {
        this.state.userBehavior.totalPlayTime += 1000;
      }
    }, 1000);
  }

  updatePlaybackTick(sample) {
    if (this._isDestroyed) return;
    this._lastTick = sample;
  }

  // ===== TRACK START / END =====

  /**
   * Called when a track actually starts (from AudioProvider / queue logic)
   */





  
  onTrackStart(meta) {
    if (this._isDestroyed) return;

    if (this.owner !== "ad") {
      this.owner = "content";
    }

    this._debug("onTrackStart CALLED", {
      meta: {
        id: meta?.id,
        title: meta?.title,
        genre: meta?.genre,
      },
      currentSongsPlayed: this.state.userBehavior.songsPlayed,
      currentTrack: this.state.currentTrack,
      owner: this.owner,
    });

    this._trackStartAt = Date.now();
    this.state.currentTrack = meta;

    if (meta?.genre) {
      this.updateCurrentGenre(meta.genre);
    }

    const playRecord = {
      timestamp: Date.now(),
      genre: meta?.genre || this.state.userBehavior.currentGenre,
      duration: meta?.duration || 0,
      trackId: meta?.id,
      title: meta?.title,
    };

    this.state.userBehavior.playHistory.push(playRecord);
    this.state.userBehavior.songsPlayed += 1;

    this._debug("after onTrackStart", {
      songsPlayed: this.state.userBehavior.songsPlayed,
      currentTrack: this.state.currentTrack,
      playHistoryLength: this.state.userBehavior.playHistory.length,
      owner: this.owner,
    });

    if (this.adSchedule) {
      this._debug("Notifying adSchedule.onSongStarted");
      this.adSchedule.onSongStarted();
      const scheduleState = this.adSchedule.getState();
      this._debug("adSchedule state after song", scheduleState);
    } else {
      this._debug("No adSchedule available");
    }

  }






  // Back-compat alias
  onTrackLoaded(meta) {
    return this.onTrackStart(meta);
  }









async onTrackEnd(meta) {
  if (this._isDestroyed) return;


  if (!this.policy.midroll) {
    return;
  }
  if (!this.ads) {
    return;
  }

  // 🔥 USE AD SCHEDULE CONTROLLER FOR DECISIONS
  if (this.adSchedule) {
    // Guests/premium: skip ad breaks entirely
    if (this.identity.userType !== "regular") {
      return;
    }

    // Notify that a song completed
    this.adSchedule.onSongStarted();
    
    // Get current metrics to see what's happening
    const metrics = this.adSchedule.getAdMetrics();
    
    // Check if we should start an ad break
    const breakDecision = this.adSchedule.shouldStartBreak();

    if (!breakDecision.shouldStart) {
      return;
    }

    // Check user-level blocks
    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      return;
    }

    if (this.state.userBehavior.consecutiveAdErrors >= this.state.adRules.maxConsecutiveErrors) {
      return;
    }


    // Start the ad break in the schedule
    this.adSchedule.onAdBreakStarted();
    
    const adType = this.selectOptimalAdType();

    try {
      await this.playAd(adType, this.getAdContext());
    } catch (error) {
      console.error("[PM] Midroll ad failed from onTrackEnd:", error);
    }
  } else {
    // 🔥 FALLBACK: Original logic if no ad schedule

    // Guests/premium: skip ad cadence
    if (this.identity.userType !== "regular" || this.state.isAdBlocked) {
      this._songsSinceLastBreak = 0;
      return;
    }
    
    const now = Date.now();
    const lastAdTime = this.state.userBehavior.lastAdPlayedAt || 0;
    const minAdInterval = 1 * 60 * 1000; // 1 minute between ads
    
    if (now - lastAdTime < minAdInterval) {
      this._songsSinceLastBreak = (this._songsSinceLastBreak || 0) + 1;
      return;
    }

    this._songsSinceLastBreak = (this._songsSinceLastBreak || 0) + 1;

    const cadenceThreshold = this._isTestMode ? this._testEveryNSongs || 3 : 3; // Fixed 3 songs

    if (this._songsSinceLastBreak < cadenceThreshold) {
      return;
    }

    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      this._songsSinceLastBreak = 0;
      return;
    }

    if (this.state.userBehavior.consecutiveAdErrors >= this.state.adRules.maxConsecutiveErrors) {
      this._songsSinceLastBreak = 0;
      return;
    }

    const adType = this.selectOptimalAdType();

    this._songsSinceLastBreak = 0;

    try {
      await this.playAd(adType, this.getAdContext());
    } catch (error) {
      console.error("[PM] Midroll ad failed from onTrackEnd:", error);
    }
  }
}


  onPlay() {
    if (this._isDestroyed) return;
    if (this.owner !== "ad") this.owner = "content";
    this._debug("onPlay", { owner: this.owner });
  }

  onPause() {
    if (this._isDestroyed) return;
    if (this.owner === "content") this.owner = "idle";
    this._debug("onPause", { owner: this.owner });
  }

  updateCurrentGenre(genre) {
    if (this._isDestroyed) return;
    this.state.userBehavior.currentGenre = genre || null;
  }

  recordSkip() {
    if (this._isDestroyed) return;
    this.state.userBehavior.skipCount++;
  }

  // ===== DECISION ENGINE (still used for preroll, analytics, etc.) =====

  shouldPlayAd(adType = "midroll") {
    if (this._isDestroyed) return false;


    if (this.identity.userType !== "regular" || this.state.isAdBlocked) {
      return false;
    }
    if (!this.ads) {
      return false;
    }
    if (
      this.state.userBehavior.consecutiveAdErrors >=
      this.state.adRules.maxConsecutiveErrors
    ) {
      return false;
    }

    const now = Date.now();
    const behavior = this.state.userBehavior;
    const rules = this.state.adRules; // ✅ declare once and reuse

    // Minimum interval
    if (now - behavior.lastAdPlayedAt < rules.minInterval) {
      return false;
    }

    // Hourly cap
    const adsThisHour = behavior.playHistory.filter(
      (p) => p.adPlayed && now - p.timestamp < 3600000
    ).length;
    if (adsThisHour >= rules.maxAdsPerHour) {
      return false;
    }

    // Time-of-day gate (skip in test mode)
    if (!this._testSkipTimeRule) {
      const currentHour = new Date().getHours();
      const timeMultiplier = this._getTimeBasedMultiplier(currentHour);
      const passTime = this._testForceAdChance
        ? true
        : Math.random() < 0.3 * timeMultiplier;
      if (!passTime) {
        return false;
      }
    }

    // Engagement
    const engagementScore = this._calculateEngagementScore();
    if (!this._testForceAdChance && engagementScore < 0.3) {
      return false;
    }

    // High-value opportunities
    if (rules.genreSpecificAds && this._hasGenreAdOpportunity()) {
      return true;
    }
    if (rules.locationBasedAds && this._hasLocationAdOpportunity()) {
      return true;
    }

    // Cadence fallback (mainly for preroll / others now)
    const every = this._testEveryNSongs || 3;
    const cadenceOK = behavior.songsPlayed % every === 0;
    return cadenceOK;
  }





  _getTimeBasedMultiplier(hour) {
    const { peakHours, offPeak } = this.state.adRules.timeBasedRules;
    if (hour >= peakHours.start && hour < peakHours.end)
      return peakHours.multiplier;
    if (hour >= offPeak.start && hour < offPeak.end)
      return offPeak.multiplier;
    return 1;
  }




  _calculateEngagementScore() {
    const b = this.state.userBehavior;
    const sessionDuration = Date.now() - b.sessionStartTime;
    if (sessionDuration < 30000) return 0;
    const skipRatio = b.skipCount / Math.max(b.songsPlayed, 1);
    const timePerSong = b.totalPlayTime / Math.max(b.songsPlayed, 1);
    const skipScore = 1 - Math.min(skipRatio, 1);
    const timeScore = Math.min(timePerSong / (3 * 60 * 1000), 1);
    const score = skipScore * 0.6 + timeScore * 0.4;
    this._debug("Engagement score", { score, skipRatio, timePerSong });
    return score;
  }




// TO BE CHECKED

  _hasGenreAdOpportunity() {
    const genre = (this.state.userBehavior.currentGenre || "").toLowerCase();
    if (!genre) return false;
    const premiumGenres = ["pop", "hiphop", "electronic", "rock", "jazz"];
    return premiumGenres.includes(genre);
  }

  _hasLocationAdOpportunity() {
    const loc = this.state.userBehavior.userLocation;
    if (!loc || !loc.country) return false;
    const premiumLocations = ["US", "CA", "UK", "AU", "DE", "FR"];
    return premiumLocations.includes(loc.country);
  }

  selectOptimalAdType() {
    const b = this.state.userBehavior;
    let adType = "midroll";
    if (b.songsPlayed === 1) adType = "preroll";
    else if (b.totalPlayTime > 30 * 60 * 1000) adType = "branded_content";
    else if (
      this._hasLocationAdOpportunity() &&
      this._hasGenreAdOpportunity()
    )
      adType = "premium_midroll";
    else if (this._calculateEngagementScore() > 0.8) adType = "interactive";

    return adType;
  }

  getAdContext() {
    return {
      identity: this.identity,
      environment: this.environment,
      location: this.state.userBehavior.userLocation,
      genre: this.state.userBehavior.currentGenre,
      engagement: this._calculateEngagementScore(),
      sessionDuration: Date.now() - this.state.userBehavior.sessionStartTime,
      songsPlayed: this.state.userBehavior.songsPlayed,
      totalPlayTime: this.state.userBehavior.totalPlayTime,
      timestamp: Date.now(),
      currentTrack: this.state.currentTrack,
    };
  }

  // ===== PLAYBACK ARBITRATION =====

  async playMusic(trackMeta = null) {
    if (this._isDestroyed) {
      throw new Error("PlayerManager has been destroyed");
    }


    if (this.owner === "ad") {
      return false;
    }

    try {
      this._validateContentPlayer();

      // Optional preroll
      if (trackMeta && this.policy.preroll && this.shouldPlayAd("preroll")) {
        const adType = this.selectOptimalAdType();
        await this._executeAdPlayback(adType, this.getAdContext());
      }

      await this.content.play?.();
      this.owner = "content";

      if (trackMeta) {
        this.onTrackStart(trackMeta);
      }

      return true;
    } catch (error) {
      console.error("[PM] ❌ Failed to play music:", error);
      this._emit("onAdError", { error });
      return false;
    }
  }

  async playAd(adType, context) {
    if (this._isDestroyed) {
      throw new Error("PlayerManager has been destroyed");
    }
    return this._executeAdPlayback(adType, context);
  }

  async skip() {
    if (this._isDestroyed) return false;
    this.recordSkip();
    if (this.owner === "ad") {
      return false;
    }
    return true;
  }

  // ===== AD PLAYBACK CORE =====

  async _executeAdPlayback(adType, context) {
    if (this._isDestroyed) {
      throw new Error("PlayerManager has been destroyed");
    }


    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      this._emit("onAdBlocked", { reason: "premium_user" });
      return;
    }

    if (!this._validateAdPlayer()) {
      console.error("[PM] _executeAdPlayback: NO ad player available");
      throw new Error("Ad player not available");
    }

    if (this._adPlaybackPromise) {
      return this._adPlaybackPromise;
    }

    const enhancedContext = {
      ...context,
      behavioralData: {
        engagementScore: this._calculateEngagementScore(),
        sessionMetrics: {
          duration: this.state.userBehavior.totalPlayTime,
          songs: this.state.userBehavior.songsPlayed,
          skips: this.state.userBehavior.skipCount,
        },
        optimalAdType: this.selectOptimalAdType(),
      },
    };

    // Always pause content when owner === 'content'
    let wasPlaying = false;
    if (this.owner === "content") {
      wasPlaying = true;
      this.state.isInterrupted = true;
      this.state.interruptedPosition =
        this.content.getCurrentTime?.() || 0;

      try {
        await this.content.pause?.();
      } catch (e) {
        console.warn("[PM] Error pausing content before ad:", e);
      }

      this._emit("onContentInterrupted", {
        position: this.state.interruptedPosition,
        reason: "ad_break",
        adType,
      });
    }

    this.owner = "ad";
    this.state.userBehavior.lastAdPlayedAt = Date.now();
    this.state.userBehavior.playHistory.push({
      timestamp: Date.now(),
      adPlayed: true,
      adType,
      context: enhancedContext,
    });


    this._emit("onAdDecision", {
      adType,
      context: enhancedContext,
      decisionFactors: {
        engagement: this._calculateEngagementScore(),
        location: this.state.userBehavior.userLocation,
        genre: this.state.userBehavior.currentGenre,
        sessionTime: this.state.userBehavior.totalPlayTime,
      },
    });

    this._adPlaybackPromise = this._performAdPlayback(
      adType,
      enhancedContext,
      wasPlaying
    ).finally(() => {
      this._adPlaybackPromise = null;
    });

    return this._adPlaybackPromise;
  }

  async _performAdPlayback(adType, context, wasPlaying) {
    try {
      this.ads?.onComplete?.(this._handleAdComplete);
      this.ads?.onError?.(this._handleAdError);

      this._emit("onAdStart", { adType, context });

      this.state.userBehavior.consecutiveAdErrors = 0;

    const enhancedContext = {
      ...context,
      // 🔥 Capping + control hooks passed to ad adapter
      shouldCapAd: (adId) => this.shouldCapAd(adId),
      recordAdPlay: (adId, adTitle, adIndex) => this.recordAdPlay(adId, adTitle, adIndex),
      pauseContent: async () => {
        try {
          await this.content.pause?.();
        } catch (err) {
          console.warn("[PM] pauseContent hook failed before ad", err);
        }
      },
      resumeContent: async () => {
        if (!this.autoResume || !wasPlaying) return;
        try {
          await this.content.play?.();
        } catch (err) {
          console.warn("[PM] resumeContent hook failed after ad", err);
        }
      },
      wasPlayingBeforeAd: wasPlaying,
    };



      const adIndex = this.getNextAdIndex();


      // await this.ads.playAd(adType, context);
       await this.ads.playAd(adIndex, enhancedContext);

      // _handleAdComplete is called by adapter when ad finishes
    } catch (error) {
      this._handleAdError(error, wasPlaying);
      throw error;
    }
  }

   // 🔥 ADD: Method to record ad plays for capping
  recordAdPlay(adId, adTitle, adIndex) {
    const playRecord = {
      adId,
      adTitle, 
      adIndex,
      timestamp: Date.now()
    };
    
    this.playedAdsHistory.push(playRecord);
    
    // Clean up old history (keep last 20 entries)
    if (this.playedAdsHistory.length > 20) {
      this.playedAdsHistory = this.playedAdsHistory.slice(-20);
    }
    
  }


  // 🔥 ADD: Method to check if ad should be capped
  shouldCapAd(adId) {
    const now = Date.now();
    const recentPlays = this.playedAdsHistory.filter(
      entry => entry.adId === adId && 
      (now - entry.timestamp) < this.adCappingRules.sameAdMinInterval
    );
    
    const sessionPlays = this.playedAdsHistory.filter(
      entry => entry.adId === adId
    ).length;
    
    const shouldCap = recentPlays.length > 0 || 
                     sessionPlays >= this.adCappingRules.maxSameAdPerSession;
    
    if (shouldCap) {
    }
    
    return shouldCap;
  }

  // 🔥 ADD: Get capping info for logging
  getAdCappingInfo() {
    return {
      totalPlayed: this.playedAdsHistory.length,
      uniqueAds: [...new Set(this.playedAdsHistory.map(entry => entry.adId))].length,
      cappingRules: this.adCappingRules
    };
  }

  // ===== AD COMPLETE / ERROR =====

_handleAdComplete() {
  if (this._isDestroyed || this.owner !== "ad") return;


  this.owner = "idle";
  this._emit("onAdComplete", {});

  this.state.userBehavior.consecutiveAdErrors = 0;

  // 🔥 CRITICAL: Let the ad system emit AD_COMPLETED first before doing anything
  // The main audio player should handle the resume, not PlayerManager
  setTimeout(() => {
    if (this.adSchedule && this.adSchedule.isInAdBreak()) {
      const remaining = this.adSchedule.consumeAdSlot();

      if (remaining > 0) {
        const adType = this.selectOptimalAdType();
        this.playAd(adType, this.getAdContext()).catch((error) => {
          console.error("[PM] Follow-up ad in break failed:", error);
        });
        return;
      }
    }

    if (this.autoResume && this.state.isInterrupted) {
      // Just reset the state, don't call _resumeContent()
      this.state.isInterrupted = false;
      this.state.interruptedPosition = 0;
    }
  }, 800); // 🔥 Increased delay to ensure clean handoff
}



// 🔥 ENSURE adIndex is properly passed and tracked
// async _performAdPlayback(adType, context, wasPlaying) {
//   try {
//     this.ads?.onComplete?.(this._handleAdComplete);
//     this.ads?.onError?.(this._handleAdError);

//     this._emit("onAdStart", { adType, context });

//     this.state.userBehavior.consecutiveAdErrors = 0;

//     // 🔥 GET THE AD INDEX AND LOG IT
//     const adIndex = this.getNextAdIndex();
    
//       adType,
//       adIndex,
//       sequenceCounter: this.adSequenceCounter,
//       hasAds: !!this.ads,
//     });

//     // 🔥 PASS adIndex TO ADAPTER
//     await this.ads.playAd(adIndex, context);
    
//   } catch (error) {
//     console.error("[PM] Ad playback failed:", error);
//     this._handleAdError(error, wasPlaying);
//     throw error;
//   }
// }


_handleAdError(error, wasPlaying = this.state.isInterrupted) {
  console.warn("🛑 [PM] Ad error:", error?.message || error);

  this.state.userBehavior.consecutiveAdErrors++;

  this._emit("onAdError", {
    error,
    consecutiveErrors: this.state.userBehavior.consecutiveAdErrors,
  });

  if (this.owner === "ad") {
    this.owner = "idle";
    if (wasPlaying) {
      // 🔥 DON'T resume here - let main audio handle it
      this.state.isInterrupted = false;
    }
  }
}


  // _resumeContent() {
  //   if (!this.state.isInterrupted) return;

  //   this.state.isInterrupted = false;
  //   const position = this.state.interruptedPosition || 0;

  //   try {
  //     if (this.content.seek) {
  //       this.content.seek(position);
  //     }

  //     this.content
  //       .play?.()
  //       .catch((err) =>
  //         console.error("[PM] Failed to resume content after ad:", err)
  //       );

  //     this.owner = "content";
  //     this._emit("onContentResumed", { position });
  //   } catch (error) {
  //     console.error("[PM] Error resuming content after ad:", error);
  //   }
  // }





  // ===== ANALYTICS =====



  getUserBehaviorReport() {
    if (this._isDestroyed) return null;

    const b = this.state.userBehavior;
    const sessionDuration = Date.now() - b.sessionStartTime;

    const scheduleMetrics =
      this.adSchedule?.getAdMetrics?.() || null;

    return {
      session: {
        duration: sessionDuration,
        startTime: new Date(b.sessionStartTime).toISOString(),
        totalPlayTime: b.totalPlayTime,
        isTestMode: this._isTestMode,
      },
      engagement: {
        songsPlayed: b.songsPlayed,
        skipRate: b.skipCount / Math.max(b.songsPlayed, 1),
        averageSessionTime:
          b.totalPlayTime / Math.max(b.songsPlayed, 1),
        engagementScore: this._calculateEngagementScore(),
        consecutiveAdErrors: b.consecutiveAdErrors,
      },
      preferences: {
        currentGenre: b.currentGenre,
        location: b.userLocation,
        recentGenres: [
          ...new Set(
            b.playHistory
              .slice(-10)
              .map((p) => p.genre)
              .filter(Boolean)
          ),
        ],
      },
      adPerformance: {
        totalAds: b.playHistory.filter((p) => p.adPlayed).length,
        lastAdPlayed: b.lastAdPlayedAt
          ? new Date(b.lastAdPlayedAt).toISOString()
          : null,
        errorRate: b.consecutiveAdErrors,
        schedule: scheduleMetrics,
      },
      policy: this.policy,
    };
  }

  // ===== CLEANUP =====

  destroy() {
    if (this._isDestroyed) return;


    this._emit("onDestroy", {});

    this._isDestroyed = true;
    this.owner = "idle";

    this._clearMidrollTimer();
    if (this._playTimeInterval) {
      clearInterval(this._playTimeInterval);
      this._playTimeInterval = null;
    }

    if (this.ads) {
      try {
        this.ads.onComplete = null;
        this.ads.onError = null;
        this.ads.stopAd?.();
      } catch (error) {
        console.warn("[PM] Error cleaning up ad player:", error);
      }
    }

    this._adPlaybackPromise = null;

    Object.values(this.events).forEach((set) => set.clear());

  }

  // ===== UTILITY METHODS =====

  getState() {
    return {
      owner: this.owner,
      isDestroyed: this._isDestroyed,
      isTestMode: this._isTestMode,
      policy: { ...this.policy },
      identity: { ...this.identity },
      hasAdPlayer: !!this.ads,
      currentTrack: this.state.currentTrack,
      isAdBlocked: this.state.isAdBlocked,
    };
  }

  getAdResumeSnapshot() {
    const sched = this.adSchedule?.getState?.() || {};
    return {
      songsPlayed: this.state.userBehavior.songsPlayed,
      songsSinceLastBreak: sched.songsSinceLastBreak ?? 0,
      totalAdBreaks: sched.totalAdBreaks ?? 0,
      adSequenceCounter: this.adSequenceCounter,
      lastAdPlayedAt: this.state.userBehavior.lastAdPlayedAt || 0,
    };
  }

  restoreAdResumeState(snapshot = {}) {
    if (!snapshot || typeof snapshot !== "object") return;
    if (Number.isFinite(snapshot.songsPlayed)) {
      this.state.userBehavior.songsPlayed = snapshot.songsPlayed;
    }
    if (Number.isFinite(snapshot.lastAdPlayedAt)) {
      this.state.userBehavior.lastAdPlayedAt = snapshot.lastAdPlayedAt;
    }
    if (Number.isFinite(snapshot.adSequenceCounter)) {
      this.adSequenceCounter = snapshot.adSequenceCounter;
    }
    if (this.adSchedule?.hydrateState) {
      this.adSchedule.hydrateState({
        songsSinceLastBreak: snapshot.songsSinceLastBreak,
        totalAdBreaks: snapshot.totalAdBreaks,
        totalSongsPlayed: snapshot.songsPlayed,
      });
    }
  }

  isAdPlaying() {
    return this.owner === "ad";
  }

  isContentPlaying() {
    return this.owner === "content";
  }
}
