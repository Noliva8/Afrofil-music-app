import { useMemo, useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import { useTheme } from "@mui/material/styles";
import {
  PlayArrow,
  Pause,
  MoreHoriz,
  AccessTime,
  QueueMusic,
  FavoriteBorder,
  TrendingUp,
} from "@mui/icons-material";


import { Link as RouterLink } from "react-router-dom";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { useApolloClient } from "@apollo/client";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";





export default function SuggestedSongs({ suggestedSongsWithArtwork = [], onCardClick })

 {
  const theme = useTheme();
  const client = useApolloClient();
  const [showAll, setShowAll] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();



  const suggestedSongs = useMemo(() => {
    const normalized = processSongs(suggestedSongsWithArtwork).filter((song) => song.audioUrl);
    return showAll ? normalized.slice(0, 20) : normalized.slice(0, 8);
  }, [suggestedSongsWithArtwork, showAll]);



  const handlePlay = (event, song) => {
    event.stopPropagation();
    const isCurrent = currentTrack?.id === song.id;
    
    if (isCurrent) {
      isPlaying ? pause() : handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: suggestedSongs,
        client,
      });
    } else {
      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: suggestedSongs,
        client,
      });
    }
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
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 4,
              height: 32,
              background: `linear-gradient(180deg, ${alpha(
                theme.palette.primary.light,
                0.95
              )} 0%, ${theme.palette.primary.main} 100%)`,
              borderRadius: 2,
            }}
          />
          <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              fontFamily: "'Inter', sans-serif",
              color: "#ffffff",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              letterSpacing: "-0.5px",
              whiteSpace: "normal",
              lineHeight: 1.15,
            }}
          >
            Suggested songs
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Based on your listening history and trending songs
          </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowAll(!showAll)}
          sx={{
            color: theme.palette.primary.main,
            borderColor: alpha(theme.palette.primary.main, 0.3),
            borderRadius: 1.5,
            px: 2,
            py: 0.75,
            minWidth: 100,
            "&:hover": {
              borderColor: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          {showAll ? "Show Less" : "View All"}
        </Button>
      </Box>

      {/* List Container */}
      <Box
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
        }}
      >
        {/* List Header */}
        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gridTemplateColumns: "50px 1fr 1fr 100px 120px 80px",
            gap: 2,
            px: 3,
            py: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontWeight: 600 }}>
            #
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontWeight: 600 }}>
            TITLE
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontWeight: 600 }}>
            ARTIST
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontWeight: 600 }}>
            PLAYS
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontWeight: 600 }}>
            DURATION
          </Typography>
          <Box />
        </Box>

        {/* Songs List */}
        <List sx={{ py: 0 }}>
          {suggestedSongs.map((song, index) => {
            const isCurrent = currentTrack?.id === song.id;
            const isHovered = hoveredIndex === index;

            return (
              <ListItem
                key={song.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onCardClick?.(song)}
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 1.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: isHovered 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "transparent",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                {/* Index Number */}
                <Box
                  sx={{
                    width: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isCurrent && isPlaying ? (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "pulse 1.5s infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.5 },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 8,
                          backgroundColor: theme.palette.primary.contrastText,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: isCurrent 
                          ? theme.palette.primary.main 
                          : alpha(theme.palette.text.primary, 0.6),
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: "0.875rem",
                      }}
                    >
                      {index + 1}
                    </Typography>
                  )}
                </Box>

                {/* Song Info with Artwork */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    minWidth: 0,
                    mr: 2,
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={song.artworkUrl}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    {song.title?.[0]}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: isCurrent 
                          ? theme.palette.primary.main 
                          : theme.palette.text.primary,
                        fontSize: "0.95rem",
                        mb: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {song.title}
                      {song.trendingScore > 50 && (
                        <TrendingUp
                          sx={{
                            fontSize: 14,
                            ml: 1,
                            color: theme.palette.warning.main,
                            verticalAlign: "text-bottom",
                          }}
                        />
                      )}
                    </Typography>
                    
                    <Typography
                      component={RouterLink}
                      to={`/artist/${song.artistId}`}
                      onClick={(e) => e.stopPropagation()}
                      variant="body2"
                      sx={{
                        color: alpha(theme.palette.text.primary, 0.7),
                        textDecoration: "none",
                        fontSize: "0.875rem",
                        "&:hover": {
                          color: theme.palette.primary.main,
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {song.artistName}
                    </Typography>
                  </Box>
                </Box>

                {/* Artist (Desktop only) */}
                <Box
                  sx={{
                    flex: 1,
                    display: { xs: "none", md: "block" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(theme.palette.text.primary, 0.8),
                      fontSize: "0.875rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.artistName}
                  </Typography>
                </Box>

                {/* Plays */}
                <Box
                  sx={{
                    width: 100,
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <PlayArrow sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.8), fontSize: "0.875rem" }}>
                    {song.plays?.toLocaleString?.() || 0}
                  </Typography>
                </Box>

                {/* Duration */}
                <Box
                  sx={{
                    width: 120,
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <AccessTime sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.8), fontSize: "0.875rem" }}>
                    {song.duration || "0:00"}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box
                  sx={{
                    width: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                >
                  {/* Play Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => handlePlay(e, song)}
                    sx={{
                      backgroundColor: isCurrent
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, isHovered ? 0.1 : 0),
                      color: isCurrent
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                      width: 32,
                      height: 32,
                      opacity: isHovered || isCurrent ? 1 : 0,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                      },
                    }}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause sx={{ fontSize: 16 }} />
                    ) : (
                      <PlayArrow sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>

                  {/* More Options (shown on hover) */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <IconButton size="small" sx={{ width: 32, height: 32 }}>
                      <FavoriteBorder sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.7) }} />
                    </IconButton>
                    <IconButton size="small" sx={{ width: 32, height: 32 }}>
                      <MoreHoriz sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.7) }} />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Current Song Progress Bar */}
        {currentTrack && suggestedSongs.some(song => song.id === currentTrack.id) && (
          <Box sx={{ px: 3, py: 1 }}>
            <LinearProgress
              variant="determinate"
              value={50} // Replace with actual progress
              sx={{
                height: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.divider, 0.2),
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Empty State */}
      {suggestedSongs.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: alpha(theme.palette.text.primary, 0.5),
          }}
        >
          <QueueMusic sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            No suggestions available
          </Typography>
          <Typography variant="body2">
            Start listening to songs to get personalized recommendations
          </Typography>
        </Box>
      )}
    </Box>
  );
}
