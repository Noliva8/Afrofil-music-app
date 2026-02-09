import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext.jsx';
import ModernMusicPlayer from './ModernMusicPlayer.jsx';
import { AdMediaPlayer } from './ModernAdPlayer.jsx';
import { eventBus } from '../../utils/Contexts/playerAdapters.js';
import Box from '@mui/material/Box';
import MediaSessionManager from './MediaSessionManager.jsx';
const LazyFullScreenPlayer = lazy(() => import('./FullScreenMediaPlayer.jsx'));

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
    playerState, // ✅ Add playerState to access playbackContext
    audioRef,
    cycleRepeatMode,
  } = useAudioPlayer();
  const { isAdPlaying } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const openFullScreen = useCallback(() => setIsFullScreenOpen(true), []);
  const closeFullScreen = useCallback(() => setIsFullScreenOpen(false), []);

  // Update slider value when currentTime changes (unless dragging)
  useEffect(() => {
    if (!isDragging && currentTime !== sliderValue) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

  // Show player only when track is available
  useEffect(() => {
    setIsVisible(!!currentTrack || isAdPlaying);
  }, [currentTrack, isAdPlaying]);

  // Allow external triggers (e.g., shared track route) to open fullscreen player
  useEffect(() => {
    const openHandler = () => openFullScreen();
    eventBus.on('OPEN_FULL_SCREEN_PLAYER', openHandler);
    return () => eventBus.off('OPEN_FULL_SCREEN_PLAYER', openHandler);
  }, [openFullScreen]);


  const handlePlayPause = () => {
    console.log('play button is clicked in media player');
    console.log('the current song is:', currentTrack);
    console.log('check if playback context works:', playerState )
    
    if (!currentTrack || isAdPlaying) return;
    
    if (isPlaying) {
      pause(true); // ✅ manually triggered pause
    } else {
      // ✅ Pass the stored playback context when resuming
      play(null, playerState?.playbackContext);
    }
  };

  const metadata = useMemo(() => {
    if (!currentTrack || isAdPlaying) return null;
    return {
      title: currentTrack.title || currentTrack.songTitle || "",
      artistName: currentTrack.artistName || currentTrack.artist || "",
      album: currentTrack.albumName || currentTrack.album || "",
      artwork:
        currentTrack.artworkPresignedUrl ||
        currentTrack.artworkUrl ||
        currentTrack.cover ||
        null,
    };
  }, [currentTrack, isAdPlaying]);

  const handleMediaAction = (action, detail) => {
    if (!audioRef?.current || isAdPlaying) return;
    switch (action) {
      case "play":
        if (!isPlaying) play(null, playerState?.playbackContext);
        break;
      case "pause":
        if (isPlaying) pause(true);
        break;
      case "previoustrack":
        skipPrevious();
        break;
      case "nexttrack":
        skipNext();
        break;
      case "seekto":
        if (detail?.seekTime != null) {
          seek(detail.seekTime);
        }
        break;
      default:
        break;
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
    <Box sx={{mb: 4}}>
      <MediaSessionManager audioRef={audioRef} metadata={metadata} onAction={handleMediaAction} />
      {isAdPlaying ? (
        <AdMediaPlayer
          isFullScreenOpen={isFullScreenOpen}
          inlineMode={!isFullScreenOpen}
          onOpenFullScreen={openFullScreen}
          onCloseFullScreen={closeFullScreen}
        />
      ) : (
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
          onToggleRepeat={cycleRepeatMode}
          onSliderChange={handleSliderChange}
          onSliderCommit={handleSliderCommit}
          isDragging={isDragging}
          queueLength={queue.length}
          onOpenFullScreen={openFullScreen}
          isShuffled={playerState.shuffle}
          repeatMode={
            playerState.repeatMode === 'one'
              ? 'one'
              : playerState.repeatMode === 'all'
              ? 'all'
              : 'none'
          }
          isAdPlaying={isAdPlaying}
        />
      )}

      {isFullScreenOpen && (
        <Suspense fallback={null}>
          <LazyFullScreenPlayer
            currentSong={currentTrack}
            isOpen={isFullScreenOpen}
            onClose={closeFullScreen}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onPlayPause={handlePlayPause}
            onPrev={skipPrevious}
            onNext={skipNext}
            onSeek={seek}
            onSliderChange={handleSliderChange}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            onToggleRepeat={cycleRepeatMode}
            teaserMode={isTeaser}
            isTeaser={isTeaser}
            teaserDuration={30}
            queue={queue}
            queueLength={queue.length}
            isAdPlaying={isAdPlaying}
            onSliderCommit={handleSliderCommit}
            repeatMode={
              playerState.repeatMode === 'one'
                ? 'one'
                : playerState.repeatMode === 'all'
                ? 'all'
                : 'none'
            }
          />
        </Suspense>
      )}
    </Box>
  );
};

export default MediaPlayerContainer;
