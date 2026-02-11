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

    isValid: () => {
      return !!(audio && typeof audio.play === 'function');
    },
  };
};
