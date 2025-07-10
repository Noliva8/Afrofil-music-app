import { useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';

export default function PauseOnLogin({ formDisplay }) {
  const { pause, playerState } = useAudioPlayer();

  useEffect(() => {
    // Only pause if song is currently playing
    if ((formDisplay === 'login' || formDisplay === 'signup') && playerState.isPlaying) {
      pause(true); // Mark as manually paused
    }
  }, [formDisplay]);

  return null;
}
