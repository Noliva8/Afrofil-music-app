import React, { useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { eventBus } from '../../utils/Contexts/playerAdapters';

export const AdMediaPlayer = () => {
  const [adState, setAdState] = useState({
    currentAd: null,
    isPlaying: false,
    progress: { currentTime: 0, duration: 0, percent: 0 }
  });

  useEffect(() => {
    const handleAdMetadata = (metadata) => {
      console.log('📱 AdMediaPlayer: Received ad metadata', metadata);
      setAdState(prev => ({ ...prev, currentAd: metadata }));
    };

    const handleAdStart = (adInfo) => {
      console.log('📱 AdMediaPlayer: Ad started', adInfo);
      setAdState(prev => ({ ...prev, isPlaying: true }));
    };

    const handleAdProgress = (progress) => {
      setAdState(prev => ({ ...prev, progress }));
    };

    const handleAdCompleted = () => {
      console.log('📱 AdMediaPlayer: Ad completed');
      setAdState({ 
        currentAd: null, 
        isPlaying: false, 
        progress: { currentTime: 0, duration: 0, percent: 0 } 
      });
    };

    const handleAdError = (errorData) => {
      console.error('📱 AdMediaPlayer: Ad error', errorData);
      setAdState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleAdPaused = (payload) => {
      setAdState(prev => ({
        ...prev,
        isPlaying: false,
        progress: payload?.progress || prev.progress
      }));
    };

    const handleAdResumed = (payload) => {
      setAdState(prev => ({
        ...prev,
        isPlaying: true,
        progress: payload?.progress || prev.progress
      }));
    };

    // Subscribe to events
    eventBus.on('AD_METADATA_LOADED', handleAdMetadata);
    eventBus.on('AD_STARTED', handleAdStart);
    eventBus.on('AD_PROGRESS', handleAdProgress);
    eventBus.on('AD_COMPLETED', handleAdCompleted);
    eventBus.on('AD_STOPPED', handleAdCompleted);
    eventBus.on('AD_ERROR', handleAdError);
    eventBus.on('AD_PAUSED', handleAdPaused);
    eventBus.on('AD_RESUMED', handleAdResumed);

    console.log('📱 AdMediaPlayer: Subscribed to ad events');

    return () => {
      // Cleanup
      eventBus.off('AD_METADATA_LOADED', handleAdMetadata);
      eventBus.off('AD_STARTED', handleAdStart);
      eventBus.off('AD_PROGRESS', handleAdProgress);
      eventBus.off('AD_COMPLETED', handleAdCompleted);
      eventBus.off('AD_STOPPED', handleAdCompleted);
      eventBus.off('AD_ERROR', handleAdError);
      eventBus.off('AD_PAUSED', handleAdPaused);
      eventBus.off('AD_RESUMED', handleAdResumed);
      
      console.log('📱 AdMediaPlayer: Unsubscribed from ad events');
    };
  }, []);

  // Helper function to format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Destructure for cleaner JSX
  const { currentAd, isPlaying, progress } = adState;

  if (!currentAd) return null;

  const togglePlayPause = () => {
    if (isPlaying) {
      eventBus.emit('AD_UI_PAUSE');
    } else {
      eventBus.emit('AD_UI_PLAY');
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15,15,15,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(228,196,33,0.2)',
        zIndex: 1100,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 1.5,
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            background: 'linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {currentAd.artwork ? (
            <img
              src={currentAd.artwork}
              alt={currentAd.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              Sponsored
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              background: 'rgba(0,0,0,0.65)',
              borderRadius: 1,
              px: 0.6,
              py: 0.2
            }}
          >
            <Typography variant="caption" sx={{ color: '#E4C421', fontSize: '0.65rem', letterSpacing: 0.2 }}>
              AD
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentAd.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.75)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              Sponsored by {currentAd.advertiser || 'Brand'}
            </Typography>
            {currentAd.description && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mt: 0.5, lineHeight: 1.4, maxHeight: 32, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentAd.description}
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause ad' : 'Play ad'}
            sx={{
              backgroundColor: '#E4C421',
              color: '#0f0f0f',
              '&:hover': { backgroundColor: '#F8D347' }
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Slider
          value={progress.duration ? progress.currentTime / 1000 : 0}
          max={progress.duration ? progress.duration / 1000 : 0}
          min={0}
          disabled
          sx={{
            color: '#E4C421',
            height: 4,
            '& .MuiSlider-thumb': { display: 'none' },
            '& .MuiSlider-rail': { opacity: 0.25 }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          <span>{formatTime(progress.currentTime)}</span>
          <span>{formatTime(progress.duration)}</span>
        </Box>
      </Box>
    </Box>
  );
};
