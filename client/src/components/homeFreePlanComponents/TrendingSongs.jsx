import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { Box, Typography, Card, IconButton } from '@mui/material';
import { PlayArrow, Pause, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SONG_OF_ARTIST } from '../../utils/queries';
import { usePlayCount } from '../../utils/handlePlayCount';
import { buildTrendingContext, RepeatModes, PlaybackSource } from '../../utils/plabackUtls/playbackSources';
import { buildTrendingQueue } from '../../utils/plabackUtls/trendingAlg/buildTrendingQueue';

import { SIMILAR_SONGS_TRENDINGS } from '../../utils/queries';
import { useMutation,useQuery, useLazyQuery} from '@apollo/client';










export default function TrendingSongs({ songsWithArtwork }) {
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showAll, setShowAll] = useState(false);

    const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

// fetch similar songs
// -----------------
  // Similar songs state
  const [similarSongsData, setSimilarSongsData] = useState(null);
  const [fetchSimilarSongs, { loading: similarLoading, error: similarError }] = useLazyQuery(SIMILAR_SONGS_TRENDINGS, {
    onCompleted: (data) => {
      console.log('Similar songs fetched:', data?.similarSongs);
      setSimilarSongsData(data?.similarSongs || []);
    },
    onError: (error) => {
      console.error('Error fetching similar songs:', error);
      setSimilarSongsData([]);
    }
  });



  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Handle scroll with mouse wheel on the container
  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      // e.preventDefault(); we need to fix this since it is causing the issue, we muted that
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };



  // Handle next/previous navigation
  const handleNavClick = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Matches card width + gap
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      // Update arrow visibility after a short delay
      setTimeout(checkScrollPosition, 300);
    }
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };


// Process songs data
const processSongs = (songs) => {



  return songs?.map((song) => {
  const hasAudio = !!(song.audioUrl || song.streamAudioFileUrl);




    return {
      id: song._id,
      title: song.title,
      artistName: song.artist?.artistAka || "Unknown Artist",
      artistId: song.artist?._id || "",
      albumId: song.album?._id || "",
      genre: song.genre || "",
      mood: Array.isArray(song.mood) && song.mood.length > 0 
        ? song.mood.join(', ') 
        : "Unknown Mood",
      subMood: Array.isArray(song.subMoods) && song.subMoods.length > 0 
        ? song.subMoods.join(', ') 
        : "Unknown Sub Mood",
      tempo: song.tempo || 120, // Default to 120 BPM
      plays: song.playCount || 0,
      likesCount: song.likedByUsers?.length || 0,
      durationSeconds: song.duration || 0,
      duration: formatDuration(song.duration || 0),
      cover: song.artworkUrl || song.artwork || "https://placehold.co/300x300?text=No+Cover",
      audioUrl: song.audioUrl || song.streamAudioFileUrl || null,

      fullOriginal: song,
      country: song.artist?.country || "", // CORRECT: Get country from artist object
      album: song.album
    };
  }) || [];
};
  




const trendingSongs = processSongs(songsWithArtwork)
  .filter((song) => song.audioUrl)
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 20);




// console.log("All processed trending songs:", processSongs(songsWithArtwork));
// console.log("Filtered (with audioUrl):", trendingSongs);


// inside the Trending component

const handleTrendingSongPlay = async (song) => {
  // 0) Defensive normalization for the clicked card
  const id = String(song.id ?? song._id);
  if (!id) { console.error('[Trending] Missing song id'); return; }

  incrementPlayCount(id);

  // 1) Normalize the playing track (string IDs, consistent fields)
  const track = {
    id,
    title: song.title,
    artist: song.artistName,
    artistId: String(song.artistId ?? song.artist ?? ''),
    albumId:  String(song.albumId  ?? song.album  ?? ''),
    genre: song.genre ?? null,
    mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
    subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
    tempo: Number(song.tempo) || null,
    audioUrl: song.audioUrl || song.streamAudioFileUrl || null,
    artworkUrl: song.cover || song.artwork || null,
    duration: Number(song.durationSeconds ?? song.duration) || 0,
    country: song.artist?.country || song.country || '',
    album: song.album,
  };


 // Fetch similar songs in background (non-blocking)
    fetchSimilarSongs({ 
      variables: { songId: track.id },
      fetchPolicy: 'network-only'
    });






  // 2) Build personalized queue from trending candidates you already have in memory
  const { queue: builtQueue, queueIds } = buildTrendingQueue(
    track,
    trendingSongs, // raw array you rendered
    {
      maxQueueSize: 20,
      capSameArtistFirstK: { cap: 2, window: 10 },
      capSameAlbumFirstK:  { cap: 1, window: 8 },
      w1: 10, w2: 15, w3: 20, w4: 25
    }
  );






// console.log('check returned of similar songs:', data);


  // 3) Map queue items to the shape your player expects (keep IDs as strings)
  const queue = builtQueue.map(s => ({
    id: String(s.id ?? s._id),
    title: s.title,
    artist: s.artistName,
    artistId: String(s.artistId ?? s.artist ?? ''),
    albumId:  String(s.albumId  ?? s.album  ?? ''),
    genre: s.genre ?? null,
    mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
    subMood: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
    tempo: Number(s.tempo) || null,
    audioUrl: s.audioUrl || s.streamAudioFileUrl || null,
    artworkUrl: s.cover || s.artwork || null,
    duration: Number(s.durationSeconds ?? s.duration) || 0,
    country: s.country || s.artist?.country || '',
  }));

  // 4) Locate current index (must exist — your builder puts seed first)
  const currentIndex = queue.findIndex(t => t.id === track.id);
  if (currentIndex < 0) {
    console.error('[Trending] Clicked track not found in built queue');
    return;
  }

  // 5) Build playback context
  const context = buildTrendingContext(
    currentIndex,           // queuePosition
    queue.length,           // queueLength
    false,                  // shuffle
    RepeatModes.OFF
  );

  // 6) Persist queue IDs for resume (fire-and-forget)
  //    Use your actual mutation or REST. Keep it small: just ids + context pointer.
  try {
    // await saveQueueForContext({
    //   variables: {
    //     input: {
    //       ownerKey,                  // "user:<id>" or "sess:<id>"
    //       source: context.source,    // "TRENDING"
    //       contextUri: context.contextUri,
    //       queueIds,                  // from builder (ordered)
    //       generatedAt: Date.now()
    //     }
    //   }
    // });
  } catch (e) {
    console.warn('[Trending] Failed to persist queueIds (non-fatal):', e?.message);
  }

  // 7) Prepare payload for the player
  const prepared = {
    track,
    context,
    queue,
    queueIds,          // use builder’s ids
    currentIndex
  };

  // 8) Remaining queue must be items AFTER current (fix)
  const restQueue = queue.slice(currentIndex + 1);

  // 9) Hand off to your player. It will start saving snapshots on timeupdate.
  const loaded = await handlePlaySong(track, restQueue, context, { prepared });
  if (!loaded) console.error('[Trending] Failed to load and play song.');
};











  // Handle show all toggle
  const handleShowAll = () => {
    setShowAll(!showAll);
  };

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
                      isPlaying ? pause() : handleTrendingSongPlay(song);
                    } else {
                      handleTrendingSongPlay(song);
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
                        isPlaying ? pause() : handleTrendingSongPlay(song);
                      } else {
                        handleTrendingSongPlay(song);
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

// Regular SongCard for horizontal scrolling
function SongCard({ song, isPlayingThisSong, onPlayPause }) {
  return (
    <Card
      sx={{
        width: { xs: 160, sm: 180, md: 200, lg: 220 },
        backgroundColor: "rgba(255, 255, 255, 0.07)",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
        },
      }}
    >
      {/* Image Container */}
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          width="100%"
          height={{ xs: 160, sm: 180, md: 200, lg: 220 }}
          src={song.cover}
          alt={song.title}
          sx={{
            objectFit: "cover",
            objectPosition: "center",
          }}
          onError={(e) => {
            e.target.src = "https://placehold.co/300x300?text=No+Cover&font=roboto";
          }}
        />

        {isPlayingThisSong && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 6,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#E4C421",
              fontWeight: 600,
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
            }}
          >
            Now Playing
          </Typography>
        )}

        <IconButton
          onClick={onPlayPause}
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            backgroundColor: "#E4C421",
            width: { xs: 28, sm: 32, md: 36 },
            height: { xs: 28, sm: 32, md: 36 },
            "&:hover": { backgroundColor: "#F8D347" },
          }}
        >
          {isPlayingThisSong ? (
            <Pause sx={{ color: "#000", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
          ) : (
            <PlayArrow sx={{ color: "#000", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
          )}
        </IconButton>
      </Box>

      {/* Song Details */}
      <Box sx={{ p: { xs: 1, sm: 1.25 } }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
            color: "white",
            mb: 0.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {song.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.6)",
            mb: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {song.artistName}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ 
            color: "#E4C421",
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            {song.plays.toLocaleString()} plays
          </Typography>
          <Typography variant="caption" sx={{ 
            color: "rgba(255,255,255,0.5)",
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            {song.duration}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

// Compact SongCard for Show All grid view
function CompactSongCard({ song, isPlayingThisSong, onPlayPause }) {
  return (
    <Card
      sx={{
        width: { xs: 140, sm: 150, md: 160, lg: 170 },
        backgroundColor: "rgba(255, 255, 255, 0.07)",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(228, 196, 33, 0.3)",
        },
      }}
    >
      {/* Image Container */}
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          width="100%"
          height={{ xs: 140, sm: 150, md: 160, lg: 170 }}
          src={song.cover}
          alt={song.title}
          sx={{
            objectFit: "cover",
            objectPosition: "center",
          }}
          onError={(e) => {
            e.target.src = "https://placehold.co/300x300?text=No+Cover&font=roboto";
          }}
        />

        {isPlayingThisSong && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 4,
              right: 6,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#E4C421",
              fontWeight: 600,
              px: 0.5,
              py: 0.1,
              borderRadius: 0.75,
              fontSize: '0.6rem',
            }}
          >
            Now Playing
          </Typography>
        )}

        <IconButton
          onClick={onPlayPause}
          sx={{
            position: "absolute",
            bottom: 6,
            right: 6,
            backgroundColor: "#E4C421",
            width: { xs: 24, sm: 26 },
            height: { xs: 24, sm: 26 },
            "&:hover": { backgroundColor: "#F8D347" },
          }}
        >
          {isPlayingThisSong ? (
            <Pause sx={{ color: "#000", fontSize: '0.875rem' }} />
          ) : (
            <PlayArrow sx={{ color: "#000", fontSize: '0.875rem' }} />
          )}
        </IconButton>
      </Box>

      {/* Song Details */}
      <Box sx={{ p: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: "bold",
            color: "white",
            mb: 0.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
          }}
        >
          {song.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.6)",
            mb: 0.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}
        >
          {song.artistName}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ 
            color: "#E4C421",
            fontSize: '0.65rem'
          }}>
            {song.plays.toLocaleString()} plays
          </Typography>
          <Typography variant="caption" sx={{ 
            color: "rgba(255,255,255,0.5)",
            fontSize: '0.65rem'
          }}>
            {song.duration}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}