


export function createAdScheduleController(options = {}) {
  const config = {
    // Progressive frequency: [songsPerBreak, adsPerBreak]
    frequencySchedule: options.frequencySchedule ?? [
      { songs: 3, ads: 1 },  // First break: after 3 songs, 1 ad
      { songs: 4, ads: 1 },  // Second: after 4 songs, 1 ad  
      { songs: 5, ads: 2 },  // Third: after 5 songs, 2 ads
      { songs: 6, ads: 2 },  // Steady state: after 6 songs, 2 ads
    ],
    minSongsBeforeFirstBreak: options.minSongsBeforeFirstBreak ?? 2,
    maxAdBreaksPerHour: options.maxAdBreaksPerHour ?? 6,
    minBreakCooldownMs: options.minBreakCooldownMs ?? 120000, // 2 minutes
    enableProgressiveMode: options.enableProgressiveMode ?? true,
  };

  const state = {
    totalSongsPlayed: 0,
    totalAdBreaks: 0,
    songsSinceLastBreak: 0,
    adsRemainingInBreak: 0,
    lastBreakTimestamp: 0,
    breaksThisHour: 0,
    currentFrequencyTier: 0,
  };

  function _updateHourlyReset(now = Date.now()) {
    const oneHourAgo = now - (60 * 60 * 1000);
    if (state.lastBreakTimestamp < oneHourAgo) {
      state.breaksThisHour = 0;
    }
  }

  function _getCurrentFrequency() {
    if (!config.enableProgressiveMode) {
      // Fixed frequency mode
      const fixed = config.frequencySchedule[config.frequencySchedule.length - 1];
      return { songs: fixed.songs, ads: fixed.ads };
    }

    // Progressive mode: move through tiers based on total breaks
    const tierIndex = Math.min(state.totalAdBreaks, config.frequencySchedule.length - 1);
    state.currentFrequencyTier = tierIndex;
    return config.frequencySchedule[tierIndex];
  }

  return {
    getConfig() { return { ...config }; },
    getState() { return { ...state }; },

    onSongStarted() {
      state.totalSongsPlayed += 1;
      state.songsSinceLastBreak += 1;
    },

    onAdBreakStarted() {
      const now = Date.now();
      _updateHourlyReset(now);
      
      state.lastBreakTimestamp = now;
      state.totalAdBreaks += 1;
      state.breaksThisHour += 1;
      state.songsSinceLastBreak = 0;
      
      const frequency = _getCurrentFrequency();
      state.adsRemainingInBreak = frequency.ads;
    },

    consumeAdSlot() {
      if (state.adsRemainingInBreak > 0) {
        state.adsRemainingInBreak -= 1;
      }
      return state.adsRemainingInBreak;
    },

    isInAdBreak() {
      return state.adsRemainingInBreak > 0;
    },

    shouldStartBreak() {
      const now = Date.now();
      _updateHourlyReset(now);

      // Rate limiting
      if (state.breaksThisHour >= config.maxAdBreaksPerHour) {
        return { shouldStart: false, reason: 'hourly_limit_reached' };
      }

      // Cooldown protection
      if (now - state.lastBreakTimestamp < config.minBreakCooldownMs) {
        return { shouldStart: false, reason: 'cooldown_active' };
      }

      const frequency = _getCurrentFrequency();
      
      // First break minimum songs
      if (state.totalAdBreaks === 0 && state.totalSongsPlayed < config.minSongsBeforeFirstBreak) {
        return { shouldStart: false, reason: 'first_break_min_songs' };
      }

      // Check if we've reached the song threshold
      if (state.songsSinceLastBreak >= frequency.songs) {
        return { 
          shouldStart: true, 
          reason: 'song_threshold_met',
          expectedAds: frequency.ads,
          tier: state.currentFrequencyTier
        };
      }

      return { shouldStart: false, reason: 'song_threshold_not_met' };
    },

    // For debugging and analytics
    getAdMetrics() {
      const frequency = _getCurrentFrequency();
      return {
        totalSongsPlayed: state.totalSongsPlayed,
        totalAdBreaks: state.totalAdBreaks,
        songsSinceLastBreak: state.songsSinceLastBreak,
        songsUntilNextBreak: Math.max(0, frequency.songs - state.songsSinceLastBreak),
        currentTier: state.currentFrequencyTier,
        currentFrequency: frequency,
        breaksThisHour: state.breaksThisHour,
        hourlyLimit: config.maxAdBreaksPerHour,
      };
    },
  };
}