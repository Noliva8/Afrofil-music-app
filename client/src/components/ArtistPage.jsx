
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LinearProgress from '@mui/material/LinearProgress';
import Modal from '@mui/material/Modal';
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  Share,
  ArrowBack,
  Shuffle,
  Close,
  ChevronRight,
  Person,
  PersonAdd,
  Block,
  Description,
  Radio,
  Flag,
  DesktopWindows,
  FileDownloadOutlined,
  VolumeUp as VolumeUpIcon,
  MusicOff,
} from '@mui/icons-material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { SongCard } from './otherSongsComponents/songCard.jsx';
import Grid from '@mui/material/Grid2';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext.jsx';
import { useArtistFollowers } from '../utils/Contexts/followers/useArtistFollowers.js';
import { useUser } from '../utils/Contexts/userContext.jsx';
import { GET_SONGS_ARTIST } from '../utils/queries.js';
import { useApolloClient, useQuery } from '@apollo/client';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import { processSongs } from '../utils/someSongsUtils/someSongsUtils.js';

import { handleTrendingSongPlay } from '../utils/plabackUtls/handleSongPlayBack.js';
import { PlayButton } from './PlayButton.jsx';
import { ShuffleButton } from './ShuffleButton.jsx';
import { ActionButtonsGroup } from './ActionButtonsGroup.jsx';
import { ActionMenu } from './ActionMenu.jsx';
import { TrackListSection } from './TrackListSection.jsx';
import AddToPlaylistModal from './AddToPlaylistModal.jsx';

  export const formatDuration = (seconds) => {
    if (seconds == null) return '0:00';
    const total = Math.max(0, Math.round(Number(seconds)) || 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };





export const buckets_name =[

{name: 'artist',
  bucket: 'afrofeel-profile-picture'
},

{name: 'album',
  bucket: 'afrofeel-album-covers'
},

{
  name: 'song',
  bucket: 'afrofeel-cover-images-for-songs',
},

{
  name: 'fallback',
  bucket: 'fallback-imagess',
},

{
  name: 'songAudio',
  bucket: 'afrofeel-songs-streaming'

}

]







const ArtistPage = () => {
  const { currentTrack: playingTrack, isPlaying: playerIsPlaying, isAdPlaying, handlePlaySong, pause, playerState} = useAudioPlayer();
  const client = useApolloClient();
  const { user } = useUser();
  const { toggleFollow, loading: followLoading } = useArtistFollowers();

  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { artistId: routeArtistId } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  const primary = theme.palette.primary.main;
  const onPrimary = theme.palette.getContrastText(primary);
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const bgDefault = theme.palette.background.default || '#000';
  const bgPaper = theme.palette.background.paper || '#111';

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [singles, setSingles] = useState([]);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);
  const [playableTrack, setPlayableTrack] = useState(null);
  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const prevAvatarRef = useRef(null);
  const [followerCount, setFollowerCount] = useState(null);
  const [artistHydrated, setArtistHydrated] = useState(false);

  const [adNoticeOpen, setAdNoticeOpen] = useState(false);
  const [adNoticeMessage] = useState('Playback will resume after the advertisement finishes.');
  
  const derivedArtistId = useMemo(() => {
    const stateSong = location?.state?.song || null;
    return (
      routeArtistId ||
      stateSong?.artistId ||
      stateSong?.artist?._id ||
      playingTrack?.artistId ||
      playingTrack?.artist?._id ||
      null
    );
  }, [location?.state, playingTrack, routeArtistId]);
  const resolvedArtistId = useMemo(() => {
    if (!derivedArtistId || derivedArtistId === 'undefined') return null;
    return derivedArtistId;
  }, [derivedArtistId]);




  // Define fallback images array
  const fallbackImages = [
    'fallback-images/Icon1.jpg',
    'fallback-images/Singing.jpg',
   
  ];

  const getRandomFallbackImage = () => {
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return fallbackImages[randomIndex];
  };







  const shouldSkipSongs = !resolvedArtistId;

 // Add more detailed logging
  const { data: songsData, loading: songsLoading, error: songsError } = useQuery(GET_SONGS_ARTIST, {
  variables: { artistId: resolvedArtistId },
  
  fetchPolicy: 'cache-and-network',
  onCompleted: (data) => {
    // console.log('✅ Query completed! Data:', data);
    // console.log('🔍 getArtistSongs result:', data?.getArtistSongs);
    // console.log('🔍 Array length:', data?.getArtistSongs?.length);
  },
  onError: (error) => {
    console.error('❌ Query error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error details:', error.graphQLErrors);
  }
});


// ✅ 3) Inside ArtistPage, right after your useQuery(GET_SONGS_ARTIST) call,
// use the hook like this:

// step 1: songs from components
  const rawSongs = songsData?.getArtistSongs;

// process the songs to display ( ui ) by using useSongsWithPresignedUrls

const { songsWithArtwork: hydratedSongs } = useSongsWithPresignedUrls(rawSongs);

// Songs ready for playback (ids/keys normalized)
const processedSongs = useMemo(() => processSongs(hydratedSongs), [hydratedSongs]);
const secondarySongs = useMemo(() => processedSongs.slice(6, 12), [processedSongs]);

if (songsError) console.log('songsError:', songsError);
if (shouldSkipSongs) console.log('Skipping song query (no artist id)');

const hasServerSongs = Boolean(songsData?.getArtistSongs?.length);






  const followerDisplay = useMemo(() => {
    if (typeof followerCount === 'number') return followerCount.toLocaleString();
    if (typeof artist?.followers === 'number') return artist.followers.toLocaleString();
    if (artist?.followers) return String(artist.followers);
    return '—';
  }, [artist?.followers, followerCount]);

  const genreDisplay = useMemo(() => {
    if (Array.isArray(artist?.genre)) return artist.genre.join(', ');
    return artist?.genre || '';
  }, [artist?.genre]);



const handleCloseDrawer = () => {
  setDrawerOpen(false);
};




const handleOpenMenu = (event) => {
  if (isMobile) {
    setDrawerOpen(true);
  } else {
    setMenuAnchor(event.currentTarget);
  }
};

const handleCloseMenu = () => {
  setMenuAnchor(null);
};




  const clampSx = (lines = 2) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  });






 useEffect(() => {
  if (!resolvedArtistId) return;

  const songs = processedSongs || [];
  if (!songs.length) {
    setTopTracks([]);
    setAvatarLoaded(false);
    setArtistHydrated(false);
    return;
  }

  const limitedSongs = songs.slice(0, 6);

console.log('top track processesd:', limitedSongs)
  const mappedTracks = limitedSongs.map((song, idx) => {
    const hydrated = Array.isArray(hydratedSongs) ? hydratedSongs[idx] : null;
    const durationSeconds = Number(song.durationSeconds ?? song.duration ?? hydrated?.duration ?? hydrated?.durationSeconds ?? 0);

    // Prefer the song's own artwork; only fall back to artist/album images if missing
    const cover =
      song.artworkUrl ||
      hydrated?.artworkUrl ||
      song.albumCoverImageUrl ||
      hydrated?.albumCoverImageUrl ||
      hydrated?.coverImageUrl ||
      hydrated?.profilePictureUrl ||
      hydrated?.album?.albumCoverImage ||
      hydrated?.artist?.coverImage ||
      hydrated?.artist?.profileImage ||
      null;

    const playbackUrl =
      song.audioUrl ||
      song.streamAudioFileUrl ||
      hydrated?.audioUrl ||
      hydrated?.streamAudioFileUrl ||
      hydrated?.audioFileUrl ||
      song.url ||
      hydrated?.url ||
      null;

    const rawSong = {
      ...song,
      id: String(song.id || song._id),
      artistName: song.artistName || hydrated?.artist?.artistAka || hydrated?.artist?.fullName,
      artistId: song.artistId || hydrated?.artist?._id || resolvedArtistId,
      cover,
      artworkUrl: cover,
      fullUrl: playbackUrl,
      fullUrlWithAds: playbackUrl,
      audioUrl: playbackUrl,
      url: playbackUrl,
      durationSeconds,
      duration: durationSeconds,
    };

    return {
      id: String(rawSong.id),
      title: song.title || hydrated?.title || 'Untitled',
      album: song.albumName || hydrated?.album?.title || hydrated?.albumTitle || 'Single',
      albumId: song.albumId || hydrated?.album?._id || hydrated?.albumId || null,
      plays: Number(song.playCount ?? song.plays ?? hydrated?.playCount) || 0,
      duration: durationSeconds,
      thumbnail: cover,
      albumArt: cover,
      artistAka: rawSong.artistName,
      downloadUrl: playbackUrl,
      raw: rawSong,
      thumb: cover,
    };
  });

  setTopTracks(mappedTracks);

  if (!playableTrack && mappedTracks.length) {
    setPlayableTrack(mappedTracks[0].raw);
  }

  const primarySong = hydratedSongs?.[0] || songs[0];
  if (primarySong?.artist) {
    setArtist((prev) => ({
      ...(prev || {}),
      id: resolvedArtistId,
      name: primarySong.artist.artistAka || primarySong.artist.fullName || prev?.name || 'Unknown Artist',
      aka: primarySong.artist.artistAka || prev?.aka,
      followers: Array.isArray(primarySong.artist.followers)
        ? primarySong.artist.followers.length
        : (typeof primarySong.artist.followers === 'number' ? primarySong.artist.followers : prev?.followers ?? 0),
      genre: primarySong.artist.genre || prev?.genre || [],
      // Prefer fetched profile/cover; fall back to any existing value
      avatar: primarySong.profilePictureUrl || primarySong.artist.profileImage || prev?.avatar || null,
      cover: primarySong.coverImageUrl || primarySong.artist.coverImage || prev?.cover || null,
    }));
    setAvatarLoaded(false);
    setArtistHydrated(true);
  }
}, [resolvedArtistId, processedSongs, hydratedSongs]); // ✅ depends on processedSongs for playback






  // Load artist data from navigation state or current track
  useEffect(() => {
    const sourceSong = (location.state && location.state.song) || playingTrack;
    if (!sourceSong || !resolvedArtistId) return;
    if (hasServerSongs) return; // don't overwrite server-fetched songs

    const artwork = sourceSong.artworkPresignedUrl || sourceSong.artworkUrl || sourceSong.cover || sourceSong.image || null;
    const artistName = sourceSong.artistName || sourceSong.artist || 'Unknown Artist';
    const rawFollowers = typeof sourceSong.artistFollowers === 'number' ? sourceSong.artistFollowers : null;
    const artistFollowers = rawFollowers != null ? rawFollowers.toLocaleString() : null;

    setArtist((prev) => ({
      id: derivedArtistId,
      name: artistName,
      aka: sourceSong.artistAka || sourceSong.artist || artistName,
      bio: sourceSong.artistBio || '',
      followers: artistFollowers || '—',
      genre: Array.isArray(sourceSong.genre) ? sourceSong.genre : [],
      location: sourceSong.country || '',
      verified: Boolean(sourceSong.artistVerified),
      avatar: sourceSong.artistProfileImage || prev?.avatar || null,
      cover: sourceSong.artistCoverImage || prev?.cover || null,
    }));
    if (sourceSong.artistProfileImage || sourceSong.artistCoverImage) {
      setAvatarLoaded(false);
      setArtistHydrated(true);
    }

    let persistedFollow = null;
    try {
      const raw = localStorage.getItem(`artist-follow-${resolvedArtistId}`);
      persistedFollow = raw ? JSON.parse(raw) : null;
    } catch {
      persistedFollow = null;
    }

    setIsFollowing(persistedFollow?.isFollowing ?? Boolean(sourceSong.isFollowing));
    setFollowerCount(
      typeof persistedFollow?.followerCount === 'number'
        ? persistedFollow.followerCount
        : rawFollowers
    );

    // For now you only have one song in this page state. Later replace this with real artist songs.
    const trackRow = {
      id: sourceSong.id,
      title: sourceSong.title,
      artistAka: sourceSong.artistAka || sourceSong.artist || artistName,
      durationSeconds: sourceSong.durationSeconds,
      duration: typeof sourceSong.duration === 'string'
        ? sourceSong.duration
        : formatDuration(sourceSong.durationSeconds || sourceSong.duration),
      thumb: sourceSong.artworkPresignedUrl || sourceSong.artworkUrl || sourceSong.cover || sourceSong.image || null,
      // optional download fields (wire to your real field)
      downloadUrl: sourceSong.downloadUrl || sourceSong.audioPresignedUrl || sourceSong.audioUrl || null,
      raw: sourceSong,
    };

    setTopTracks([trackRow]);
    setAlbums([]);
    setSingles([]);
    setRelatedArtists([]);
    setPlayableTrack(sourceSong);
  }, [resolvedArtistId, location.state, playingTrack, hasServerSongs]);

  useEffect(() => {
    if (!songsLoading && !artist?.avatar) {
      setAvatarLoaded(true);
    }
  }, [songsLoading, artist?.avatar]);

  // Keep avatar loaded when the same image persists to avoid placeholder flash
  useEffect(() => {
    const avatar = artist?.avatar || null;
    if (!avatar) {
      prevAvatarRef.current = null;
      setAvatarLoaded(false);
      return;
    }
    if (prevAvatarRef.current === avatar) {
      setAvatarLoaded(true);
    } else {
      prevAvatarRef.current = avatar;
      setAvatarLoaded(false);
    }
  }, [artist?.avatar]);

  const isArtistTrackPlaying = playableTrack && playingTrack?.id === playableTrack.id && playerIsPlaying;

  const handleFollowToggle = async () => {
    if (!artist?.id || !user?._id) return;

    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowerCount((prev) => {
      if (typeof prev !== 'number') return prev;
      const updated = prev + (nextFollowing ? 1 : -1);
      return updated < 0 ? 0 : updated;
    });

    try {
      const updated = await toggleFollow({ artistId: artist.id, userId: user._id });
      const nextCount =
        typeof updated === 'number'
          ? updated
          : (typeof followerCount === 'number'
              ? Math.max(0, followerCount + (nextFollowing ? 1 : -1))
              : null);

      if (typeof nextCount === 'number') {
        setFollowerCount(nextCount);
        localStorage.setItem(
          `artist-follow-${artist.id}`,
          JSON.stringify({ isFollowing: nextFollowing, followerCount: nextCount })
        );
      }
    } catch (err) {
      console.warn('Follow toggle failed', err);
    }
  };

  const handleShareArtist = async () => {
    if (!artist?.id) return;
    const shareUrl = `${window.location.origin}/artist/${artist.id}`;
    try {
      if (navigator?.share) {
        await navigator.share({ title: artist.name, text: artist.bio, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      console.warn('Share artist failed', err);
    }
  };

  const handlePrimaryPlay = async () => {
    if (!playableTrack) return;

    if (isAdPlaying) {
      setAdNoticeOpen(true);
      return;
    }

    if (isArtistTrackPlaying) {
      pause();
      return;
    }

    await handleTrendingSongPlay({
      song: playableTrack,
      incrementPlayCount: () => {},
      handlePlaySong,
      trendingSongs: processedSongs,
      client,
    });
  };



  const handleDownloadTrack = async (track) => {
    const url = track?.downloadUrl || track?.raw?.downloadUrl || track?.raw?.audioPresignedUrl || track?.raw?.audioUrl;
    if (!url) return;

    try {
      // Open the presigned/download URL in a new tab; browser will download if headers are set.
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Download failed', err);
    }
  };

  const getTrackId = useCallback(
    (track) => String(track?.raw?.id || track?.id || track?._id || track?.songId || ""),
    []
  );

  const handleAddToPlaylist = useCallback((track) => {
    if (!track) return;
    setPlaylistTrack(track);
    setPlaylistDialogOpen(true);
  }, []);

  const handleCloseAddToPlaylist = useCallback(() => {
    setPlaylistDialogOpen(false);
    setPlaylistTrack(null);
  }, []);

  const handlePlayTrack = useCallback(
    async (track) => {
      if (!track) return;
      const song = track.raw || track;
      await handleTrendingSongPlay({
        song,
        incrementPlayCount: () => {},
        handlePlaySong,
        trendingSongs: processedSongs,
        client,
      });
    },
    [handlePlaySong, processedSongs, client]
  );

  const handleNavigateTrack = useCallback(
    (trackId) => {
      if (trackId) navigate(`/song/${trackId}`);
    },
    [navigate]
  );

  const handleNavigateArtist = useCallback(
    (artistId) => {
      if (artistId) navigate(`/artist/${artistId}`);
    },
    [navigate]
  );

  const handleNavigateAlbum = useCallback(
    (albumId) => {
      if (albumId) navigate(`/album/${albumId}`);
    },
    [navigate]
  );

  const actionMenuItems = useMemo(
    () => [
      {
        icon: <Description />,
        label: 'Bio',
        onClick: () => console.log('Bio clicked'),
      },
      {
        icon: isFollowing ? <Person /> : <PersonAdd />,
        label: isFollowing ? 'Unfollow' : 'Follow',
        onClick: handleFollowToggle,
      },
      {
        icon: <Radio />,
        label: 'Go to artist radio',
        onClick: () => console.log('Radio clicked'),
      },
      {
        icon: <Share />,
        label: 'Share',
        onClick: handleShareArtist,
      },
      {
        icon: <DesktopWindows />,
        label: 'Open in Desktop app',
        onClick: () => console.log('Desktop app clicked'),
      },
      { type: 'divider' },
      {
        icon: <Block />,
        label: 'Block artist',
        color: '#ff4444',
        onClick: () => console.log('Block clicked'),
      },
      {
        icon: <Flag />,
        label: 'Report',
        color: '#ff4444',
        onClick: () => console.log('Report clicked'),
      },
    ],
    [handleFollowToggle, handleShareArtist, isFollowing]
  );



  const normalizedTopTracks = useMemo(
    () =>
      topTracks.map((track) => ({
        ...track,
        album: { title: track.album || 'Single' },
        artist: {
          artistAka: track.artistAka || artist?.name || '',
          _id: track.artistId || resolvedArtistId || undefined,
        },
        artwork: track.thumbnail || track.albumArt,
        albumCoverImageUrl: track.thumbnail || track.albumArt,
        raw: track.raw,
      })),
    [topTracks, artist?.name, resolvedArtistId]
  );

  if (!artist) return <LinearProgress />;






  return (
    <>
      <Modal
        open={adNoticeOpen}
        onClose={() => setAdNoticeOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            maxWidth: 420,
            width: '100%',
            bgcolor: alpha(bgPaper, 0.95),
            border: `1px solid ${alpha(primary, 0.35)}`,
            borderRadius: 3,
            p: 3,
            textAlign: 'center',
            color: textPrimary,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Advertisement in Progress</Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            {adNoticeMessage}
          </Typography>
          <Button variant="contained" onClick={() => setAdNoticeOpen(false)} sx={{ bgcolor: primary, color: onPrimary }}>
            Got it
          </Button>
        </Paper>
      </Modal>

      



<Box
  sx={{
    width: '100%',
    height: { xs: '50vh', md: '60vh' },
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#121212',
  }}
>



{/* We need to check if artist data itself is loaded, not just songs */}
{songsLoading || !artistHydrated ? (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      backgroundColor: '#121212',
      color: '#666',
      fontSize: '0.875rem',
      fontWeight: 500,
    }}
  >
    Loading...
  </Box>
) : artist.avatar ? (
  <Box
    component="img"
    src={artist.avatar}
    alt={artist.name}
    loading="lazy"
    decoding="async"
    sx={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
    }}
  />
) : (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      backgroundColor: '#121212',
      color: '#fff',
      fontWeight: 700,
      letterSpacing: 0.5,
    }}
  >
    Profile image not uploaded
  </Box>
)}

  {/* Top Gradient for better contrast */}
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '20%',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
      zIndex: 1,
    }}
  />
  
  {/* Bottom Gradient Overlay */}
  <Box
    sx={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '60%',
      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
      zIndex: 1,
    }}
  />

  {/* Content Container - Only show when not loading */}
  {!songsLoading && (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: { xs: 0, sm: '1rem', md: '2rem', lg: '5rem', xl: '8rem' },
        right: 0,
        zIndex: 2,
        px: { xs: 2, md: 4 },
        pb: { 
          xs: 'max(12px, env(safe-area-inset-bottom))',
          md: 4 
        },
      }}
    >
      {/* Your existing content - perfect as is! */}
      <Box sx={{ color: '#fff' }}>
        <Typography 
          sx={{
            fontWeight: 900,
            letterSpacing: { xs: -0.5, md: -1 },
            lineHeight: { xs: 1.05, md: 1 },
            fontSize: { 
              xs: '2rem',     // Mobile: ~32px
              sm: '2.5rem',   // Small tablet: ~40px  
              md: '3rem',     // Tablet: ~48px
              lg: '4.5rem',   // Desktop: ~72px
              xl: '5rem'      // Large desktop: ~80px
            },
            mb: { xs: 0.5, md: 1 },
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            ...clampSx(1),
          }}
        >
          {artist.name}
        </Typography>

        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            fontWeight: 400,
            mb: { xs: 2, md: 3 },
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            letterSpacing: '0.01em',
          }}
        >
          {followerDisplay} followers{genreDisplay ? ` • ${genreDisplay}` : ''}
        </Typography>

        {/* Your perfect button layout */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: {xs: 'column', sm: 'column', md: 'row'}, 
          justifyContent: 'space-between',
          gap: { xs: 2, md: 0 },
        }}>

          {/* Play & Shuffle buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Play Button */}

         
<PlayButton handlePrimaryPlay={handlePrimaryPlay}  isArtistTrackPlaying={isArtistTrackPlaying} playableTrack={playableTrack} />



            {/* Shuffle Button */}

            <ShuffleButton playableTrack={playableTrack} isShuffled={playerState.Shuffle} />
          </Box>




          <ActionButtonsGroup
            isFavorite={isFollowing}
            onToggleFavorite={handleFollowToggle}
            onShare={handleShareArtist}
            onMore={handleOpenMenu}
          />
        </Box>
      </Box>
    </Box>
  )}
</Box>


{/* Section */}

<Box sx={{ 
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 3, md: 4 },
  backgroundColor: 'transparent',
}}>

{/* 1. PREMIUM TOP TRACKS SECTION */}
<Box sx={{ mb: { xs: 6, md: 8 } }}>
  {/* Section Header */}
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    mb: { xs: 4, md: 5 },
    px: { xs: 2, md: 0 }
  }}>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: 'text.primary',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.pxToRem(20),
        letterSpacing: 0.2,
      }}
    >
      Top Tracks
    </Typography>
    
    {topTracks.length > 0 && (
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '0.9rem', md: '1rem' },
          fontWeight: 500,
        }}
      >
        {topTracks.length} {topTracks.length === 1 ? 'track' : 'tracks'}
      </Typography>
    )}
  </Box>

  {/* Loading State */}
  {songsLoading && !topTracks.length && (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      py: { xs: 8, md: 12 },
      px: 2 
    }}>
      <CircularProgress size={32} sx={{ color: 'primary.main', mb: 2 }} />
      <Typography sx={{ color: 'text.secondary' }}>
        Loading tracks...
      </Typography>
    </Box>
  )}

  {/* Error State */}
  {songsError && (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      py: { xs: 8, md: 12 },
      px: 2 
    }}>
      <ErrorOutline sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
      <Typography sx={{ 
        color: 'text.secondary', 
        textAlign: 'center',
        maxWidth: 400,
        mb: 2 
      }}>
        Unable to load songs right now. Please try again shortly.
      </Typography>
      <Button 
        variant="outlined" 
        onClick={() => window.location.reload()}
        sx={{ 
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
        }}
      >
        Retry
      </Button>
    </Box>
  )}

  {/* Empty State */}
  {!songsLoading && !songsError && topTracks.length === 0 && (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      py: { xs: 8, md: 12 },
      px: 2 
    }}>
      <MusicOff sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
      <Typography sx={{ 
        color: 'text.secondary', 
        textAlign: 'center',
        maxWidth: 400 
      }}>
        No songs available for this artist yet.
      </Typography>
    </Box>
  )}

  {topTracks.length > 0 && (
    <TrackListSection
      tracks={normalizedTopTracks}
      getId={getTrackId}
      playingId={playingTrack?.id || playingTrack?._id}
      songId={null}
      playerIsPlaying={playerIsPlaying}
      isMobile={isMobile}
      fallbackArtwork={artist?.avatar || ''}
      onPlayTrack={handlePlayTrack}
      onAddToPlaylist={handleAddToPlaylist}
      onNavigateTrack={handleNavigateTrack}
      onNavigateArtist={handleNavigateArtist}
      onNavigateAlbum={handleNavigateAlbum}
      formatDuration={formatDuration}
    />
  )}
</Box>



{secondarySongs.length > 0 && (
  <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: { xs: 5, md: 7 } }}>

    
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: 'text.primary',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.pxToRem(20),
        letterSpacing: 0.2,
      }}
    >
      More from this artist
    </Typography>



    <Box
      sx={{
        display: 'flex',
        gap: {
          xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
          sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
          md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
          lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
        },
        overflowX: 'auto',
        pb: 1.5,
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {secondarySongs.map((song) => {
        const isPlayingThisSong =
          playingTrack && song?.id && String(playingTrack.id) === String(song.id) && playerIsPlaying;
        return (
          <Box
            key={song.id}
            sx={{
              flex: '0 0 auto',
              width: {
                xs: theme.customSizes?.musicCard?.xs ?? 140,
                sm: theme.customSizes?.musicCard?.sm ?? 160,
                md: theme.customSizes?.musicCard?.md ?? 180,
                lg: theme.customSizes?.musicCard?.lg ?? 200,
              },
            }}
          >
            <SongCard
              song={song}
              isPlayingThisSong={isPlayingThisSong}
              onPlayPause={() =>
                handleTrendingSongPlay({
                  song,
                  incrementPlayCount: () => {},
                  handlePlaySong,
                  trendingSongs: processedSongs,
                  client,
                })
              }
              onOpenArtist={() => {
                const songId = song?._id || song?.songId || song?.id;
                const albumId = song?.albumId || song?.album?._id || song?.album;
                if (albumId && songId) {
                  navigate(`/album/${albumId}/${songId}`);
                  return;
                }
                if (songId) navigate(`/song/${songId}`);
              }}
            />
          </Box>
        );
      })}
    </Box>
  </Box>
)}





  {/* 2. OTHER SINGLES SECTION */}
  {artist.otherSingles && artist.otherSingles.length > 0 && (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: '#fff',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.pxToRem(20),
          letterSpacing: 0.2,
        }}
      >
        Other singles
      </Typography>

      {/* Cards Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)',
          xl: 'repeat(6, 1fr)',
        },
        gap: {
          xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
          sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
          md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
          lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
        },
      }}>
        {artist.otherSingles.map((single) => (
          <Box
            key={single.id}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.06)',
                transform: 'translateY(-4px)',
                '& .play-button': {
                  opacity: 1,
                  transform: 'translateY(0)',
                }
              },
            }}
          >
            {/* Thumbnail */}
            <Box sx={{ position: 'relative', aspectRatio: '1' }}>
              <Box
                component="img"
                src={single.thumbnail || single.artwork}
                alt={single.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Play Button Overlay */}
              <Box
                className="play-button"
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: '#1DB954',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transform: 'translateY(8px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: '#1ED760',
                    transform: 'translateY(0) scale(1.05)',
                  },
                }}
              >
                <PlayArrow sx={{ color: '#000', fontSize: '1.8rem', ml: 0.5 }} />
              </Box>
            </Box>

            {/* Song Info */}
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  mb: 0.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {single.title}
              </Typography>
              
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {single.releaseYear} • {single.type}
              </Typography>

              {/* Quick Actions */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 1.5,
              }}>
                <IconButton
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover': {
                      color: '#fff',
                    },
                  }}
                >
                  <FavoriteBorder sx={{ fontSize: '1.2rem' }} />
                </IconButton>
                
                <IconButton
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover': {
                      color: '#fff',
                    },
                  }}
                >
                  <MoreHorizIcon sx={{ fontSize: '1.3rem' }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* See More Button */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          variant="outlined"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontSize: '0.95rem',
            fontWeight: 500,
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.05)',
            },
          }}
        >
          See more singles
        </Button>
      </Box>
    </Box>




  )}
</Box>

  <ActionMenu
    isMobile={isMobile}
    anchorEl={menuAnchor}
    open={Boolean(menuAnchor)}
    onClose={handleCloseMenu}
    drawerOpen={drawerOpen}
    onCloseDrawer={handleCloseDrawer}
    items={actionMenuItems}
    drawerTitle={artist?.name}
    drawerSubtitle={artist ? `${followerDisplay} followers` : undefined}
  />

  <AddToPlaylistModal
    open={playlistDialogOpen}
    onClose={handleCloseAddToPlaylist}
    track={playlistTrack}
  />

    </>
  );
};

export default ArtistPage;
