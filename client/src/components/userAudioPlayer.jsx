import { Box, Slider, IconButton, Typography } from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp,
  FavoriteBorder, PlaylistPlay
} from '@mui/icons-material';

const ModernMusicPlayer = ({
  currentSong,
  audioUrl,
  audioRef,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  onSliderCommit,
  onSliderChange,
  isDragging,
  teaserMode = false
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveDuration = teaserMode ? 30 : duration;

  return (
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(15, 15, 15, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(228, 196, 33, 0.2)',
      zIndex: 1000,
      p: 2,
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* 🔁 Progress Bar */}
    <Slider
  value={currentTime}
  max={duration || 100}
  onChange={onSliderChange}
  onChangeCommitted={onSliderCommit}
  sx={{
    color: '#E4C421',
    height: 4,
    transition: isDragging ? 'none' : 'transform 0.1s linear',
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
      transition: isDragging ? 'none' : 'left 0.1s linear',
    },
  }}
/>


      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(effectiveDuration)}
        </Typography>
      </Box>

      {/* 🔘 Main Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
        {/* Song Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img
            src={currentSong?.artworkUrl || currentSong?.cover || 'https://via.placeholder.com/56x56?text=No+Cover'}
            alt={currentSong?.title}
            style={{ width: 56, height: 56, borderRadius: 8, marginRight: 12, objectFit: 'cover' }}
            onError={(e) => {
              const fallback = 'https://via.placeholder.com/56x56?text=No+Cover';
              if (e.target.src !== fallback) {
                e.target.onerror = null;
                e.target.src = fallback;
              }
            }}
          />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong?.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSong?.artistName || currentSong?.artist?.artistAka || 'Unknown Artist'}
            </Typography>
          </Box>
        </Box>

        {/* Transport Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <IconButton onClick={onPrev} sx={{ color: 'white', mx: 1 }}>
            <SkipPrevious />
          </IconButton>
          <IconButton
            onClick={() => onPlayPause(!isPlaying)}
            sx={{
              backgroundColor: '#E4C421',
              color: 'black',
              mx: 1,
              '&:hover': { backgroundColor: '#F8D347' }
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={onNext} sx={{ color: 'white', mx: 1 }}>
            <SkipNext />
          </IconButton>
        </Box>

        {/* Extras */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <IconButton sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FavoriteBorder />
          </IconButton>
          <IconButton sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <PlaylistPlay />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', width: 120, ml: 1 }}>
            <VolumeUp sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
            <Slider
              value={volume * 100}
              onChange={(_, v) => onVolumeChange(v / 100)}
              sx={{ color: '#E4C421', '& .MuiSlider-thumb': { width: 10, height: 10 } }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernMusicPlayer;
