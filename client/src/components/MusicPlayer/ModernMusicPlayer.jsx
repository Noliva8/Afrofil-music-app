import React from 'react';
import { Box, Slider, IconButton, Typography, Tooltip } from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeOff,
  FavoriteBorder, PlaylistPlay
} from '@mui/icons-material';

import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { useNowPlayingArtwork } from '../../utils/Contexts/useNowPlayingArtwork';

const ModernMusicPlayer = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  teaserMode,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSliderChange,
  onSliderCommit,
  isDragging,
  queueLength
}) => {
  // ====== NEW: pull ad/track context safely and derive ad artwork/texts ======
  // Assumes provider is mounted (your app already uses AudioPlayerProvider).
  const { isPlayingAd, currentAd, playerState } = useAudioPlayer();
  const {
    artworkUrl: adArtworkUrl,
    title: adTitle,
    subtitle: adSubtitle,
    isAd,
    isPlaceholder,
    note
  } = useNowPlayingArtwork({
    isPlayingAd,
    currentAd,
    currentTrack: playerState?.currentTrack
  });

  // What to show in the UI (does NOT change progress/seek logic)
  const displayImageSrc = isAd
    ? (adArtworkUrl || '/default-cover.jpg') // use your existing default image
    : (currentSong?.artworkUrl || currentSong?.cover || '/default-cover.jpg');

  const displayTitle = isAd
    ? (adTitle || 'Advertisement')
    : (currentSong?.title || 'No song selected');

  const displaySubtitle = isAd
    ? (adSubtitle || 'Sponsored')
    : (currentSong?.artistName || currentSong?.artist?.artistAka || 'Unknown Artist');

  // ====== existing helpers / logic remain unchanged ======
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveDuration = teaserMode ? Math.min(30, duration) : duration;
  const isTeaserActive = teaserMode && currentTime >= 30;

  const handleProgressClick = (e) => {
    if (!currentSong) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * effectiveDuration;
    onSeek(seekTime);
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        onPlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(effectiveDuration, currentTime + 5));
        break;
      case 'm':
        e.preventDefault();
        onToggleMute();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, effectiveDuration, onPlayPause, onSeek, onToggleMute]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(228, 196, 33, 0.2)',
        zIndex: 1000,
        px: { xs: 1, sm: 2 },
        pt: 2,
        pb: 'calc(2rem + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
      }}
      tabIndex={0}
    >
      {/* Progress Bar - Clickable Area (unchanged) */}
      <Box onClick={handleProgressClick} sx={{ cursor: currentSong ? 'pointer' : 'default', paddingY: 1, marginY: -1 }}>
        <Slider
          value={Math.min(currentTime, effectiveDuration)}
          max={effectiveDuration || 100}
          onChange={onSliderChange}
          onChangeCommitted={onSliderCommit}
          sx={{
            color: '#E4C421',
            height: 4,
            pointerEvents: isDragging ? 'auto' : 'none',
            '& .MuiSlider-track': { transition: isDragging ? 'none' : 'width 0.1s linear' },
            '& .MuiSlider-thumb': { width: 12, height: 12, transition: isDragging ? 'none' : 'left 0.1s linear', display: isDragging ? 'block' : 'none' },
          }}
          disabled={!currentSong}
        />
      </Box>

      {/* Time Display (unchanged) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(effectiveDuration)}
          {teaserMode && (
            <span style={{ marginLeft: 4, color: '#E4C421', fontSize: '0.7rem' }}>
              (Preview)
            </span>
          )}
        </Typography>
      </Box>

      {/* Main Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          mt: 2,
          gap: 2,
        }}
      >
        {/* Song / Ad Info (artwork + texts) */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', width: 56, height: 56, borderRadius: 1.5, overflow: 'hidden', marginRight: 1.5, flexShrink: 0 }}>
            <img
              src={displayImageSrc}
              alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: currentSong || isAd ? 1 : 0.7 }}
              onError={(e) => { e.currentTarget.src = '/default-cover.jpg'; }}
            />
            {isAd && (
              <Box sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                background: 'rgba(0,0,0,0.7)',
                borderRadius: 1,
                px: 0.5,
                py: 0.2
              }}>
                <Typography variant="caption" sx={{ color: '#E4C421', fontSize: '0.65rem' }}>
                  Sponsored
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: (currentSong || isAd) ? 'white' : 'rgba(255,255,255,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayTitle}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={displaySubtitle}
            >
              {displaySubtitle}
              {isAd && isPlaceholder && note ? (
                <em style={{ marginLeft: 8, opacity: 0.9 }}>{note}</em>
              ) : null}
            </Typography>
          </Box>
        </Box>

        {/* Transport Controls (unchanged behavior) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Tooltip title="Previous (Ctrl+Left)">
            <span>
              <IconButton
                onClick={onPrev}
                disabled={!currentSong || queueLength <= 1}
                sx={{ color: 'white', mx: 1 }}
              >
                <SkipPrevious />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
            <span>
              <IconButton
                onClick={onPlayPause}
                disabled={!currentSong}
                sx={{
                  backgroundColor: '#E4C421',
                  color: 'black',
                  mx: 1,
                  '&:hover': { backgroundColor: '#F8D347' },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)'
                  }
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Next (Ctrl+Right)">
            <span>

              <IconButton 
  onClick={onNext} 
  disabled={!currentSong || queueLength <= 1}
                sx={{ color: 'white', mx: 1 }}
              >

                <SkipNext />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Right Controls (unchanged) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'space-between', sm: 'flex-end' }, flex: 1 }}>
          <Tooltip title="Add to favorites">
            <IconButton disabled={!currentSong}>
              <FavoriteBorder sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add to playlist">
            <IconButton disabled={!currentSong}>
              <PlaylistPlay sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', width: 120, ml: 1, gap: 0.5 }}>
            <Tooltip title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
              <IconButton onClick={onToggleMute} size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Tooltip>
            <Slider
              value={isMuted ? 0 : (volume || 0) * 100}
              onChange={(_, v) => onVolumeChange((Array.isArray(v) ? v[0] : v) / 100)}
              sx={{
                color: '#E4C421',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 4px rgba(228, 196, 33, 0.2)' }
                },
                '& .MuiSlider-rail': { opacity: 0.3 }
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernMusicPlayer;
