import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext.jsx';
import ModernMusicPlayer from './ModernMusicPlayer.jsx';
import { AdMediaPlayer } from './ModernAdPlayer.jsx';

const MediaPlayerContainer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isTeaser,
    play,
    pause,
    seek,
    skipNext,
    skipPrevious,
    setVolume,
    toggleMute,
    queue,
    playerState // ✅ Add playerState to access playbackContext
  } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Update slider value when currentTime changes (unless dragging)
  useEffect(() => {
    if (!isDragging && currentTime !== sliderValue) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

  // Show player only when track is available
  useEffect(() => {
    setIsVisible(!!currentTrack);
  }, [currentTrack]);


  const handlePlayPause = () => {
    console.log('play button is clicked in media player');
    console.log('the current song is:', currentTrack);
    console.log('check if playback context works:', playerState )
    
    if (!currentTrack) return;
    
    if (isPlaying) {
      pause(true); // ✅ manually triggered pause
    } else {
      // ✅ Pass the stored playback context when resuming
      play(null, playerState?.playbackContext);
    }
  };



  const handleSliderChange = (_, newValue) => {
    setIsDragging(true);
    setSliderValue(newValue);
  };

  const handleSliderCommit = (_, newValue) => {
    setIsDragging(false);
    const maxAllowed = isTeaser ? Math.min(duration, 30) : duration;
    const clamped = Math.min(newValue, maxAllowed);
    seek(clamped);
    setSliderValue(clamped);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (newVolume === 0 && !isMuted) {
      toggleMute();
    } else if (newVolume > 0 && isMuted) {
      toggleMute();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modern-player-wrapper">
      <AdMediaPlayer />
      
      <ModernMusicPlayer
        currentSong={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        teaserMode={isTeaser}
        onPlayPause={handlePlayPause}
        onPrev={skipPrevious} // ⚠️ Check if this should be skipPrevious
        onNext={skipNext}
        onSeek={seek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        onSliderChange={handleSliderChange}
        onSliderCommit={handleSliderCommit}
        isDragging={isDragging}
        queueLength={queue.length}
      />
    </div>
  );
};

export default MediaPlayerContainer;