import React from 'react';
import {
  Box,
  Slider,
  IconButton,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeOff,
  FavoriteBorder,
  PlaylistPlay,
  Shuffle,
  Repeat,
  RepeatOne,
  QueueMusic,
  OpenInFull
} from '@mui/icons-material';

import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { useNowPlayingArtwork } from '../../utils/Contexts/useNowPlayingArtwork';

const DEFAULT_COVER = 'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#0f0f0f" offset="0"/><stop stop-color="#1a1a1a" offset="1"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#e4c421" font-size="10" font-family="Arial">AF</text>
    </svg>`
  );

const CompactMusicPlayer = ({
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
  queueLength,
  isShuffled = false,
  repeatMode = 'none',
  onToggleShuffle,
  onToggleRepeat,
  onOpenQueue,
  isQueueOpen,
  onOpenFullScreen = null,
  isAdPlaying = false
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900px - 1200px
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg')); // ≥ 1200px




  const accent = theme.palette.primary.main ?? '#E4C421';
  const text = theme.palette.text.primary ?? '#fff';
  const textMuted = theme.palette.text.secondary ?? 'rgba(255,255,255,0.6)';

  const { isPlayingAd, currentAd, playerState, toggleShuffle,
  cycleRepeatMode } = useAudioPlayer();

  const {
    artworkUrl: hookArtworkUrl,
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



const effectiveIsShuffled = Boolean(playerState?.shuffle);

const effectiveRepeatMode =
  playerState?.repeatMode === 'one'
    ? 'one'
    : playerState?.repeatMode === 'all'
    ? 'all'
    : 'none';





  const sanitizeCover = (src) => {
    if (!src) return null;
    if (/placehold\.co/i.test(src)) return null;
    return src;
  };

  const musicArtwork =
    sanitizeCover(hookArtworkUrl) ||
    sanitizeCover(currentSong?.artworkUrl) ||
    sanitizeCover(currentSong?.cover);

  const displayImageSrc = isAd
    ? (sanitizeCover(hookArtworkUrl) || DEFAULT_COVER)
    : (musicArtwork || DEFAULT_COVER);

  const displayTitle = isAd
    ? (adTitle || 'Advertisement')
    : (currentSong?.title || 'No song');

  const resolveArtistText = (artist) => {
    if (!artist) return '';
    if (typeof artist === 'string') return artist;
    if (Array.isArray(artist)) return artist.filter(Boolean).join(', ');
    return artist.artistAka || artist.fullName || artist.artistName || artist.name || '';
  };

  const displaySubtitle = isAd
    ? (adSubtitle || 'Sponsored')
    : (resolveArtistText(currentSong?.artist) || currentSong?.artistName || '');
  const safeSubtitle = displaySubtitle || '';

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveDuration = teaserMode ? Math.min(30, duration) : duration;

  const handleProgressClick = (e) => {
    if (!currentSong && !isAd) return;
    if (isAdPlaying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(pct * effectiveDuration);
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
      case 's':
        e.preventDefault();
        onToggleShuffle?.();
        break;
      case 'r':
        e.preventDefault();
        onToggleRepeat?.();
        break;
      case 'q':
        e.preventDefault();
        onOpenQueue?.();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, effectiveDuration, onPlayPause, onSeek, onToggleMute, onToggleShuffle, onToggleRepeat, onOpenQueue]);

  // Responsive layout configurations
  const layoutConfig = {
    xs: {
      height: 80,
      padding: '0.5rem 0.75rem',
      albumArtSize: 40,
      controlsGap: 0.25,
      iconSize: 18,
      playIconSize: 20,
      showTimeLabels: false,
      showShuffleRepeat: false,
      showFavoritePlaylist: false,
      compactVolume: true,
      progressHeight: 3
    },
    sm: {
      height: 84,
      padding: '0.75rem 1rem',
      albumArtSize: 44,
      controlsGap: 0.5,
      iconSize: 20,
      playIconSize: 22,
      showTimeLabels: true,
      showShuffleRepeat: true,
      showFavoritePlaylist: true,
      compactVolume: false,
      progressHeight: 4
    },
    md: {
      height: 88,
      padding: '0.75rem 1.5rem',
      albumArtSize: 48,
      controlsGap: 0.75,
      iconSize: 22,
      playIconSize: 24,
      showTimeLabels: true,
      showShuffleRepeat: true,
      showFavoritePlaylist: true,
      compactVolume: false,
      progressHeight: 4
    },
    lg: {
      height: 92,
      padding: '0.75rem 2rem',
      albumArtSize: 52,
      controlsGap: 1,
      iconSize: 24,
      playIconSize: 26,
      showTimeLabels: true,
      showShuffleRepeat: true,
      showFavoritePlaylist: true,
      compactVolume: false,
      progressHeight: 5
    }
  };

  const config = isXs ? layoutConfig.xs : 
                 isSm ? layoutConfig.sm : 
                 isMd ? layoutConfig.md : 
                 layoutConfig.lg;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid rgba(228, 196, 33, 0.2)`,
        zIndex: (theme.zIndex?.appBar ?? 1100) + 300,
        px: { xs: 0.75, sm: 1, md: 1.5, lg: 2 },
        py: { xs: 0.5, sm: 0.75, md: 0.75, lg: 0.75 },
        height: config.height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        touchAction: 'none',
      }}
      tabIndex={0}
      role="application"
      aria-label="Music player"
    >
      {/* TOP SECTION: Controls */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        gap: { xs: 0.75, sm: 1, md: 1.5 }
      }}>
        {/* Left: Album Art & Song Info */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: '0 1 auto',
          minWidth: 0,
          width: { xs: 'auto', sm: '30%', md: '25%', lg: '22%' },
          gap: { xs: 0.75, sm: 1 },
          cursor: onOpenFullScreen ? 'pointer' : 'default'
        }}
        onClick={onOpenFullScreen}
        >
          {/* Album Art */}
          <Box sx={{ 
            position: 'relative', 
            width: config.albumArtSize, 
            height: config.albumArtSize, 
            borderRadius: 1, 
            overflow: 'hidden', 
            flexShrink: 0 
          }}>
            <img
              src={displayImageSrc}
              alt={displayTitle}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                aspectRatio: '1/1'
              }}
              onError={(e) => { e.currentTarget.src = DEFAULT_COVER; }}
            />
            {isAd && (
              <Box sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(178, 80, 53, 0.9)',
                borderRadius: '50%',
                width: 8,
                height: 8,
              }} />
            )}
          </Box>
          
         {/* Song Info */}
<Box sx={{ 
  minWidth: 0, 
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  overflow: 'hidden', // IMPORTANT: Contain overflowing text
  maxWidth: {
    xs: 'calc(100vw - 180px)', // Reserve space for controls on mobile
    sm: 'none'
  }
}}>
  {/* Title with dynamic truncation */}
  <Tooltip title={displayTitle} disableHoverListener={(displayTitle || '').length < 25}>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        color: text,
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: { 
          xs: '0.75rem', // Slightly smaller on mobile
          sm: '0.85rem', 
          md: '0.9rem' 
        },
        lineHeight: 1.2,
        // Prevent text from taking too much space
        maxWidth: '100%',
        // Ensure it doesn't push other elements
        flexShrink: 1,
      }}
    >
      {displayTitle}
    </Typography>
  </Tooltip>
  
  {/* Artist/Subtitle with dynamic truncation */}
  <Tooltip title={safeSubtitle} disableHoverListener={safeSubtitle.length < 30}>
    <Typography
      variant="caption"
      sx={{
        color: textMuted,
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: { 
          xs: '0.65rem', // Even smaller on mobile
          sm: '0.75rem', 
          md: '0.8rem' 
        },
        lineHeight: 1.2,
        mt: { xs: 0, sm: 0.25 },
        // Prevent text from taking too much space
        maxWidth: '100%',
        // Ensure it doesn't push other elements
        flexShrink: 1,
      }}
    >
      {safeSubtitle}
    </Typography>
  </Tooltip>
</Box>
        </Box>

        {/* Center: Main Playback Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          gap: config.controlsGap
        }}>


          {/* Shuffle */}

          {config.showShuffleRepeat && (

           <Tooltip title={effectiveIsShuffled ? "Disable shuffle (S)" : "Enable shuffle (S)"}>
 <IconButton
  size="small"
  onClick={toggleShuffle}
  sx={{
    color: effectiveIsShuffled ? accent : textMuted,
    p: 0.5,
    '&:hover': { color: accent }
  }}
  disabled={!currentSong && !isAd}
>
  <Shuffle sx={{ fontSize: config.iconSize }} />
</IconButton>


</Tooltip>

          )}




          {/* Previous */}
          <Tooltip title="Previous">
            <span>
              <IconButton
                size="small"
                onClick={onPrev}
                disabled={isAdPlaying || (!currentSong && !isAd) || queueLength <= 1}
                sx={{ 
                  color: text,
                  p: 0.5,
                  '&:hover': { color: accent },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <SkipPrevious sx={{ fontSize: config.iconSize + 2 }} />
              </IconButton>
            </span>
          </Tooltip>

          {/* Play/Pause */}
          <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
            <span>
              <IconButton
                size="small"
                onClick={onPlayPause}
                disabled={isAdPlaying || (!currentSong && !isAd)}
                sx={{
                  backgroundColor: accent,
                  color: theme.palette.getContrastText?.(accent) || '#0f0f0f',
                  p: 1,
                  width: { xs: 46, sm: 50, md: 54, lg: 58 },
                  height: { xs: 46, sm: 50, md: 54, lg: 58 },
                  '&:hover': { 
                    backgroundColor: accent,
                    transform: 'scale(1.05)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {isPlaying ? 
                  <Pause sx={{ fontSize: config.playIconSize }} /> : 
                  <PlayArrow sx={{ fontSize: config.playIconSize }} />
                }
              </IconButton>
            </span>
          </Tooltip>

          {/* Next */}
          <Tooltip title="Next">
            <span>
              <IconButton
                size="small"
                onClick={onNext}
                disabled={isAdPlaying || (!currentSong && !isAd) || queueLength <= 1}
                sx={{ 
                  color: text,
                  p: 0.5,
                  '&:hover': { color: accent },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <SkipNext sx={{ fontSize: config.iconSize + 2 }} />
              </IconButton>
            </span>
          </Tooltip>

          {/* Repeat */}
          {config.showShuffleRepeat && (
          <Tooltip title={
  effectiveRepeatMode === "none" ? "Enable repeat (R)" :
  effectiveRepeatMode === "one" ? "Repeat one" : "Repeat all"
}>
 <IconButton
  size="small"
  onClick={cycleRepeatMode}
  sx={{
    color: effectiveRepeatMode !== 'none' ? accent : textMuted,
    p: 0.5,
    '&:hover': { color: accent }
  }}
  disabled={isAdPlaying || (!currentSong && !isAd)}
>
  {effectiveRepeatMode === 'one'
    ? <RepeatOne sx={{ fontSize: config.iconSize }} />
    : <Repeat sx={{ fontSize: config.iconSize }} />
  }
</IconButton>


</Tooltip>

          )}
        </Box>

        {/* Right: Additional Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: '0 1 auto',
          minWidth: 0,
          width: { xs: 'auto', sm: '25%', md: '25%', lg: '28%' },
          justifyContent: 'flex-end',
          gap: { xs: 0.5, sm: 0.75 }
        }}>
          {onOpenFullScreen && (
            <Tooltip title="Open fullscreen player">
              <IconButton
                size="small"
                onClick={onOpenFullScreen}
                disabled={false}
                sx={{
                  color: textMuted,
                  p: 0.5,
                  '&:hover': { color: accent },
                  display: { xs: 'inline-flex', sm: 'inline-flex' },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <QueueMusic sx={{ fontSize: config.iconSize }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Queue Button */}
          {onOpenQueue && config.showFavoritePlaylist && (
            <Tooltip title={`${isQueueOpen ? 'Hide' : 'Show'} queue (Q)`}>
              <IconButton 
                size="small" 
                onClick={onOpenQueue}
                sx={{ 
                  color: isQueueOpen ? accent : textMuted,
                  p: 0.5,
                  '&:hover': { color: accent },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                <QueueMusic sx={{ fontSize: config.iconSize }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Favorite */}
          {config.showFavoritePlaylist && (
            <Tooltip title="Add to favorites">
              <IconButton 
                size="small" 
                disabled={!currentSong && !isAd}
                sx={{ 
                  color: textMuted,
                  p: 0.5,
                  '&:hover': { color: accent },
                  '&.Mui-disabled': { opacity: 0.3 },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                <FavoriteBorder sx={{ fontSize: config.iconSize }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Playlist */}
          {config.showFavoritePlaylist && (
            <Tooltip title="Add to playlist">
              <IconButton 
                size="small" 
                disabled={!currentSong && !isAd}
                sx={{ 
                  color: textMuted,
                  p: 0.5,
                  '&:hover': { color: accent },
                  '&.Mui-disabled': { opacity: 0.3 },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                <PlaylistPlay sx={{ fontSize: config.iconSize }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Fullscreen trigger */}
          {onOpenFullScreen && (
            <Tooltip title="Fullscreen player">
              <IconButton 
                size="small"
                onClick={onOpenFullScreen}
                sx={{ 
                  color: textMuted,
                  p: 0.5,
                  '&:hover': { color: accent },
                  '&:active': { transform: 'scale(0.98)' },
                  display: 'inline-flex'
                }}
              >
                <OpenInFull sx={{ fontSize: config.iconSize }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Volume Controls */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: config.compactVolume ? 80 : 120
          }}>
            <Tooltip title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
              <IconButton 
                onClick={onToggleMute} 
                size="small" 
                sx={{ 
                  color: textMuted, 
                  p: 0.5,
                  '&:hover': { color: accent }
                }}
              >
                {isMuted ? 
                  <VolumeOff sx={{ fontSize: config.iconSize }} /> : 
                  <VolumeUp sx={{ fontSize: config.iconSize }} />
                }
              </IconButton>
            </Tooltip>
            
            {!config.compactVolume && (
              <Slider
                value={isMuted ? 0 : (volume || 0) * 100}
                onChange={(_, v) => onVolumeChange((Array.isArray(v) ? v[0] : v) / 100)}
                sx={{
                  color: accent,
                  ml: 0.5,
                  '& .MuiSlider-thumb': {
                    width: { xs: 8, sm: 10 },
                    height: { xs: 8, sm: 10 },
                    '&:hover': { boxShadow: `0 0 0 4px ${accent}33` }
                  },
                  '& .MuiSlider-rail': { opacity: 0.3, height: 3 },
                  '& .MuiSlider-track': { height: 3 },
                }}
                size="small"
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* BOTTOM SECTION: Progress Bar */}
      <Box sx={{
        width: '100%',
        mt: { xs: 0.5, sm: 0.75 }
      }}>
        {/* Progress Bar with Time Labels */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5
        }}>
          {/* Current Time */}
          {config.showTimeLabels && (
            <Typography variant="caption" sx={{ 
              color: textMuted, 
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              minWidth: 40,
              flexShrink: 0
            }}>
              {formatTime(currentTime)}
            </Typography>
          )}

          {/* Progress Bar */}
          <Box 
            onClick={handleProgressClick} 
            sx={{ 
              flex: 1,
              cursor: (currentSong || isAd) ? 'pointer' : 'default',
            }}
          >
            <Slider
              value={Math.min(currentTime, effectiveDuration)}
              max={effectiveDuration || 100}
              onChange={isAdPlaying ? undefined : onSliderChange}
              onChangeCommitted={isAdPlaying ? undefined : onSliderCommit}
              sx={{
                color: accent,
                height: config.progressHeight,
                pointerEvents: isDragging ? 'auto' : 'none',
                '& .MuiSlider-track': { 
                  transition: isDragging ? 'none' : 'width 0.1s linear',
                  height: config.progressHeight,
                },
                '& .MuiSlider-thumb': { 
                  width: config.progressHeight * 2, 
                  height: config.progressHeight * 2, 
                  transition: isDragging ? 'none' : 'left 0.1s linear', 
                  display: isDragging ? 'block' : 'none',
                  '&:hover': {
                    boxShadow: `0 0 0 4px ${accent}33`
                  }
                },
                '& .MuiSlider-rail': { 
                  height: config.progressHeight,
                  opacity: 0.4 
                },
              }}
              disabled={isAdPlaying || (!currentSong && !isAd)}
            />
          </Box>

          {/* Duration Time */}
          {config.showTimeLabels && (
            <Typography variant="caption" sx={{ 
              color: textMuted, 
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              minWidth: 40,
              textAlign: 'right',
              flexShrink: 0
            }}>
              {formatTime(effectiveDuration)}
              {teaserMode && (
                <Box component="span" sx={{ 
                  ml: 0.5, 
                  color: accent, 
                  fontSize: '0.6rem',
                  display: { xs: 'none', sm: 'inline' }
                }}>
                  (Preview)
                </Box>
              )}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CompactMusicPlayer;
