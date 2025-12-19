// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Container,
//   Typography,
//   Button,
//   IconButton,
//   Avatar,
//   Paper,
//   Grid,
//   Chip,
//   Stack,
//   Tabs,
//   Tab,
//   Card,
//   CardContent,
//   CardMedia,
//   Fab,
//   LinearProgress,
//   Modal,
//   useTheme,
//   alpha,
//   Divider,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemAvatar
// } from '@mui/material';
// import {
//   PlayArrow,
//   Pause,
//   Favorite,
//   FavoriteBorder,
//   Share,
//   MoreVert,
//   ArrowBack,
//   LibraryMusic,
//   People,
//   Event,
//   Place,
//   Language,
//   PlaylistAdd,
//   Shuffle,
//   Repeat,
//   SkipNext,
//   SkipPrevious,
//   Verified,
//   TrendingUp,
//   PlayCircle,
//   Album,
//   Mic,
//   MusicVideo,
//   QueueMusic,
//   KeyboardArrowDown
// } from '@mui/icons-material';
// import { useNavigate, useParams, useLocation } from 'react-router-dom';
// import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext.jsx';
// import { useArtistFollowers } from '../utils/Contexts/followers/useArtistFollowers.js';
// import { useUser } from '../utils/Contexts/userContext.jsx';





// const ArtistPage = () => {
//   const { currentTrack: playingTrack, isPlaying: playerIsPlaying, isAdPlaying, handlePlaySong, pause } = useAudioPlayer();
//   const { user } = useUser();
//   const { toggleFollow, loading: followLoading } = useArtistFollowers();
//   const location = useLocation();
//   const theme = useTheme();
//   const primary = theme.palette.primary.main;
//   const onPrimary = theme.palette.getContrastText(primary);
//   const textPrimary = theme.palette.text.primary;
//   const textSecondary = theme.palette.text.secondary;
//   const bgDefault = theme.palette.background.default || "#000";
//   const bgPaper = theme.palette.background.paper || "#111";
//   const navigate = useNavigate();
//   const { artistId } = useParams();
//   const [artist, setArtist] = useState(null);
//   const [topTracks, setTopTracks] = useState([]);
//   const [albums, setAlbums] = useState([]);
//   const [singles, setSingles] = useState([]);
//   const [relatedArtists, setRelatedArtists] = useState([]);
//   const [activeTab, setActiveTab] = useState(0);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [playableTrack, setPlayableTrack] = useState(null);
//   const [followerCount, setFollowerCount] = useState(null);
//   const [adNoticeOpen, setAdNoticeOpen] = useState(false);
//   const [adNoticeMessage, setAdNoticeMessage] = useState('Playback will resume after the advertisement finishes.');

//   const formatDuration = (seconds) => {
//     if (seconds == null) return '0:00';
//     const total = Math.max(0, Math.round(Number(seconds)) || 0);
//     const mins = Math.floor(total / 60);
//     const secs = total % 60;
//     return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
//   };

//   // Load artist data from navigation state or current track
//   useEffect(() => {
//     const sourceSong = (location.state && location.state.song) || playingTrack;
//     if (!sourceSong) return;

//     const artwork = sourceSong.artworkPresignedUrl || sourceSong.artworkUrl || sourceSong.cover || sourceSong.image || null;
//     const artistName = sourceSong.artistName || sourceSong.artist || 'Unknown Artist';
//     const rawFollowers = typeof sourceSong.artistFollowers === 'number' ? sourceSong.artistFollowers : null;
//     const artistFollowers = rawFollowers != null ? rawFollowers.toLocaleString() : null;

//     setArtist({
//       id: artistId,
//       name: artistName,
//       aka: sourceSong.artistAka || sourceSong.artist || artistName,
//       bio: sourceSong.artistBio || '',
//       followers: artistFollowers || '—',
//       monthlyListeners: sourceSong.artistDownloadCounts ? `${sourceSong.artistDownloadCounts.toLocaleString()} downloads` : null,
//       genre: Array.isArray(sourceSong.genre) ? sourceSong.genre : [],
//       location: sourceSong.country || '',
//       activeSince: null,
//       verified: Boolean(sourceSong.artistVerified),
//       avatar: sourceSong.artistProfileImage || artwork || undefined,
//       cover: sourceSong.artistCoverImage || artwork || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2070&q=80',
//       social: sourceSong.social || { instagram: '', twitter: '', youtube: '' }
//     });

//     let persistedFollow = null;
//     try {
//       const raw = localStorage.getItem(`artist-follow-${artistId}`);
//       persistedFollow = raw ? JSON.parse(raw) : null;
//     } catch (err) {
//       persistedFollow = null;
//     }

//     setIsFollowing(persistedFollow?.isFollowing ?? Boolean(sourceSong.isFollowing));
//     setFollowerCount(
//       typeof persistedFollow?.followerCount === 'number'
//         ? persistedFollow.followerCount
//         : rawFollowers
//     );

//     const topTrackEntry = {
//       id: sourceSong.id,
//       title: sourceSong.title,
//       album: sourceSong.albumName || 'Single',
//       duration: sourceSong.duration || formatDuration(sourceSong.durationSeconds),
//       plays: (sourceSong.playCount ?? sourceSong.plays ?? 0).toLocaleString(),
//     };

//     setTopTracks([topTrackEntry]);

//     if (sourceSong.albumId || sourceSong.albumName) {
//       setAlbums([{
//         id: sourceSong.albumId || 'album',
//         title: sourceSong.albumName || 'Album',
//         year: sourceSong.releaseYear || '',
//         tracks: null,
//         cover: artwork
//       }]);
//     } else {
//       setAlbums([]);
//     }

//     setSingles([{
//       id: sourceSong.id,
//       title: sourceSong.title,
//       year: sourceSong.releaseYear || '',
//       cover: artwork
//     }]);

//     setRelatedArtists([]);
//     setPlayableTrack(sourceSong);
//   }, [artistId, location.state, playingTrack]);

//   const isArtistTrackPlaying = playableTrack && playingTrack?.id === playableTrack.id && playerIsPlaying;

//   const handleFollowToggle = async () => {
//     if (!artist?.id || !user?._id) return;
//     const nextFollowing = !isFollowing;
//     setIsFollowing(nextFollowing);
//     setFollowerCount((prev) => {
//       if (typeof prev !== 'number') return prev;
//       const updated = prev + (nextFollowing ? 1 : -1);
//       return updated < 0 ? 0 : updated;
//     });
//     try {
//       const updated = await toggleFollow({ artistId: artist.id, userId: user._id });
//       const nextCount = typeof updated === 'number'
//         ? updated
//         : (typeof followerCount === 'number'
//             ? Math.max(0, followerCount + (nextFollowing ? 1 : -1))
//             : null);
//       if (typeof nextCount === 'number') {
//         setFollowerCount(nextCount);
//         localStorage.setItem(
//           `artist-follow-${artist.id}`,
//           JSON.stringify({ isFollowing: nextFollowing, followerCount: nextCount })
//         );
//       }
//     } catch (err) {
//       console.warn('Follow toggle failed', err);
//     } finally {
//       if (typeof followerCount === 'number') {
//         const cachedCount = Math.max(0, followerCount + (nextFollowing ? 1 : -1));
//         try {
//           localStorage.setItem(
//             `artist-follow-${artist.id}`,
//             JSON.stringify({ isFollowing: nextFollowing, followerCount: cachedCount })
//           );
//         } catch {}
//       }
//     }
//   };


//   const handleShareArtist = async () => {
//     if (!artist?.id) return;
//     const shareUrl = `${window.location.origin}/artist/${artist.id}`;
//     try {
//       if (navigator?.share) {
//         await navigator.share({ title: artist.name, text: artist.bio, url: shareUrl });
//       } else {
//         await navigator.clipboard.writeText(shareUrl);
//       }
//     } catch (err) {
//       console.warn('Share artist failed', err);
//     }
//   };

//   const handlePrimaryPlay = async () => {
//     if (!playableTrack) return;
//     if (isAdPlaying) {
//       setAdNoticeOpen(true);
//       return;
//     }
//     if (isArtistTrackPlaying) {
//       pause();
//       return;
//     }
//     try {
//       await handlePlaySong(playableTrack, [], { source: 'artist-page', artistId });
//     } catch (err) {
//       console.warn('Artist page play failed', err);
//     }
//   };

//   if (!artist) return <LinearProgress />;

//   return (
//     <>
//       <Modal
//         open={adNoticeOpen}
//         onClose={() => setAdNoticeOpen(false)}
//         sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
//       >
//         <Paper
//           elevation={8}
//           sx={{
//             maxWidth: 420,
//             width: '100%',
//             bgcolor: alpha(bgPaper, 0.95),
//             border: '1px solid',
//             borderColor: alpha(primary, 0.4),
//             boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
//             borderRadius: 3,
//             p: 3,
//             textAlign: 'center',
//             color: textPrimary,
//             backdropFilter: 'blur(16px)',
//           }}
//         >
//           <Stack spacing={2} alignItems="center">
//             <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
//               Advertisement in Progress
//             </Typography>
//             <Typography variant="body2" sx={{ color: textSecondary }}>
//               {adNoticeMessage}
//             </Typography>
//             <Button
//               variant="contained"
//               onClick={() => setAdNoticeOpen(false)}
//               sx={{
//                 bgcolor: primary,
//                 color: onPrimary,
//                 px: 3,
//                 '&:hover': { bgcolor: theme.palette.primary.dark }
//               }}
//             >
//               Got it
//             </Button>
//           </Stack>
//         </Paper>
//       </Modal>






//     <Box sx={{ backgroundColor: bgDefault, minHeight: "100vh", color: textPrimary }}>



//       {/* Hero Section with Artist Cover */}

//       {/* to do */}

// <Box
//   sx={{
//     position: 'relative',
//     overflow: 'hidden',
//     pt: { xs: 2, sm: 3, md: 4 },
//     pb: { xs: 4, sm: 5, md: 6 },
//     px: { xs: 2, sm: 3, md: 4 },
//   }}
// >
//   {/* Background layers remain the same */}
//   <Box
//     sx={{
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundImage: `url(${artist.cover})`,
//       backgroundSize: 'cover',
//       backgroundPosition: 'center',
//       filter: 'blur(50px) brightness(0.65)',
//       opacity: 0.6,
//       transform: 'scale(1.1)',
//       zIndex: 0,
//     }}
//   />
  
//   <Box
//     sx={{
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       background: `radial-gradient(circle at 20% 20%, ${alpha(primary, 0.25)}, transparent 40%), 
//         radial-gradient(circle at 80% 10%, ${alpha('#fff', 0.15)}, transparent 35%),
//         linear-gradient(180deg, ${alpha(bgDefault, 0)} 0%, ${alpha(bgDefault, 0.5)} 50%, ${bgDefault} 100%)`,
//       zIndex: 1,
//     }}
//   />

//   {/* Back Arrow */}
//   <IconButton
//     onClick={() => navigate(-1)}
//     sx={{
//       position: 'relative',
//       zIndex: 3,
//       mb: { xs: 2, sm: 3 },
//       ml: { xs: 1, sm: 2 },
//       color: '#fff',
//       bgcolor: alpha('#fff', 0.1),
//       backdropFilter: 'blur(10px)',
//       border: `1px solid ${alpha('#fff', 0.2)}`,
//       '&:hover': {
//         bgcolor: alpha('#fff', 0.2),
//       }
//     }}
//   >
//     <ArrowBack />
//   </IconButton>

//   {/* Main Content Container */}
//   <Container 
//     maxWidth="lg"
//     sx={{
//       position: 'relative',
//       zIndex: 2,
//     }}
//   >
//     {/* Image + Artist Info Row */}
//     <Box
//       sx={{
//         display: 'grid',
//         gridTemplateColumns: { 
//           xs: '1fr', 
//           md: 'minmax(300px, 400px) 1fr',
//           lg: 'minmax(320px, 450px) 1fr'
//         },
//         alignItems: 'flex-start',
//         gap: { xs: 4, sm: 5, md: 6, lg: 8 },
//         mb: { xs: 4, sm: 5, md: 6 },
//       }}
//     >
//       {/* Portrait Artwork Card */}
//       <Box
//         sx={{
//           position: 'relative',
//           width: '100%',
//           height: 'auto',
//           aspectRatio: { xs: '3/4', md: '4/5' },
//           maxWidth: { xs: '320px', sm: '360px', md: '100%' },
//           mx: { xs: 'auto', md: 0 },
//           '&::before': {
//             content: '""',
//             position: 'absolute',
//             top: { xs: -10, sm: -12, md: -14 },
//             left: { xs: -10, sm: -12, md: -14 },
//             right: { xs: -10, sm: -12, md: -14 },
//             bottom: { xs: -10, sm: -12, md: -14 },
//             background: `linear-gradient(45deg, 
//               ${alpha(primary, 0.4)}, 
//               ${alpha('#fff', 0.12)}, 
//               ${alpha(primary, 0.4)}
//             )`,
//             borderRadius: { xs: '16px', sm: '20px', md: '24px' },
//             zIndex: -1,
//             filter: 'blur(20px)',
//             opacity: 0.6,
//           }
//         }}
//       >
//         <Box
//           sx={{
//             position: 'relative',
//             width: '100%',
//             height: '100%',
//             borderRadius: { xs: '12px', sm: '16px', md: '20px' },
//             overflow: 'hidden',
//             boxShadow: `
//               0 20px 40px rgba(0,0,0,0.35),
//               0 0 0 1px ${alpha('#fff', 0.1)},
//               inset 0 0 0 1px ${alpha('#fff', 0.08)}
//             `,
//             bgcolor: alpha('#000', 0.25),
//             backdropFilter: 'blur(10px)',
//           }}
//         >
//           <Box
//             component="img"
//             src={artist.avatar || artist.cover}
//             alt={artist.name}
//             sx={{
//               width: '100%',
//               height: '100%',
//               aspectRatio: 'inherit',
//               objectFit: 'cover',
//               objectPosition: 'center',
//             }}
//           />

//           {artist.verified && (
//             <Box
//               sx={{
//                 position: 'absolute',
//                 top: { xs: 12, sm: 14, md: 16 },
//                 right: { xs: 12, sm: 14, md: 16 },
//                 width: { xs: 32, sm: 36, md: 40 },
//                 height: { xs: 32, sm: 36, md: 40 },
//                 borderRadius: '50%',
//                 display: 'grid',
//                 placeItems: 'center',
//                 bgcolor: alpha('#000', 0.55),
//                 border: `1px solid ${alpha('#fff', 0.25)}`,
//                 boxShadow: `0 10px 24px ${alpha('#000', 0.45)}`,
//                 backdropFilter: 'blur(10px)',
//               }}
//             >
//               <Verified sx={{ color: primary, fontSize: { xs: 18, sm: 20, md: 22 } }} />
//             </Box>
//           )}

//           <Paper
//             elevation={0}
//             sx={{
//               position: 'absolute',
//               bottom: { xs: 12, sm: 14, md: 16 },
//               left: { xs: 12, sm: 14, md: 16 },
//               right: { xs: 12, sm: 14, md: 16 },
//               bgcolor: alpha('#000', 0.5),
//               borderRadius: 2,
//               p: { xs: 1.5, sm: 2 },
//               border: `1px solid ${alpha('#fff', 0.1)}`,
//               backdropFilter: 'blur(12px)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               gap: { xs: 1, sm: 1.5 },
//             }}
//           >
//             <Box sx={{ textAlign: 'center', flex: 1 }}>
//               <Typography sx={{ color: alpha('#fff', 0.7), fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 0.5 }}>
//                 Followers
//               </Typography>
//               <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
//                 {typeof followerCount === 'number'
//                   ? followerCount > 9999 
//                     ? `${(followerCount / 1000).toFixed(1)}K`
//                     : followerCount.toLocaleString()
//                   : (artist.followers || '—')}
//               </Typography>
//             </Box>
            
//             {artist.monthlyListeners && (
//               <Box sx={{ textAlign: 'center', flex: 1 }}>
//                 <Typography sx={{ color: alpha('#fff', 0.7), fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 0.5 }}>
//                   Downloads
//                 </Typography>
//                 <Typography sx={{ color: primary, fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
//                   {artist.monthlyListeners}
//                 </Typography>
//               </Box>
//             )}
            
//             <Box sx={{ textAlign: 'center', flex: 1 }}>
//               <Typography sx={{ color: alpha('#fff', 0.7), fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 0.5 }}>
//                 Songs
//               </Typography>
//               <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
//                 {topTracks.length + albums.length + singles.length}
//               </Typography>
//             </Box>
//           </Paper>
//         </Box>
//       </Box>

//       {/* Artist Info Section */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: { xs: 2, sm: 3 },
//           textAlign: { xs: 'center', md: 'left' },
//           color: '#fff',
//         }}
//       >
//         <Typography
//           variant="h1"
//           sx={{
//             fontSize: { 
//               xs: '2.2rem', 
//               sm: '2.8rem', 
//               md: '3.2rem', 
//               lg: '3.8rem' 
//             },
//             fontWeight: 900,
//             lineHeight: 1.05,
//             mb: { xs: 1, sm: 2 },
//             textShadow: '0 6px 30px rgba(0,0,0,0.55)',
//           }}
//         >
//           {artist.name}
//         </Typography>

//         <Stack 
//           direction="row" 
//           spacing={1} 
//           flexWrap="wrap" 
//           useFlexGap 
//           justifyContent={{ xs: 'center', md: 'flex-start' }}
//           mb={2}
//         >
//           {artist.genre.slice(0, 3).map((g, i) => (
//             <Chip
//               key={i}
//               label={g}
//               size="small"
//               sx={{
//                 bgcolor: alpha(primary, 0.15),
//                 color: '#fff',
//                 border: `1px solid ${alpha(primary, 0.4)}`,
//                 fontSize: { xs: '0.8rem', sm: '0.85rem' },
//               }}
//             />
//           ))}
//           {artist.location && (
//             <Chip
//               label={artist.location}
//               size="small"
//               icon={<Place sx={{ fontSize: { xs: 14, sm: 16 }, color: primary }} />}
//               sx={{
//                 bgcolor: alpha('#fff', 0.08),
//                 color: '#fff',
//                 border: `1px solid ${alpha('#fff', 0.15)}`,
//                 fontSize: { xs: '0.8rem', sm: '0.85rem' },
//               }}
//             />
//           )}
//         </Stack>

//         {artist.bio && (
//           <Typography
//             sx={{
//               fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.1rem' },
//               lineHeight: 1.7,
//               color: alpha('#fff', 0.9),
//             }}
//           >
//             {artist.bio}
//           </Typography>
//         )}
//       </Box>
//     </Box>

//     {/* Action Buttons - Always below both image and info */}
//     <Box
//       sx={{
//         display: 'flex',
//         flexDirection: { xs: 'column', sm: 'row' },
//         justifyContent: { xs: 'center', sm: 'space-between' },
//         alignItems: { xs: 'stretch', sm: 'center' },
//         gap: { xs: 2, sm: 3 },
//         flexWrap: 'wrap',
//         width: '100%',
//         px: { md: 2 },
//       }}
//     >
//       {/* Left Group: Play & Shuffle */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', sm: 'row' },
//           gap: 2,
//           flex: { xs: '1 1 100%', sm: '0 1 auto' },
//           justifyContent: { xs: 'center', sm: 'flex-start' },
//           width: { xs: '100%', sm: 'auto' },
//         }}
//       >
//         <Button
//           variant="contained"
//           startIcon={isArtistTrackPlaying ? <Pause /> : <PlayArrow />}
//           onClick={handlePrimaryPlay}
//           disabled={!playableTrack}
//           sx={{
//             bgcolor: primary,
//             color: onPrimary,
//             px: { xs: 3, sm: 4 },
//             py: 1.5,
//             borderRadius: '12px',
//             fontWeight: 700,
//             fontSize: { xs: '0.95rem', sm: '1rem' },
//             minWidth: { xs: '100%', sm: '140px', md: '160px' },
//             width: { xs: '100%', sm: 'auto' },
//             boxShadow: `0 15px 40px ${alpha(primary, 0.35)}`,
//             '&:hover': {
//               bgcolor: theme.palette.primary.dark,
//               transform: 'translateY(-2px)',
//             },
//             transition: 'all 0.2s ease',
//           }}
//         >
//           {isArtistTrackPlaying ? 'Playing' : 'Play'}
//         </Button>

//         <Button
//           variant="outlined"
//           startIcon={<Shuffle />}
//           sx={{
//             borderColor: alpha('#fff', 0.35),
//             color: '#fff',
//             px: { xs: 3, sm: 4 },
//             py: 1.5,
//             borderRadius: '12px',
//             fontWeight: 700,
//             fontSize: { xs: '0.95rem', sm: '1rem' },
//             minWidth: { xs: '100%', sm: '140px', md: '160px' },
//             width: { xs: '100%', sm: 'auto' },
//             backdropFilter: 'blur(10px)',
//             bgcolor: alpha('#000', 0.25),
//             '&:hover': {
//               borderColor: primary,
//               bgcolor: alpha(primary, 0.12),
//               transform: 'translateY(-2px)',
//             },
//             transition: 'all 0.2s ease',
//           }}
//         >
//           Shuffle
//         </Button>
//       </Box>

//       {/* Right Group: Follow & Share */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', sm: 'row' },
//           gap: 2,
//           flex: { xs: '1 1 100%', sm: '0 1 auto' },
//           justifyContent: { xs: 'center', sm: 'flex-end' },
//           alignItems: 'center',
//           width: { xs: '100%', sm: 'auto' },
//         }}
//       >
//         <Button
//           variant="outlined"
//           startIcon={isFollowing ? <Favorite /> : <FavoriteBorder />}
//           onClick={handleFollowToggle}
//           disabled={followLoading || !user?._id || !artist?.id}
//           sx={{
//             borderColor: isFollowing ? primary : alpha('#fff', 0.35),
//             color: isFollowing ? primary : '#fff',
//             px: { xs: 3, sm: 4 },
//             py: 1.5,
//             borderRadius: '12px',
//             fontWeight: 700,
//             fontSize: { xs: '0.95rem', sm: '1rem' },
//             minWidth: { xs: '100%', sm: '140px', md: '160px' },
//             width: { xs: '100%', sm: 'auto' },
//             backdropFilter: 'blur(10px)',
//             bgcolor: alpha('#000', 0.25),
//             '&:hover': {
//               borderColor: isFollowing ? theme.palette.primary.dark : primary,
//               bgcolor: alpha(primary, 0.12),
//               transform: 'translateY(-2px)',
//             },
//             '&:disabled': {
//               borderColor: alpha('#fff', 0.1),
//               color: alpha('#fff', 0.3),
//             },
//             transition: 'all 0.2s ease',
//           }}
//         >
//           {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
//         </Button>

//         <IconButton
//           onClick={handleShareArtist}
//           sx={{
//             color: '#fff',
//             bgcolor: alpha('#fff', 0.12),
//             width: { xs: 48, sm: 56 },
//             height: { xs: 48, sm: 56 },
//             borderRadius: '14px',
//             '&:hover': {
//               bgcolor: alpha('#fff', 0.2),
//               transform: 'translateY(-2px)',
//             },
//             transition: 'all 0.2s ease',
//             border: `1px solid ${alpha('#fff', 0.2)}`,
//             backdropFilter: 'blur(10px)',
//           }}
//           title="Share artist"
//         >
//           <Share />
//         </IconButton>
//       </Box>
//     </Box>

//     {/* Track Preview (if available) */}
//     {playableTrack && (
//       <Paper
//         sx={{
//           mt: { xs: 3, sm: 4 },
//           bgcolor: alpha('#000', 0.4),
//           border: `1px solid ${alpha('#fff', 0.1)}`,
//           borderRadius: 3,
//           p: { xs: 1.5, sm: 2 },
//           display: 'flex',
//           alignItems: 'center',
//           gap: 2,
//           backdropFilter: 'blur(12px)',
//           boxShadow: `0 12px 32px ${alpha('#000', 0.35)}`,
//         }}
//       >
//         <Avatar
//           src={artist.avatar || artist.cover}
//           alt={playableTrack.title}
//           variant="rounded"
//           sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, borderRadius: 2 }}
//         />
//         <Box sx={{ flex: 1, minWidth: 0 }}>
//           <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
//             {playableTrack.title}
//           </Typography>
//           <Typography sx={{ color: alpha('#fff', 0.7), fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
//             {artist.name} • {typeof playableTrack.duration === 'string'
//               ? playableTrack.duration
//               : formatDuration(playableTrack.durationSeconds || playableTrack.duration)}
//           </Typography>
//         </Box>
//         <Button
//           variant="text"
//           onClick={handlePrimaryPlay}
//           startIcon={isArtistTrackPlaying ? <Pause /> : <PlayArrow />}
//           sx={{
//             color: primary,
//             fontWeight: 700,
//             fontSize: { xs: '0.85rem', sm: '0.9rem' },
//             px: { xs: 1, sm: 2 },
//             '&:hover': { bgcolor: alpha(primary, 0.12) }
//           }}
//         >
//           {isArtistTrackPlaying ? 'Pause' : 'Play'}
//         </Button>
//       </Paper>
//     )}
//   </Container>
// </Box>



//       {/* Main Content */}
//       <Container maxWidth="xl" sx={{ py: 4 }}>
//         {/* Stats Bar */}
     
//         {/* Tabs Navigation */}
//         <Paper
//           sx={{
//             bgcolor: alpha('#111', 0.8),
//             backdropFilter: 'blur(20px)',
//             borderRadius: 3,
//             mb: 4,
//             border: `1px solid ${alpha('#fff', 0.1)}`
//           }}
//         >
//           <Tabs
//             value={activeTab}
//             onChange={(e, newValue) => setActiveTab(newValue)}
//             variant="scrollable"
//             scrollButtons="auto"
//             sx={{
//               '& .MuiTab-root': {
//                 color: alpha('#fff', 0.7),
//                 py: 2,
//                 fontSize: '1rem',
//                 fontWeight: 500,
//                 '&.Mui-selected': { color: theme.palette.primary.main }
//               },
//               '& .MuiTabs-indicator': {
//                 bgcolor: theme.palette.primary.main,
//                 height: 3
//               }
//             }}
//           >
//             <Tab label="Overview" icon={<LibraryMusic />} iconPosition="start" />
//             <Tab label="Popular" icon={<TrendingUp />} iconPosition="start" />
//             <Tab label="Discography" icon={<Album />} iconPosition="start" />
//             <Tab label="Related Artists" icon={<People />} iconPosition="start" />
//             <Tab label="About" icon={<Mic />} iconPosition="start" />
//           </Tabs>

//           {/* Tab Content */}
//           <Box sx={{ p: { xs: 3, md: 4 } }}>
//             {/* Overview Tab */}
//             {activeTab === 0 && (
//               <Grid container spacing={4}>
//                 {/* Popular Tracks */}
//                 <Grid item xs={12} md={6}>
//                   <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                     Popular
//                   </Typography>
//                   <List sx={{ bgcolor: alpha('#000', 0.3), borderRadius: 2 }}>
//                     {topTracks.map((track, index) => (
//                       <ListItem
//                         key={track.id}
//                         sx={{
//                           borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
//                           '&:hover': { bgcolor: alpha('#fff', 0.05) },
//                           cursor: 'pointer'
//                         }}
//                         secondaryAction={
//                           <Typography sx={{ color: alpha('#fff', 0.6) }}>
//                             {track.duration}
//                           </Typography>
//                         }
//                       >
//                         <ListItemAvatar>
//                           <Typography sx={{ 
//                             color: alpha('#fff', 0.6),
//                             fontWeight: 700,
//                             minWidth: 30
//                           }}>
//                             {index + 1}
//                           </Typography>
//                         </ListItemAvatar>
//                         <ListItemText
//                           primary={
//                             <Typography sx={{ color: '#fff', fontWeight: 500 }}>
//                               {track.title}
//                             </Typography>
//                           }
//                           secondary={
//                             <Typography sx={{ color: alpha('#fff', 0.6), fontSize: '0.85rem' }}>
//                               {track.plays} plays
//                             </Typography>
//                           }
//                         />
//                         <IconButton
//                           size="small"
//                           sx={{ color: theme.palette.primary.main }}
//                           onClick={() => setCurrentTrack(track)}
//                         >
//                           <PlayCircle />
//                         </IconButton>
//                       </ListItem>
//                     ))}
//                   </List>
//                 </Grid>

//                 {/* Artist Info */}
//                 <Grid item xs={12} md={6}>
//                   <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                     About
//                   </Typography>
//                   <Paper sx={{ bgcolor: alpha('#000', 0.3), p: 3, borderRadius: 2 }}>
//                     <Typography sx={{ color: alpha('#fff', 0.9), lineHeight: 1.8, mb: 3 }}>
//                       {artist.bio}
//                     </Typography>
                    
//                     <Box sx={{ display: 'grid', gap: 2 }}>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                         <Place sx={{ color: alpha('#fff', 0.6) }} />
//                         <Typography sx={{ color: alpha('#fff', 0.9) }}>
//                           {artist.location}
//                         </Typography>
//                       </Box>
                      
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                         <Event sx={{ color: alpha('#fff', 0.6) }} />
//                         <Typography sx={{ color: alpha('#fff', 0.9) }}>
//                           Active since {artist.activeSince}
//                         </Typography>
//                       </Box>
                      
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
//                         <MusicVideo sx={{ color: alpha('#fff', 0.6) }} />
//                         <Stack direction="row" spacing={1}>
//                           {artist.genre.map((g, i) => (
//                             <Chip
//                               key={i}
//                               label={g}
//                               size="small"
//                               sx={{
//                                 bgcolor: alpha(theme.palette.primary.main, 0.2),
//                                 color: '#fff'
//                               }}
//                             />
//                           ))}
//                         </Stack>
//                       </Box>
//                     </Box>
//                   </Paper>
//                 </Grid>
//               </Grid>
//             )}

//             {/* Popular Tab - Top Tracks Grid */}
//             {activeTab === 1 && (
//               <Grid container spacing={3}>
//                 {topTracks.map((track) => (
//                   <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
//                     <Card
//                       sx={{
//                         bgcolor: alpha('#111', 0.7),
//                         borderRadius: 3,
//                         border: `1px solid ${alpha('#fff', 0.1)}`,
//                         transition: 'all 0.3s ease',
//                         '&:hover': {
//                           transform: 'translateY(-4px)',
//                           borderColor: theme.palette.primary.main,
//                           boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`
//                         }
//                       }}
//                     >
//                       <CardMedia
//                         component="img"
//                         height="200"
//                         image={artist.avatar}
//                         alt={track.title}
//                       />
//                       <CardContent>
//                         <Typography sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
//                           {track.title}
//                         </Typography>
//                         <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.9rem', mb: 2 }}>
//                           {artist.name} • {track.album}
//                         </Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                           <Typography sx={{ color: theme.palette.primary.main, fontSize: '0.85rem' }}>
//                             {track.plays} plays
//                           </Typography>
//                           <IconButton
//                             size="small"
//                             sx={{ color: theme.palette.primary.main }}
//                             onClick={() => setCurrentTrack(track)}
//                           >
//                             <PlayArrow />
//                           </IconButton>
//                         </Box>
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 ))}
//               </Grid>
//             )}

//             {/* Discography Tab */}
//             {activeTab === 2 && (
//               <Box>
//                 <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                   Albums
//                 </Typography>
//                 <Grid container spacing={3} sx={{ mb: 6 }}>
//                   {albums.map((album) => (
//                     <Grid item xs={6} sm={4} md={3} lg={2.4} key={album.id}>
//                       <Card
//                         sx={{
//                           bgcolor: 'transparent',
//                           border: 'none',
//                           boxShadow: 'none',
//                           cursor: 'pointer',
//                           '&:hover .album-cover': {
//                             transform: 'scale(1.05)'
//                           }
//                         }}
//                       >
//                         <Box sx={{ position: 'relative', mb: 2 }}>
//                           <CardMedia
//                             className="album-cover"
//                             component="img"
//                             image={album.cover}
//                             alt={album.title}
//                             sx={{
//                               borderRadius: 2,
//                               transition: 'transform 0.3s ease',
//                               aspectRatio: '1/1'
//                             }}
//                           />
//                           <Fab
//                             size="small"
//                             sx={{
//                               position: 'absolute',
//                               bottom: 10,
//                               right: 10,
//                               bgcolor: theme.palette.primary.main,
//                               color: '#000',
//                               '&:hover': { bgcolor: theme.palette.primary.dark }
//                             }}
//                           >
//                             <PlayArrow />
//                           </Fab>
//                         </Box>
//                         <CardContent sx={{ p: 0 }}>
//                           <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
//                             {album.title}
//                           </Typography>
//                           <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.85rem' }}>
//                             {album.year} • {album.tracks} songs
//                           </Typography>
//                         </CardContent>
//                       </Card>
//                     </Grid>
//                   ))}
//                 </Grid>

//                 <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                   Singles
//                 </Typography>
//                 <Grid container spacing={3}>
//                   {singles.map((single) => (
//                     <Grid item xs={6} sm={4} md={3} lg={2.4} key={single.id}>
//                       <Card
//                         sx={{
//                           bgcolor: 'transparent',
//                           border: 'none',
//                           boxShadow: 'none',
//                           cursor: 'pointer'
//                         }}
//                       >
//                         <CardMedia
//                           component="img"
//                           image={single.cover}
//                           alt={single.title}
//                           sx={{ borderRadius: 2, aspectRatio: '1/1', mb: 1 }}
//                         />
//                         <CardContent sx={{ p: 0 }}>
//                           <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
//                             {single.title}
//                           </Typography>
//                           <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.85rem' }}>
//                             {single.year}
//                           </Typography>
//                         </CardContent>
//                       </Card>
//                     </Grid>
//                   ))}
//                 </Grid>
//               </Box>
//             )}

//             {/* Related Artists Tab */}
//             {activeTab === 3 && (
//               <Grid container spacing={3}>
//                 {relatedArtists.map((related) => (
//                   <Grid item xs={12} sm={6} md={4} lg={3} key={related.id}>
//                     <Card
//                       sx={{
//                         bgcolor: alpha('#111', 0.7),
//                         borderRadius: 3,
//                         border: `1px solid ${alpha('#fff', 0.1)}`,
//                         transition: 'all 0.3s ease',
//                         cursor: 'pointer',
//                         '&:hover': {
//                           transform: 'translateY(-4px)',
//                           borderColor: theme.palette.primary.main,
//                           boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`
//                         }
//                       }}
//                       onClick={() => navigate(`/artist/${related.id}`)}
//                     >
//                       <CardMedia
//                         component="img"
//                         height="200"
//                         image={related.avatar}
//                         alt={related.name}
//                         sx={{ borderBottom: `1px solid ${alpha('#fff', 0.1)}` }}
//                       />
//                       <CardContent>
//                         <Typography sx={{ color: textPrimary, fontWeight: 700, mb: 1 }}>
//                           {related.name}
//                         </Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                           <People sx={{ fontSize: '1rem', color: alpha('#fff', 0.6) }} />
//                           <Typography sx={{ color: textSecondary, fontSize: '0.9rem' }}>
//                             {related.followers} followers
//                           </Typography>
//                         </Box>
//                       </CardContent>
//                     </Card>
//                   </Grid>
//                 ))}
//               </Grid>
//             )}

//             {/* About Tab */}
//             {activeTab === 4 && (
//               <Grid container spacing={4}>
//                 <Grid item xs={12} md={8}>
//                   <Paper sx={{ bgcolor: alpha('#000', 0.3), p: 4, borderRadius: 3 }}>
//                     <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                       Biography
//                     </Typography>
//                     <Typography sx={{ color: alpha('#fff', 0.9), lineHeight: 1.8, mb: 4 }}>
//                       {artist.bio}
//                     </Typography>

//                     <Divider sx={{ borderColor: alpha('#fff', 0.1), my: 4 }} />

//                     <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
//                       Career Highlights
//                     </Typography>
//                     <List>
//                       <ListItem sx={{ px: 0 }}>
//                         <ListItemAvatar>
//                           <Chip label="2019" sx={{ bgcolor: theme.palette.primary.main, color: '#000' }} />
//                         </ListItemAvatar>
//                         <ListItemText
//                           primary="Grammy Award Nomination"
//                           secondary="Best World Music Album for 'African Giant'"
//                           sx={{ color: '#fff' }}
//                         />
//                       </ListItem>
//                       <ListItem sx={{ px: 0 }}>
//                         <ListItemAvatar>
//                           <Chip label="2020" sx={{ bgcolor: theme.palette.primary.main, color: '#000' }} />
//                         </ListItemAvatar>
//                         <ListItemText
//                           primary="Grammy Award Win"
//                           secondary="Best Global Music Album for 'Twice As Tall'"
//                           sx={{ color: '#fff' }}
//                         />
//                       </ListItem>
//                     </List>
//                   </Paper>
//                 </Grid>

//                 <Grid item xs={12} md={4}>
//                   <Paper sx={{ bgcolor: alpha('#000', 0.3), p: 3, borderRadius: 3, mb: 3 }}>
//                     <Typography variant="h6" sx={{ mb: 2, color: '#fff', fontWeight: 700 }}>
//                       Genres
//                     </Typography>
//                     <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
//                       {artist.genre.map((g, i) => (
//                         <Chip
//                           key={i}
//                           label={g}
//                           sx={{
//                             bgcolor: alpha(theme.palette.primary.main, 0.2),
//                             color: '#fff',
//                             mb: 1
//                           }}
//                         />
//                       ))}
//                     </Stack>
//                   </Paper>

//                   <Paper sx={{ bgcolor: alpha('#000', 0.3), p: 3, borderRadius: 3 }}>
//                     <Typography variant="h6" sx={{ mb: 2, color: '#fff', fontWeight: 700 }}>
//                       Social Media
//                     </Typography>
//                     <Box sx={{ display: 'grid', gap: 2 }}>
//                       <Button
//                         variant="outlined"
//                         startIcon={<Language />}
//                         sx={{
//                           justifyContent: 'flex-start',
//                           borderColor: alpha('#fff', 0.2),
//                           color: '#fff',
//                           '&:hover': { borderColor: theme.palette.primary.main }
//                         }}
//                       >
//                         Instagram: @{artist.social.instagram}
//                       </Button>
//                       <Button
//                         variant="outlined"
//                         startIcon={<Language />}
//                         sx={{
//                           justifyContent: 'flex-start',
//                           borderColor: alpha('#fff', 0.2),
//                           color: '#fff',
//                           '&:hover': { borderColor: theme.palette.primary.main }
//                         }}
//                       >
//                         Twitter: @{artist.social.twitter}
//                       </Button>
//                       <Button
//                         variant="outlined"
//                         startIcon={<Language />}
//                         sx={{
//                           justifyContent: 'flex-start',
//                           borderColor: alpha('#fff', 0.2),
//                           color: '#fff',
//                           '&:hover': { borderColor: theme.palette.primary.main }
//                         }}
//                       >
//                         YouTube: {artist.social.youtube}
//                       </Button>
//                     </Box>
//                   </Paper>
//                 </Grid>
//               </Grid>
//             )}
//           </Box>
//         </Paper>
//       </Container>

//       {/* Floating Player Controls */}
//       {playingTrack && (
//         <Paper
//           sx={{
//             position: 'fixed',
//             bottom: 20,
//             left: '50%',
//             transform: 'translateX(-50%)',
//             width: '90%',
//             maxWidth: 800,
//             bgcolor: alpha(bgPaper, 0.95),
//             backdropFilter: 'blur(20px)',
//             borderRadius: 3,
//             p: 2,
//             border: `1px solid ${primary}`,
//             zIndex: 1000,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between'
//           }}
//         >
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
//             <Avatar
//               src={artist.avatar}
//               sx={{ width: 50, height: 50 }}
//             />
//             <Box>
//               <Typography sx={{ color: '#fff', fontWeight: 600 }}>
//                 {playingTrack.title}
//               </Typography>
//               <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.85rem' }}>
//                 {artist.name}
//               </Typography>
//             </Box>
//           </Box>

//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <IconButton sx={{ color: textPrimary }} onClick={handleShareArtist}>
//               <SkipPrevious />
//             </IconButton>
//             <IconButton
//               sx={{
//                 bgcolor: theme.palette.primary.main,
//                 color: '#000',
//                 '&:hover': { bgcolor: theme.palette.primary.dark }
//               }}
//             >
//               <PlayArrow />
//             </IconButton>
//             <IconButton sx={{ color: textPrimary }} onClick={handleShareArtist}>
//               <SkipNext />
//             </IconButton>
//           </Box>

//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <IconButton
//               size="small"
//               sx={{ color: '#fff' }}
//               onClick={() => setCurrentTrack(null)}
//             >
//               <QueueMusic />
//             </IconButton>
//             <IconButton
//               size="small"
//               sx={{ color: '#fff' }}
//               onClick={() => setCurrentTrack(null)}
//             >
//               <MoreVert />
//             </IconButton>
//           </Box>
//         </Paper>
//       )}
//     </Box>
//     </>
//   );
// };

// export default ArtistPage;



import React, { useState, useEffect, useMemo } from 'react';
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
  

    Person,
  PersonAdd,
  Block,
  Description,
  Radio,
  Flag,
 
  DesktopWindows,
 
  FileDownloadOutlined,
} from '@mui/icons-material';
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
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRESIGNED_URL_DOWNLOAD, GET_PRESIGNED_URL_DOWNLOAD_AUDIO } from '../utils/mutations.js';
import { toBucketKey } from '../utils/bucketKeySupport.js';




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
  const { currentTrack: playingTrack, isPlaying: playerIsPlaying, isAdPlaying, handlePlaySong, pause } = useAudioPlayer();
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
  const [followerCount, setFollowerCount] = useState(null);

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

// Check what resolvedArtistId actually is
console.log('🔍 resolvedArtistId value:', resolvedArtistId);
console.log('🔍 Type of resolvedArtistId:', typeof resolvedArtistId);
console.log('🔍 Is resolvedArtistId truthy?', !!resolvedArtistId);




if (songsError) console.log('songsError:', songsError);
if (shouldSkipSongs) console.log('Skipping song query (no artist id)');



  const hasServerSongs = Boolean(songsData?.getArtistSongs?.length);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);

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
    if (!resolvedArtistId || !songsData) return;

    const songs = songsData.getArtistSongs || [];
    if (!songs.length) {
      setTopTracks([]);
      return;
    }

    const mappedTracks = songs.map((song) => {
      const cover =
        song.artworkUrl ||
        song.artwork ||
        song.album?.albumCoverImage ||
        song.artist?.coverImage ||
        song.artist?.profileImage ||
        null;
      const durationSeconds = Number(song.duration ?? song.durationSeconds ?? 0);
      const playbackUrl = song.audioUrl || song.audioFileUrl || song.streamAudioFileUrl || null;

      const rawSong = {
        ...song,
        id: song._id || song.id,
        artistName: song.artist?.artistAka || song.artist?.fullName,
        artistId: song.artist?._id || resolvedArtistId,
        cover,
        artworkUrl: song.artworkUrl || cover,
        artworkPresignedUrl: song.artworkPresignedUrl || cover,
        fullUrl: playbackUrl,
        fullUrlWithAds: playbackUrl,
        audioUrl: playbackUrl,
        url: playbackUrl,
        durationSeconds,
        duration: durationSeconds,
      };

      return {
        id: String(rawSong.id),
        title: song.title || 'Untitled',
        album: song.album?.title || 'Single',
        plays: Number(song.playCount) || 0,
        duration: durationSeconds,
        thumbnail: cover,
        albumArt: song.album?.albumCoverImage || cover,
        artistAka: rawSong.artistName,
        downloadUrl: playbackUrl,
        raw: rawSong,
      };
    });

    setTopTracks(mappedTracks);

    const resolveArtwork = async (pointer) => {
      if (!pointer) return null;
      try {
        // Always attempt to re-sign via mutation so we get a stable, fresh URL.
        const { bucket, key } = toBucketKey(pointer, 'afrofeel-cover-images-for-songs');
        if (bucket && key) {
          const region =
            bucket === 'afrofeel-cover-images-for-songs' ? 'us-east-2' : 'us-west-2';
          const { data } = await getPresignedUrlDownload({
            variables: { bucket, key: decodeURIComponent(key), region },
          });
          if (data?.getPresignedUrlDownload?.urlToDownload) {
            return data.getPresignedUrlDownload.urlToDownload;
          }
        }
      } catch (err) {
        console.warn('resolveArtwork presign failed', err);
      }
      // Fallback to the original pointer if we couldn't sign it
      return pointer;
    };

    const resolveAudio = async (pointer) => {
      if (!pointer) return null;
      try {
        const { bucket, key } = toBucketKey(pointer, 'afrofeel-songs-streaming');
        if (bucket && key) {
          const region = bucket === 'afrofeel-songs-streaming' ? 'us-west-2' : 'us-west-2';
          const { data } = await getPresignedUrlDownloadAudio({
            variables: { bucket, key: decodeURIComponent(key), region },
          });
          if (data?.getPresignedUrlDownloadAudio?.url) {
            return data.getPresignedUrlDownloadAudio.url;
          }
        }
      } catch (err) {
        console.warn('resolveAudio presign failed', err);
      }
      return pointer;
    };

    (async () => {
      try {
        const hydrated = await Promise.all(
          mappedTracks.map(async (track) => {
            const artPointer = track.raw.artworkUrl || track.raw.artwork || track.thumbnail || track.albumArt;
            const presignedArt = await resolveArtwork(artPointer);
            const presignedAudio = await resolveAudio(track.raw.streamAudioFileUrl || track.raw.audioUrl || track.raw.audioFileUrl);
            return {
              ...track,
              thumbnail: presignedArt || track.thumbnail,
              albumArt: presignedArt || track.albumArt,
              downloadUrl: presignedAudio || track.downloadUrl,
              raw: {
                ...track.raw,
                artworkUrl: presignedArt || track.raw.artworkUrl || track.raw.artwork,
                artworkPresignedUrl: presignedArt || track.raw.artworkPresignedUrl,
                cover: presignedArt || track.raw.cover,
                streamAudioFileUrl: presignedAudio || track.raw.streamAudioFileUrl,
                audioUrl: presignedAudio || track.raw.audioUrl,
                audioFileUrl: presignedAudio || track.raw.audioFileUrl,
                fullUrl: presignedAudio || track.raw.fullUrl,
                fullUrlWithAds: presignedAudio || track.raw.fullUrlWithAds,
                url: presignedAudio || track.raw.url,
              },
            };
          })
        );

        setTopTracks(hydrated);
        if (!playableTrack && hydrated.length) {
          setPlayableTrack(hydrated[0].raw);
        }
      } catch (err) {
        console.warn('Failed to hydrate artwork URLs', err);
        if (!playableTrack && mappedTracks.length) {
          setPlayableTrack(mappedTracks[0].raw);
        }
      }
    })();

    const primarySong = songs[0];
    if (primarySong?.artist) {
      const followersNumber =
        typeof primarySong.artistFollowers === 'number'
          ? primarySong.artistFollowers
          : Array.isArray(primarySong.artist.followers)
            ? primarySong.artist.followers.length
            : null;

      if (typeof followersNumber === 'number') {
        setFollowerCount(followersNumber);
      }

      setArtist((prev) => ({
        ...(prev || {}),
        id: resolvedArtistId,
        name: primarySong.artist.artistAka || primarySong.artist.fullName || prev?.name || 'Unknown Artist',
        aka: primarySong.artist.artistAka || prev?.aka,
        bio: primarySong.artist.bio ?? prev?.bio ?? '',
        followers: followersNumber ?? prev?.followers ?? '—',
        genre: primarySong.artist.genre || prev?.genre || [],
        location: primarySong.artist.country || prev?.location || '',
        verified: prev?.verified ?? false,
        avatar: primarySong.artist.profileImage || prev?.avatar,
        cover: primarySong.artist.coverImage || prev?.cover || primarySong.artist.profileImage || null,
      }));
    }
  }, [resolvedArtistId, playableTrack, songsData, getPresignedUrlDownload]);



  // Load artist data from navigation state or current track
  useEffect(() => {
    const sourceSong = (location.state && location.state.song) || playingTrack;
    if (!sourceSong || !resolvedArtistId) return;
    if (hasServerSongs) return; // don't overwrite server-fetched songs

    const artwork = sourceSong.artworkPresignedUrl || sourceSong.artworkUrl || sourceSong.cover || sourceSong.image || null;
    const artistName = sourceSong.artistName || sourceSong.artist || 'Unknown Artist';
    const rawFollowers = typeof sourceSong.artistFollowers === 'number' ? sourceSong.artistFollowers : null;
    const artistFollowers = rawFollowers != null ? rawFollowers.toLocaleString() : null;

    setArtist({
      id: derivedArtistId,
      name: artistName,
      aka: sourceSong.artistAka || sourceSong.artist || artistName,
      bio: sourceSong.artistBio || '',
      followers: artistFollowers || '—',
      genre: Array.isArray(sourceSong.genre) ? sourceSong.genre : [],
      location: sourceSong.country || '',
      verified: Boolean(sourceSong.artistVerified),
      avatar: sourceSong.artistProfileImage || artwork || undefined,
      cover: sourceSong.artistCoverImage || artwork || undefined,
    });

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

  const isArtistTrackPlaying = playableTrack && playingTrack?.id === playableTrack.id && playerIsPlaying;
  const buildArtistQueue = (currentId) =>
    topTracks
      .filter((track) => track?.raw?.id && String(track.raw.id) !== String(currentId))
      .map((track) => ({ ...track.raw, id: String(track.raw.id) }));

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

    try {
      const queue = buildArtistQueue(playableTrack.id || playableTrack._id);
      await handlePlaySong(playableTrack, queue, { source: 'artist-page', artistId: resolvedArtistId });
    } catch (err) {
      console.warn('Artist page play failed', err);
    }
  };

  const handleShuffle = async () => {
    if (!topTracks.length) return;
    const randomIndex = Math.floor(Math.random() * topTracks.length);
    const nextTrack = topTracks[randomIndex];
    const queue = buildArtistQueue(nextTrack.raw.id);
    await handlePlaySong(nextTrack.raw, queue, { source: 'artist-page', artistId: resolvedArtistId });
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
    const isThisPlaying = playingTrack?.id === track?.raw?.id && playerIsPlaying;

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
            }}
              onClick={() => handlePlaySong(track.raw, buildArtistQueue(track.raw.id), { source: 'artist-page', artistId: resolvedArtistId })}
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
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha('#fff', 0.14),
                    border: `1px solid ${alpha('#fff', 0.18)}`,
                  }}
                >
                  {isThisPlaying ? (
                    <Pause sx={{ fontSize: 18, color: '#fff' }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 18, color: '#fff' }} />
                  )}
                </Box>
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
  {/* Background Image */}
  <Box
    component="img"
    src={artist.cover || artist.avatar}
    alt={artist.name}
    loading="lazy"
    decoding="async"
    sx={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      objectFit: 'cover', 
      objectPosition: 'center', 
      backgroundColor: '#121212', // Fallback
      transition: 'opacity 0.3s ease',
    }}
    onLoad={(e) => {
      e.target.style.opacity = 1;
    }}
    style={{ opacity: 0 }}
  />
  
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

  {/* Content Container */}
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
          <Button
            variant="contained"
            startIcon={isArtistTrackPlaying ? <Pause /> : <PlayArrow />}
            onClick={handlePrimaryPlay}
            disabled={!playableTrack}
            sx={{
              bgcolor: primary,
              color: onPrimary,
              borderRadius: 10,
              textTransform: 'none',
              fontWeight: 800,
              px: { xs: 2.5, sm: 3, md: 4 },
              py: { xs: 1, sm: 1.2, md: 1.5 },
              minWidth: { xs: 140, sm: 160, md: 200, lg: 240 },
              minHeight: { xs: 44, sm: 48, md: 56, lg: 64 },
              fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.05rem' },
              '&:hover': { transform: 'scale(1.02)' },
              '&:active': { transform: 'scale(0.98)' },
              transition: 'transform 0.2s ease',
            }}
          >
            {isArtistTrackPlaying ? 'Playing' : 'Play'}
          </Button>

          {/* Shuffle Button */}
          <Button
            variant="outlined"
            startIcon={<Shuffle />}
            disabled={!playableTrack}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              bgcolor: 'transparent',
              borderRadius: 10,
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 0.8, sm: 1, md: 1.2 },
              minWidth: { xs: 120, sm: 140, md: 160, lg: 180 },
              minHeight: { xs: 40, sm: 44, md: 48, lg: 52 },
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.6)',
                bgcolor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Shuffle
          </Button>
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
  <IconButton
    aria-label="Share"
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
    <Share sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
    <Typography 
      variant="caption" 
      sx={{ 
        fontSize: { xs: '0.7rem', sm: '0.75rem' },
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      Share
    </Typography>
  </IconButton>

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
</Box>



{/* Section */}

<Box sx={{ 
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 3, md: 4 },
  backgroundColor: 'transparent',
}}>

  {/* 1. TOP TRACKS SECTION */}
  <Box sx={{ mb: { xs: 4, md: 5 } }}>
    <Typography 
      variant="h5" 
      sx={{ 
        fontWeight: 700,
        mb: 3,
        color: '#fff',
        fontSize: { xs: '1.5rem', md: '1.75rem' }
      }}
    >
      Top tracks
    </Typography>

    {/* Data Grid for Top Tracks */}
    <Box sx={{ 
      display: 'grid',
      gap: 0,
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Header Row (Desktop only) */}
      <Box sx={{ 
        display: { xs: 'none', md: 'grid' },
        gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 0.4fr 0.4fr',
        alignItems: 'center',
        py: 2,
        px: 2,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          TITLE
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          ALBUM
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          PLAYS
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          DURATION
        </Typography>
        <Box></Box> {/* Empty for add button */}
        <Box></Box> {/* Empty for more actions */}
      </Box>





      {/* Track Rows */}
      {songsLoading && !topTracks.length && (
        <Box sx={{ px: 2, py: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {songsError && (
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 2 }}>
          Unable to load songs right now. Please try again shortly.
        </Typography>
      )}

      {!songsLoading && !songsError && topTracks.length === 0 && (
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', px: 2, py: 2 }}>
          No songs available for this artist yet.
        </Typography>
      )}

      {topTracks.map((track, index) => (
        <Box 
          key={track.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'auto 1fr auto auto',
              md: 'auto 1fr 1fr 0.8fr 0.8fr 0.4fr 0.4fr'
            },
            alignItems: 'center',
            gap: { xs: 1.5, md: 2 },
            py: { xs: 1.5, md: 2 },
            px: { xs: 1, md: 2 },
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 1,
            },
            transition: 'background-color 0.2s ease',
          }}
        >
          {/* Index Number (Mobile & Desktop) */}
          <Typography 
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 500,
              textAlign: 'center',
              minWidth: 24,
            }}
          >
            {index + 1}
          </Typography>

          {/* Track Info (Title + Thumbnail) */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 1.5 },
            overflow: 'hidden',
          }}>
            {/* Thumbnail */}
            <Box
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
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
            </Box>

            {/* Title & Artist (Mobile shows more info) */}
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.title}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: { xs: '0.8rem', md: '0.85rem' },
                  display: { xs: 'block', md: 'none' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.album} • {(track.plays ?? 0).toLocaleString()} plays
              </Typography>
            </Box>
          </Box>

          {/* Album (Desktop only) */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.album}
            </Typography>
          </Box>

          {/* Plays (Desktop only) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.95rem',
              }}
            >
              {(track.plays ?? 0).toLocaleString()}
            </Typography>
          </Box>

          {/* Duration (Desktop only) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.95rem',
              }}
            >
              {formatDuration(track.duration)}
            </Typography>
          </Box>

          {/* Add to Playlist Button */}
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              width: { xs: 32, md: 36 },
              height: { xs: 32, md: 36 },
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Add sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }} />
          </IconButton>

          {/* More Actions Button */}
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              '&:hover': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MoreHorizIcon sx={{ fontSize: { xs: '1.2rem', md: '1.3rem' } }} />
          </IconButton>
        </Box>
      ))}
    </Box>

    {/* Show All Button */}
    {topTracks.length > 5 && (
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          variant="outlined"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            fontSize: '0.9rem',
            fontWeight: 500,
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.05)',
            },
          }}
        >
          Show all
        </Button>
      </Box>
    )}
  </Box>

  {/* 2. OTHER SINGLES SECTION */}
  {artist.otherSingles && artist.otherSingles.length > 0 && (
    <Box>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          mb: 3,
          color: '#fff',
          fontSize: { xs: '1.5rem', md: '1.75rem' }
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
        gap: { xs: 2, md: 3 },
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
