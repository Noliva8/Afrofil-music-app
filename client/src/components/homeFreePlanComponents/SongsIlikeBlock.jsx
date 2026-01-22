import React, { useRef, useEffect } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
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
          gap: {
            xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
            sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
            md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
            lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
          },
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
              gap: {
                xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
                sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
                md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
                lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
              },
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
