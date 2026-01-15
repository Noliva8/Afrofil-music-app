import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Button,
  Paper,
  Container,
  Avatar,
  Fab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Favorite,
  FavoriteBorder,
  Shuffle,
  Repeat,
  RepeatOne,
  ArrowDownward,
  Lyrics,
  Person,
  MusicNote,
  Share,
  Download,
  PlaylistAdd,
  MoreVert,
  ExpandMore,
  PersonAdd
} from '@mui/icons-material';
import { useNowPlayingArtwork } from '../../utils/Contexts/useNowPlayingArtwork';
import { useArtistFollowers } from '../../utils/Contexts/followers/useArtistFollowers';
import { useUser } from '../../utils/Contexts/userContext';
import { SHARE_SONG } from '../../utils/queries';
import useArtistDownload from '../../utils/Contexts/artisDownload/useArtistDownload';



const DEFAULT_COVER = 'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#0f0f0f" offset="0"/><stop stop-color="#1a1a1a" offset="1"/>
        </linearGradient>
        <radialGradient id="shine">
          <stop offset="0%" stop-color="#E4C421" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#E4C421" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <circle cx="300" cy="300" r="250" fill="url(#shine)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#e4c421" font-size="48" font-family="Arial, sans-serif" font-weight="bold">AFROFEEL</text>
    </svg>`
  );

const FullScreenMediaPlayer = ({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onSliderChange,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle = () => {},
  onToggleRepeat = () => {},
  isShuffled = false,
  repeatMode = 'none',
  queueLength = 0,
  onToggleFavorite = () => {},
  isFavorite = false,
  queue = [],
  isAdPlaying = false,
  isTeaser = false,
  teaserDuration = 30,
  onSliderCommit
}) => {
  const theme = useTheme();
  const [shareSong] = useMutation(SHARE_SONG);
  const { user } = useUser();
  const { toggleFollow, loading: followLoading } = useArtistFollowers();
  const { recordDownload, loading: downloading } = useArtistDownload();
  const scrollRef = useRef(null);
  const touchStart = useRef(null);
  const scrollPositionRef = useRef(0); // Track scroll position
  const horizontalScrollLockRef = useRef(0); // Cooldown to avoid multiple next/prev on a single scroll gesture
  const horizontalAccumRef = useRef(0); // accumulate deltaX over a short window
  const horizontalTimerRef = useRef(null);
  const { artworkUrl } = useNowPlayingArtwork({ currentTrack: currentSong });


const [showReadMore, setShowReadMore] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const bioRef = useRef(null);



  const sanitizeCover = (src) => {
    if (!src) return null;
    if (/placehold\.co/i.test(src)) return null;
    return src;
  };

  const displayImageSrc =
    sanitizeCover(artworkUrl) ||
    sanitizeCover(currentSong?.artworkUrl) ||
    sanitizeCover(currentSong?.cover) ||
    DEFAULT_COVER;

  const resolveArtistText = (artist) => {
    if (!artist) return '';
    if (typeof artist === 'string') return artist;
    if (Array.isArray(artist)) return artist.filter(Boolean).join(', ');
    return (
      artist.artistAka ||
      artist.fullName ||
      artist.artistName ||
      artist.name ||
      ''
    );
  };

  const currentTrackId = currentSong?.id || currentSong?._id;
  const recommendations = Array.isArray(queue)
    ? queue
        .filter((item) => String(item?.id ?? item?._id ?? '') !== String(currentTrackId ?? ''))
        .slice(0, 4)
    : [];
  const displayTitle = currentSong?.title || currentSong?.name || 'No song playing';
  const displayArtist = resolveArtistText(currentSong?.artist) || currentSong?.artistName || 'Unknown Artist';
  const displayAlbum = currentSong?.albumName || 'Single';
  const download = currentSong.artistDownloadCounts || 0
  const artistBio = currentSong?.artistBio || `${displayArtist} is an acclaimed artist blending traditional African rhythms with contemporary sounds.`;
  const artistId = currentSong?.artistId || currentSong?.artist?._id || currentSong?.artistId;

  const readFollowCache = (id) => {
    if (!id) return null;
    try {
      const raw = localStorage.getItem(`artist-follow-${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const followCache = readFollowCache(artistId);
  const initialFollowing = (followCache?.isFollowing ?? Boolean(
    currentSong?.artist?.isFollowing ??
    currentSong?.isFollowing ??
    currentSong?.isFollowed
  ));
  const initialFollowerCount = typeof followCache?.followerCount === 'number'
    ? followCache.followerCount
    : Number(currentSong?.artistFollowers ?? 0);

  const [artistFollowers, setArtistFollowers] = useState(initialFollowerCount);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [downloadCount, setDownloadCount] = useState(Number(currentSong?.downloadCount ?? 0));
  const [downloadInFlight, setDownloadInFlight] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const effectiveDuration = isTeaser
    ? Math.min(Number(duration) || teaserDuration, currentSong?.maxDuration || teaserDuration)
    : duration;
  const clampedCurrentTime = isTeaser
    ? Math.min(currentTime, effectiveDuration || teaserDuration)
    : currentTime;
  useEffect(() => {
    const cache = readFollowCache(artistId);
    const freshFollowers = Number(currentSong?.artistFollowers ?? 0);
    const nextCount = typeof cache?.followerCount === 'number' ? cache.followerCount : freshFollowers;
    const nextFollowing = cache?.isFollowing ?? Boolean(
      currentSong?.artist?.isFollowing ??
      currentSong?.isFollowing ??
      currentSong?.isFollowed
    );
    setArtistFollowers(nextCount);
    setIsFollowing(nextFollowing);
  }, [
    artistId,
    currentSong?.artistFollowers,
    currentSong?.artist?.isFollowing,
    currentSong?.isFollowing,
    currentSong?.isFollowed,
    currentSong?.id,
    currentSong?._id
  ]);
  useEffect(() => {
    setDownloadCount(Number(currentSong?.downloadCount ?? 0));
  }, [currentSong?.downloadCount, currentSong?.id, currentSong?._id]);
  const handleSliderCommit = (_, newValue) => {
    const maxAllowed = isTeaser ? Math.min(duration, teaserDuration) : duration;
    const clamped = Math.min(newValue, maxAllowed);
    onSeek?.(clamped);
  };
  


  
  const handleShare = async () => {
    const songId = currentSong?.id || currentSong?._id;
    if (!songId) return;
    const shareUrl = `${window.location.origin}/track/${songId}`;
    try {
      await shareSong({ variables: { songId } });
    } catch (err) {
      console.error('Share song mutation failed', err);
    }
    if (navigator?.share) {
      navigator
        .share({
          title: displayTitle,
          text: `Listen to ${displayTitle} by ${displayArtist}`,
          url: shareUrl
        })
        .catch(() => {});
    } else if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }
  };

  const handleDownload = async () => {
    if (downloadInFlight) return;
    const artistIdSafe = currentSong?.artistId || currentSong?.artist?._id;
    const userId = user?._id;
    const audioUrl = currentSong?.audioUrl || currentSong?.url;
    if (!artistIdSafe || !userId) return;
    try {
      setDownloadInFlight(true);
      await recordDownload({
        artistId: artistIdSafe,
        userId,
        role: user?.plan || user?.role || 'free'
      });
      setDownloadCount((prev) => prev + 1);

      // Cache audio for offline playback (best effort)
      if (audioUrl && 'caches' in window) {
        try {
          const cache = await caches.open('afrofeel-audio');
          const existing = await cache.match(audioUrl);
          if (!existing) {
            const response = await fetch(audioUrl, { mode: 'cors' });
            if (response.ok) {
              await cache.put(audioUrl, response.clone());
            }
          }
        } catch (cacheErr) {
          console.warn('Audio cache failed', cacheErr);
        }
      }
    } catch (err) {
      console.error('Download tracking failed', err);
      setShowUpgradePrompt(true);
    } finally {
      setDownloadInFlight(false);
    }
  };
  
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const lyrics = currentSong?.lyrics || 'No lyrics available for this track.';

  const credits = currentSong?.credits || [
    { role: 'Producer', name: 'Jamal Williams' },
    { role: 'Composer', name: 'Amina Diallo' },
    { role: 'Lyricist', name: 'Kwame Osei' },
    { role: 'Vocals', name: displayArtist },
    { role: 'Mixing', name: 'Sofia Chen' }
  ];
  const expandedCredits = React.useMemo(() => {
    const list = Array.isArray(credits) ? [...credits] : [];
    if (currentSong?.label) {
      list.push({ role: 'Label', name: currentSong.label });
    }
    if (Array.isArray(currentSong?.featuringArtist)) {
      currentSong.featuringArtist.forEach((feat) => {
        if (feat) list.push({ role: 'Featuring', name: feat });
      });
    }
    return list;
  }, [credits, currentSong?.label, currentSong?.featuringArtist]);

  const controlsDisabled = isAdPlaying;

  // Track scroll position so we can restore it when reopening the player
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
  }, []);

  // Only restore scroll position when the modal opens; doing this on every
  // playback tick was fighting user scrolling while music played.
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') onPrev?.();
      else if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onPrev, onNext]);

  // Mouse/trackpad horizontal scroll -> next/previous track
  const handleHorizontalScroll = useCallback((e) => {
    // Ignore mostly vertical gestures to preserve normal scrolling
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.6 && Math.abs(e.deltaX) < 8) return;

    // Accumulate horizontal deltas over a short window for smoother trackpad gestures
    horizontalAccumRef.current += e.deltaX;
    if (horizontalTimerRef.current) clearTimeout(horizontalTimerRef.current);
    horizontalTimerRef.current = setTimeout(() => {
      horizontalAccumRef.current = 0;
    }, 200);

    const now = Date.now();
    if (now - horizontalScrollLockRef.current < 500) return; // debounce

    if (horizontalAccumRef.current > 60) {
      onNext?.();
      horizontalScrollLockRef.current = now;
      horizontalAccumRef.current = 0;
    } else if (horizontalAccumRef.current < -60) {
      onPrev?.();
      horizontalScrollLockRef.current = now;
      horizontalAccumRef.current = 0;
    }
  }, [onNext, onPrev]);

  // Touch swipe for prev/next
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 80 && dt < 600) {
      if (dx < 0) onNext?.();
      else onPrev?.();
    }
  };

  // Prevent body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset scroll position when opening
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        scrollPositionRef.current = 0;
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Debounced progress bar update to prevent excessive re-renders
  const [debouncedCurrentTime, setDebouncedCurrentTime] = useState(currentTime);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCurrentTime(currentTime);
    }, 100); // Update every 100ms instead of continuously
    
    return () => clearTimeout(timer);
  }, [currentTime]);

  if (!isOpen) return null;

  const artworkSize = 'clamp(260px, 35vw, 520px)';



  // Effect to check if bio needs truncation
  useEffect(() => {
    if (bioRef.current && !isBioExpanded) {
      // Check if content is taller than container
      const needsTruncation = bioRef.current.scrollHeight > bioRef.current.clientHeight;
      setShowReadMore(needsTruncation);
    } else {
      setShowReadMore(false);
    }
  }, [artistBio, isBioExpanded]);

  const toggleBioExpansion = () => {
    setIsBioExpanded(!isBioExpanded);
  };

  return createPortal(
    <>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Keep below global modals (auth, system notices)
        zIndex: Math.max((theme.zIndex.modal || 1300) - 1, 1200),
        overflow: 'hidden',
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dynamic Background - Fixed */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(180deg, 
            ${alpha(theme.palette.primary.main, 0.4)} 0%,
            ${alpha('#0A0A0F', 0.95)} 40%,
            ${alpha('#050509', 0.98)} 100%
          )`,
          zIndex: 0,
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${displayImageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            filter: 'blur(10px)',
            backgroundAttachment: 'fixed',
          }
        }}
      />

      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: alpha('#050509', 0.95),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
          }}
        >
          <ArrowDownward />
        </IconButton>

        <Box sx={{ textAlign: 'center', mx: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
            {displayTitle}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontSize: '0.75rem' }}>
            {displayArtist}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handleShare} sx={{ color: 'white' }}>
            <Share fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white' }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Scroll Container */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleHorizontalScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.primary.main, 0.5)} ${alpha('#000', 0.2)}`,
          '&::-webkit-scrollbar': { 
            width: '6px',
          },
          '&::-webkit-scrollbar-track': { 
            background: alpha('#000', 0.2),
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.5),
            borderRadius: '3px',
            '&:hover': { background: alpha(theme.palette.primary.main, 0.8) }
          },
          position: 'relative',
          zIndex: 1,
        }}
      >



        
        {/* Hero Section - Fixed height viewport */}
    <Box
  sx={{
    minHeight: '100vh',
    display: 'grid',
    gridTemplateAreas: {
      xs: `"art"
           "info"
           "actions"
           "slider"
           "controls"
           "hint"`,
      md: `"art info"
           "actions actions"
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
        src={displayImageSrc}
        alt={displayTitle}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: { xs: 3, md: 4, lg: 5 },
          boxShadow: `0 24px 60px ${alpha('#000', 0.7)}`,
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          }
        }}
      />
      
      {/* Floating Play Button */}
      <Fab
        onClick={controlsDisabled ? undefined : onPlayPause}
        disabled={controlsDisabled}
        sx={{
          position: 'absolute',
          bottom: { xs: -25, md: -30, lg: -35 },
          right: { xs: 'calc(50% - 35px)', md: 30, lg: 40 },
          bgcolor: theme.palette.primary.main,
          color: theme.palette.getContrastText(theme.palette.primary.main),
          width: { xs: 70, md: 72, lg: 80 },
          height: { xs: 70, md: 72, lg: 80 },
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            transform: 'scale(1.05)',
          },
          boxShadow: `0 15px 40px ${alpha(theme.palette.primary.main, 0.45)}`,
          zIndex: 10,
        }}
      >
        {isPlaying ? 
          <Pause sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} /> : 
          <PlayArrow sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} />
        }
      </Fab>
    </Box>
  </Box>

  {/* Right Column - Song Info & Controls */}
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
    {/* Song Info */}
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
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {displayTitle}
      </Typography>
      
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
        {displayArtist}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 400,
          color: alpha('#fff', 0.7),
          fontSize: { 
            xs: '1rem', 
            sm: '1.1rem', 
            md: '1.2rem', 
            lg: '1.3rem' 
          },
        }}
      >
        Album: {displayAlbum} • {currentSong?.releaseYear || '-'}
      </Typography>

      {/* Stats */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'center', md: 'flex-start' }, 
        gap: { xs: 3, md: 4, lg: 5 },
        flexWrap: 'wrap',
        mt: { xs: 1, md: 2 }
      }}>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {currentSong?.playCount ? (currentSong.playCount > 1000000 
              ? `${(currentSong.playCount / 1000000).toFixed(1)}M` 
              : currentSong.playCount > 1000 
              ? `${(currentSong.playCount / 1000).toFixed(1)}K`
              : currentSong.playCount
            ) : '1.2M'}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Plays
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {currentSong?.likesCount || '45K'}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Likes
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {typeof currentSong?.shareCount === 'number' ? currentSong.shareCount : 0}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Shares
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h5" sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 700,
            fontSize: { xs: '1.4rem', md: '1.6rem', lg: '1.8rem' }
          }}>
            {download ? (download > 1000000 
              ? `${(download / 1000000).toFixed(1)}M` 
              : download > 1000 
              ? `${(download / 1000).toFixed(1)}K`
              : download
            ) : 0}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: alpha('#fff', 0.6), 
            fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' }
          }}>
            Downloads
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>

  {/* Action Buttons (Favorite, Download, PlaylistAdd) - ABOVE SLIDER */}
  <Box
    sx={{
      gridArea: 'actions',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: { xs: 1.5, md: 2 },
      width: '100%',
      mb: { xs: 1, md: 2 }
    }}
  >
    <IconButton
      onClick={controlsDisabled ? undefined : onToggleFavorite}
      disabled={controlsDisabled}
      sx={{
        color: isFavorite ? '#ff4081' : alpha('#fff', 0.8),
        fontSize: { xs: '1.8rem', md: '2rem', lg: '2.2rem' },
        '&:hover': { 
          color: '#ff4081',
          transform: 'scale(1.1)'
        }
      }}
    >
      {isFavorite ? <Favorite /> : <FavoriteBorder />}
    </IconButton>

    <IconButton
      sx={{
        color: '#fff',
        fontSize: { xs: '1.8rem', md: '2rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        },
        '&.Mui-disabled': { color: alpha('#fff', 0.3) }
      }}
      aria-label="Download"
      onClick={controlsDisabled ? undefined : handleDownload}
      disabled={controlsDisabled || downloading || downloadInFlight || !user?._id}
    >
      {downloadInFlight ? (
        <CircularProgress size={24} sx={{ color: '#fff' }} />
      ) : (
        <Download />
      )}
    </IconButton>

    <IconButton
      disabled={controlsDisabled}
      sx={{
        color: '#fff',
        fontSize: { xs: '1.8rem', md: '2rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        },
        '&.Mui-disabled': { color: alpha('#fff', 0.3) }
      }}
      aria-label="Add to playlist"
    >
      <PlaylistAdd />
    </IconButton>
  </Box>

  {/* Progress Bar */}
  <Box sx={{ 
    gridArea: 'slider',
    width: '100%',
    maxWidth: '100%',
    mx: 'auto',
    mt: { xs: 0, md: 0 } // Reduced margin since buttons are now above
  }}>
    <Slider
      value={Math.min(debouncedCurrentTime, effectiveDuration || teaserDuration)}
      max={effectiveDuration || 100}
      onChange={isAdPlaying ? undefined : (onSliderChange || onSeek)}
      onChangeCommitted={controlsDisabled ? undefined : handleSliderCommit}
      disabled={controlsDisabled}
      sx={{
        color: theme.palette.primary.main,
        height: { xs: 5, md: 6 },
        '& .MuiSlider-track': { 
          height: { xs: 5, md: 6 } 
        },
        '& .MuiSlider-thumb': {
          width: { xs: 14, md: 16 },
          height: { xs: 14, md: 16 },
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.3)}`,
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
        {formatTime(isTeaser ? Math.min(debouncedCurrentTime, effectiveDuration || teaserDuration) : debouncedCurrentTime)}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: alpha('#fff', 0.8), 
        fontWeight: 500,
        fontSize: { xs: '0.85rem', md: '0.9rem' }
      }}>
        {formatTime(effectiveDuration || duration)}
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
    <IconButton
      onClick={controlsDisabled ? undefined : onToggleShuffle}
      disabled={controlsDisabled}
      sx={{
        color: isShuffled ? theme.palette.primary.main : alpha('#fff', 0.8),
        fontSize: { xs: '1.6rem', md: '1.8rem', lg: '2rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        }
      }}
    >
      <Shuffle />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onPrev}
      disabled={controlsDisabled || queueLength <= 1}
      sx={{
        color: '#fff',
        fontSize: { xs: '2.2rem', md: '2.5rem', lg: '2.8rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        },
        '&.Mui-disabled': { color: alpha('#fff', 0.3) }
      }}
    >
      <SkipPrevious />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onPlayPause}
      disabled={controlsDisabled}
      sx={{
        bgcolor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
        width: { xs: 70, md: 80, lg: 90 },
        height: { xs: 70, md: 80, lg: 90 },
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
          transform: 'scale(1.05)',
        },
        boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.4)}`,
      }}
    >
      {isPlaying ? 
        <Pause sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} /> : 
        <PlayArrow sx={{ fontSize: { xs: 32, md: 36, lg: 40 } }} />
      }
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onNext}
      disabled={controlsDisabled || queueLength <= 1}
      sx={{
        color: '#fff',
        fontSize: { xs: '2.2rem', md: '2.5rem', lg: '2.8rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        },
        '&.Mui-disabled': { color: alpha('#fff', 0.3) }
      }}
    >
      <SkipNext />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onToggleRepeat}
      disabled={controlsDisabled}
      sx={{
        color: repeatMode !== 'none' ? theme.palette.primary.main : alpha('#fff', 0.8),
        fontSize: { xs: '1.6rem', md: '1.8rem', lg: '2rem' },
        '&:hover': { 
          color: theme.palette.primary.main,
          transform: 'scale(1.1)'
        }
      }}
    >
      {repeatMode === 'one' ? <RepeatOne /> : <Repeat />}
    </IconButton>
  </Box>

  {/* Scroll Indicator - Only show on mobile/tablet */}
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
      Scroll for lyrics, credits, and more
    </Typography>
    <ExpandMore sx={{ 
      color: alpha('#fff', 0.6), 
      fontSize: { xs: '1.8rem', md: '2rem' } 
    }} />
  </Box>
</Box>





        {/* Content Section */}
        <Box sx={{ 
          bgcolor: alpha('#050509', 0.9),
          minHeight: '100vh',
          pt: 4,
          backdropFilter: 'blur(10px)',
        }}>
          <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, px: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 4, lg: 6 }, alignItems: 'start' }}>
              <Box sx={{ display: 'grid', gap: 3 }}>


                <Paper
                  sx={{
                    bgcolor: alpha('#111119', 0.75),
                    backdropFilter: 'blur(18px)',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    p: { xs: 3, sm: 4 },
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
                    Lyrics
                  </Typography>
                  <Box
                    sx={{
                      color: alpha('#fff', 0.95),
                      lineHeight: 2,
                      fontSize: '1.1rem',
                      whiteSpace: 'pre-line',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {lyrics}
                  </Box>
                </Paper>


<Paper
      sx={{
        bgcolor: alpha('#111119', 0.75),
        backdropFilter: 'blur(18px)',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        p: { xs: 3, sm: 4 },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: 3, 
        mb: 3, 
        flexWrap: 'wrap' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 3,
          flex: 1,
          minWidth: 0
        }}>
          <Avatar
            src={displayImageSrc}
            sx={{
              width: { xs: 70, sm: 90 },
              height: { xs: 70, sm: 90 },
              border: `3px solid ${theme.palette.primary.main}`,
              flexShrink: 0
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ 
              color: '#fff', 
              fontWeight: 700, 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {displayArtist}
            </Typography>
            <Typography sx={{ 
              color: alpha('#fff', 0.8),
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}>
              {currentSong?.country || 'Global Artist'} • {currentSong?.artist?.genre || 'Afrobeat'}
            </Typography>
            
            {/* Stats Row */}
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              mt: 2,
              flexWrap: 'wrap'
            }}>
              <Box>
                <Typography sx={{ 
                  color: theme.palette.primary.main, 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.2rem' }
                }}>
                  {artistFollowers
                    ? artistFollowers > 1000000
                      ? `${(artistFollowers / 1000000).toFixed(1)}M`
                      : artistFollowers > 1000
                      ? `${(artistFollowers / 1000).toFixed(1)}K`
                      : artistFollowers
                    : 0}
                </Typography>

                <Typography sx={{ 
                  color: alpha('#fff', 0.6), 
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }}>
                  Followers
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ 
                  color: theme.palette.primary.main, 
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.2rem' }
                }}>
                  {currentSong?.artist?.songs ? 
                    currentSong.artist.songs > 1000 
                      ? `${(currentSong.artist.songs / 1000).toFixed(1)}K` 
                      : currentSong.artist.songs
                    : '24'
                  }
                </Typography>
                <Typography sx={{ 
                  color: alpha('#fff', 0.6), 
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }}>
                  Songs
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Follow Button */}
        <Button
          variant="contained"
          startIcon={isFollowing ? <Person /> : <PersonAdd />}
          sx={{
            bgcolor: isFollowing 
              ? alpha(theme.palette.primary.main, 0.1)
              : theme.palette.primary.main,
            color: isFollowing 
              ? theme.palette.primary.main
              : theme.palette.getContrastText(theme.palette.primary.main),
            px: { xs: 3, sm: 4 },
            py: { xs: 1, sm: 1.25 },
            borderRadius: 2,
            border: isFollowing 
              ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              : 'none',
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            '&:hover': {
              bgcolor: isFollowing 
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.9),
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            minWidth: { xs: '100%', sm: 'auto' }
          }}
          onClick={() => {
            if (!artistId || !user?._id) return;
            const nextFollowing = !isFollowing;
            const optimistic = typeof artistFollowers === 'number'
              ? Math.max(0, artistFollowers + (nextFollowing ? 1 : -1))
              : artistFollowers;
            if (typeof optimistic === 'number') setArtistFollowers(optimistic);
            setIsFollowing(nextFollowing);

            toggleFollow({ artistId, userId: user._id })
              .then((count) => {
                const finalCount = typeof count === 'number' ? count : optimistic;
                if (typeof finalCount === 'number') {
                  setArtistFollowers(finalCount);
                  try {
                    localStorage.setItem(
                      `artist-follow-${artistId}`,
                      JSON.stringify({ isFollowing: nextFollowing, followerCount: finalCount })
                    );
                  } catch {}
                }
              })
              .catch((err) => {
                console.error('Follow toggle failed', err);
              });
          }}
          disabled={followLoading || !artistId || !user?._id}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      
    </Box>

      <Typography variant="h5" sx={{ 
        mb: 2, 
        color: '#fff', 
        fontWeight: 600,
        fontSize: { xs: '1.25rem', sm: '1.5rem' }
      }}>
        Biography
      </Typography>
      
      {/* Responsive Biography Text Container */}
      <Box
        ref={(el) => {
          // Check if bio needs truncation (only on mount)
          if (el && !isBioExpanded) {
            const needsTruncation = el.scrollHeight > el.clientHeight;
            setShowReadMore(needsTruncation);
          }
        }}
        sx={{
          position: 'relative',
          maxHeight: isBioExpanded ? 'none' : { 
            xs: '200px', 
            sm: '250px', 
            md: 'none' 
          },
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          '&::after': !isBioExpanded ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: { xs: '60px', sm: '80px' },
            background: `linear-gradient(transparent, ${alpha('#111119', 0.9)})`,
            display: { xs: 'block', md: 'none' },
            pointerEvents: 'none'
          } : {}
        }}
      >
        <Typography sx={{ 
          color: alpha('#fff', 0.95), 
          lineHeight: { xs: 1.7, sm: 1.8, md: 1.8 },
          fontSize: { 
            xs: '0.9rem',
            sm: '0.95rem',
            md: '1rem',
            lg: '1.05rem'
          },
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          textAlign: 'justify',
          textJustify: 'inter-word'
        }}>
          {artistBio}
        </Typography>
      </Box>
      
      {/* Read More/Less Button */}
      {artistBio.length > 200 && ( // Only show if bio is long enough
        <Button
          variant="text"
          size="small"
          onClick={toggleBioExpansion}
          sx={{
            display: 'flex',
            mt: 2,
            color: theme.palette.primary.main,
            fontSize: '0.85rem',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          {isBioExpanded ? 'Show less' : 'Read more'}
          <Box component="span" sx={{ 
            ml: 0.5,
            transform: isBioExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ExpandMore />
          </Box>
        </Button>
      )}
    </Paper>

<Paper
  sx={{
    bgcolor: alpha('#111119', 0.75),
    backdropFilter: 'blur(18px)',
    borderRadius: 3,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    p: { xs: 3, sm: 4 },
  }}
>
  <Typography variant="h4" sx={{ mb: 4, color: '#fff', fontWeight: 700 }}>
    Credits
  </Typography>
  
  {/* Single Card Container */}
  <Box sx={{ 
    bgcolor: alpha('#000', 0.3),
    borderRadius: 2,
    border: `1px solid ${alpha('#fff', 0.1)}`,
    overflow: 'hidden',
  }}>
    
    {/* Card Header - Record Label */}
    {currentSong?.label && (
      <Box sx={{
        p: { xs: 2.5, sm: 3 },
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Box sx={{ 
          width: { xs: 36, sm: 40 }, 
          height: { xs: 36, sm: 40 }, 
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Typography sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 800,
            fontSize: { xs: '1rem', sm: '1.2rem' }
          }}>
            L
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ 
            color: alpha('#fff', 0.7), 
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Record Label
          </Typography>
          <Typography sx={{ 
            color: '#fff', 
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            mt: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentSong.label}
          </Typography>
        </Box>
      </Box>
    )}

    {/* All Credits Content */}
    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
      
      {/* Responsive Grid for Credits */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        },
        gap: { xs: 2.5, sm: 3 }
      }}>
        
        {/* Composer Section */}
        {currentSong?.composer && currentSong.composer.length > 0 && (
          <Box>
            <Typography sx={{ 
              color: theme.palette.secondary?.main || '#1db954', 
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              letterSpacing: '0.5px',
              mb: { xs: 1.5, sm: 2 },
              textTransform: 'uppercase'
            }}>
              Composer
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              {currentSong.composer.map((composer, index) => (
                <Box key={index}>
                  <Typography sx={{ 
                    color: '#fff', 
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    mb: 0.25,
                    lineHeight: 1.2
                  }}>
                    {composer.name}
                  </Typography>
                  <Typography sx={{ 
                    color: alpha('#fff', 0.7), 
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    lineHeight: 1.3
                  }}>
                    {composer.contribution || 'Composer'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Producer Section */}
        {currentSong?.producer && currentSong.producer.length > 0 && (
          <Box>
            <Typography sx={{ 
              color: theme.palette.success?.main || '#1ed760', 
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              letterSpacing: '0.5px',
              mb: { xs: 1.5, sm: 2 },
              textTransform: 'uppercase'
            }}>
              Producer
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              {currentSong.producer.map((producer, index) => (
                <Box key={index}>
                  <Typography sx={{ 
                    color: '#fff', 
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    mb: 0.25,
                    lineHeight: 1.2
                  }}>
                    {producer.name}
                  </Typography>
                  <Typography sx={{ 
                    color: alpha('#fff', 0.7), 
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    lineHeight: 1.3
                  }}>
                    {producer.role || 'Producer'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Featuring Section */}
        {currentSong?.featuringArtist && currentSong.featuringArtist.length > 0 && (
          <Box>
            <Typography sx={{ 
              color: theme.palette.warning?.main || '#ffa42b', 
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              letterSpacing: '0.5px',
              mb: { xs: 1.5, sm: 2 },
              textTransform: 'uppercase'
            }}>
              Featuring
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              {currentSong.featuringArtist.map((artist, index) => (
                <Box key={index}>
                  <Typography sx={{ 
                    color: '#fff', 
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    mb: 0.25,
                    lineHeight: 1.2
                  }}>
                    {artist}
                  </Typography>
                  <Typography sx={{ 
                    color: alpha('#fff', 0.7), 
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    lineHeight: 1.3
                  }}>
                    Featured Artist
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Other Credits Section */}
        {credits && credits.length > 0 && (
          <Box sx={{ 
            gridColumn: { 
              xs: 'span 1', 
              sm: credits.length > 2 ? 'span 2' : 'span 1',
              md: 'span 1' 
            }
          }}>
            <Typography sx={{ 
              color: theme.palette.info?.main || '#0d72ea', 
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              letterSpacing: '0.5px',
              mb: { xs: 1.5, sm: 2 },
              textTransform: 'uppercase'
            }}>
              Other Credits
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)',
                md: '1fr' 
              },
              gap: { xs: 1.5, sm: 2 }
            }}>
              {credits.map((credit, index) => (
                <Box key={index}>
                  <Typography sx={{ 
                    color: '#fff', 
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    mb: 0.25,
                    lineHeight: 1.2
                  }}>
                    {credit.name}
                  </Typography>
                  <Typography sx={{ 
                    color: alpha('#fff', 0.7), 
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    lineHeight: 1.3
                  }}>
                    {credit.role}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
      </Box> {/* Close responsive grid */}
    </Box> {/* Close credits content */}
  </Box> {/* Close single card container */}

  {/* Empty State */}
  {!currentSong?.label && 
   !currentSong?.composer?.length && 
   !currentSong?.producer?.length && 
   !currentSong?.featuringArtist?.length && 
   !credits?.length && (
    <Box sx={{ 
      p: { xs: 4, sm: 6 }, 
      textAlign: 'center',
      color: alpha('#fff', 0.5),
      bgcolor: alpha('#fff', 0.03),
      borderRadius: 2,
      border: `1px dashed ${alpha('#fff', 0.1)}`
    }}>
      <Typography variant="h6" sx={{ 
        mb: 2,
        fontSize: { xs: '1rem', sm: '1.1rem' }
      }}>
        No credit information available
      </Typography>
      <Typography variant="body2" sx={{ 
        fontSize: { xs: '0.85rem', sm: '0.9rem' }
      }}>
        Credit details will appear here once added
      </Typography>
    </Box>
  )}
</Paper>






              </Box>

              <Box sx={{ position: 'sticky', top: 90 }}>
                <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 700, textAlign: { xs: 'center', lg: 'left' } }}>
                  More Like This
                </Typography>
                {recommendations.length > 0 ? (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '1fr' }, 
                    gap: 3 
                  }}>
                    {recommendations.map((rec, idx) => {
                      const recCover = sanitizeCover(rec?.artworkUrl || rec?.cover || rec?.artworkPresignedUrl) || DEFAULT_COVER;
                      const recTitle = rec?.title || 'Untitled';
                      const recArtist = resolveArtistText(rec?.artist) || rec?.artistName || 'Unknown Artist';
                      return (
                        <Paper
                          key={`${rec?.id || rec?._id || idx}`}
                          sx={{
                            bgcolor: alpha('#111119', 0.8),
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: `1px solid ${alpha('#fff', 0.1)}`,
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              component="img"
                              src={recCover}
                              sx={{ width: '100%', height: 160, objectFit: 'cover' }}
                            />
                            <IconButton
                              disabled
                              sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                bgcolor: theme.palette.primary.main,
                                color: '#000',
                                opacity: 0.7
                              }}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Box>
                          <Box sx={{ p: 2 }}>
                            <Typography sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }} noWrap>
                              {recTitle}
                            </Typography>
                            <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.9rem' }} noWrap>
                              {recArtist}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    border: `1px dashed ${alpha('#fff', 0.1)}`, 
                    color: alpha('#fff', 0.7),
                    textAlign: 'center',
                    bgcolor: alpha('#111119', 0.4)
                  }}>
                    <Typography variant="body2">
                      Recommendations will appear here once the queue has more songs.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Container>
        </Box>
        </Box>
      </Box>


      <Dialog
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#050509', 0.95),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 20px 50px ${alpha('#000', 0.6)}`,
            backdropFilter: 'blur(18px)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>
          Upgrade Required
        </DialogTitle>
        <DialogContent sx={{ color: alpha('#fff', 0.9), pb: 1 }}>
          Downloading songs is available for premium members. Upgrade to keep your favorites offline.
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setShowUpgradePrompt(false)}
            sx={{ color: alpha('#fff', 0.8) }}
          >
            Maybe later
          </Button>
          <Button
            variant="contained"
            onClick={() => { window.location.href = '/premium'; }}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      
    </>,
    document.body
  );
};

export const useFullScreenPlayer = () => {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const openFullScreen = useCallback(() => setIsFullScreenOpen(true), []);
  const closeFullScreen = useCallback(() => setIsFullScreenOpen(false), []);

  // Keep component identity stable while the player is open so it doesn't
  // remount on every playback tick and reset scroll position.
  const FullScreenPlayer = useCallback((props) => (
    <FullScreenMediaPlayer
      isOpen={isFullScreenOpen}
      onClose={closeFullScreen}
      {...props}
    />
  ), [isFullScreenOpen, closeFullScreen]);

  return {
    isFullScreenOpen,
    openFullScreen,
    closeFullScreen,
    FullScreenPlayer
  };
};

export default FullScreenMediaPlayer;

// Upgrade prompt dialog (mounted with player)
const UpgradePrompt = ({ open, onClose, onUpgrade }) => {
  const theme = useTheme();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Upgrade Required</DialogTitle>
      <DialogContent sx={{ color: alpha('#000', 0.8) }}>
        Downloading songs is available for premium members. Upgrade to keep your favorites offline.
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Maybe later</Button>
        <Button
          variant="contained"
          onClick={onUpgrade}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
};
