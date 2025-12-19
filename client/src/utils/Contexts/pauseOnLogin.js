import { useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';

export default function PauseOnLogin({ formDisplay }) {
  const { pause, playerState } = useAudioPlayer();

  useEffect(() => {
    // Pause only when the auth modal is active
    if ((formDisplay === 'login' || formDisplay === 'signup') && playerState.isPlaying) {
      pause(true); // Mark as manually paused
    }
  }, [formDisplay, pause, playerState.isPlaying]);

  return null;
}
