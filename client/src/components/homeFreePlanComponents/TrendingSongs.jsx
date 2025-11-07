import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { Box, Typography, Card, IconButton } from '@mui/material';
import { useApolloClient, useMutation } from '@apollo/client';
import { PlayArrow, Pause, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SONG_OF_ARTIST } from '../../utils/queries';
import { usePlayCount } from '../../utils/handlePlayCount';
import { buildTrendingContext, RepeatModes, PlaybackSource } from '../../utils/plabackUtls/playbackSources';
import { buildTrendingQueue } from '../../utils/plabackUtls/trendingAlg/buildTrendingQueue';

import { SIMILAR_SONGS_TRENDINGS } from '../../utils/queries';

import { LikesComponent } from '../otherSongsComponents/like';
import { useSongsWithPresignedUrls } from '../../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import { fetchPresignedUrls } from '../../utils/someSongsUtils/songsWithPresignedUrlHook.js';


// some songsutils to use
import { processSongs } from '../../utils/someSongsUtils/someSongsUtils.js';
import { useScrollNavigation } from '../../utils/someSongsUtils/scrollHooks.js';
import { similarSongsUtil } from '../../utils/someSongsUtils/similarSongsHook.js';
import { SongCard, CompactSongCard } from '../otherSongsComponents/songCard.jsx';
import { handleTrendingSongPlay } from '../../utils/plabackUtls/handleSongPlayBack.js';






export default function TrendingSongs({ songsWithArtwork, refetch }) {
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


const trendingSongs = processSongs(songsWithArtwork)
  .filter((song) => song.audioUrl)
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 20);

// handleTrendingSongPlay({song, incrementPlayCount, handlePlaySong,  trendingSongs , client})




// console.log("All processed trending songs:", processSongs(songsWithArtwork));
// console.log("Filtered (with audioUrl):", trendingSongs);



//  const pickId = (obj) => obj?.id ?? obj?._id ?? obj?.songId ?? null;

 

// const handleTrendingSongPlay = async (song) => {
//   const rawId = pickId(song);
//   if (!rawId) return;
//   const id = String(rawId); 

//   incrementPlayCount(id);

//   const track = {
//     id,
//     title: song.title,
//     artist: song.artistName,
//     artistId: String(song.artistId ?? song.artist ?? ''),
//     albumId: String(song.albumId ?? song.album ?? ''),
//     genre: song.genre ?? null,
//     mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
//     subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
//     tempo: Number(song.tempo) || null,
//     audioUrl: song.audioPresignedUrl || song.audioUrl || song.streamAudioFileUrl || null,
//     artworkUrl: song.artworkPresignedUrl || song.cover || song.artwork || null,
//     duration: Number(song.durationSeconds ?? song.duration) || 0,
//     country: song.artist?.country || song.country || '',
//     album: song.album,
//   };

//   // Get similar songs from server (with presigned URLs)
//   const similarData = await similarSongsUtil(client, track.id);
//   const similarSongs = similarData.songs || [];
  
//   console.log(`🎵 Server similar songs: ${similarSongs.length}`);

//   // Process both similar songs and trending songs
//   const processedSimilarSongs = processSongs(similarSongs);
//   const processedTrendingSongs = processSongs(trendingSongs || []);
  
//   console.log(`🎵 Component trending songs: ${processedTrendingSongs.length}`);

//   // COMBINE BOTH SOURCES for a longer queue
//   const combinedSongs = [
//     ...processedSimilarSongs,
//     ...processedTrendingSongs.filter(trendingSong => 
//       // Remove duplicates - don't include trending songs that are already in similar songs
//       !processedSimilarSongs.some(similarSong => 
//         String(similarSong.id) === String(trendingSong.id)
//       )
//     )
//   ];

//   // console.log(`🎵 Combined queue: ${combinedSongs.length} total songs`);

//   // Build the queue from COMBINED sources
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

//   // Map queue items to player format
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

//   // Build playback context
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
// };
// -------------------------------------



























  
  




















  // Handle show all toggle
  // const handleShowAll = () => {
  //   setShowAll(!showAll);
  // };

  // Check initial scroll position
  
  
  
  
  
  
  
  
  
  useEffect(() => {
    checkScrollPosition();
    
    // Add resize listener
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
        <Typography variant="h5" component="h2" sx={{ 
          fontWeight: 'bold', 
          background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
        }}>
          🔥 Trending Now
        </Typography>
        

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
          gap: { xs: '1rem', sm: '1.5rem', md: '2rem' },
          px: { xs: 0.5, sm: 1 }
        }}>
          {trendingSongs.map((song) => {
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
                        song, incrementPlayCount, handlePlaySong,  trendingSongs , client
                    });
                    } else {
                      handleTrendingSongPlay({
                        song, incrementPlayCount, handlePlaySong,  trendingSongs , client
                    });
                    }
                  }}
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
              <ChevronLeft sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
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
              <ChevronRight sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
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
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              '&-ms-overflow-style': 'none'
            }}
          >
            {trendingSongs.map((song) => {
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
                        song, incrementPlayCount, handlePlaySong,  trendingSongs , client
                    });
                      } else {
                       handleTrendingSongPlay({
                        song, incrementPlayCount, handlePlaySong,  trendingSongs , client
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
}




