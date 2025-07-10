import React from 'react';
import { Box, Slider, IconButton, Typography, Tooltip } from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeOff,
  FavoriteBorder, PlaylistPlay
} from '@mui/icons-material';

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
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveDuration = teaserMode ? Math.min(30, duration) : duration;
  const isTeaserActive = teaserMode && currentTime >= 30;

  // Handle click on progress bar
  const handleProgressClick = (e) => {
    if (!currentSong) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * effectiveDuration;
    
    onSeek(seekTime);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT') return; // Skip if typing in inputs
    
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
      tabIndex={0} // Make the player focusable for keyboard events
    >
      {/* Progress Bar - Clickable Area */}
      <Box 
        onClick={handleProgressClick}
        sx={{ 
          cursor: currentSong ? 'pointer' : 'default',
          paddingY: 1,
          marginY: -1 // Compensate for padding
        }}
      >
        <Slider
          value={Math.min(currentTime, effectiveDuration)}
          max={effectiveDuration || 100}
          onChange={onSliderChange}
          onChangeCommitted={onSliderCommit}
          sx={{
            color: '#E4C421',
            height: 4,
            pointerEvents: isDragging ? 'auto' : 'none', // Let parent handle clicks
            '& .MuiSlider-track': {
              transition: isDragging ? 'none' : 'width 0.1s linear',
            },
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              transition: isDragging ? 'none' : 'left 0.1s linear',
              display: isDragging ? 'block' : 'none',
            },
          }}
          disabled={!currentSong}
        />
      </Box>

      {/* Time Display */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 1,
        px: 0.5 // Align with progress bar edges
      }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(effectiveDuration)}
          {teaserMode && (
            <span style={{ 
              marginLeft: 4,
              color: '#E4C421',
              fontSize: '0.7rem'
            }}>
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
        {/* Song Info */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1, 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <img
            src={currentSong?.artworkUrl || currentSong?.cover || '/default-cover.jpg'}
            alt={currentSong?.title || 'No song playing'}
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 8, 
              marginRight: 12, 
              objectFit: 'cover',
              opacity: currentSong ? 1 : 0.7,
              flexShrink: 0
            }}
            onError={(e) => {
              e.target.src = '/default-cover.jpg';
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: currentSong ? 'white' : 'rgba(255,255,255,0.5)', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              {currentSong?.title || 'No song selected'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              {currentSong?.artistName || currentSong?.artist?.artistAka || 'Unknown Artist'}
            </Typography>
          </Box>
        </Box>

        {/* Transport Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>

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

        {/* Right Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          flex: 1
        }}>
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

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: 120, 
            ml: 1,
            gap: 0.5
          }}>
            <Tooltip title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
              <IconButton 
                onClick={onToggleMute} 
                size="small"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Tooltip>
            <Slider
              value={isMuted ? 0 : volume * 100}
              onChange={(_, v) => onVolumeChange(v / 100)}
              sx={{ 
                color: '#E4C421',
                '& .MuiSlider-thumb': { 
                  width: 10, 
                  height: 10,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 4px rgba(228, 196, 33, 0.2)'
                  }
                },
                '& .MuiSlider-rail': {
                  opacity: 0.3
                }
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernMusicPlayer;