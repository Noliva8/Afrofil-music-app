import React, { useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks.js";
import { SongCard, CompactSongCard } from "../otherSongsComponents/songCard.jsx";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";

const getSongTimestamp = (song) => {
  const raw =
    song?.fullOriginal?.createdAt ||
    song?.fullOriginal?.releaseDate ||
    song?.fullOriginal?.album?.releaseDate ||
    null;
  const ts = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
};

export default function NewUploaded({ songsWithArtwork, refetch, onCardClick }) {
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

  const newUploads = processSongs(songsWithArtwork)
    .filter((song) => song.audioUrl)
    .sort((a, b) => getSongTimestamp(b) - getSongTimestamp(a))
    .slice(0, 20);

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  return (
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
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
              background: "linear-gradient(180deg, #B0FFD6 0%, #6FFFD2 100%)",
              borderRadius: 2,
            }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                background: "linear-gradient(45deg, #B0FFD6 20%, #6FFFD2 80%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                letterSpacing: "-0.5px",
              }}
            >
              New uploads
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Fresh drops from artists across the continent
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleShowAll}
          sx={{
            color: "#6FFFD2",
            "&:hover": { backgroundColor: "rgba(111, 255, 210, 0.1)" },
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
            {showAll ? "Show Less" : "Show All"}
          </Typography>
        </IconButton>
      </Box>

      {showAll ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: { xs: "center", sm: "flex-start" },
            gap: {
              xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
              sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
              md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
              lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
            },
            px: { xs: 0.5, sm: 1 },
          }}
        >
          {newUploads.map((song) => {
            const isCurrent = currentTrack?.id === song.id;
            const isPlayingThisSong = isCurrent && isPlaying;

            return (
              <Box key={song.id}>
                <CompactSongCard
                  song={song}
                  isPlayingThisSong={isPlayingThisSong}
                  onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
                  onPlayPause={() => {
                    if (isCurrent) {
                      isPlaying
                        ? pause()
                        : handleTrendingSongPlay({
                            song,
                            incrementPlayCount,
                            handlePlaySong,
                            trendingSongs: newUploads,
                            client,
                          });
                    } else {
                      handleTrendingSongPlay({
                        song,
                        incrementPlayCount,
                        handlePlaySong,
                        trendingSongs: newUploads,
                        client,
                      });
                    }
                  }}
                />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            "&:hover .scroll-arrows": {
              opacity: 1,
            },
          }}
        >
          {showLeftArrow && (
            <IconButton
              className="scroll-arrows"
              onClick={() => handleNavClick("left")}
              sx={{
                position: "absolute",
                left: { xs: 4, sm: 8, md: 10 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "#6FFFD2",
                opacity: 0,
                transition: "opacity 0.3s",
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
            </IconButton>
          )}

          {showRightArrow && (
            <IconButton
              className="scroll-arrows"
              onClick={() => handleNavClick("right")}
              sx={{
                position: "absolute",
                right: { xs: 4, sm: 8, md: 10 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "#6FFFD2",
                opacity: 0,
                transition: "opacity 0.3s",
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                },
              }}
            >
              <ChevronRight sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
            </IconButton>
          )}

          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: {
                xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
                sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
                md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
                lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
              },
              pb: 2,
              px: { xs: 1, sm: 2 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              "&-ms-overflow-style": "none",
            }}
          >
            {newUploads.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const isPlayingThisSong = isCurrent && isPlaying;

              return (
                <Box key={song.id} sx={{ flexShrink: 0 }}>
                  <SongCard
                    song={song}
                    isPlayingThisSong={isPlayingThisSong}
                    onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
                    onPlayPause={() => {
                      if (isCurrent) {
                        isPlaying
                          ? pause()
                          : handleTrendingSongPlay({
                              song,
                              incrementPlayCount,
                              handlePlaySong,
                              trendingSongs: newUploads,
                              client,
                            });
                      } else {
                        handleTrendingSongPlay({
                          song,
                          incrementPlayCount,
                          handlePlaySong,
                          trendingSongs: newUploads,
                          client,
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
