import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext.jsx';
import ModernMusicPlayer from './ModernMusicPlayer.jsx';

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
    queue
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

  // For debugging teaser state
  // useEffect(() => {
  //   console.log('[MediaPlayer] State:', {
  //     isPlaying,
  //     currentTime,
  //     duration,
  //     isTeaser
  //   });
  // }, [isPlaying, currentTime, duration, isTeaser]);

  const handlePlayPause = () => {
    console.log('play button is clicked in media player')
    console.log('the current song is:', currentTrack)
    if (!currentTrack) return;
    isPlaying ? pause(true) : play(); // ✅ manually triggered pause
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
      <ModernMusicPlayer
        currentSong={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        teaserMode={isTeaser}
        onPlayPause={handlePlayPause}
        onPrev={skipPrevious}
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
