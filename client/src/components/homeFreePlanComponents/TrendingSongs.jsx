import React, { useCallback, useRef, useEffect, useState, useMemo} from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { usePlayCount } from '../../utils/handlePlayCount';

import { GET_PRESIGNED_URL_DOWNLOAD } from '../../utils/mutations';
import { useScrollNavigation } from '../../utils/someSongsUtils/scrollHooks.js';

import { SongCardHero, CompactSongCardHero } from '../otherSongsComponents/songCard.jsx';

import { handleTrendingSongPlay } from '../../utils/plabackUtls/handleSongPlayBack.js';

const artworkCache = new Map();

const normalizeKey = (value) => {
  if (!value || typeof value !== "string") return "";
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return decodeURIComponent(value.replace(/^\/+/, ""));
  }
  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
};


const Helmet = ({ children }) => {
  useEffect(() => {
    if (!children) return;

    const nodes = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const el = document.createElement(child.type);
      Object.entries(child.props || {}).forEach(([key, value]) => {
        if (key === 'children' || key === 'key' || value == null) return;
        el.setAttribute(key, value);
      });
      document.head.appendChild(el);
      nodes.push(el);
    });

    return () => {
      nodes.forEach((node) => {
        if (node && node.parentNode === document.head) {
          document.head.removeChild(node);
        }
      });
    };
  }, [children]);

  return null;
};



// export default function TrendingSongs({ songs, refetch, onCardClick }) {
//   const containerRef = useRef(null);
//   const client = useApolloClient();
//   const theme = useTheme();
 



//     const { incrementPlayCount } = usePlayCount();
//   const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();


//   const {
//     scrollContainerRef,
//     showLeftArrow,
//     showRightArrow,
//     showAll,
//     handleWheel,
//     handleNavClick,
//       checkScrollPosition,
//        handleShowAll,
//   } = useScrollNavigation();


// // const trendingSongs = processSongs(songsWithArtwork)

// //   .filter((song) => song.audioUrl)
// //   .sort((a, b) => b.plays - a.plays)
// //   .slice(0, 20);

//   // use memo to memoise the process

//   // use memo to memoise the process

// const processedSongs = Array.isArray(songs) ? songs : [];
// const heroProcessedSongs = useMemo(() => processedSongs.slice(0, 8), [processedSongs]);
// const allProcessedTrendingSongs = useMemo(() => processedSongs.slice(0, 20), [processedSongs]);

// const [heroSongs, setHeroSongs] = useState([]);
// const [allPresignedSongs, setAllPresignedSongs] = useState([]);
// const [hasPresignedAll, setHasPresignedAll] = useState(false);
// const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);



//   useEffect(() => {
//     setHeroSongs(heroProcessedSongs);
//   }, [heroProcessedSongs]);


//   useEffect(() => {
//     setAllPresignedSongs(allProcessedTrendingSongs);
//     setHasPresignedAll(false);
//   }, [allProcessedTrendingSongs]);





//   const getArtworkKey = (song) =>
//     song.artworkKey || song.coverImageKey || song.artwork || song.coverImage || '';

//   const presignSongs = useCallback(
//     async (subset) => {
//       if (!subset.length) return subset;
//       try {
//         const updated = await Promise.all(
//           subset.map(async (song) => {
//             const artworkKey = getArtworkKey(song);
//             if (!artworkKey) {
//               return song;
//             }
//             if (artworkCache.has(artworkKey)) {
//               return {
//                 ...song,
//                 artworkUrl: artworkCache.get(artworkKey),
//               };
//             }
//             const { data } = await getPresignedUrlDownload({
//               variables: {
//                 bucket: 'afrofeel-cover-images-for-songs',
//                 key: artworkKey,
//                 region: 'us-east-2',
//                 expiresIn: 604800,
//               },
//             });
//             const url = data?.getPresignedUrlDownload?.url;
//             if (url) {
//               artworkCache.set(artworkKey, url);
//             }
//             return {
//               ...song,
//               artworkUrl: url || song.artworkUrl,
//             };
//           })
//         );
//         return updated;
//       } catch (error) {
//         console.error('Error presigning artwork:', error);
//         return subset;
//       }
//     },
//     [getPresignedUrlDownload]
//   );

//   useEffect(() => {
//     if (!heroProcessedSongs.length) {
//       setHeroSongs([]);
//       return;
//     }
//     let isMounted = true;
//     presignSongs(heroProcessedSongs).then((updated) => {
//       if (isMounted) {
//         setHeroSongs(updated);
//       }
//     });
//     return () => {
//       isMounted = false;
//     };
//   }, [heroProcessedSongs, presignSongs]);

//   useEffect(() => {
//     if (!showAll || hasPresignedAll) return;
//     if (!allProcessedTrendingSongs.length) return;
//     let isMounted = true;
//     presignSongs(allProcessedTrendingSongs).then((updated) => {
//       if (isMounted) {
//         setAllPresignedSongs(updated);
//         setHasPresignedAll(true);
//       }
//     });
//     return () => {
//       isMounted = false;
//     };
//   }, [showAll, hasPresignedAll, allProcessedTrendingSongs, presignSongs]);

//   const trendingQueue = allPresignedSongs;
//   const handleTrackPlay = useCallback(
//     (song, isCurrent) => {
//       if (isCurrent) {
//         if (isPlaying) {
//           pause();
//           return;
//         }
//         handleTrendingSongPlay({
//           song,
//           incrementPlayCount,
//           handlePlaySong,
//           trendingSongs: trendingQueue,
//           client,
//         });
//         return;
//       }
//       handleTrendingSongPlay({
//         song,
//         incrementPlayCount,
//         handlePlaySong,
//         trendingSongs: trendingQueue,
//         client,
//       });
//     },
//     [client, handlePlaySong, incrementPlayCount, isPlaying, pause, trendingQueue]
//   );
//   const lcpImageUrl = heroSongs?.[0]?.artworkUrl || heroProcessedSongs?.[0]?.artworkUrl;

//   useEffect(() => {
//     checkScrollPosition();
    
//     // Add resize listener
//     window.addEventListener('resize', checkScrollPosition);
//     return () => window.removeEventListener('resize', checkScrollPosition);
//   }, []);





//   return (
//     <>
//       {lcpImageUrl && (
//         <Helmet>
//           <link rel="preload" as="image" href={lcpImageUrl} />
//         </Helmet>
//       )}
//       <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
//       {/* Header */}
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mb: 4,
//           px: { xs: 1, sm: 2 },
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           <Box
//             sx={{
//               width: 4,
//               height: 32,
//               background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)",
//               borderRadius: 2,
//             }}
//           />
//           <Box>
//             <Typography
//               variant="h5"
//               sx={{
//                 fontWeight: 900,
//                 fontFamily: "'Inter', sans-serif",
//                 background: "linear-gradient(45deg, #FFD700 30%, #FFA500 90%)",
//                 backgroundClip: "text",
//                 WebkitBackgroundClip: "text",
//                 color: "transparent",
//                 fontSize: { xs: "1.5rem", sm: "1.75rem" },
//                 letterSpacing: "-0.5px",
//               }}
//             >
//               Trending now
//             </Typography>
//             <Typography
//               variant="caption"
//               sx={{
//                 color: "rgba(255,255,255,0.6)",
//                 fontSize: "0.875rem",
//                 fontWeight: 500,
//               }}
//             >
//               The hottest tracks across Afrofeel right now
//             </Typography>
//           </Box>
//         </Box>
        
//         <IconButton 
//           onClick={handleShowAll}
//           sx={{ 
//             color: '#E4C421',
//             '&:hover': { backgroundColor: 'rgba(228, 196, 33, 0.1)' }
//           }}
//         >
//           <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
//             {showAll ? 'Show Less' : 'Show All'}
//           </Typography>
//         </IconButton>

//       </Box>




//       {/* Grid View (when Show All is active) */}
//       {showAll ? (
//         <Box sx={{
//           display: 'flex',
//           flexWrap: 'wrap',
//           justifyContent: { xs: 'center', sm: 'flex-start' },
//           gap: {
//             xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
//             sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
//             md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
//             lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
//           },
//           px: { xs: 0.5, sm: 1 }
//         }}>
//           {allPresignedSongs.map((song) => {
//             const isCurrent = currentTrack?.id === song.id;
//             const isPlayingThisSong = isCurrent && isPlaying;

//             return (
//               <Box key={song.id}>
//                 <CompactSongCardHero
//                   song={song} 
//                   isPlayingThisSong={isPlayingThisSong}
//                   imgLoading="lazy"
//                   imgFetchPriority="auto"
                  
//                   onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
//                   onPlayPause={() => handleTrackPlay(song, isCurrent)}
//                 />
//               </Box>
//             );
//           })}
//         </Box>

//       ) : (
//         /* Horizontal Scrolling View */
//         <Box 
//           ref={containerRef}
//           sx={{ 
//             position: 'relative',
//             '&:hover .scroll-arrows': {
//               opacity: 1
//             }
//           }}
//         >
//           {/* Left Arrow */}
//           {showLeftArrow && (
//             <IconButton
//               className="scroll-arrows"
//               onClick={() => handleNavClick('left')}
//               sx={{
//                 position: 'absolute',
//                 left: { xs: 4, sm: 8, md: 10 },
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 zIndex: 10,
//                 backgroundColor: 'rgba(0, 0, 0, 0.7)',
//                 color: '#E4C421',
//                 opacity: 0,
//                 transition: 'opacity 0.3s',
//                 width: { xs: 32, sm: 40 },
//                 height: { xs: 32, sm: 40 },
//                 '&:hover': {
//                   backgroundColor: 'rgba(0, 0, 0, 0.9)'
//                 }
//               }}
//             >
//               <ChevronLeftIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
//             </IconButton>
//           )}

//           {/* Right Arrow */}
//           {showRightArrow && (
//             <IconButton
//               className="scroll-arrows"
//               onClick={() => handleNavClick('right')}
//               sx={{
//                 position: 'absolute',
//                 right: { xs: 4, sm: 8, md: 10 },
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 zIndex: 10,
//                 backgroundColor: 'rgba(0, 0, 0, 0.7)',
//                 color: '#E4C421',
//                 opacity: 0,
//                 transition: 'opacity 0.3s',
//                 width: { xs: 32, sm: 40 },
//                 height: { xs: 32, sm: 40 },
//                 '&:hover': {
//                   backgroundColor: 'rgba(0, 0, 0, 0.9)'
//                 }
//               }}
//             >
//               <ChevronRightIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
//             </IconButton>
//           )}

//           {/* Scrollable Container */}
//           <Box
//             ref={scrollContainerRef}
//             onScroll={checkScrollPosition}
//             onWheel={handleWheel}
//             sx={{
//               display: 'flex',
//               overflowX: 'auto',
//               gap: {
//                 xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
//                 sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
//                 md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
//                 lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
//               },
//               pb: 2,
//               px: { xs: 1, sm: 2 },
//               scrollbarWidth: 'none',
//               '&::-webkit-scrollbar': {
//                 display: 'none'
//               },
//               '&-ms-overflow-style': 'none'
//             }}
//           >
//             {heroSongs.map((song, index) => {
//               const isCurrent = currentTrack?.id === song.id;
//               const isPlayingThisSong = isCurrent && isPlaying;
//               const isPrimaryHero = index === 0;
//               const heroLoading = isPrimaryHero ? 'eager' : 'lazy';
//               const heroFetchPriority = isPrimaryHero ? 'high' : 'auto';

//               return (
//                 <Box key={song.id} sx={{ flexShrink: 0 }}>
//                   <SongCardHero
//                     song={song}
//                     isPlayingThisSong={isPlayingThisSong}
//                     imgLoading={heroLoading}
//                     imgFetchPriority={heroFetchPriority}
//                     imgDecoding="async"
//                     heroVariant
//                     onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
//                     onPlayPause={() => handleTrackPlay(song, isCurrent)}
//                   />
//                   </Box>
//                 );
//               })}
//           </Box>
//         </Box>
//       )}


      
//       </Box>
//     </>
//   );
// }



export default function TrendingSongs({ songs, onCardClick }) {
  const containerRef = useRef(null);
  const client = useApolloClient();
  const theme = useTheme();
  
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

  const {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    showAll,
    handleWheel,
    handleNavClick,
    checkScrollPosition,
    handleShowAll,
  } = useScrollNavigation();

  // Process songs with memoization
  const processedSongs = useMemo(() => 
    Array.isArray(songs) ? songs : [], 
    [songs]
  );
  
  const heroProcessedSongs = useMemo(() => 
    processedSongs.slice(0, 8), 
    [processedSongs]
  );
  
  const allProcessedTrendingSongs = useMemo(() => 
    processedSongs.slice(0, 20), 
    [processedSongs]
  );

  const [heroSongs, setHeroSongs] = useState([]);
  const [allPresignedSongs, setAllPresignedSongs] = useState([]);
  const [hasPresignedAll, setHasPresignedAll] = useState(false);
  const [lcpImageUrl, setLcpImageUrl] = useState('');
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);

const getArtworkKey = useCallback((song) => {
    const candidates = [
      song?.artworkKey,
      song?.coverImageKey,
      song?.artwork,
      song?.coverImage,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeKey(candidate);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  }, []);

  const getSongKey = useCallback(
    (song, fallback) =>
      song?.id || song?._id || song?.songId || song?.audioUrl || fallback,
    []
  );

  // Presign LCP image immediately (first hero image)
  useEffect(() => {
    const presignFirstImage = async () => {
      if (!heroProcessedSongs.length) return;
      
      const firstSong = heroProcessedSongs[0];
      const artworkKey = getArtworkKey(firstSong);
      
      if (!artworkKey) {
        setLcpImageUrl('');
        return;
      }
      
      // Check cache first
      if (artworkCache.has(artworkKey)) {
        const url = artworkCache.get(artworkKey);
        setLcpImageUrl(url);
        setHeroSongs(prev => {
          const existingFirst = prev[0];
          if (!existingFirst || existingFirst.id !== firstSong.id) {
            const updated = [{ ...firstSong, artworkUrl: url }];
            if (prev.length > 1) {
              return [...updated, ...prev.slice(1)];
            }
            return updated;
          }
          return prev;
        });
        return;
      }
      
      try {
        const { data } = await getPresignedUrlDownload({
          variables: {
            bucket: 'afrofeel-cover-images-for-songs',
            key: artworkKey,
            region: 'us-east-2',
            expiresIn: 604800,
          },
        });
        
        const url = data?.getPresignedUrlDownload?.url;
        if (url) {
          artworkCache.set(artworkKey, url);
          setLcpImageUrl(url);
          setHeroSongs(prev => {
            const existingFirst = prev[0];
            if (!existingFirst || existingFirst.id !== firstSong.id) {
              const updated = [{ ...firstSong, artworkUrl: url }];
              if (prev.length > 1) {
                return [...updated, ...prev.slice(1)];
              }
              return updated;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error presigning LCP artwork:', error);
        setLcpImageUrl('');
      }
    };
    
    presignFirstImage();
  }, [heroProcessedSongs, getPresignedUrlDownload, getArtworkKey]);

  const presignSongs = useCallback(
    async (subset) => {
      if (!subset.length) return subset;
      try {
        const updated = await Promise.all(
          subset.map(async (song) => {
            const artworkKey = getArtworkKey(song);
            if (!artworkKey) {
              return song;
            }
            if (artworkCache.has(artworkKey)) {
              return {
                ...song,
                artworkUrl: artworkCache.get(artworkKey),
              };
            }
            const { data } = await getPresignedUrlDownload({
              variables: {
                bucket: 'afrofeel-cover-images-for-songs',
                key: artworkKey,
                region: 'us-east-2',
                expiresIn: 604800,
              },
            });
            const url = data?.getPresignedUrlDownload?.url;
            if (url) {
              artworkCache.set(artworkKey, url);
            }
            return {
              ...song,
              artworkUrl: url || song.artworkUrl,
            };
          })
        );
        return updated;
      } catch (error) {
        console.error('Error presigning artwork:', error);
        return subset;
      }
    },
    [getPresignedUrlDownload, getArtworkKey]
  );

  // Presign remaining hero songs
  useEffect(() => {
    if (!heroProcessedSongs.length || heroSongs.length >= heroProcessedSongs.length) return;
    
    const remainingSongs = heroProcessedSongs.filter(
      song => !heroSongs.some(hs => hs.id === song.id)
    );
    
    if (remainingSongs.length === 0) return;
    
    let isMounted = true;
    
    const presignRemaining = async () => {
      const updated = await presignSongs(remainingSongs);
      if (isMounted) {
        setHeroSongs(prev => {
          const merged = [...prev];
          updated.forEach(song => {
            if (!merged.some(s => s.id === song.id)) {
              merged.push(song);
            }
          });
          // Sort to maintain original order
          return merged.sort((a, b) => {
            const indexA = heroProcessedSongs.findIndex(s => s.id === a.id);
            const indexB = heroProcessedSongs.findIndex(s => s.id === b.id);
            return indexA - indexB;
          });
        });
      }
    };
    
    presignRemaining();
    
    return () => {
      isMounted = false;
    };
  }, [heroProcessedSongs, heroSongs, presignSongs]);

  // Presign all songs when showAll is active
  useEffect(() => {
    if (!showAll || hasPresignedAll || !allProcessedTrendingSongs.length) return;
    
    let isMounted = true;
    
    const presignAll = async () => {
      const updated = await presignSongs(allProcessedTrendingSongs);
      if (isMounted) {
        setAllPresignedSongs(updated);
        setHasPresignedAll(true);
      }
    };
    
    presignAll();
    
    return () => {
      isMounted = false;
    };
  }, [showAll, hasPresignedAll, allProcessedTrendingSongs, presignSongs]);

  // Reset allPresignedSongs when showAll changes to false
  useEffect(() => {
    if (!showAll) {
      setAllPresignedSongs([]);
      setHasPresignedAll(false);
    }
  }, [showAll]);

  const trendingQueue = useMemo(() => 
    showAll ? allPresignedSongs : heroSongs,
    [showAll, allPresignedSongs, heroSongs]
  );

  const handleTrackPlay = useCallback(
    (song, isCurrent) => {
      if (isCurrent && isPlaying) {
        pause();
        return;
      }
      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: trendingQueue,
        client,
      });
    },
    [client, handlePlaySong, incrementPlayCount, isPlaying, pause, trendingQueue]
  );

  // Setup scroll listeners
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition]);

  return (
    <>
      {lcpImageUrl && (
        <Helmet>
          <link rel="preload" as="image" href={lcpImageUrl} fetchPriority="high" />
        </Helmet>
      )}
      <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            px: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 4,
                height: 32,
                background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)",
                borderRadius: 2,
              }}
            />
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  fontFamily: "'Inter', sans-serif",
                  background: "linear-gradient(45deg, #FFD700 30%, #FFA500 90%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  letterSpacing: "-0.5px",
                }}
              >
                Trending now
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                The hottest tracks across Afrofeel right now
              </Typography>
            </Box>
          </Box>
          
          <IconButton 
            onClick={handleShowAll}
            sx={{ 
              color: '#E4C421',
              '&:hover': { backgroundColor: 'rgba(228, 196, 33, 0.1)' }
            }}
          >
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {showAll ? 'Show Less' : 'Show All'}
            </Typography>
          </IconButton>
        </Box>

        {/* Grid View (when Show All is active) */}
        {showAll ? (
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            gap: {
              xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
              sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
              md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
              lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
            },
            px: { xs: 0.5, sm: 1 }
          }}>
            {allPresignedSongs.map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              const isPlayingThisSong = isCurrent && isPlaying;

              return (
                <Box key={getSongKey(song, index)}>
                  <CompactSongCardHero
                    song={song} 
                    isPlayingThisSong={isPlayingThisSong}
                    imgLoading="lazy"
                    imgFetchPriority="auto"
                    onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
                    onPlayPause={() => handleTrackPlay(song, isCurrent)}
                  />
                </Box>
              );
            })}
          </Box>
        ) : (
          /* Horizontal Scrolling View */
          <Box 
            ref={containerRef}
            sx={{ 
              position: 'relative',
              '&:hover .scroll-arrows': {
                opacity: 1
              }
            }}
          >
            {/* Left Arrow */}
            {showLeftArrow && (
              <IconButton
                className="scroll-arrows"
                onClick={() => handleNavClick('left')}
                sx={{
                  position: 'absolute',
                  left: { xs: 4, sm: 8, md: 10 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#E4C421',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)'
                  }
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </IconButton>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
              <IconButton
                className="scroll-arrows"
                onClick={() => handleNavClick('right')}
                sx={{
                  position: 'absolute',
                  right: { xs: 4, sm: 8, md: 10 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#E4C421',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)'
                  }
                }}
              >
                <ChevronRightIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </IconButton>
            )}

            {/* Scrollable Container */}
            <Box
              ref={scrollContainerRef}
              onScroll={checkScrollPosition}
              onWheel={handleWheel}
              sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: {
                  xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
                  sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
                  md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
                  lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
                },
                pb: 2,
                px: { xs: 1, sm: 2 },
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                '&-ms-overflow-style': 'none'
              }}
            >
              {heroSongs.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                const isPlayingThisSong = isCurrent && isPlaying;
                const isPrimaryHero = index === 0;
                const heroLoading = isPrimaryHero ? 'eager' : 'lazy';
                const heroFetchPriority = isPrimaryHero ? 'high' : 'auto';

                return (
                <Box key={getSongKey(song, index)} sx={{ flexShrink: 0 }}>
                    <SongCardHero
                      song={song}
                      isPlayingThisSong={isPlayingThisSong}
                      imgLoading={heroLoading}
                      imgFetchPriority={heroFetchPriority}
                      imgDecoding="async"
                      heroVariant
                      onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
                      onPlayPause={() => handleTrackPlay(song, isCurrent)}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
