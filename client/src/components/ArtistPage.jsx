
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Avatar,
  Paper,
   Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Modal,
  useTheme,
  alpha,
  List,
  ListItem,
  Stack,
    Divider,
     

  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  Share,
  ArrowBack,
  Shuffle,
  Add,
  Close,
  ChevronRight ,
  
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
import { SongCard } from './otherSongsComponents/songCard.jsx';
import { CircularProgress } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Drawer from '@mui/material/Drawer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useMediaQuery } from '@mui/material';
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
import { ShareButton } from './ShareButton.jsx';

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
    console.log('✅ Query completed! Data:', data);
    console.log('🔍 getArtistSongs result:', data?.getArtistSongs);
    console.log('🔍 Array length:', data?.getArtistSongs?.length);
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

  const TrackRow = ({ track }) => {
    const canDownload = Boolean(track?.downloadUrl);
    const isThisPlaying = playingTrack && track?.raw?.id
      ? String(playingTrack.id) === String(track.raw.id) && playerIsPlaying
      : false;







    return (
      <ListItem
        disableGutters
        sx={{
          px: { xs: 1, sm: 1.5 },
          py: 0.75,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: '100%',
            p: 1,
            borderRadius: 2,
            borderColor: alpha('#fff', 0.10),
            bgcolor: alpha(bgPaper, 0.35),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}
          >
            {/* Thumbnail with play overlay */}
            <Box
              sx={{
                position: 'relative',
                width: { xs: 52, sm: 56 },
                height: { xs: 52, sm: 56 },
                borderRadius: 2,
                overflow: 'hidden',
              flexShrink: 0,
              bgcolor: alpha('#000', 0.25),
              cursor: 'pointer',
              '&:hover .track-play-btn': { opacity: 1, transform: 'scale(1.05)' },
              }}
              
              onClick={async () => {
                await handleTrendingSongPlay({
                  song: track.raw,
                  incrementPlayCount: () => {},
                  handlePlaySong,
                  trendingSongs: processedSongs,
                  client,
                });
              }}


              role="button"
              tabIndex={0}
            >
              {track.thumb ? (
                <Box
                  component="img"
                  src={track.thumb}
                  alt={track.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}

              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha('#000', 0.25),
                }}
              >
                <IconButton
                  size="small"
                  className="track-play-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleTrendingSongPlay({
                      song: track.raw,
                      incrementPlayCount: () => {},
                      handlePlaySong,
                      trendingSongs: processedSongs,
                      client,
                    });
                  }}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(primary, 0.25),
                    border: `1px solid ${alpha(primary, 0.45)}`,
                    color: onPrimary,
                    opacity: 0.9,
                    transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
                    '&:hover': { bgcolor: alpha(primary, 0.35), opacity: 1, transform: 'scale(1.08)' },
                  }}
                >
                  {playingTrack?.id === track?.raw?.id && playerIsPlaying ? (
                    <VolumeUpIcon sx={{ fontSize: 20, color: onPrimary }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 20, color: onPrimary }} />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Title + aka */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: textPrimary,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  ...clampSx(1),
                }}
              >
                {track.title}
              </Typography>
              <Typography
                sx={{
                  color: textSecondary,
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  ...clampSx(1),
                }}
              >
                {track.artistAka || artist?.aka || artist?.name}
              </Typography>
            </Box>

            {/* Download */}
            <IconButton
              onClick={() => handleDownloadTrack(track)}
              disabled={!canDownload}
              sx={{
                flexShrink: 0,
                color: canDownload ? textPrimary : alpha(textPrimary, 0.35),
              }}
              aria-label="Download"
            >
              <FileDownloadOutlined />
            </IconButton>
          </Box>
        </Paper>
      </ListItem>
    );
  };

  if (!artist) return <LinearProgress />;




// Menu/Drawer options
const menuItems = [
  { icon: <Description />, text: 'Bio', action: () => console.log('Bio clicked') },
  { 
    icon: artist.isFollowed ? <Person /> : <PersonAdd />, 
    text: artist.isFollowed ? 'Unfollow' : 'Follow',
    action: () => console.log('Follow clicked')
  },
  { icon: <Radio />, text: 'Go to artist radio', action: () => console.log('Radio clicked') },
  { icon: <Share />, text: 'Share', action: () => console.log('Share clicked') },
  { icon: <DesktopWindows />, text: 'Open in Desktop app', action: () => console.log('Desktop app clicked') },
  { icon: <Block />, text: 'Block artist', color: '#ff4444', action: () => console.log('Block clicked') },
  { icon: <Flag />, text: 'Report', color: '#ff4444', action: () => console.log('Report clicked') },
];




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




          <Box sx={{
            display: 'flex',
            gap: { xs: 0.5, sm: 1, md: 2 },
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
            mt: { xs: 2, md: 0 },
            width: { xs: '100%', md: 'auto' },
          }}>


            {/* Follow Button */}
            <IconButton
              aria-label="Follow"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                p: { xs: 1.2, sm: 1.5 },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                minWidth: { xs: 70, sm: 80 },
              }}
            >
              <Add sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Follow
              </Typography>
            </IconButton>



            {/* Share Button */}

<ShareButton handleShare={handleShareArtist }/>



            {/* More Button */}
            <IconButton
              aria-label="More options"
              onClick={handleOpenMenu}
              sx={{
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                p: { xs: 1.2, sm: 1.5 },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                minWidth: { xs: 70, sm: 80 },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                More
              </Typography>
            </IconButton>




          </Box>
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

  {/* Tracks Grid - Premium Design */}
  {topTracks.length > 0 && (
    <>
      {/* Desktop Header */}
      <Box sx={{ 
        display: { xs: 'none', md: 'grid' },
        gridTemplateColumns: '0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr',
        alignItems: 'center',
        py: 2.5,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: '12px 12px 0 0',
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          #
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Title
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Album
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Plays
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Duration
        </Typography>
        <Box></Box>
        <Box></Box>
      </Box>

      {/* Tracks List */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, md: 0 },
        borderRadius: { xs: 2, md: '0 0 12px 12px' },
        overflow: 'hidden',
        bgcolor: { md: 'transparent' },
      }}>
        {topTracks.map((track, index) => (
          <Box 
            key={track.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: 'auto 1fr auto',
                md: '0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr'
              },
              alignItems: 'center',
              gap: { xs: 2, md: 0 },
              py: { xs: 2.5, md: 2 },
              px: { xs: 3, md: 3 },
              borderBottom: { xs: 'none', md: '1px solid' },
              borderColor: { md: 'divider' },
              borderRadius: { xs: 2, md: 0 },
              bgcolor: { xs: 'background.paper', md: 'transparent' },
              mb: { xs: 1.5, md: 0 },
              transition: 'all 0.25s',
              '&:hover': {
                bgcolor: { xs: 'action.hover', md: 'action.hover' },
                transform: { xs: 'translateX(4px)', md: 'none' },
              },
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            {/* Index Number with gold accent for top 3 */}
            <Typography 
              sx={{ 
                color: index < 3 ? 'primary.main' : 'text.secondary',
                fontSize: { xs: '1.1rem', md: '1.15rem' },
                fontWeight: 900,
                textAlign: 'center',
                minWidth: { xs: 28, md: 'auto' },
                fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
              }}
            >
              {index + 1}
            </Typography>

            {/* Track Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 3, md: 2.5 },
              overflow: 'hidden',
              gridColumn: { xs: 'span 2', md: 'auto' },
            }}>
              {/* Premium Thumbnail */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 56, md: 60 },
                  height: { xs: 56, md: 60 },
                  borderRadius: { xs: 1.5, md: 2 },
                  overflow: 'hidden',
                  flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: 3,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                    '& .play-overlay': {
                      opacity: 1,
                      bgcolor: 'rgba(0,0,0,0.5)',
                    },
                  },
                }}
                onClick={async () => {
                  await handleTrendingSongPlay({
                    song: track.raw,
                    incrementPlayCount: () => {},
                    handlePlaySong,
                    trendingSongs: processedSongs,
                    client,
                  });
                }}
              >
                <Box
                  component="img"
                  src={track.thumbnail || track.albumArt}
                  alt={track.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box
                  className="play-overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha('#000', 0.35),
                    opacity: playingTrack?.id === track?.raw?.id && playerIsPlaying ? 1 : 0.85,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <IconButton
                    size="large"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleTrendingSongPlay({
                        song: track.raw,
                        incrementPlayCount: () => {},
                        handlePlaySong,
                        trendingSongs: processedSongs,
                        client,
                      });
                    }}
                    sx={{
                      width: { xs: 44, md: 48 },
                      height: { xs: 44, md: 48 },
                      bgcolor: alpha(primary, 0.25),
                      border: `2px solid ${alpha(primary, 0.6)}`,
                      backdropFilter: 'blur(8px)',
                      '&:hover': { 
                        bgcolor: 'rgba(228,196,33,0.4)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {playingTrack?.id === track?.raw?.id && playerIsPlaying ? (
                      <VolumeUpIcon sx={{ 
                        fontSize: { xs: 22, md: 24 }, 
                        color: 'primary.contrastText' 
                      }} />
                    ) : (
                      <PlayArrow sx={{ 
                        fontSize: { xs: 22, md: 24 }, 
                        color: 'primary.contrastText',
                        ml: 0.5 
                      }} />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* Title Info with Clash Display font */}
              <Box sx={{ 
                minWidth: 0, 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 0.75, md: 0.5 } 
              }}>
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontWeight: 700,
                    fontSize: { xs: '1.1rem', md: '1.15rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                    fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
                  }}
                >
                  {track.title}
                </Typography>
                
                <Typography
                  onClick={() => (track.raw.artistId || resolvedArtistId) && navigate(`/artist/${track.raw.artistId || resolvedArtistId}`)}
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.95rem', md: '0.975rem' },
                    cursor: (track.raw.artistId || resolvedArtistId) ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    '&:hover': {
                      color: (track.raw.artistId || resolvedArtistId) ? 'primary.main' : 'text.secondary',
                      textDecoration: (track.raw.artistId || resolvedArtistId) ? 'underline' : 'none',
                    },
                  }}
                >
                  {track.artistAka || artist?.name || 'Unknown Artist'}
                </Typography>

                {/* Mobile-only extra info */}
                <Box sx={{ 
                  display: { xs: 'flex', md: 'none' }, 
                  alignItems: 'center', 
                  gap: 1.5,
                  mt: 0.5 
                }}>
                  <Typography
                    onClick={() => track.albumId && navigate(`/album/${track.albumId}`)}
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                      cursor: track.albumId ? 'pointer' : 'default',
                      fontWeight: 500,
                      '&:hover': {
                        color: track.albumId ? 'primary.main' : 'text.secondary',
                      },
                    }}
                  >
                    {track.album || 'Single'}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.75,
                  }}>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'action.disabled' }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {(track.plays ?? 0).toLocaleString()}
                    </Typography>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'action.disabled' }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {formatDuration(track.duration)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Desktop-only Album */}
            <Box sx={{ 
              display: { xs: 'none', md: 'block' }, 
              overflow: 'hidden',
              px: 2 
            }}>
              <Typography
                onClick={() => track.albumId && navigate(`/album/${track.albumId}`)}
                sx={{
                  color: 'text.primary',
                  fontSize: '1rem',
                  cursor: track.albumId ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 500,
                  '&:hover': {
                    color: track.albumId ? 'primary.main' : 'text.primary',
                    textDecoration: track.albumId ? 'underline' : 'none',
                  },
                }}
              >
                {track.album || 'Single'}
              </Typography>
            </Box>

            {/* Desktop-only Plays with gold accent */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center',
              px: 2 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: 'rgba(228,196,33,0.08)',
                px: 2,
                py: 0.75,
                borderRadius: 2,
                minWidth: 100,
                border: '1px solid',
                borderColor: 'rgba(228,196,33,0.15)',
              }}>
                <PlayArrow sx={{ fontSize: 16, color: 'primary.main', opacity: 0.8 }} />
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {(track.plays ?? 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Desktop-only Duration */}
            <Box sx={{ 
              display: { xs: 'none', md: 'block' },
              px: 2 
            }}>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                {formatDuration(track.duration)}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gridColumn: { xs: '3', md: 'auto' },
            }}>
              <IconButton
                size="medium"
                sx={{
                  color: 'text.secondary',
                  backgroundColor: 'action.hover',
                  width: { xs: 44, md: 48 },
                  height: { xs: 44, md: 48 },
                  borderRadius: 2,
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(228,196,33,0.15)',
                    transform: 'scale(1.1) rotate(90deg)',
                  },
                }}
              >
                <Add sx={{ fontSize: { xs: '1.3rem', md: '1.4rem' } }} />
              </IconButton>
            </Box>

            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              justifyContent: 'center' 
            }}>
              <IconButton
                size="medium"
                sx={{
                  color: 'text.secondary',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <MoreHorizIcon sx={{ fontSize: '1.6rem' }} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

    </>
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













{/* drawer from the top of more buttons : Bio, Follow, Block, Credits, Go to artist radio, Report, Share, Open in Desktop app*/}
 <Menu
    anchorEl={menuAnchor}
    open={Boolean(menuAnchor)}
    onClose={handleCloseMenu}
    PaperProps={{
      sx: {
        backgroundColor: '#181818',
        color: '#fff',
        minWidth: 220,
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
      }
    }}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
  >
    {menuItems.map((item, index) => (
      <MenuItem
        key={index}
        onClick={() => {
          item.action();
          handleCloseMenu();
        }}
        sx={{
          py: 1.5,
          px: 2,
          fontSize: '0.95rem',
          fontWeight: 400,
          color: item.color || '#fff',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          width: '100%'
        }}>
          <Box sx={{ 
            color: item.color || 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            minWidth: 30,
          }}>
            {item.icon}
          </Box>
          {item.text}
        </Box>
      </MenuItem>
    ))}
  </Menu>

  {/* Mobile Drawer */}
  {isMobile && (
    <Drawer
      anchor="bottom"
      open={drawerOpen}
      onClose={handleCloseDrawer}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: '#181818',
          color: '#fff',
        }
      }}
    >
      <Box sx={{ p: 2, pt: 3 }}>
        {/* Handle bar - Larger */}
        <Box sx={{ 
          width: 60, 
          height: 6, 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          borderRadius: 3, 
          mx: 'auto', 
          mb: 3,
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          }
        }} />
        
        {/* Artist Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, px: 1 }}>
          <Box
            component="img"
            src={artist.avatar}
            alt={artist.name}
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255,255,255,0.1)',
            }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {artist.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              {followerDisplay} followers
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

        {/* Actions List - Larger items */}
        <List sx={{ py: 1 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem 
                button 
                onClick={() => {
                  item.action();
                  handleCloseDrawer();
                }}
                sx={{
                  py: 2, // Increased padding for larger touch target
                  px: 2,
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  },
                  '&:active': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 44, // Increased min width
                  color: item.color || 'rgba(255,255,255,0.7)',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    sx: { 
                      fontSize: '1rem', // Larger font
                      fontWeight: 400,
                      color: item.color || '#fff',
                      ml: 1,
                    }
                  }}
                />
              </ListItem>
              
              {/* Add divider after certain items */}
              {index === 2 && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
              )}
            </React.Fragment>
          ))}
        </List>

        {/* Cancel Button - Larger */}
        <Box sx={{ p: 2, pt: 1 }}>
          <Button
            fullWidth
            variant="contain"
            onClick={handleCloseDrawer}
            sx={{
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>



                {/* other buttons */}




    </Drawer>
  )}





    </>
  );
};

export default ArtistPage;
