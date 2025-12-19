import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Box, IconButton, Slider, Typography, Fab, useTheme, alpha, Button, Container } from '@mui/material';
import { PlayArrow, Pause, Close, VolumeUp, OpenInNew, SkipPrevious, SkipNext, ArrowDownward, ExpandMore } from '@mui/icons-material';
import { eventBus } from '../../utils/Contexts/playerAdapters';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { useAdAudio } from '../../utils/Contexts/adPlayer/adPlayerProvider.jsx';

const initialAdState = {
  currentAd: null,
  isPlaying: false,
  progress: { currentTime: 0, duration: 0, percent: 0 },
  isClosing: false
};

// Global cache for ad metadata to prevent loss during remounts
const adMetadataCache = {
  current: null,
  timestamp: 0
};

export const AdMediaPlayer = ({
  isFullScreenOpen = false,
  inlineMode = false,
  onOpenFullScreen = () => {},
  progress: externalProgress,
  duration: externalDuration,
  isPlaying: externalPlaying,
  onTogglePlay = null,
  onCloseFullScreen = () => {}
}) => {
  console.log('🎯 AdMediaPlayer: Component render start');
  
  const [adState, setAdState] = useState(initialAdState);
  const { playerState, currentAd: contextAd } = useAudioPlayer();
  const adAudioCtx = (() => {
    try { return useAdAudio(); } catch { return null; }
  })();
  const adAudioState = adAudioCtx?.adState;

  const resizeTimeout = React.useRef();
  const isMounted = React.useRef(true);
  const renderCount = React.useRef(0);
  const hasReceivedMetadata = React.useRef(false);
  
  // Track render count
  renderCount.current++;
  
  // Log ALL relevant data sources
  console.log(`🎯 AdMediaPlayer: Render #${renderCount.current}`, {
    localAd: adState.currentAd,
    contextAd: contextAd,
    playerStateIsAdPlaying: playerState?.isAdPlaying,
    cachedAd: adMetadataCache.current,
    progress: adState.progress.currentTime
  });

  useEffect(() => {
    console.log('🎯 AdMediaPlayer: Component mount');
    isMounted.current = true;
    
    // Check cache for missed metadata
    if (!adState.currentAd && !contextAd && adMetadataCache.current) {
      const cacheAge = Date.now() - adMetadataCache.timestamp;
      if (cacheAge < 10000) { // Cache valid for 10 seconds
        console.log('🎯 AdMediaPlayer: Restoring ad from cache', adMetadataCache.current);
        setAdState(prev => ({
          ...prev,
          currentAd: adMetadataCache.current,
          isPlaying: true
        }));
        hasReceivedMetadata.current = true;
      }
    }
    
    return () => {
      console.log('🎯 AdMediaPlayer: Component unmount');
      isMounted.current = false;
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []);

  // Keep local ad in sync with context if metadata arrives later
  useEffect(() => {
    if (!playerState?.isAdPlaying || !contextAd) return;
    const local = adState.currentAd;
    const needsUpdate =
      !local ||
      local.id !== contextAd.id ||
      (!local.artwork && contextAd.artwork) ||
      (!local.title && contextAd.title);
    if (needsUpdate) {
      console.log('🎯 AdMediaPlayer: Syncing local ad from context metadata', contextAd);
      setAdState(prev => ({
        ...prev,
        currentAd: contextAd,
        isPlaying: true,
        isClosing: false
      }));
    }
  }, [playerState?.isAdPlaying, contextAd, adState.currentAd]);

  // Listen for ALL possible ad-related events
  useEffect(() => {
    console.log('🎯 AdMediaPlayer: Setting up comprehensive event listeners');
    
    const handleAdMetadata = (metadata) => {
      console.log('🎯 AdMediaPlayer: Received AD_METADATA_LOADED', metadata);
      hasReceivedMetadata.current = true;
      
      // Cache the metadata globally
      adMetadataCache.current = metadata;
      adMetadataCache.timestamp = Date.now();
      
      if (!isMounted.current) return;
      
      setAdState(prev => ({
        ...prev,
        currentAd: metadata,
        isPlaying: true,
        isClosing: false
      }));
    };

    // Also listen for generic ad events that might contain metadata
    const handleAdEvent = (eventName, data) => {
      if (eventName.includes('AD_') && data?.ad) {
        console.log(`🎯 AdMediaPlayer: Found ad metadata in ${eventName}`, data.ad);
        if (!hasReceivedMetadata.current) {
          handleAdMetadata(data.ad);
        }
      }
    };

    const handleAdStart = (adInfo) => {
      console.log('🎯 AdMediaPlayer: Received AD_STARTED', adInfo);
      
      // Sometimes ad metadata is in the start event
      if (adInfo?.ad && !hasReceivedMetadata.current) {
        console.log('🎯 AdMediaPlayer: Extracting metadata from AD_STARTED');
        handleAdMetadata(adInfo.ad);
      }
      
      if (!isMounted.current) return;
      
      setAdState(prev => ({ ...prev, isPlaying: true }));
    };

    const handleAdProgress = (progress) => {
      if (!isMounted.current) return;

      const hasPercent = typeof progress?.percent === 'number' && !Number.isNaN(progress.percent);
      const shouldStop = hasPercent && progress.percent >= 0.99;

      setAdState(prev => ({
        ...prev,
        progress,
        // Only auto-stop when we have a reliable percent; otherwise keep prior state
        isPlaying: shouldStop ? false : prev.isPlaying
      }));
    };

    const handleAdCompleted = () => {
      console.log('🎯 AdMediaPlayer: Received AD_COMPLETED');
      if (!isMounted.current) return;

      setAdState((prev) => {
        const { progress } = prev;
        const duration = Number(progress?.duration) || 0;
        const current = Number(progress?.currentTime) || 0;
        const percent = duration ? current / duration : 0;

        console.log('🎯 AdMediaPlayer: Completion check', { percent });

        if (percent < 0.95) {
          console.warn('🎯 AdMediaPlayer: Ignoring premature completion');
          return prev;
        }

        return { ...prev, isPlaying: false, isClosing: true };
      });
    };

    const handleAdError = (errorData) => {
      console.error('🎯 AdMediaPlayer: Received AD_ERROR', errorData);
      
      if (!isMounted.current) return;
      
      setAdState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleAdPaused = (payload) => {
      console.log('🎯 AdMediaPlayer: Received AD_PAUSED', payload);
      
      if (!isMounted.current) return;
      
      setAdState(prev => ({
        ...prev,
        isPlaying: false,
        progress: payload?.progress || prev.progress
      }));
    };

    const handleAdResumed = (payload) => {
      console.log('🎯 AdMediaPlayer: Received AD_RESUMED', payload);
      
      if (!isMounted.current) return;
      
      setAdState(prev => ({
        ...prev,
        isPlaying: true,
        progress: payload?.progress || prev.progress
      }));
    };

    // Subscribe to ALL events to catch any ad metadata
    console.log('🎯 AdMediaPlayer: Subscribing to events');
    
    eventBus.on('AD_METADATA_LOADED', handleAdMetadata);
    eventBus.on('AD_STARTED', handleAdStart);
    eventBus.on('AD_PROGRESS', handleAdProgress);
    eventBus.on('AD_COMPLETED', handleAdCompleted);
    eventBus.on('AD_ERROR', handleAdError);
    eventBus.on('AD_PAUSED', handleAdPaused);
    eventBus.on('AD_RESUMED', handleAdResumed);
    
    // Listen to all events to find hidden metadata
    eventBus.on('*', handleAdEvent);

    // Also check if there's a global ad object somewhere
    if (window.__adPlayerMetadata && !hasReceivedMetadata.current) {
      console.log('🎯 AdMediaPlayer: Found global ad metadata', window.__adPlayerMetadata);
      handleAdMetadata(window.__adPlayerMetadata);
    }

    return () => {
      console.log('🎯 AdMediaPlayer: Cleaning up event listeners');
      
      eventBus.off('AD_METADATA_LOADED', handleAdMetadata);
      eventBus.off('AD_STARTED', handleAdStart);
      eventBus.off('AD_PROGRESS', handleAdProgress);
      eventBus.off('AD_COMPLETED', handleAdCompleted);
      eventBus.off('AD_ERROR', handleAdError);
      eventBus.off('AD_PAUSED', handleAdPaused);
      eventBus.off('AD_RESUMED', handleAdResumed);
      eventBus.off('*', handleAdEvent);
    };
  }, []);

  // Sync with player context - CRITICAL FIX
  useEffect(() => {
    // If player says ad is playing but we have no metadata
    if (playerState?.isAdPlaying && !adState.currentAd && !contextAd) {
      console.warn('🎯 AdMediaPlayer: Ad playing but no metadata! Checking for hidden data...');
      
      // Try to find ad data in playerState
      if (playerState.currentAd) {
        console.log('🎯 AdMediaPlayer: Found ad in playerState.currentAd', playerState.currentAd);
        setAdState(prev => ({
          ...prev,
          currentAd: playerState.currentAd,
          isPlaying: true
        }));
        hasReceivedMetadata.current = true;
      }
      
      // Check for ad data in other playerState properties
      const playerStateKeys = Object.keys(playerState || {});
      playerStateKeys.forEach(key => {
        if (key.includes('ad') || key.includes('Ad')) {
          console.log(`🎯 AdMediaPlayer: Checking playerState.${key}`, playerState[key]);
        }
      });
    }
    
    // If we have context ad, use it
    if (contextAd && !adState.currentAd) {
      console.log('🎯 AdMediaPlayer: Using context ad', contextAd);
      setAdState(prev => ({
        ...prev,
        currentAd: contextAd,
        isPlaying: true
      }));
      hasReceivedMetadata.current = true;
    }
  }, [playerState, contextAd, adState.currentAd]);

  // Enhanced resize handler
  const handleResize = useCallback(() => {
    // Avoid forcing play on resize; simply keep progress stable
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = setTimeout(() => {}, 150);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, [handleResize]);

  // Format time helper
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };



  const togglePlayPause = () => {
    const currentPlaying = (typeof adAudioState?.isPlaying === 'boolean'
      ? adAudioState.isPlaying
      : adState.isPlaying);

    const nextPlaying = !currentPlaying;

    if (nextPlaying) {
      eventBus.emit('AD_UI_PLAY');
    } else {
      eventBus.emit('AD_UI_PAUSE', { source: 'ui' });
    }

    setAdState(prev => ({ ...prev, isPlaying: nextPlaying }));
  };



  const handleSkipAd = () => {
    eventBus.emit('AD_UI_SKIP');
    setAdState(initialAdState);
    adMetadataCache.current = null;
    hasReceivedMetadata.current = false;
  };

  const { currentAd, isPlaying, progress, isClosing } = adState;
  const theme = useTheme();
  const accent = theme.palette.primary.main || '#E4C421';
  
  // Determine which ad to display (prefer context, then local, then cache)
  const displayAd = contextAd || currentAd || adMetadataCache.current;

  // Derive playing flag: trust ad audio provider first, then global player ad flag, then local
  const playing = Boolean(
    (typeof adAudioState?.isPlaying === 'boolean' ? adAudioState.isPlaying : null) ??
    (typeof playerState?.isAdPlaying === 'boolean' ? playerState.isAdPlaying : null) ??
    (typeof isPlaying === 'boolean' ? isPlaying : null) ??
    false
  );

  const handleLearnMore = () => {
    const current = displayAd || contextAd || currentAd || adMetadataCache.current;
    if (current?.clickThroughUrl) {
      window.open(current.clickThroughUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Show ad player if: ad is playing OR we have ad data OR we're closing animation
  const shouldShowAdPlayer = playerState?.isAdPlaying || displayAd || isClosing;

  console.log('🎯 AdMediaPlayer: Render decision', {
    displayAd: displayAd?.title || 'No title',
    shouldShowAdPlayer,
    isClosing,
    isPlaying,
    hasProgress: !!progress.currentTime
  });

  if (!shouldShowAdPlayer) {
    return null;
  }

  // For inline mini-player mode
  if (inlineMode && !isFullScreenOpen) {
    const adProgressSec = progress?.currentTime != null ? progress.currentTime / 1000 : 0;
    const adDurationSec = progress?.duration != null ? progress.duration / 1000 : 0;
    const sliderValue = Math.min(adProgressSec, adDurationSec || adProgressSec);

    return createPortal(
      <Box
        sx={{
          position: 'fixed',
          bottom: {
            xs: 'var(--bottom-nav-height, 70px)',
            sm: 'var(--bottom-nav-height, 70px)',
            md: 'var(--bottom-nav-height, 0px)',
            lg: 'var(--bottom-nav-height, 0px)',
          },
          left: 0,
          right: 0,
          backgroundColor: 'rgba(10, 10, 15, 0.98)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${alpha(accent, 0.2)}`,
          zIndex: (theme.zIndex?.appBar ?? 1100) + 300,
          px: { xs: 0.75, sm: 1, md: 1.5, lg: 2 },
          py: { xs: 0.5, sm: 0.5, md: 0.6, lg: 0.6 },
          height: 'var(--player-height, 68px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
         onClick={onOpenFullScreen}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          gap: { xs: 0.75, sm: 1, md: 1.5 }
        }}>
          {/* Artwork + text */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: '0 1 auto',
              minWidth: 0,
              width: { xs: 'auto', sm: '30%', md: '25%', lg: '22%' },
              gap: { xs: 0.75, sm: 1 },
              cursor: 'pointer'
            }}
           
         >
           <Box sx={{
             position: 'relative',
             width: 48,
             height: 48,
             borderRadius: 1,
             overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer'
           }}>
              {displayAd?.artwork ? (
                <img
                  src={displayAd.artwork}
                  alt={displayAd?.title || 'Ad'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: alpha(accent, 0.2),
                  color: accent
                }}>
                  AD
                </Box>
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                }}
              >
                {displayAd?.title || 'Advertisement'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  mt: 0.25,
                }}
              >
                {displayAd?.advertiser || 'Sponsored'}
              </Typography>
            </Box>
          </Box>

          {/* Center controls */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.25, sm: 0.5, md: 0.75 }
          }}>
            <IconButton size="small" disabled sx={{ color: alpha('#fff', 0.3) }}>
              <SkipPrevious />
            </IconButton>

            <IconButton
              size="small"
              onClick={onTogglePlay || togglePlayPause}
              sx={{
                backgroundColor: accent,
                color: theme.palette.getContrastText?.(accent) || '#0f0f0f',
                p: 1,
                '&:hover': { backgroundColor: accent }
              }}
            >
              {playing || externalPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton size="small" disabled sx={{ color: alpha('#fff', 0.3) }}>
              <SkipNext />
            </IconButton>
          </Box>

          {/* Right: fullscreen button */}
          <Box>
            <IconButton
              size="small"
              onClick={onOpenFullScreen}
              sx={{ color: alpha('#fff', 0.7), '&:hover': { color: accent } }}
            >
              <OpenInNew />
            </IconButton>
          </Box>
        </Box>

        {/* Progress */}
        <Slider
          value={sliderValue}
          max={adDurationSec || 0}
          min={0}
          disabled
          sx={{
            color: accent,
            height: 4,
            '& .MuiSlider-thumb': { display: 'none' },
            '& .MuiSlider-rail': { opacity: 0.2 }
          }}
        />
      </Box>,
      document.body
    );
  }

  // Full-screen ad player
  return createPortal(
    <Box
      data-ad-player="true"
      sx={{
        position: 'fixed',
        inset: 0,
        minHeight: '100vh',
        background: `linear-gradient(180deg, 
          ${alpha(theme.palette.primary.main, 0.15)} 0%,
          ${alpha('#050509', 0.96)} 45%,
          ${alpha('#030308', 0.98)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: displayAd?.artwork ? `url(${displayAd.artwork})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(16px)',
          opacity: 0.18,
          transform: 'scale(1.05)',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Sticky header similar to music player */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          background: alpha('#050509', 0.9),
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${alpha(accent, 0.2)}`,
        }}
      >
        <IconButton
          onClick={onCloseFullScreen}
          sx={{ color: '#fff', '&:hover': { bgcolor: alpha(accent, 0.2) } }}
        >
          <ArrowDownward />
        </IconButton>

        <Box sx={{ textAlign: 'center', px: 2, flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayAd?.title || 'Advertisement'}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
            {displayAd?.advertiser || 'Sponsored'}
          </Typography>
        </Box>

        <Box sx={{ width: 40 }} /> {/* spacer */}
      </Box>

   

{/* Hero Section - Match Music Player Layout */}
<Box
  sx={{
    minHeight: '100vh',
    display: 'grid',
    gridTemplateAreas: {
      xs: `"art"
           "info"
           "slider"
           "controls"
           "hint"`,
      md: `"art info"
           "slider slider"
           "controls controls"
           "hint hint"`
    },
    gridTemplateColumns: { 
      xs: '1fr', 
      sm: '1fr',
      md: 'minmax(300px, 1fr) minmax(0, 1.2fr)',
      lg: 'minmax(350px, 1fr) minmax(0, 1.2fr)',
      xl: 'minmax(400px, 1fr) minmax(0, 1.2fr)'
    },
    alignItems: 'center',
    gap: { xs: 4, md: 6, lg: 8 },
    width: '100%',
    maxWidth: { xs: '100%', md: '1400px', lg: '1600px' },
    mx: 'auto',
    p: { xs: 3, sm: 4, md: 5, lg: 6 },
    position: 'relative',
  }}
>
  {/* Album Art - Responsive container */}
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      maxWidth: { xs: '85vw', sm: '70vw', md: '100%' },
      height: { 
        xs: '85vw', 
        sm: '70vw', 
        md: 'calc(100vh - 200px)',
        lg: 'calc(100vh - 180px)',
        xl: 'calc(100vh - 160px)' 
      },
      maxHeight: { md: '600px', lg: '700px', xl: '800px' },
      justifySelf: 'center',
      alignSelf: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gridArea: 'art',
    }}
  >
    {/* Dynamic aspect ratio container */}
    <Box
      sx={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Album Art Image */}
      <Box
        component="img"
        src={displayAd?.artwork || ''}
        alt={displayAd?.title || 'Advertisement'}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: { xs: 3, md: 4, lg: 5 },
          boxShadow: `0 24px 60px ${alpha('#000', 0.7)}`,
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
          background: displayAd?.artwork ? 'none' : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        }}
      />
      
      {/* AD Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: alpha('#000', 0.8),
          borderRadius: 2,
          px: 2,
          py: 1,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha(accent, 0.4)}`,
          zIndex: 2,
        }}
      >
        <Typography variant="caption" sx={{ 
          color: accent, 
          fontSize: '0.75rem', 
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          ADVERTISEMENT
        </Typography>
      </Box>
      
      {/* Floating Play Button */}
      <Fab
        onClick={togglePlayPause}
        sx={{
          position: 'absolute',
          bottom: { xs: -25, md: -30, lg: -35 },
          right: { xs: 'calc(50% - 35px)', md: 30, lg: 40 },
          bgcolor: accent,
          color: theme.palette.getContrastText(accent),
          width: { xs: 70, md: 72, lg: 80 },
          height: { xs: 70, md: 72, lg: 80 },
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            transform: 'scale(1.05)',
          },
          boxShadow: `0 15px 40px ${alpha(accent, 0.45)}`,
          zIndex: 10,
        }}
      >
        {playing ? 
          <Pause sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} /> : 
          <PlayArrow sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} />
        }
      </Fab>
    </Box>
  </Box>

  {/* Right Column - Ad Info */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 3, md: 4, lg: 5 },
      height: '100%',
      minWidth: 0,
      justifyContent: { xs: 'flex-start', md: 'center' },
      alignSelf: { xs: 'flex-start', md: 'center' },
      pt: { xs: 0, md: 0 },
      gridArea: 'info',
    }}
  >
    {/* Ad Info */}
    <Box sx={{ 
      textAlign: { xs: 'center', md: 'left' }, 
      color: 'white',
      flex: 1,
      minWidth: 0,
      mx: { xs: 'auto', md: 0 },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 2, md: 2.5, lg: 3 },
      justifyContent: 'center',
    }}>
      {/* Sponsored Label */}
      <Typography
        variant="overline"
        sx={{
          color: alpha('#fff', 0.6),
          fontWeight: 600,
          fontSize: { xs: '0.7rem', md: '0.8rem' },
          letterSpacing: '1.5px',
        }}
      >
        SPONSORED MESSAGE
      </Typography>
      
      {/* Title with Gradient */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 900,
          fontSize: { 
            xs: '2.2rem', 
            sm: '2.8rem', 
            md: '3.2rem', 
            lg: '3.8rem', 
            xl: '4.2rem' 
          },
          lineHeight: 1.1,
          background: `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.8)})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {displayAd?.title || 'Advertisement'}
      </Typography>
      
      {/* Advertiser */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          fontSize: { 
            xs: '1.3rem', 
            sm: '1.6rem', 
            md: '1.9rem', 
            lg: '2.2rem' 
          },
          color: alpha('#fff', 0.9),
          lineHeight: 1.2,
        }}
      >
        Presented by {displayAd?.advertiser || 'Sponsored'}
      </Typography>

      {/* Description */}
      {displayAd?.description && (
        <Typography
          variant="body1"
          sx={{
            color: alpha('#fff', 0.85),
            fontSize: { 
              xs: '1rem', 
              sm: '1.1rem', 
              md: '1.2rem', 
              lg: '1.3rem' 
            },
            lineHeight: 1.7,
            mt: 1,
          }}
        >
          {displayAd.description}
        </Typography>
      )}

      {/* Stats - Show Ad Metrics */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'center', md: 'flex-start' }, 
        gap: { xs: 3, md: 4, lg: 5 },
        flexWrap: 'wrap',
        mt: { xs: 1, md: 2 }
      }}>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: accent, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {formatTime(progress.duration - progress.currentTime)}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Time Remaining
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: accent, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {displayAd?.views ? (displayAd.views > 1000000 
              ? `${(displayAd.views / 1000000).toFixed(1)}M` 
              : displayAd.views > 1000 
              ? `${(displayAd.views / 1000).toFixed(1)}K`
              : displayAd.views || '1.2K'
            ) : '1.2K'}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Views
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: accent, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {displayAd?.ctr ? `${displayAd.ctr}%` : '2.4%'}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            CTR
          </Typography>
        </Box>
      </Box>

      {/* CTA Button */}
      {displayAd?.clickThroughUrl && (
        <Button
          variant="contained"
          onClick={handleLearnMore}
          endIcon={<OpenInNew />}
          sx={{
            alignSelf: { xs: 'center', md: 'flex-start' },
            bgcolor: accent,
            color: theme.palette.getContrastText?.(accent) || '#000',
            px: 4,
            py: 1.5,
            mt: { xs: 2, md: 3 },
            fontSize: { xs: '1rem', md: '1.1rem' },
            fontWeight: 600,
            '&:hover': {
              bgcolor: alpha(accent, 0.9),
              transform: 'translateY(-2px)',
              boxShadow: `0 10px 25px ${alpha(accent, 0.3)}`,
            },
            transition: 'all 0.3s ease',
          }}
        >
          Learn More
        </Button>
      )}
    </Box>
  </Box>

  {/* Progress Bar */}
  <Box sx={{ 
    gridArea: 'slider',
    width: '100%',
    maxWidth: '100%',
    mx: 'auto',
    mt: { xs: 2, md: 3 }
  }}>
    <Slider
      value={progress.duration ? progress.currentTime / 1000 : 0}
      max={progress.duration ? progress.duration / 1000 : 0}
      min={0}
      disabled
      sx={{
        color: accent,
        height: { xs: 5, md: 6 },
        '& .MuiSlider-track': { 
          height: { xs: 5, md: 6 } 
        },
        '& .MuiSlider-thumb': {
          width: { xs: 14, md: 16 },
          height: { xs: 14, md: 16 },
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0 0 0 8px ${alpha(accent, 0.3)}`,
          }
        },
        '& .MuiSlider-rail': {
          height: { xs: 5, md: 6 },
          bgcolor: alpha('#fff', 0.15),
        }
      }}
    />
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mt: 1 
    }}>
      <Typography variant="body2" sx={{ 
        color: alpha('#fff', 0.8), 
        fontWeight: 500,
        fontSize: { xs: '0.85rem', md: '0.9rem' }
      }}>
        {formatTime(progress.currentTime)}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: alpha('#fff', 0.8), 
        fontWeight: 500,
        fontSize: { xs: '0.85rem', md: '0.9rem' }
      }}>
        {formatTime(progress.duration)}
      </Typography>
    </Box>
  </Box>

  {/* Main Controls */}
  <Box sx={{ 
    gridArea: 'controls',
    display: 'flex', 
    alignItems: 'center',
    justifyContent: { xs: 'center', md: 'center' },
    gap: { xs: 2, sm: 3, md: 4, lg: 5 },
    flexWrap: 'wrap',
    mt: { xs: 3, md: 4 }
  }}>
    {/* Previous Button - Disabled for Ads */}
    <IconButton
      disabled
      sx={{
        color: alpha('#fff', 0.3),
        fontSize: { xs: '2.2rem', md: '2.5rem', lg: '2.8rem' },
        '&.Mui-disabled': { color: alpha('#fff', 0.3) }
      }}
    >
      <SkipPrevious />
    </IconButton>

    {/* Play/Pause Button */}
    <IconButton
      onClick={togglePlayPause}
      sx={{
        bgcolor: accent,
        color: theme.palette.getContrastText(accent),
        width: { xs: 70, md: 80, lg: 90 },
        height: { xs: 70, md: 80, lg: 90 },
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
          transform: 'scale(1.05)',
        },
        boxShadow: `0 15px 35px ${alpha(accent, 0.4)}`,
      }}
    >
      {playing ? 
        <Pause sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} /> : 
        <PlayArrow sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} />
      }
    </IconButton>

    {/* Skip Ad Button */}
    <IconButton
      onClick={handleSkipAd}
      sx={{
        color: '#fff',
        fontSize: { xs: '2.2rem', md: '2.5rem', lg: '2.8rem' },
        '&:hover': { 
          color: accent,
          transform: 'scale(1.1)'
        },
      }}
    >
      <Close />
    </IconButton>

    {/* Volume Control */}
    <IconButton
      sx={{
        color: alpha('#fff', 0.8),
        fontSize: { xs: '1.8rem', md: '2rem', lg: '2.2rem' },
        '&:hover': { 
          color: accent,
          transform: 'scale(1.1)'
        }
      }}
    >
      <VolumeUp />
    </IconButton>
  </Box>

  {/* Scroll Indicator */}
  <Box sx={{ 
    gridArea: 'hint',
    textAlign: { xs: 'center', md: 'left' },
    display: { xs: 'block', lg: 'none' },
    mt: { xs: 4, md: 5 }
  }}>
    <Typography variant="caption" sx={{ 
      color: alpha('#fff', 0.6), 
      mb: 1, 
      display: 'block',
      fontSize: { xs: '0.8rem', md: '0.9rem' }
    }}>
      Scroll for ad details
    </Typography>
    <ExpandMore sx={{ 
      color: alpha('#fff', 0.6), 
      fontSize: { xs: '1.8rem', md: '2rem' } 
    }} />
  </Box>
</Box>

// Remove the old bottom player controls section completely
// The controls are now part of the hero section


      
    </Box>,
    document.body
  );
};
