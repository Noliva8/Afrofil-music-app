// utils/useAudioPersistence.js
import { useEffect, useRef } from 'react';
import { useUser } from './userContext';

export const useAudioPersistence = ({
  audioRef,
  playerState,
  setPlayerState,
  load,
  play
}) => {
  const restoredRef = useRef(false);
  const userContext = useUser();
  const { isUser, isPremium } = userContext;
  const isUserLoggedIn = isUser || isPremium;

  useEffect(() => {
    if (restoredRef.current || !isUserLoggedIn || userContext.isGuest) return;


    const saved = localStorage.getItem('lastPlayedTrack');
    if (!saved) return;

    const { track, currentTime, queue, wasPlaying } = JSON.parse(saved);

    load(track, queue || []).then(success => {
      if (success && audioRef.current) {
        audioRef.current.currentTime = currentTime || 0;

        if (wasPlaying) {
          // 🔐 Wait for user interaction before resuming playback
          const handleInteraction = () => {
            play(track);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
          };

          document.addEventListener('click', handleInteraction);
          document.addEventListener('keydown', handleInteraction);
        }
      }
    });

    restoredRef.current = true;
  }, [audioRef, isUserLoggedIn, load, play, setPlayerState]);

  // 🧠 Optional: Save current track progress on change
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
};
