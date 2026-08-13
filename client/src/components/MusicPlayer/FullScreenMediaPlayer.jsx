import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
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

  Person,
  Share,
  Download,
  PlaylistAdd,
  ExpandMore,
  PersonAdd
} from '@mui/icons-material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNowPlayingArtwork } from '../../utils/Contexts/useNowPlayingArtwork';
import { useArtistFollowers } from '../../utils/Contexts/followers/useArtistFollowers';
import { useUser } from '../../utils/Contexts/userContext';
import { SHARE_SONG } from '../../utils/queries';
import { LIKES } from '../../utils/mutations';
import useArtistDownload from '../../utils/Contexts/artisDownload/useArtistDownload';
import { getShareableSongId, shareSongLink } from '../../utils/shareSong';
import { TEASER_DURATION_SECONDS } from '../../utils/teaserConfig';



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
        fill="#e4c421" font-size="48" font-family="Arial, sans-serif" font-weight="bold">FLOLUP</text>
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
  teaserDuration = TEASER_DURATION_SECONDS,
  onSliderCommit
  ,
  // from container
  isDragging = false,
  sliderValue = 0,
  audioRef = null,
}) => {
  const theme = useTheme();
  const [shareSong] = useMutation(SHARE_SONG);
  const [toggleLikeSong, { loading: likeLoading }] = useMutation(LIKES);
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

  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [renderDetails, setRenderDetails] = useState(false);
  const bioRef = useRef(null);



const sanitizeCover = (src) => {
  if (!src) return null;
  if (/placehold\.co/i.test(src)) return null;
  return src;
};

const formatStatNumber = (value, fallback = "0") => {
  const num = Number.isFinite(Number(value)) ? Number(value) : null;
  if (num === null) return fallback;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
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
  const recommendations = React.useMemo(
    () => Array.isArray(queue)
      ? queue
          .filter((item) => String(item?.id ?? item?._id ?? '') !== String(currentTrackId ?? ''))
          .slice(0, 4)
      : [],
    [queue, currentTrackId]
  );
  const displayTitle = currentSong?.title || currentSong?.name || 'No song playing';
  const displayArtist = resolveArtistText(currentSong?.artist) || currentSong?.artistName || 'Unknown Artist';
  const displayAlbum = currentSong?.albumName || 'Single';
  const download = currentSong.artistDownloadCounts || 0;
  const getSongLikesCount = (song) => Number(
    song?.likesCount ??
      song?.fullOriginal?.likesCount ??
      song?.fullOriginal?.likedByUsers?.length ??
      0
  ) || 0;
  const likesCount = getSongLikesCount(currentSong);
  const formattedPlayCount = formatStatNumber(
    currentSong?.playCount ?? currentSong?.fullOriginal?.playCount,
    "1.2M"
  );
  const formattedDownloadCount = formatStatNumber(
    download > 0 ? download : currentSong?.downloadCount ?? 0,
    "0"
  );
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
  const [songLikedByMe, setSongLikedByMe] = useState(Boolean(currentSong?.likedByMe ?? isFavorite));
  const [songLikesCount, setSongLikesCount] = useState(likesCount);
  const [downloadCount, setDownloadCount] = useState(Number(currentSong?.downloadCount ?? 0));
  const [downloadInFlight, setDownloadInFlight] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const formattedLikesCount = formatStatNumber(songLikesCount, "0");
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

  useEffect(() => {
    setSongLikedByMe(Boolean(currentSong?.likedByMe ?? isFavorite));
    setSongLikesCount(getSongLikesCount(currentSong));
  }, [
    currentSong?.id,
    currentSong?._id,
    currentSong?.likedByMe,
    currentSong?.likesCount,
    currentSong?.fullOriginal?.likesCount,
    isFavorite
  ]);
  const handleSliderCommit = (_, newValue) => {
    const maxAllowed = isTeaser ? Math.min(duration, teaserDuration) : duration;
    const clamped = Math.min(newValue, maxAllowed);
    onSeek?.(clamped);
  };
  


  
  const handleShare = async () => {
    const songId = getShareableSongId(currentSong);
    if (!songId) return;
    await shareSongLink({
      songId,
      shareSongMutation: shareSong,
    });
  };

  const handleToggleLike = async () => {
    const songId = String(currentSong?.id ?? currentSong?._id ?? currentSong?.songId ?? '');
    if (!songId || likeLoading) return;

    if (!user?._id) {
      setShowLoginPrompt(true);
      return;
    }

    const previousLiked = songLikedByMe;
    const previousLikes = songLikesCount;
    const nextLiked = !previousLiked;
    const nextLikes = Math.max(0, previousLikes + (nextLiked ? 1 : -1));

    setSongLikedByMe(nextLiked);
    setSongLikesCount(nextLikes);

    try {
      const { data } = await toggleLikeSong({
        variables: { songId },
        optimisticResponse: {
          toggleLikeSong: {
            __typename: 'Song',
            _id: songId,
            title: currentSong?.title ?? '',
            likesCount: nextLikes,
            likedByMe: nextLiked,
            streamAudioFileUrl: currentSong?.streamAudioFileUrl ?? currentSong?.audioUrl ?? null,
            genre: currentSong?.genre ?? null,
            artwork: currentSong?.artwork ?? currentSong?.artworkUrl ?? null,
            album: currentSong?.album
              ? {
                  __typename: 'Album',
                  _id: String(currentSong.album._id ?? currentSong.albumId ?? ''),
                  title: currentSong.album.title ?? '',
                }
              : null,
            artist: currentSong?.artistId || currentSong?.artist
              ? {
                  __typename: 'Artist',
                  _id: String(currentSong.artist?._id ?? currentSong.artistId ?? ''),
                  artistAka: currentSong.artist?.artistAka ?? currentSong.artistName ?? '',
                }
              : null,
          },
        },
        update: (cache, { data: mutationData }) => {
          const updatedSong = mutationData?.toggleLikeSong;
          if (!updatedSong) return;

          cache.modify({
            id: cache.identify({ __typename: 'Song', _id: updatedSong._id }),
            fields: {
              likesCount: () => updatedSong.likesCount,
              likedByMe: () => updatedSong.likedByMe,
            },
          });
        },
      });

      const updatedSong = data?.toggleLikeSong;
      if (updatedSong) {
        setSongLikedByMe(Boolean(updatedSong.likedByMe));
        setSongLikesCount(getSongLikesCount(updatedSong));
      }
    } catch (err) {
      setSongLikedByMe(previousLiked);
      setSongLikesCount(previousLikes);
      if (/unauthorized|login|required/i.test(err?.message || '')) {
        setShowLoginPrompt(true);
      } else {
        console.error('Like toggle failed', err);
      }
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
  const controlsDisabled = isAdPlaying;

  // Track scroll position so we can restore it when reopening the player
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
      if (scrollRef.current.scrollTop > 260) {
        setRenderDetails(true);
      }
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
      setRenderDetails(false);
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
  }, [isOpen, currentTrackId]);

  const toggleBioExpansion = () => {
    setIsBioExpanded(!isBioExpanded);
  };

  if (!isOpen) return null;



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
      {/* Lightweight Artwork Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#050509',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${displayImageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18,
            filter: { xs: 'none', md: 'blur(18px)' },
            transform: { xs: 'none', md: 'scale(1.06)' },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${alpha('#050509', 0.72)} 0%, ${alpha('#050509', 0.94)} 58%, #050509 100%)`,
          },
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
          <ExpandMoreIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center', mx: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              maxWidth: { xs: '52vw', sm: '60vw' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayTitle}
          </Typography>
          
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={handleShare} sx={{ color: 'white' }}>
            <Share fontSize="small" />
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



{/* Hero Section - Responsive */}
<Box
  sx={{
    minHeight: { xs: 'auto', md: 'calc(100dvh - 76px)' },
    display: 'grid',
    gridTemplateAreas: {
      xs: `"art"
           "info"
           "actions"
           "controls"
         "slider"
           "hint"`,
      md: `"art info"
           "actions actions"
           "controls controls"
         "slider slider"
           "hint hint"`
    },
    gridTemplateColumns: { 
      xs: '1fr', 
      md: 'minmax(300px, 1fr) minmax(0, 1.2fr)',
    },
    alignItems: { xs: 'flex-start', md: 'center' },
    alignContent: { xs: 'start', md: 'center' },
    gap: { xs: 1.75, sm: 2.25, md: 4 },
    width: '100%',
    maxWidth: { xs: '100%', md: '1400px' },
    mx: 'auto',
    p: { xs: 2, sm: 2.5, md: 4 },
    position: 'relative',
  }}
>
  {/* Album Art - Compact on mobile */}
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      maxWidth: { xs: 'min(76vw, 300px)', sm: 'min(52vw, 360px)', md: '100%' },
      height: { 
        xs: 'auto',
        md: 'min(52vh, 500px)',
      },
      justifySelf: 'center',
      alignSelf: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gridArea: 'art',
      mx: 'auto',
    }}
  >
    <Box
      sx={{
        width: '100%',
        height: { xs: 'auto', md: '100%' },
        position: 'relative',
      }}
    >
      {/* Album Art Image */}
      <Box
        component="img"
        src={displayImageSrc}
        alt={displayTitle}
        loading="eager"
        sx={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1/1', // Keep square aspect ratio
          objectFit: 'cover',
          borderRadius: { xs: 2, md: 4 },
          display: 'block',
        }}
      />
    </Box>
  </Box>

  {/* Right Column - Compact on mobile */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      gap: { xs: 1, md: 3 },
      gridArea: 'info',
    }}
  >
    {/* Song Info - Smaller text on mobile */}
    <Box sx={{ 
      textAlign: { xs: 'center', md: 'left' }, 
      color: 'white',
    }}>
      <Typography
        variant="h1"
        sx={{
          fontWeight: 900,
          fontSize: { xs: '1.45rem', sm: '1.9rem', md: '3rem' },
          lineHeight: 1.1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: { xs: 2, md: 2 },
          WebkitBoxOrient: 'vertical',
          mb: 0.5,
        }}
      >
        {displayTitle}
      </Typography>
      
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          fontSize: { xs: '1rem', sm: '1.2rem', md: '1.8rem' },
          color: alpha('#fff', 0.9),
          mb: 0.5,
        }}
      >
        {displayArtist}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: alpha('#fff', 0.7),
          fontSize: { xs: '0.9rem', md: '1.2rem' },
          mb: 1,
        }}
      >
        {displayAlbum} • {currentSong?.releaseYear || '-'}
      </Typography>

      {/* Stats - Compact on mobile */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'center', md: 'flex-start' }, 
        gap: { xs: 1.5, md: 4 },
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Plays', value: formattedPlayCount },
          { label: 'Likes', value: formattedLikesCount },
          { label: 'Shares', value: currentSong?.shareCount || 0 },
          { label: 'Downloads', value: formattedDownloadCount },
        ].map((stat) => (
          <Box key={stat.label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              color: theme.palette.primary.main, 
              fontWeight: 700,
              fontSize: { xs: '0.95rem', md: '1.5rem' }
            }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: alpha('#fff', 0.6),
              fontSize: { xs: '0.65rem', md: '0.8rem' }
            }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>

  {/* Action Buttons - Centered on mobile */}
  <Box
    sx={{
      gridArea: 'actions',
      display: 'flex',
      alignItems: 'center',
      justifyContent: { xs: 'center', md: 'flex-end' },
      gap: { xs: 1.5, md: 2 },
      mt: { xs: 0.75, md: 0 },
    }}
  >
    <IconButton
      onClick={controlsDisabled ? undefined : handleToggleLike}
      disabled={controlsDisabled || likeLoading}
      size="small"
      sx={{
        color: songLikedByMe ? '#ff4081' : alpha('#fff', 0.8),
        fontSize: { xs: '1.5rem', md: '2rem' },
      }}
    >
      {songLikedByMe ? <Favorite /> : <FavoriteBorder />}
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : handleDownload}
      disabled={controlsDisabled || downloading || downloadInFlight || !user?._id}
      size="small"
      sx={{ color: '#fff', fontSize: { xs: '1.5rem', md: '2rem' } }}
    >
      {downloadInFlight ? <CircularProgress size={20} /> : <Download />}
    </IconButton>

    <IconButton
      disabled={controlsDisabled}
      size="small"
      sx={{ color: '#fff', fontSize: { xs: '1.5rem', md: '2rem' } }}
    >
      <PlaylistAdd />
    </IconButton>
  </Box>

  {/* Progress Bar */}
  <Box sx={{ gridArea: 'slider', width: '100%', mt: { xs: 0.75, md: 0 } }}>
    <Slider
      value={Math.min(sliderValue, effectiveDuration || teaserDuration)}
      max={effectiveDuration || 100}
      onChange={isAdPlaying ? undefined : onSliderChange}
      onChangeCommitted={controlsDisabled ? undefined : handleSliderCommit}
      disabled={controlsDisabled}
      size="small"
      sx={{
        color: theme.palette.primary.main,
        height: { xs: 4, md: 6 },
        '& .MuiSlider-thumb': { width: { xs: 12, md: 16 }, height: { xs: 12, md: 16 } },
      }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
      <Typography variant="caption" sx={{ color: alpha('#fff', 0.8) }}>
        {formatTime(sliderValue)}
      </Typography>
      <Typography variant="caption" sx={{ color: alpha('#fff', 0.8) }}>
        {formatTime(effectiveDuration || duration)}
      </Typography>
    </Box>
  </Box>

  {/* Main Controls - Compact on mobile */}
  <Box sx={{ 
    gridArea: 'controls',
    display: 'flex', 
    alignItems: 'center',
    justifySelf: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: { xs: 440, md: 760 },
    gap: { xs: 1.5, sm: 2, md: 4 },
    mt: { xs: 0.75, md: 2 },
  }}>
    <IconButton
      onClick={controlsDisabled ? undefined : onToggleShuffle}
      disabled={controlsDisabled}
      size="small"
      sx={{
        color: isShuffled ? theme.palette.primary.main : alpha('#fff', 0.8),
        fontSize: { xs: '1.2rem', md: '1.8rem' },
      }}
    >
      <Shuffle />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onPrev}
      disabled={controlsDisabled || queueLength <= 1}
      size="small"
      sx={{ color: '#fff', fontSize: { xs: '1.8rem', md: '2.5rem' } }}
    >
      <SkipPrevious />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onPlayPause}
      disabled={controlsDisabled}
      sx={{
        bgcolor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
        width: { xs: 48, md: 72 },
        height: { xs: 48, md: 72 },
        '&:hover': { bgcolor: theme.palette.primary.dark },
      }}
    >
      {isPlaying ? 
        <Pause sx={{ fontSize: { xs: 24, md: 36 } }} /> : 
        <PlayArrow sx={{ fontSize: { xs: 24, md: 36 } }} />
      }
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onNext}
      disabled={controlsDisabled || queueLength <= 1}
      size="small"
      sx={{ color: '#fff', fontSize: { xs: '1.8rem', md: '2.5rem' } }}
    >
      <SkipNext />
    </IconButton>

    <IconButton
      onClick={controlsDisabled ? undefined : onToggleRepeat}
      disabled={controlsDisabled}
      size="small"
      sx={{
        color: repeatMode !== 'none' ? theme.palette.primary.main : alpha('#fff', 0.8),
        fontSize: { xs: '1.2rem', md: '1.8rem' },
      }}
    >
      {repeatMode === 'one' ? <RepeatOne /> : <Repeat />}
    </IconButton>
  </Box>

  {/* Scroll Indicator */}
  <Box sx={{ 
    gridArea: 'hint',
    textAlign: 'center',
    display: { xs: 'block', lg: 'none' },
    mt: { xs: 2, md: 5 }
  }}>
    <Typography variant="caption" sx={{ color: alpha('#fff', 0.6), fontSize: '0.75rem' }}>
      Scroll for lyrics, credits, and more
    </Typography>
    <ExpandMore sx={{ color: alpha('#fff', 0.6), fontSize: '1.5rem' }} />
  </Box>
  
</Box>







{/* ----------------------------- */}

        {/* Content Section */}
        <Box sx={{
          bgcolor: '#050509',
          minHeight: renderDetails ? '100vh' : 'auto',
          pt: 4,
          contentVisibility: 'auto',
          containIntrinsicSize: '900px',
        }}>
          {!renderDetails ? (
            <Box sx={{ px: 3, pb: 8, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setRenderDetails(true)}
                sx={{
                  color: theme.palette.primary.main,
                  borderColor: alpha(theme.palette.primary.main, 0.45),
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Show lyrics and credits
              </Button>
            </Box>
          ) : (
          <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, px: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 4, lg: 6 }, alignItems: 'start' }}>
              <Box sx={{ display: 'grid', gap: 3 }}>


                <Paper
                  sx={{
                    bgcolor: alpha('#111119', 0.9),
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
        bgcolor: alpha('#111119', 0.9),
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
            },
            transition: 'background-color 0.2s ease',
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
        ref={bioRef}
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
    bgcolor: alpha('#111119', 0.9),
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
          )}
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

      <Dialog
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#050509', 0.95),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>
          Login Required
        </DialogTitle>
        <DialogContent sx={{ color: alpha('#fff', 0.9), pb: 1 }}>
          Log in to like this song and add it to your liked songs.
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setShowLoginPrompt(false)}
            sx={{ color: alpha('#fff', 0.8) }}
          >
            Not now
          </Button>
          <Button
            variant="contained"
            onClick={() => { window.location.href = '/welcome?login=1'; }}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Log in
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
