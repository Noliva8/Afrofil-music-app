import React, { useMemo, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from "@mui/material/styles";
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  Download,
  Share,
  TrendingUp,
  Star,
  CalendarMonth,
  AccessTime,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { useApolloClient } from "@apollo/client";
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
  const [isHovered, setIsHovered] = useState(false);

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
    if (isCurrent) {
      isPlayingThisSong
        ? pause()
        : handleTrendingSongPlay({
            song,
            incrementPlayCount,
            handlePlaySong,
            trendingSongs: [song],
            client,
          });
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
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 4,
              height: 40,
              background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 2,
            }}
          />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                fontSize: { xs: "1.4rem", sm: "1.65rem", md: "1.85rem" },
                mb: 0.5,
              }}
            >
              Song of the Month
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.primary, 0.7),
                  fontSize: "0.875rem",
                }}
              >
                {monthLabel} • Top Performing Song
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Crown Badge */}
        <Chip
          icon={<Star sx={{ fontSize: 16 }} />}
          label="MONTHLY HIGHLIGHT"
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.15),
            color: theme.palette.warning.main,
            fontWeight: 700,
            fontSize: "0.75rem",
          }}
        />
      </Box>

      {/* Main Card */}
      <Card
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onCardClick?.(song)}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        }}
      >
        {/* Background Tint */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.15),
          }}
        />

        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
            {/* Artwork Section */}
            <Box
              sx={{
                position: "relative",
                width: { xs: "100%", md: 280 },
                height: { xs: 240, md: 280 },
                flexShrink: 0,
              }}
            >
              <CardMedia
                component="img"
                image={song.artworkUrl || "/api/placeholder/400/400"}
                alt={song.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Play Button Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              >
                <IconButton
                  onClick={handlePlay}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    width: 64,
                    height: 64,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {isPlayingThisSong ? (
                    <Pause sx={{ fontSize: 32 }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 32 }} />
                  )}
                </IconButton>
              </Box>

              {/* Now Playing Indicator */}
              {isCurrent && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.main,
                      animation: "pulse 1.5s infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                    Now playing
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Content Section */}
            <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
              {/* Title and Stats */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    fontSize: { xs: "1.75rem", md: "2rem" },
                    lineHeight: 1.2,
                    mb: 1,
                  }}
                >
                  {song.title}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Typography
                    component={RouterLink}
                    to={`/artist/${song.artistId}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {song.artistName}
                  </Typography>

                  {song.trendingScore > 50 && (
                    <Tooltip title="Trending Song">
                      <TrendingUp sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                    </Tooltip>
                  )}
                </Box>

                {/* Duration */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 3 }}>
                  <AccessTime sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.6) }} />
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                    {song.duration || "0:00"}
                  </Typography>
                </Box>
              </Box>

              {/* Stats Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                  gap: 2,
                  mb: 3,
                }}
              >
                {[
                  { label: "Plays", value: song.playCount, icon: PlayArrow, color: "primary" },
                  { label: "Likes", value: song.likesCount, icon: Favorite, color: "error" },
                  { label: "Downloads", value: song.downloadCount, icon: Download, color: "success" },
                  { label: "Shares", value: song.shareCount, icon: Share, color: "info" },
                ].map((stat, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: alpha(theme.palette[stat.color].main, 0.1),
                      borderRadius: 2,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <stat.icon sx={{ fontSize: 20, color: theme.palette[stat.color].main, mb: 1 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        fontSize: "1.25rem",
                      }}
                    >
                      {formatStat(stat.value)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(theme.palette.text.primary, 0.6),
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <IconButton
                  onClick={handlePlay}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    px: 3,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  {isPlayingThisSong ? (
                    <>
                      <Pause sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Pause
                      </Typography>
                    </>
                  ) : (
                    <>
                      <PlayArrow sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Play Song
                      </Typography>
                    </>
                  )}
                </IconButton>

                <IconButton
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    color: theme.palette.primary.main,
                    px: 2,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <FavoriteBorder sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Like
                  </Typography>
                </IconButton>

                <IconButton
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    color: alpha(theme.palette.text.primary, 0.7),
                    px: 2,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.divider, 0.1),
                    },
                  }}
                >
                  <Share sx={{ mr: 1 }} />
                  <Typography variant="body2">Share</Typography>
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Progress Bar for Currently Playing */}
          {isCurrent && (
            <Box sx={{ px: 3, pb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={50} // Replace with actual progress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.divider, 0.2),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {song.description && (
        <Box sx={{ mt: 2, px: { xs: 1, sm: 2 } }}>
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            {song.description}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
