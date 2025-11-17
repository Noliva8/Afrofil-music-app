// import { createAdScheduleController } from "./adPlayer/createAdScheduleController";

// export class PlayerManager {
//   /**
//    * @param {Object} contentPlayer - adapter from AudioPlayerProvider (play, pause, isPlaying, getCurrentTime, seek)
//    * @param {Object|Function} adPlayerOrFactory - ad adapter instance OR factory ({ identity, environment }) => adAdapter
//    * @param {Object} [opts]
//    * @param {Object} [opts.policy] - enable/disable ad slots
//    * @param {boolean} [opts.policy.preroll=false]
//    * @param {boolean} [opts.policy.midroll=true]
//    * @param {boolean} [opts.policy.postroll=false]
//    * @param {number}  [opts.midrollDelayMs=30000]
//    * @param {boolean} [opts.autoResume=true] - whether to auto-resume content after ads
//    */
//   constructor(contentPlayer, adPlayerOrFactory, opts = {}) {
//     // Validate required parameters
//     if (!contentPlayer) {
//       throw new Error('PlayerManager: contentPlayer is required');
//     }
    
//     if (!adPlayerOrFactory) {
//       throw new Error('PlayerManager: adPlayerOrFactory is required');
//     }

//     this.content = contentPlayer;

//     // Identity + environment (populated by Orchestrator)
//     this.identity = { userType: 'guest', userId: null };
//     this.environment = { location: null };

//     // Ad player initialization with error handling
//     try {
//       this.ads = typeof adPlayerOrFactory === 'function'
//         ? adPlayerOrFactory({ identity: this.identity, environment: this.environment })
//         : adPlayerOrFactory;
      
//       // Validate ad adapter has required methods
//       if (!this.ads || typeof this.ads.playAd !== 'function') {
//         console.warn('PlayerManager: Ad adapter missing playAd method. Ads will be disabled.');
//         this.ads = null;
//       }
//     } catch (error) {
//       console.error('PlayerManager: Failed to initialize ad adapter:', error);
//       this.ads = null;
//     }

//     this.owner = null; // 'content' | 'ad' | null
//     this._isDestroyed = false;

//     // Policy & timing with validation
//     this.policy = {
//       preroll: Boolean(opts.policy?.preroll ?? false),
//       midroll: Boolean(opts.policy?.midroll ?? true),
//       postroll: Boolean(opts.policy?.postroll ?? false)
//     };
    
//     this.midrollDelayMs = Math.max(0, Number.isFinite(opts.midrollDelayMs) ? opts.midrollDelayMs : 30000);
//     this.autoResume = Boolean(opts.autoResume ?? true);

//     // Robust state management
//     this.state = {
//       isInterrupted: false,
//       interruptedPosition: 0,
//       pendingAd: null,
//       adQueue: [],
//       isAdBlocked: false,
//       currentTrack: null,

//       userBehavior: {
//         sessionStartTime: Date.now(),
//         totalPlayTime: 0,
//         songsPlayed: 0,
//         currentGenre: null,
//         userLocation: null,
//         skipCount: 0,
//         lastAdPlayedAt: 0,
//         consecutiveAdErrors: 0,
//         playHistory: []
//       },

//       adRules: {
//         minInterval: 5 * 60 * 1000,
//         maxAdsPerHour: 4,
//         maxConsecutiveErrors: 3,
//         genreSpecificAds: true,
//         locationBasedAds: true,
//         timeBasedRules: {
//           peakHours: { start: 18, end: 22, multiplier: 1.5 },
//           offPeak: { start: 0, end: 6, multiplier: 0.5 }
//         }
//       }
//     };

//     // Event system with better error handling
//     this.events = {
//       onAdStart: new Set(),
//       onAdComplete: new Set(),
//       onAdError: new Set(),
//       onContentInterrupted: new Set(),
//       onContentResumed: new Set(),
//       onAdDecision: new Set(),
//       onAdBlocked: new Set(),
//       onDestroy: new Set()
//     };

//     // TEST MODE with safety limits
//     this._testForceAdChance = false;
//     this._testSkipTimeRule = false;
//     this._testEveryNSongs = 3;
//     this._isTestMode = false;

//     // Timing controls
//     this._trackStartAt = 0;
//     this._midrollTimeout = null;
//     this._playTimeInterval = null;
//     this._adPlaybackPromise = null;

//     // Bind methods safely
//     this._handleAdComplete = this._safeBoundMethod(this._handleAdComplete.bind(this));
//     this._handleAdError = this._safeBoundMethod(this._handleAdError.bind(this));

//     // Initialize
//     this._startSessionTimer();
    
//     console.log('🎛️ PlayerManager initialized', {
//       policy: this.policy,
//       hasAds: !!this.ads,
//       midrollDelay: this.midrollDelayMs
//     });
//   }

//   // ---------- PRIVATE UTILITIES ----------
//   _safeBoundMethod(method) {
//     return (...args) => {
//       if (this._isDestroyed) {
//         console.warn('PlayerManager: Method called after destroy');
//         return;
//       }
//       return method(...args);
//     };
//   }

//   _clearMidrollTimer() {
//     if (this._midrollTimeout) {
//       clearTimeout(this._midrollTimeout);
//       this._midrollTimeout = null;
//     }
//   }

//   _validateContentPlayer() {
//     if (!this.content) {
//       throw new Error('Content player not available');
//     }
//     return true;
//   }

//   _validateAdPlayer() {
//     if (!this.ads) {
//       throw new Error('Ad player not available');
//     }
//     return true;
//   }

//   // ---------- TEST MODE ----------
//   enableTestMode({ everyNSongs = 3 } = {}) {
//     this._testForceAdChance = true;
//     this._testSkipTimeRule = true;
//     this._testEveryNSongs = Math.max(1, everyNSongs);
//     this._isTestMode = true;

//     this.state.adRules.minInterval = 0;
//     this.state.adRules.maxAdsPerHour = 999;

//     console.log('[PM] Test mode enabled (every', this._testEveryNSongs, 'songs)');
//   }

//   disableTestMode() {
//     this._testForceAdChance = false;
//     this._testSkipTimeRule = false;
//     this._testEveryNSongs = 3;
//     this._isTestMode = false;

//     this.state.adRules.minInterval = 5 * 60 * 1000;
//     this.state.adRules.maxAdsPerHour = 4;

//     console.log('[PM] Test mode disabled');
//   }

//   // ---------- CONFIG UPDATES ----------
//   setPolicy(next) {
//     if (this._isDestroyed) return;
    
//     this.policy = { ...this.policy, ...next };
//     console.log('[PM] Policy updated:', this.policy);
//   }

//   setMidrollDelay(ms) {
//     if (this._isDestroyed) return;
    
//     if (Number.isFinite(ms) && ms >= 0) {
//       this.midrollDelayMs = ms;
//       console.log('[PM] Midroll delay:', this.midrollDelayMs);
//     }
//   }

//   setAdRules(partial) {
//     if (this._isDestroyed) return;
    
//     this.state.adRules = { ...this.state.adRules, ...partial };
//     console.log('[PM] Ad rules updated:', this.state.adRules);
//   }

//   // ---------- IDENTITY + ENVIRONMENT ----------
//   setIdentity({ userType, userId = null } = {}) {
//     if (this._isDestroyed || !userType) return;
    
//     this.identity = { userType, userId };
//     this.state.isAdBlocked = (userType === 'premium');
    
//     try {
//       this.ads?.updateIdentity?.(this.identity);
//     } catch (error) {
//       console.warn('PlayerManager: Error updating ad identity:', error);
//     }
    
//     console.log('[PM] Identity set:', this.identity, 'isAdBlocked=', this.state.isAdBlocked);
//   }

//   setLocation(locationObj) {
//     if (this._isDestroyed) return;
    
//     this.environment.location = locationObj || null;
//     this.state.userBehavior.userLocation = locationObj || null;
    
//     try {
//       this.ads?.updateEnvironment?.({ location: this.environment.location });
//     } catch (error) {
//       console.warn('PlayerManager: Error updating ad environment:', error);
//     }
    
//     console.log('📍 Location updated:', locationObj);
//   }

//   setRuntimeContext({ identity, location } = {}) {
//     if (this._isDestroyed) return;
    
//     if (identity) this.setIdentity(identity);
//     if (location) this.setLocation(location);
//   }

//   // ---------- EVENT SYSTEM ----------
//   _emit(name, payload) {
//     if (this._isDestroyed) return;
    
//     const set = this.events[name];
//     if (!set) {
//       console.warn(`PlayerManager: Unknown event '${name}'`);
//       return;
//     }

//     set.forEach(cb => {
//       try {
//         cb(payload);
//       } catch (error) {
//         console.error(`PlayerManager: Error in event handler for '${name}':`, error);
//       }
//     });
//   }

//   on(event, callback) {
//     if (this._isDestroyed || !this.events[event]) {
//       console.warn(`PlayerManager: Cannot subscribe to unknown event '${event}'`);
//       return () => {};
//     }
    
//     this.events[event].add(callback);
//     return () => this.events[event].delete(callback);
//   }

//   // ===== USER BEHAVIOR TRACKING =====
//   _startSessionTimer() {
//     this._playTimeInterval = setInterval(() => {
//       if (this._isDestroyed) {
//         clearInterval(this._playTimeInterval);
//         return;
//       }
      
//       if (this.owner === 'content' && this.content.isPlaying?.()) {
//         this.state.userBehavior.totalPlayTime += 1000;
//       }
//     }, 1000);
//   }

//   updatePlaybackTick(sample) {
//     if (this._isDestroyed) return;
//     this._lastTick = sample;
//   }

//   onTrackStart(meta) {
//     if (this._isDestroyed) return;
    
//     this._trackStartAt = Date.now();
//     this.state.currentTrack = meta;
    
//     if (meta?.genre) {
//       this.updateCurrentGenre(meta.genre);
//     }

//     const playRecord = {
//       timestamp: Date.now(),
//       genre: meta?.genre || this.state.userBehavior.currentGenre,
//       duration: meta?.duration || 0,
//       trackId: meta?.id,
//       title: meta?.title
//     };
    
//     this.state.userBehavior.playHistory.push(playRecord);
//     this.state.userBehavior.songsPlayed += 1;

//     // Schedule midroll check for this track
//     if (this.policy.midroll) {
//       this._scheduleMidrollCheck();
//     }

//     console.log('🎵 Track started:', meta?.title || meta?.id);
//   }

//   onTrackLoaded(meta) {
//     return this.onTrackStart(meta);
//   }

//   onPlay() {
//     if (this._isDestroyed) return;
//     if (this.owner !== 'ad') this.owner = 'content';
//   }

//   onPause() {
//     if (this._isDestroyed) return;
//     if (this.owner === 'content') this.owner = null;
//   }

//   updateCurrentGenre(genre) {
//     if (this._isDestroyed) return;
    
//     this.state.userBehavior.currentGenre = genre || null;
//     console.log('🎵 Current genre:', genre);
//   }

//   recordSkip() {
//     if (this._isDestroyed) return;
    
//     this.state.userBehavior.skipCount++;
//     console.log('⏭️ Skip recorded. Total skips:', this.state.userBehavior.skipCount);
//   }

//   // ===== DECISION ENGINE =====
//   shouldPlayAd(adType = 'midroll') {
//     if (this._isDestroyed) return false;
    
//     // Hard blocks
//     if (this.identity.userType === 'premium' || this.state.isAdBlocked) {
//       console.log('🔕 Ads blocked for user');
//       return false;
//     }

//     if (!this.ads) {
//       console.log('🔕 No ad player available');
//       return false;
//     }

//     // Check for too many consecutive errors
//     if (this.state.userBehavior.consecutiveAdErrors >= this.state.adRules.maxConsecutiveErrors) {
//       console.log('🔕 Too many consecutive ad errors, disabling ads temporarily');
//       return false;
//     }

//     const now = Date.now();
//     const behavior = this.state.userBehavior;
//     const rules = this.state.adRules;

//     // 1) Minimum interval between ads
//     if (now - behavior.lastAdPlayedAt < rules.minInterval) {
//       console.log('⏰ Too soon for next ad');
//       return false;
//     }

//     // 2) Hourly cap
//     const adsThisHour = behavior.playHistory.filter(
//       p => p.adPlayed && (now - p.timestamp) < 3600000
//     ).length;
    
//     if (adsThisHour >= rules.maxAdsPerHour) {
//       console.log('🚫 Hourly ad limit reached');
//       return false;
//     }

//     // 3) Time-of-day gate (skip in test mode)
//     if (!this._testSkipTimeRule) {
//       const currentHour = new Date().getHours();
//       const timeMultiplier = this._getTimeBasedMultiplier(currentHour);
//       const passTime = this._testForceAdChance ? true : (Math.random() < (0.3 * timeMultiplier));
//       if (!passTime) {
//         console.log('🕒 Not optimal time for ad');
//         return false;
//       }
//     }

//     // 4) Engagement check
//     const engagementScore = this._calculateEngagementScore();
//     if (!this._testForceAdChance && engagementScore < 0.3) {
//       console.log('😴 Low engagement; defer ad');
//       return false;
//     }

//     // 5) High-value opportunities
//     if (rules.genreSpecificAds && this._hasGenreAdOpportunity()) {
//       console.log('🎯 Genre-specific ad opportunity');
//       return true;
//     }
    
//     if (rules.locationBasedAds && this._hasLocationAdOpportunity()) {
//       console.log('🌍 Location-based ad opportunity');
//       return true;
//     }

//     // 6) Cadence-based fallback
//     const every = this._testEveryNSongs || 3;
//     const cadenceOK = (behavior.songsPlayed % every) === 0;
    
//     console.log(cadenceOK ? `🎰 Regular ad slot (every ${every} songs)` : '➰ Not a cadence slot');
//     return cadenceOK;
//   }

//   _getTimeBasedMultiplier(hour) {
//     const { peakHours, offPeak } = this.state.adRules.timeBasedRules;
//     if (hour >= peakHours.start && hour < peakHours.end) return peakHours.multiplier;
//     if (hour >= offPeak.start && hour < offPeak.end) return offPeak.multiplier;
//     return 1;
//   }

//   _calculateEngagementScore() {
//     const b = this.state.userBehavior;
//     const sessionDuration = Date.now() - b.sessionStartTime;
    
//     if (sessionDuration < 30000) return 0; // Too new
    
//     const skipRatio = b.skipCount / Math.max(b.songsPlayed, 1);
//     const timePerSong = b.totalPlayTime / Math.max(b.songsPlayed, 1);
    
//     const skipScore = 1 - Math.min(skipRatio, 1);
//     const timeScore = Math.min(timePerSong / (3 * 60 * 1000), 1);
    
//     return (skipScore * 0.6 + timeScore * 0.4);
//   }

//   _hasGenreAdOpportunity() {
//     const genre = (this.state.userBehavior.currentGenre || '').toLowerCase();
//     if (!genre) return false;
    
//     const premiumGenres = ['pop', 'hiphop', 'electronic', 'rock'];
//     return premiumGenres.includes(genre);
//   }

//   _hasLocationAdOpportunity() {
//     const loc = this.state.userBehavior.userLocation;
//     if (!loc || !loc.country) return false;
    
//     const premiumLocations = ['US', 'CA', 'UK', 'AU', 'DE', 'FR'];
//     return premiumLocations.includes(loc.country);
//   }

//   selectOptimalAdType() {
//     const b = this.state.userBehavior;
//     let adType = 'midroll';
    
//     if (b.songsPlayed === 1) adType = 'preroll';
//     else if (b.totalPlayTime > 30 * 60 * 1000) adType = 'branded_content';
//     else if (this._hasLocationAdOpportunity() && this._hasGenreAdOpportunity()) adType = 'premium_midroll';
//     else if (this._calculateEngagementScore() > 0.8) adType = 'interactive';
    
//     console.log(`🎯 Selected ad type: ${adType}`);
//     return adType;
//   }

//   getAdContext() {
//     return {
//       identity: this.identity,
//       environment: this.environment,
//       location: this.state.userBehavior.userLocation,
//       genre: this.state.userBehavior.currentGenre,
//       engagement: this._calculateEngagementScore(),
//       sessionDuration: Date.now() - this.state.userBehavior.sessionStartTime,
//       songsPlayed: this.state.userBehavior.songsPlayed,
//       totalPlayTime: this.state.userBehavior.totalPlayTime,
//       timestamp: Date.now(),
//       currentTrack: this.state.currentTrack
//     };
//   }

//   // ===== PLAYBACK ARBITRATION =====
//   async playMusic(trackMeta = null) {
//     if (this._isDestroyed) {
//       throw new Error('PlayerManager has been destroyed');
//     }

//     if (this.owner === 'ad') {
//       console.log('🎧 Ad is playing. Music must wait.');
//       return false;
//     }

//     try {
//       this._validateContentPlayer();

//       // Pre-roll ad check
//       if (trackMeta && this.policy.preroll && this.shouldPlayAd('preroll')) {
//         console.log('🔄 Preroll ad detected...');
//         const adType = this.selectOptimalAdType();
//         await this._executeAdPlayback(adType, this.getAdContext());
//         // Content will auto-resume after ad if autoResume is true
//       }

//       await this.content.play();
//       this.owner = 'content';
      
//       console.log('🎶 Music is playing');

//       // Track start tracking
//       if (trackMeta) {
//         this.onTrackStart(trackMeta);
//       }
      
//       return true;
//     } catch (error) {
//       console.error('❌ Failed to play music:', error);
//       this._emit('onAdError', { error });
//       return false;
//     }
//   }

//   async playAd(adType, context) {
//     if (this._isDestroyed) {
//       throw new Error('PlayerManager has been destroyed');
//     }
    
//     return this._executeAdPlayback(adType, context);
//   }

//   _scheduleMidrollCheck() {
//     if (!this.policy.midroll || this._isDestroyed) return;

//     this._clearMidrollTimer();

//     this._midrollTimeout = setTimeout(() => {
//       if (this._isDestroyed) return;
      
//       if (this.owner === 'content' && this.shouldPlayAd('midroll')) {
//         console.log('🔄 Midroll opportunity');
//         const adType = this.selectOptimalAdType();
//         this.playAd(adType, this.getAdContext()).catch(error => {
//           console.error('Midroll ad failed:', error);
//         });
//       }
//     }, this.midrollDelayMs);
//   }

//   async skip() {
//     if (this._isDestroyed) return false;
    
//     this.recordSkip();
    
//     if (this.owner === 'ad') {
//       console.log('❌ Cannot skip ads');
//       return false;
//     }
    
//     console.log('⏭️ Skip executed');
//     return true;
//   }

//   // ===== AD PLAYBACK CORE =====
//   async _executeAdPlayback(adType, context) {
//     if (this._isDestroyed) {
//       throw new Error('PlayerManager has been destroyed');
//     }

//     // Validation checks
//     if (this.identity.userType === 'premium' || this.state.isAdBlocked) {
//       this._emit('onAdBlocked', { reason: 'premium_user' });
//       console.log('🔕 Ads blocked for premium');
//       return;
//     }

//     if (!this._validateAdPlayer()) {
//       throw new Error('Ad player not available');
//     }

//     // Prevent concurrent ad playback
//     if (this._adPlaybackPromise) {
//       console.log('🔄 Ad playback already in progress, queuing...');
//       return this._adPlaybackPromise;
//     }

//     const enhancedContext = {
//       ...context,
//       behavioralData: {
//         engagementScore: this._calculateEngagementScore(),
//         sessionMetrics: {
//           duration: this.state.userBehavior.totalPlayTime,
//           songs: this.state.userBehavior.songsPlayed,
//           skips: this.state.userBehavior.skipCount
//         },
//         optimalAdType: this.selectOptimalAdType()
//       }
//     };

//     // Pause content if playing
//     let wasPlaying = false;
//     if (this.content.isPlaying?.() && this.owner === 'content') {
//       wasPlaying = true;
//       this.state.isInterrupted = true;
//       this.state.interruptedPosition = this.content.getCurrentTime?.() || 0;
      
//       await this.content.pause();
//       this._emit('onContentInterrupted', {
//         position: this.state.interruptedPosition,
//         reason: 'ad_break',
//         adType
//       });
//       console.log('🚦 Music paused for ad');
//     }

//     this.owner = 'ad';
//     this.state.userBehavior.lastAdPlayedAt = Date.now();
    
//     this.state.userBehavior.playHistory.push({
//       timestamp: Date.now(),
//       adPlayed: true,
//       adType,
//       context: enhancedContext
//     });

//     console.log(`📢 Playing ${adType} ad`, enhancedContext);
    
//     this._emit('onAdDecision', {
//       adType,
//       context: enhancedContext,
//       decisionFactors: {
//         engagement: this._calculateEngagementScore(),
//         location: this.state.userBehavior.userLocation,
//         genre: this.state.userBehavior.currentGenre,
//         sessionTime: this.state.userBehavior.totalPlayTime
//       }
//     });

//     // Execute ad playback
//     this._adPlaybackPromise = this._performAdPlayback(adType, enhancedContext, wasPlaying)
//       .finally(() => {
//         this._adPlaybackPromise = null;
//       });

//     return this._adPlaybackPromise;
//   }

//   async _performAdPlayback(adType, context, wasPlaying) {
//     try {
//       // Set up event handlers
//       this.ads.onComplete?.(this._handleAdComplete);
//       this.ads.onError?.(this._handleAdError);

//       this._emit('onAdStart', { adType, context });

//       // Reset error counter on successful ad start
//       this.state.userBehavior.consecutiveAdErrors = 0;

//       await this.ads.playAd(adType, context);
      
//       // Note: _handleAdComplete will be called by the ad provider's 'ended' event
      
//     } catch (error) {
//       this._handleAdError(error, wasPlaying);
//       throw error;
//     }
//   }

//   _handleAdComplete() {
//     if (this._isDestroyed || this.owner !== 'ad') return;

//     console.log('✅ Ad completed');
    
//     this.owner = null;
//     this._emit('onAdComplete', {});

//     // Reset error counter on successful completion
//     this.state.userBehavior.consecutiveAdErrors = 0;

//     // Auto-resume content if it was interrupted
//     if (this.autoResume && this.state.isInterrupted) {
//       this._resumeContent();
//     }
//   }

//   _handleAdError(error, wasPlaying = this.state.isInterrupted) {
//     console.warn('🛑 Ad error:', error?.message || error);
    
//     this.state.userBehavior.consecutiveAdErrors++;
    
//     this._emit('onAdError', { 
//       error,
//       consecutiveErrors: this.state.userBehavior.consecutiveAdErrors
//     });

//     if (this.owner === 'ad') {
//       this.owner = null;
      
//       // Resume content on error if it was playing
//       if (wasPlaying) {
//         this._resumeContent();
//       }
//     }
//   }

//   _resumeContent() {
//     if (!this.state.isInterrupted) return;

//     this.state.isInterrupted = false;
//     const position = this.state.interruptedPosition || 0;

//     try {
//       if (this.content.seek) {
//         this.content.seek(position);
//       }
      
//       this.content.play?.().catch(err => {
//         console.error('Failed to resume content after ad:', err);
//       });
      
//       this._emit('onContentResumed', { position });
//       console.log('▶️ Resumed content after ad');
//     } catch (error) {
//       console.error('Error resuming content after ad:', error);
//     }
//   }

//   // ===== ANALYTICS =====
//   getUserBehaviorReport() {
//     if (this._isDestroyed) return null;
    
//     const b = this.state.userBehavior;
//     const sessionDuration = Date.now() - b.sessionStartTime;
    
//     return {
//       session: {
//         duration: sessionDuration,
//         startTime: new Date(b.sessionStartTime).toISOString(),
//         totalPlayTime: b.totalPlayTime,
//         isTestMode: this._isTestMode
//       },
//       engagement: {
//         songsPlayed: b.songsPlayed,
//         skipRate: b.skipCount / Math.max(b.songsPlayed, 1),
//         averageSessionTime: b.totalPlayTime / Math.max(b.songsPlayed, 1),
//         engagementScore: this._calculateEngagementScore(),
//         consecutiveAdErrors: b.consecutiveAdErrors
//       },
//       preferences: {
//         currentGenre: b.currentGenre,
//         location: b.userLocation,
//         recentGenres: [...new Set(b.playHistory.slice(-10).map(p => p.genre).filter(Boolean))]
//       },
//       adPerformance: {
//         totalAds: b.playHistory.filter(p => p.adPlayed).length,
//         lastAdPlayed: b.lastAdPlayedAt ? new Date(b.lastAdPlayedAt).toISOString() : null,
//         errorRate: b.consecutiveAdErrors
//       },
//       policy: this.policy
//     };
//   }

//   // ===== CLEANUP =====
//   destroy() {
//     if (this._isDestroyed) return;
    
//     console.log('🧹 PlayerManager destroying...');
    
//     this._isDestroyed = true;
//     this.owner = null;

//     // Clear all timers
//     this._clearMidrollTimer();
    
//     if (this._playTimeInterval) {
//       clearInterval(this._playTimeInterval);
//       this._playTimeInterval = null;
//     }

//     // Clear all event listeners
//     Object.values(this.events).forEach(set => set.clear());

//     // Clean up ad player
//     if (this.ads) {
//       try {
//         this.ads.onComplete = null;
//         this.ads.onError = null;
//         this.ads.stopAd?.();
//       } catch (error) {
//         console.warn('Error cleaning up ad player:', error);
//       }
//     }

//     // Clear current ad playback
//     this._adPlaybackPromise = null;

//     this._emit('onDestroy', {});
    
//     console.log('🧹 PlayerManager destroyed');
//   }

//   // ===== UTILITY METHODS =====
//   getState() {
//     return {
//       owner: this.owner,
//       isDestroyed: this._isDestroyed,
//       isTestMode: this._isTestMode,
//       policy: { ...this.policy },
//       identity: { ...this.identity },
//       hasAdPlayer: !!this.ads,
//       currentTrack: this.state.currentTrack,
//       isAdBlocked: this.state.isAdBlocked
//     };
//   }

//   isAdPlaying() {
//     return this.owner === 'ad';
//   }

//   isContentPlaying() {
//     return this.owner === 'content';
//   }
// }





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
        console.log("[PM] Ad adapter initialized with playAd");
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

    console.log("🎛️ PlayerManager initialized", {
      policy: this.policy,
      hasAds: !!this.ads,
      midrollDelay: this.midrollDelayMs,
    });
  }

  // ---------- PRIVATE UTILITIES ----------

  _debug(msg, payload) {
    if (!this._debugMode) return;
    if (payload !== undefined) {
      console.log(`🔍 [PM DEBUG] ${msg}`, payload);
    } else {
      console.log(`🔍 [PM DEBUG] ${msg}`);
    }
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

    console.log("[PM] Test mode enabled (every", this._testEveryNSongs, "songs)");
  }

  disableTestMode() {
    this._testForceAdChance = false;
    this._testSkipTimeRule = false;
    this._testEveryNSongs = 3;
    this._isTestMode = false;

    this.state.adRules.minInterval = 5 * 60 * 1000;
    this.state.adRules.maxAdsPerHour = 4;

    console.log("[PM] Test mode disabled");
  }

  enableDebugMode() {
    this._debugMode = true;
    console.log("[PM] 🔍 DEBUG MODE ENABLED");
  }

  disableDebugMode() {
    this._debugMode = false;
    console.log("[PM] 🔍 DEBUG MODE DISABLED");
  }

  // ---------- CONFIG UPDATES ----------

  setPolicy(next) {
    if (this._isDestroyed) return;
    this.policy = { ...this.policy, ...next };
    console.log("[PM] Policy updated:", this.policy);
  }

  setMidrollDelay(ms) {
    // kept for API compat, but not used for track-end midroll logic
    if (this._isDestroyed) return;
    if (Number.isFinite(ms) && ms >= 0) {
      this.midrollDelayMs = ms;
      console.log("[PM] Midroll delay:", this.midrollDelayMs);
    }
  }

  setAdRules(partial) {
    if (this._isDestroyed) return;
    this.state.adRules = { ...this.state.adRules, ...partial };
    console.log("[PM] Ad rules updated:", this.state.adRules);
  }

  // ---------- IDENTITY + ENVIRONMENT ----------

  setIdentity({ userType, userId = null } = {}) {
    if (this._isDestroyed || !userType) return;

    this.identity = { userType, userId };
    this.state.isAdBlocked = userType === "premium";

    try {
      this.ads?.updateIdentity?.(this.identity);
    } catch (error) {
      console.warn("[PM] Error updating ad identity:", error);
    }

    console.log(
      "[PM] Identity set:",
      this.identity,
      "isAdBlocked=",
      this.state.isAdBlocked
    );
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

    console.log("📍 [PM] Location updated:", locationObj);
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

    console.log("🎵 [PM] Track started:", meta?.title || meta?.id);
  }

  // Back-compat alias
  onTrackLoaded(meta) {
    return this.onTrackStart(meta);
  }

  /**
   * MUST be called when a track finishes naturally (audio.onended).
   * Here we enforce: every 3 completed songs → play midroll ad.
   */
  async onTrackEnd(meta) {
    if (this._isDestroyed) return;

    console.log("[PM] Track ended:", meta?.title || meta?.id, {
      songsPlayed: this.state.userBehavior.songsPlayed,
      songsSinceLastBreak: this._songsSinceLastBreak,
      owner: this.owner,
    });

    if (!this.policy.midroll) {
      console.log("[PM] Track-end midroll check skipped (policy.midroll=false)");
      return;
    }
    if (!this.ads) {
      console.log("[PM] Track-end midroll check skipped (no ad player)");
      return;
    }

    this._songsSinceLastBreak = (this._songsSinceLastBreak || 0) + 1;
    console.log("[PM] Songs since last ad break:", this._songsSinceLastBreak);

    const cadenceThreshold = this._isTestMode
      ? this._testEveryNSongs || 3
      : 3;

    if (this._songsSinceLastBreak < cadenceThreshold) {
      console.log(
        `[PM] < ${cadenceThreshold} completed songs since last break; no ad this time.`
      );
      return;
    }

    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      console.log("[PM] Ads blocked for premium user; skipping midroll.");
      this._songsSinceLastBreak = 0;
      return;
    }

    if (
      this.state.userBehavior.consecutiveAdErrors >=
      this.state.adRules.maxConsecutiveErrors
    ) {
      console.log(
        "[PM] Too many consecutive ad errors; skipping midroll for now."
      );
      this._songsSinceLastBreak = 0;
      return;
    }

    if (this.adSchedule && this.adSchedule.onAdBreakStarted) {
      this.adSchedule.onAdBreakStarted();
    }
    const metrics = this.adSchedule?.getAdMetrics?.();
    console.log("[PM] Ad break metrics (track-end midroll):", metrics);

    const adType = this.selectOptimalAdType();
    console.log(
      "[PM] Starting midroll via playAd() after %d completed songs. Type:",
      cadenceThreshold,
      adType
    );

    this._songsSinceLastBreak = 0;

    try {
      await this.playAd(adType, this.getAdContext());
    } catch (error) {
      console.error("[PM] Midroll ad failed from onTrackEnd:", error);
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
    console.log("🎵 [PM] Current genre:", genre);
  }

  recordSkip() {
    if (this._isDestroyed) return;
    this.state.userBehavior.skipCount++;
    console.log(
      "⏭️ [PM] Skip recorded. Total skips:",
      this.state.userBehavior.skipCount
    );
  }

  // ===== DECISION ENGINE (still used for preroll, analytics, etc.) =====

  shouldPlayAd(adType = "midroll") {
    if (this._isDestroyed) return false;

    console.log("[PM] shouldPlayAd called", {
      adType,
      userType: this.identity.userType,
      isAdBlocked: this.state.isAdBlocked,
      songsPlayed: this.state.userBehavior.songsPlayed,
    });

    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      console.log("[PM] shouldPlayAd: 🔕 Ads blocked for user");
      return false;
    }
    if (!this.ads) {
      console.log("[PM] shouldPlayAd: 🔕 No ad player available");
      return false;
    }
    if (
      this.state.userBehavior.consecutiveAdErrors >=
      this.state.adRules.maxConsecutiveErrors
    ) {
      console.log(
        "[PM] shouldPlayAd: 🔕 Too many consecutive ad errors"
      );
      return false;
    }

    const now = Date.now();
    const behavior = this.state.userBehavior;
    const rules = this.state.adRules; // ✅ declare once and reuse

    // Minimum interval
    if (now - behavior.lastAdPlayedAt < rules.minInterval) {
      console.log("[PM] shouldPlayAd: ⏰ Too soon for next ad");
      return false;
    }

    // Hourly cap
    const adsThisHour = behavior.playHistory.filter(
      (p) => p.adPlayed && now - p.timestamp < 3600000
    ).length;
    if (adsThisHour >= rules.maxAdsPerHour) {
      console.log("[PM] shouldPlayAd: 🚫 Hourly ad limit reached");
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
        console.log("[PM] shouldPlayAd: 🕒 Not optimal time for ad");
        return false;
      }
    }

    // Engagement
    const engagementScore = this._calculateEngagementScore();
    if (!this._testForceAdChance && engagementScore < 0.3) {
      console.log("[PM] shouldPlayAd: 😴 Low engagement; defer ad");
      return false;
    }

    // High-value opportunities
    if (rules.genreSpecificAds && this._hasGenreAdOpportunity()) {
      console.log("[PM] shouldPlayAd: 🎯 Genre-specific ad opportunity → YES");
      return true;
    }
    if (rules.locationBasedAds && this._hasLocationAdOpportunity()) {
      console.log("[PM] shouldPlayAd: 🌍 Location-based ad opportunity → YES");
      return true;
    }

    // Cadence fallback (mainly for preroll / others now)
    const every = this._testEveryNSongs || 3;
    const cadenceOK = behavior.songsPlayed % every === 0;
    console.log(
      "[PM] shouldPlayAd cadence check:",
      cadenceOK
        ? `✅ Regular ad slot (every ${every} songs)`
        : `➰ Not a cadence slot (every ${every} songs)`
    );
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

    console.log(`🎯 [PM] Selected ad type: ${adType}`);
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

    console.log("[PM] playMusic called", {
      owner: this.owner,
      hasTrackMeta: !!trackMeta,
      policy: this.policy,
    });

    if (this.owner === "ad") {
      console.log("[PM] playMusic: 🎧 Ad is playing. Music must wait.");
      return false;
    }

    try {
      this._validateContentPlayer();

      // Optional preroll
      if (trackMeta && this.policy.preroll && this.shouldPlayAd("preroll")) {
        console.log("[PM] playMusic: 🔄 Preroll ad detected...");
        const adType = this.selectOptimalAdType();
        await this._executeAdPlayback(adType, this.getAdContext());
      }

      await this.content.play?.();
      this.owner = "content";
      console.log("[PM] 🎶 Music is playing");

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
    console.log("[PM] playAd called", { adType, context });
    return this._executeAdPlayback(adType, context);
  }

  async skip() {
    if (this._isDestroyed) return false;
    this.recordSkip();
    if (this.owner === "ad") {
      console.log("[PM] skip: ❌ Cannot skip ads");
      return false;
    }
    console.log("[PM] ⏭️ Skip executed");
    return true;
  }

  // ===== AD PLAYBACK CORE =====

  async _executeAdPlayback(adType, context) {
    if (this._isDestroyed) {
      throw new Error("PlayerManager has been destroyed");
    }

    console.log("[PM] _executeAdPlayback CALLED", {
      adType,
      identity: this.identity,
      userType: this.identity.userType,
      songsPlayed: this.state.userBehavior.songsPlayed,
      owner: this.owner,
      hasAds: !!this.ads,
    });

    if (this.identity.userType === "premium" || this.state.isAdBlocked) {
      console.log("[PM] _executeAdPlayback: ads blocked for user");
      this._emit("onAdBlocked", { reason: "premium_user" });
      return;
    }

    if (!this._validateAdPlayer()) {
      console.error("[PM] _executeAdPlayback: NO ad player available");
      throw new Error("Ad player not available");
    }

    if (this._adPlaybackPromise) {
      console.log("[PM] _executeAdPlayback: ad already in progress, reusing promise");
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
      console.log("[PM] 🚦 Music paused for ad (owner was content)");
    }

    this.owner = "ad";
    this.state.userBehavior.lastAdPlayedAt = Date.now();
    this.state.userBehavior.playHistory.push({
      timestamp: Date.now(),
      adPlayed: true,
      adType,
      context: enhancedContext,
    });

    console.log(`📢 [PM] Playing ${adType} ad`, enhancedContext);

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

      console.log("[PM] Calling ads.playAd now →", {
        adType,
        hasAds: !!this.ads,
      });

      await this.ads.playAd(adType, context);
      // _handleAdComplete is called by adapter when ad finishes
    } catch (error) {
      this._handleAdError(error, wasPlaying);
      throw error;
    }
  }

  // ===== AD COMPLETE / ERROR =====

  _handleAdComplete() {
    if (this._isDestroyed || this.owner !== "ad") return;

    console.log("✅ [PM] Ad completed");

    this.owner = "idle";
    this._emit("onAdComplete", {});

    this.state.userBehavior.consecutiveAdErrors = 0;

    if (this.adSchedule && this.adSchedule.isInAdBreak()) {
      const remaining = this.adSchedule.consumeAdSlot();
      console.log(
        "[PM] Ad break: adsRemainingInBreak after consume =",
        remaining
      );

      if (remaining > 0) {
        const adType = this.selectOptimalAdType();
        this.playAd(adType, this.getAdContext()).catch((error) => {
          console.error("[PM] Follow-up ad in break failed:", error);
        });
        return;
      }
    }

    if (this.autoResume && this.state.isInterrupted) {
      this._resumeContent();
    }
  }

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
        this._resumeContent();
      }
    }
  }

  _resumeContent() {
    if (!this.state.isInterrupted) return;

    this.state.isInterrupted = false;
    const position = this.state.interruptedPosition || 0;

    try {
      if (this.content.seek) {
        this.content.seek(position);
      }

      this.content
        .play?.()
        .catch((err) =>
          console.error("[PM] Failed to resume content after ad:", err)
        );

      this.owner = "content";
      this._emit("onContentResumed", { position });
      console.log("▶️ [PM] Resumed content after ad");
    } catch (error) {
      console.error("[PM] Error resuming content after ad:", error);
    }
  }

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

    console.log("🧹 [PM] PlayerManager destroying...");

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

    console.log("🧹 [PM] PlayerManager destroyed");
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

  isAdPlaying() {
    return this.owner === "ad";
  }

  isContentPlaying() {
    return this.owner === "content";
  }
}
