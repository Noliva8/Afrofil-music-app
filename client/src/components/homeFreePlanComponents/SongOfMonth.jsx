import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { Pause, PlayArrow, AccessTime, Star } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";

const formatStat = (value) => {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export default function SongOfMonth({ songOfMonthWithArtwork = [], onCardClick }) {
  const theme = useTheme();
  const client = useApolloClient();
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

  const song = useMemo(() => {
    const processed = processSongs(songOfMonthWithArtwork);
    return processed[0] || null;
  }, [songOfMonthWithArtwork]);

  if (!song) return null;

  const monthLabel = new Date().toLocaleString("en-US", { month: "long" });
  const isCurrent = currentTrack?.id === song.id;
  const isPlayingThisSong = isCurrent && isPlaying;

  const handlePlay = (event) => {
    event.stopPropagation();

    if (isCurrent && isPlayingThisSong) {
      pause();
      return;
    }

    handleTrendingSongPlay({
      song,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: [song],
      client,
    });
  };

  return (
    <Box
      sx={{
        mb: 5,
        px: { xs: 1, sm: 2, md: 3 },
        contentVisibility: "auto",
        containIntrinsicSize: "320px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 32,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "'Inter', sans-serif",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              lineHeight: 1.15,
            }}
          >
            Song of the Month
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.65),
              fontSize: "0.82rem",
            }}
          >
            {monthLabel} highlight
          </Typography>
        </Box>
      </Box>

      <Box
        onClick={() => onCardClick?.(song)}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "132px minmax(0,1fr)",
            sm: "176px minmax(0,1fr) 56px",
            md: "220px minmax(0,1fr) 60px",
          },
          alignItems: "center",
          gap: { xs: 1.75, sm: 3, md: 3.5 },
          mx: { xs: 1, sm: 2 },
          p: { xs: 1.5, sm: 2, md: 2.5 },
          backgroundColor: alpha(theme.palette.background.paper, 0.96),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          cursor: "pointer",
          contain: "layout paint style",
          transition: "border-color 0.18s ease",
          "&:hover": {
            borderColor: alpha(theme.palette.primary.main, 0.75),
          },
        }}
      >
        <Box
          component="img"
          src={song.artworkUrl || "/api/placeholder/160/160"}
          alt={song.title}
          loading="lazy"
          decoding="async"
          sx={{
            width: { xs: 132, sm: 176, md: 220 },
            height: { xs: 132, sm: 176, md: 220 },
            borderRadius: 1.5,
            objectFit: "cover",
            display: "block",
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.45,
              mb: { xs: 1, sm: 1.5 },
              borderRadius: 1,
              color: theme.palette.warning.main,
              backgroundColor: alpha(theme.palette.warning.main, 0.12),
              fontSize: "0.72rem",
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: 0,
            }}
          >
            <Star sx={{ fontSize: 14 }} />
            PROMOTED PICK
          </Box>

          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
              fontSize: { xs: "1.25rem", sm: "1.65rem", md: "2rem" },
              lineHeight: 1.12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {song.title}
          </Typography>

          <Typography
            component={RouterLink}
            to={`/artist/${song.artistId}`}
            onClick={(event) => event.stopPropagation()}
            sx={{
              display: "block",
              color: alpha(theme.palette.text.primary, 0.72),
              textDecoration: "none",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mt: 0.75,
              "&:hover": { color: theme.palette.primary.main },
            }}
          >
            {song.artistName}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              mt: { xs: 1.25, sm: 1.75 },
              minWidth: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {formatStat(song.playCount)} plays
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, minWidth: 0 }}>
              <AccessTime sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.55) }} />
              <Typography
                variant="caption"
                sx={{ color: alpha(theme.palette.text.primary, 0.65), whiteSpace: "nowrap" }}
              >
                {song.duration || "0:00"}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handlePlay}
            aria-label={isPlayingThisSong ? "Pause song" : "Play song"}
            sx={{
              display: { xs: "inline-flex", sm: "none" },
              mt: 1.25,
              width: 40,
              height: 40,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {isPlayingThisSong ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Box>

        <IconButton
          onClick={handlePlay}
          aria-label={isPlayingThisSong ? "Pause song" : "Play song"}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            width: { sm: 52, md: 56 },
            height: { sm: 52, md: 56 },
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {isPlayingThisSong ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>
    </Box>
  );
}
