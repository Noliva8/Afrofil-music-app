// import React, { useRef, useState } from 'react';
// import { useQuery, useApolloClient } from '@apollo/client';
// import { Box, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
// import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// import { SONGS_I_LIKE } from "../../utils/queries";
// import { usePlayCount } from "../../utils/handlePlayCount";
// import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
// import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
// import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks";
// import { SongCard, CompactSongCard } from "../otherSongsComponents/songCard";
// import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
// import { similarSongsUtil } from "../../utils/someSongsUtils/similarSongsHook";
// import { FiChevronRight, FiMusic } from 'react-icons/fi';

// import { buildTrendingQueue } from '../../utils/plabackUtls/trendingAlg/buildTrendingQueue';





// export const SongsILike = () => {
//   const containerRef = useRef(null);

//   // common things to pass down
//   const client = useApolloClient();
//  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();




// // all of these are not needed i guess

//   const [currentPlayingSong, setCurrentPlayingSong] = useState(null);
//   const [queueLoading, setQueueLoading] = useState(false);

 
//   const { incrementPlayCount } = usePlayCount();

//   // ✅ Pass scrollContainerRef to the hook
//   const {
//     scrollContainerRef,
//     showLeftArrow,
//     showRightArrow,
//     showAll,
//     handleWheel,
//     handleNavClick,
//     checkScrollPosition,
//     handleShowAll,
//   } = useScrollNavigation();



//  const { data, loading, error } = useQuery(SONGS_I_LIKE, {
//   notifyOnNetworkStatusChange: true,
//   fetchPolicy: 'network-only',
//   nextFetchPolicy: 'network-only',
//   onCompleted: (completedData) => {
//     console.log('🔍 onCompleted - Fresh from network:', completedData);
//     if (completedData?.songsLikedByMe?.songs) {
//       completedData.songsLikedByMe.songs.forEach((song, index) => {
//         console.log(`🔍 Song ${index} in onCompleted:`, {
//           _id: song._id,
//           title: song.title,
//           likesCount: song.likesCount,
//           likedByMe: song.likedByMe
//         });
//       });
//     }
//   },
// });




// console.log('see data recieved id likesCount is present:', data)

// const songs = data?.songsLikedByMe?.songs;
// const hasNextPage = data?.songsLikedByMe?.hasNextPage;
// const hasPreviousPage = data?.songsLikedByMe?.hasPreviousPage;


// // console.log('Songs from query:', songs);

// // Then pass to your hook:
// const { songsWithArtwork } = useSongsWithPresignedUrls(songs);

// // console.log('Songs with artwork:', songsWithArtwork);



//   const pickId = (obj) => obj?.id ?? obj?._id ?? obj?.songId ?? null;




//   const handleLikedSongPlay = async (song) => {
//     const rawId = pickId(song);
//     if (!rawId) {
//       console.error('[Likes] Missing song id:', song);
//       return;
//     }

//     const id = String(rawId);
//     setCurrentPlayingSong(id);
//     setQueueLoading(true);

//     try {
//       incrementPlayCount(id);

//       const track = {
//         id,
//         title: song.title,
//         artist: song.artistName,
//         artistId: String(song.artistId ?? song.artist ?? ''),
//         albumId: String(song.albumId ?? song.album ?? ''),
//         genre: song.genre ?? null,
//         mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
//         subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
//         tempo: Number(song.tempo) || null,
//         audioUrl: song.audioUrl || song.streamAudioFileUrl || null,
//         artworkUrl: song.cover || song.artwork || null,
//         duration: Number(song.durationSeconds ?? song.duration) || 0,
//         country: song.artist?.country || song.country || '',
//         album: song.album,
//       };

//       // console.log('Fetching similar songs for:', track.id);
//       const similarSongs = await similarSongsUtil(client, track.id);
//       console.log('Similar songs found:', similarSongs?.length);
//   const processedSimilarSongs = processSongs(similarSongs);
//  const processedLikesSongs = processSongs(songsWithArtwork || []);


//   const combinedSongs = [
//     ...processedSimilarSongs,
//     ...processedLikesSongs.filter(songsLikedByMe => 
//       // Remove duplicates - don't include trending songs that are already in similar songs
//       !processedSimilarSongs.some(similarSong => 
//         String(similarSong.id) === String(songsLikedByMe.id)
//       )
//     )
//   ];

//  console.log(`🎵 Combined queue: ${combinedSongs.length} total songs`);

 
//   const { queue: builtQueue, queueIds } = buildTrendingQueue(
//     track,
//     combinedSongs, // Use combined songs as source
//     {
//       maxQueueSize: 50,
//       capSameArtistFirstK: { cap: 2, window: 10 },
//       capSameAlbumFirstK: { cap: 1, window: 8 },
//       w1: 10, w2: 15, w3: 20, w4: 25
//     }
//   );

//   console.log(`🎵 Built queue: ${builtQueue.length} songs after filtering`);

//   // Final queue - no need for supplement since we already combined sources
//   const finalQueue = builtQueue;

//  // Map queue items to player format
//   const queue = finalQueue.map(s => ({
//     id: String(s.id ?? s._id),
//     title: s.title,
//     artist: s.artistName,
//     artistId: String(s.artistId ?? s.artist ?? ''),
//     albumId: String(s.albumId ?? s.album ?? ''),
//     genre: s.genre ?? null,
//     mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
//     subMood: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
//     tempo: Number(s.tempo) || null,
//     // Unified URL handling - works for both server and component songs
//     audioUrl: s.audioPresignedUrl || s.audioUrl || s.streamAudioFileUrl || null,
//     artworkUrl: s.artworkPresignedUrl || s.cover || s.artwork || null,
//     duration: Number(s.durationSeconds ?? s.duration) || 0,
//     country: s.country || s.artist?.country || '',
//   }));

//   // Locate current index
//   const currentIndex = queue.findIndex(t => t.id === track.id);
//   if (currentIndex < 0) {
//     console.error('[Trending] Clicked track not found in built queue');
//     return;
//   }

//  // Build playback context
//   const context = buildTrendingContext(
//     currentIndex,
//     queue.length,
//     false,
//     RepeatModes.OFF
//   );

//   // Prepare payload for the player
//   const prepared = {
//     track,
//     context,
//     queue,
//     queueIds,
//     currentIndex
//   };


//   // Remaining queue must be items AFTER current
//   const restQueue = queue.slice(currentIndex + 1);
//   // Hand off to player
//   const loaded = await handlePlaySong(track, restQueue, context, { prepared });
//   if (!loaded) console.error('[Trending] Failed to load and play song.');

      
      
//     } catch (error) {
//       console.error('Error playing song:', error);
//       setCurrentPlayingSong(null);
//     } finally {
//       setQueueLoading(false);
//     }
//   };











//   // ✅ Add loading and error states
//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//         <CircularProgress sx={{ color: '#E4C421' }} />
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Alert severity="error" sx={{ m: 2 }}>
//         Error loading liked songs: {error.message}
//       </Alert>
//     );
//   }

//   // ✅ Check if we have enough songs to display
//   if (!likedSongs || likedSongs.length < 3) return null;

//   const handlePlayPause = (song) => {
//     const songId = pickId(song);
//     const isCurrent = currentTrack?.id === songId;
    
//     if (isCurrent && isPlaying) {
//       pause();
//       setCurrentPlayingSong(null);
//     } else {
//       handleLikedSongPlay(song);
//     }
//   };

//   return (
//     <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
//       {/* Loading Overlay */}
//       {queueLoading && (
//         <Box sx={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: 'rgba(0,0,0,0.7)',
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           zIndex: 9999
//         }}>
//           <CircularProgress sx={{ color: '#E4C421' }} />
//           <Typography sx={{ color: 'white', ml: 2 }}>
        
//           </Typography>
//         </Box>
//       )}

//       {/* Header */}
//       <Box sx={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         mb: 3,
//         px: { xs: 1, sm: 2 }
//       }}>

//          <div className="section-header">
//         <h2>Songs You Like</h2>
//         <button className="see-all">See all <FiChevronRight /></button>
//       </div>

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

//       {/* Grid View */}
//       {showAll ? (
//         <Box sx={{
//           display: 'flex',
//           flexWrap: 'wrap',
//           justifyContent: { xs: 'center', sm: 'flex-start' },
//           gap: { xs: '1rem', sm: '1.5rem', md: '2rem' },
//           px: { xs: 0.5, sm: 1 }
//         }}>
//           {likedSongs.map((song) => {
//             const songId = pickId(song);
//             const isCurrent = currentTrack?.id === songId;
//             const isPlayingThisSong = isCurrent && isPlaying;

//             return (
//               <Box key={songId}>
//                 <CompactSongCard
//                   song={song}
//                   isPlayingThisSong={isPlayingThisSong}
//                   onPlayPause={() => handlePlayPause(song)}
//                 />
//               </Box>
//             );
//           })}
//         </Box>
//       ) : (
//         // Scrollable View
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
//               <ChevronLeft sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
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
//               <ChevronRight sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
//             </IconButton>
//           )}

//           {/* Scrollable Container */}
//           <Box
//             ref={scrollContainerRef} // ✅ This ref is now properly set
//             onScroll={checkScrollPosition}
//             onWheel={handleWheel}
//             sx={{
//               display: 'flex',
//               overflowX: 'auto',
//               gap: { xs: '1rem', sm: '1.5rem', md: '2rem' },
//               pb: 2,
//               px: { xs: 1, sm: 2 },
//               scrollbarWidth: 'none',
//               '&::-webkit-scrollbar': {
//                 display: 'none'
//               },
//               '-ms-overflow-style': 'none'
//             }}
//           >
//             {likedSongs.map((song) => {
//               const songId = pickId(song);
//               const isCurrent = currentTrack?.id === songId;
//               const isPlayingThisSong = isCurrent && isPlaying;

//               return (
//                 <Box key={songId} sx={{ flexShrink: 0 }}>
//                   <SongCard
//                     song={song}
//                     isPlayingThisSong={isPlayingThisSong}
//                     onPlayPause={() => handlePlayPause(song)}
//                   />
//                 </Box>
//               );
//             })}
//           </Box>
//         </Box>
//       )}
//     </Box>
//   );
// };






import React, { useRef, useEffect } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { FiChevronRight } from 'react-icons/fi';

import { SONGS_I_LIKE } from "../../utils/queries";
import { usePlayCount } from "../../utils/handlePlayCount";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks";
import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { handleTrendingSongPlay } from '../../utils/plabackUtls/handleSongPlayBack';


import { SongCard, CompactSongCard } from "../otherSongsComponents/songCard";

export const SongsILike = () => {
  const containerRef = useRef(null);
  const client = useApolloClient();
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

  // 1️⃣ Fetch liked songs
  const { data } = useQuery(SONGS_I_LIKE, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  const songs = data?.songsLikedByMe?.songs || [];

  // 2️⃣ Get presigned URLs
  const { songsWithArtwork } = useSongsWithPresignedUrls(songs);

console.log('check songs i like after useSongWithPresignUrl hook: ', songsWithArtwork);


  // 3️⃣ Process for playback util
  const likedSongs = processSongs(songsWithArtwork)
    .filter(song => song.audioUrl)
    .sort((a, b) => b.plays - a.plays);

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  return (
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        px: { xs: 1, sm: 2 }
      }}>
        <div className="section-header">
          <h2>❤️ Songs You Like</h2>
          <button className="see-all">See all <FiChevronRight /></button>
        </div>

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

      {/* Songs Grid / Scrollable */}
      {showAll ? (
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' },
          gap: { xs: '1rem', sm: '1.5rem', md: '2rem' },
          px: { xs: 0.5, sm: 1 }
        }}>
          {likedSongs.map((song) => {
            const isCurrent = currentTrack?.id === song.id;
            const isPlayingThisSong = isCurrent && isPlaying;

            return (
              <Box key={song.id}>
                <CompactSongCard
                  song={song}
                  isPlayingThisSong={isPlayingThisSong}
                  onPlayPause={() => {
                    if (isCurrent) {
                      isPlaying ? pause() : handleTrendingSongPlay({
                        song,
                        incrementPlayCount,
                        handlePlaySong,
                        trendingSongs: likedSongs,
                        client
                      });
                    } else {
                      handleTrendingSongPlay({
                        song,
                        incrementPlayCount,
                        handlePlaySong,
                        trendingSongs: likedSongs,
                        client
                      });
                    }
                  }}
                />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box ref={containerRef} sx={{ position: 'relative' }}>
          {/* Arrows */}
          {showLeftArrow && (
            <IconButton
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
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {showRightArrow && (
            <IconButton
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
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
              }}
            >
              <ChevronRight />
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
              gap: { xs: '1rem', sm: '1.5rem', md: '2rem' },
              pb: 2,
              px: { xs: 1, sm: 2 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {likedSongs.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const isPlayingThisSong = isCurrent && isPlaying;
              return (
                <Box key={song.id} sx={{ flexShrink: 0 }}>
                  <SongCard
                    song={song}
                    isPlayingThisSong={isPlayingThisSong}
                    onPlayPause={() => {
                      if (isCurrent) {
                        isPlaying ? pause() : handleTrendingSongPlay({
                          song,
                          incrementPlayCount,
                          handlePlaySong,
                          trendingSongs: likedSongs,
                          client
                        });
                      } else {
                        handleTrendingSongPlay({
                          song,
                          incrementPlayCount,
                          handlePlaySong,
                          trendingSongs: likedSongs,
                          client
                        });
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};
