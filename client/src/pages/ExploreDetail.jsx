import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useApolloClient, useQuery } from "@apollo/client";
import { EXPLORE_SONGS } from "../utils/queries";
import { useSongsWithPresignedUrls } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";
import { SongCard } from "../components/otherSongsComponents/songCard.jsx";
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../utils/plabackUtls/handleSongPlayBack.js";

const toTitle = (value) =>
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ExploreDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { type, name } = useParams();

  const decodedName = decodeURIComponent(name || "");
  const title = toTitle(decodedName);
  const typeLabel = toTitle(type || "explore");

  const { data, loading } = useQuery(EXPLORE_SONGS, {
    variables: { type: String(type || ""), value: decodedName },
    fetchPolicy: "cache-first",
  });

  const rawSongs = useMemo(() => data?.exploreSongs || [], [data?.exploreSongs]);
  const { songsWithArtwork } = useSongsWithPresignedUrls(rawSongs);
  const processedSongs = useMemo(
    () => processSongs(songsWithArtwork).filter((song) => song.audioUrl),
    [songsWithArtwork]
  );

  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

  const handlePlay = (song) => {
    if (!song) return;
    const isCurrent = currentTrack?.id === song.id;
    if (isCurrent) {
      isPlaying
        ? pause()
        : handleTrendingSongPlay({
            song,
            incrementPlayCount,
            handlePlaySong,
            trendingSongs: processedSongs,
            client,
          });
      return;
    }
    handleTrendingSongPlay({
      song,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: processedSongs,
      client,
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.82
        )} 100%)`,
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            {typeLabel}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: "-1px",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
            Discover {title} in Afrofeel.
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.divider, 0.35)}`,
              background: alpha(theme.palette.background.paper, 0.55),
            }}
          >
            <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              Loading songs for {title}...
            </Typography>
          </Box>
        ) : processedSongs.length === 0 ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.divider, 0.35)}`,
              background: alpha(theme.palette.background.paper, 0.55),
            }}
          >
            <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              No songs found for {title} yet.
            </Typography>
            <Button
              onClick={() => navigate(-1)}
              variant="outlined"
              sx={{ mt: 2, textTransform: "none" }}
            >
              Back
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: {
                xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
                sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
                md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
              },
            }}
          >
            {processedSongs.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const isPlayingThisSong = isCurrent && isPlaying;
              return (
                <SongCard
                  key={song.id}
                  song={song}
                  isPlayingThisSong={isPlayingThisSong}
                  onPlayPause={() => handlePlay(song)}
                />
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
}
