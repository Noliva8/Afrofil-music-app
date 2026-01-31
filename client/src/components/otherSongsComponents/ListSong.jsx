import React, { useMemo, useState, useCallback } from "react";
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
  AccessTime,
  QueueMusic,
  TrendingUp,
  MoreHoriz,
  PlaylistAdd,
  FavoriteBorder,
  Share,
  SkipNext,
  Person,
  Report,
} from "@mui/icons-material";
import { useApolloClient, useQuery } from "@apollo/client";
import { useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";



import { Link as RouterLink } from "react-router-dom";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack";
import { AddButton } from "../AddButton";
import { ActionMenu } from "../ActionMenu.jsx";
import AddToPlaylistModal from "../AddToPlaylistModal.jsx";
import {
  LIST_BASE_LIMIT,
  LIST_SHOW_ALL_LIMIT,
  ROW_QUERY_CONFIG,
  SONG_LIST_PLACEHOLDER_QUERY,
} from "./songListConfig";
import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook.js";













const SongList = ({
  songsList = [],
  title = "Songs",
  subtitle = "",
  onCardClick,
  emptyMessage = "No songs available",
  emptyDescription = "Start listening to get recommendations",
  rowCode,
}) => {
  const theme = useTheme();
  const client = useApolloClient();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuTrack, setMenuTrack] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobileActions = useMediaQuery(theme.breakpoints.down("md"));
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();

  const rowConfig = rowCode ? ROW_QUERY_CONFIG[rowCode] : null;
  const shouldFetchRowQuery = Boolean(rowConfig && showAll);
  const { data: rowQueryData } = useQuery(
    rowConfig?.query ?? SONG_LIST_PLACEHOLDER_QUERY,
    {
      variables: rowConfig?.variables,
      skip: !shouldFetchRowQuery,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: rowConfig?.fetchPolicy ?? "cache-first",
    }
  );

  const baseSongs = useMemo(() => {
    return processSongs(songsList).filter((song) => song.audioUrl);
  }, [songsList]);

  const baseIdSet = useMemo(() => {
    return new Set(baseSongs.map((song) => song.id));
  }, [baseSongs]);

  const fetchedRowSongs = useMemo(() => {
    if (!rowConfig || !showAll) return [];
    const raw = rowQueryData?.[rowConfig.dataKey] ?? [];
    return raw;
  }, [rowConfig, showAll, rowQueryData]);

  const extraSongs = useMemo(() => {
    if (!showAll || !rowConfig) return [];
    const normalized = processSongs(fetchedRowSongs).filter((song) => song.audioUrl);
    const uniques = normalized.filter((song) => song.id && !baseIdSet.has(song.id));
    const limit = Math.max(LIST_SHOW_ALL_LIMIT - baseSongs.length, 0);
    return uniques.slice(0, limit);
  }, [baseIdSet, baseSongs.length, fetchedRowSongs, rowConfig, showAll]);

  const { songsWithArtwork: extraSongsWithArtwork } = useSongsWithPresignedUrls(
    showAll ? extraSongs : []
  );

  const displayedSongs = useMemo(() => {
    if (showAll) {
      const merged = [...baseSongs, ...extraSongsWithArtwork];
      return merged.slice(0, LIST_SHOW_ALL_LIMIT);
    }
    return baseSongs.slice(0, LIST_BASE_LIMIT);
  }, [baseSongs, extraSongsWithArtwork, showAll]);


const handleCloseAddToPlaylist = useCallback(() => {
  setPlaylistDialogOpen(false);
  setPlaylistTrack(null);
}, []);

const handleAddToPlaylist = useCallback((track) => {
  if (!track) return;
  setPlaylistTrack(track);
  setPlaylistDialogOpen(true);
}, []);

const handleRemoveFromPlaylist = useCallback((track) => {
  if (!track) return;
  console.log("Remove from playlist", track?.title);
}, []);


const handleNavigateToArtist = useCallback(
  (track) => {
    const artistId = track?.artistId || track?.artist?._id || track?.artist;
    if (artistId) {
      navigate(`/artist/${artistId}`);
    }
  },
  [navigate]
);

const handleReportTrack = useCallback((track) => {
  if (!track) return;
  console.log("Report:", track?.title);
}, []);

const handleToggleFavorite = useCallback((track) => {
  if (!track) return;
  console.log("Toggle favorite", track?.title);
}, []);

const handlePlayNext = useCallback((track) => {
  if (!track) return;
  console.log("Play next", track?.title);
}, []);

const handleShareTrack = useCallback((track) => {
  if (!track) return;
  const url = `${window.location.origin}/song/${track?.id || track?._id || ""}`;
  const text = `Listen to "${track?.title}"`;
  if (navigator?.share) {
    navigator.share({ title: track?.title, text, url }).catch(console.error);
    return;
  }
  navigator.clipboard.writeText(url).catch(console.error);
}, []);

const handleMenuClose = useCallback(() => {
  setMenuAnchorEl(null);
  setMenuTrack(null);
}, []);

const handleDrawerClose = useCallback(() => {
  setDrawerOpen(false);
  setMenuTrack(null);
}, []);

const handleMoreClick = useCallback(
  (event, track) => {
    event.stopPropagation();
    setMenuTrack(track);
    if (isMobileActions) {
      setDrawerOpen(true);
      return;
    }
    setMenuAnchorEl(event.currentTarget);
  },
  [isMobileActions]
);

const menuItems = useMemo(() => {
  if (!menuTrack) return [];
  const baseItems = [
    {
      key: "add-to-playlist",
      icon: <PlaylistAdd sx={{ fontSize: "1.2rem" }} />,
      label: "Add to playlist",
      onClick: () => handleAddToPlaylist(menuTrack),
    },
    {
      key: "favorite-track",
      icon: <FavoriteBorder sx={{ fontSize: "1.2rem" }} />,
      label: "Add to favorites",
      onClick: () => handleToggleFavorite(menuTrack),
    },
    {
      key: "play-next",
      icon: <SkipNext sx={{ fontSize: "1.2rem" }} />,
      label: "Play next",
      onClick: () => handlePlayNext(menuTrack),
    },
    {
      type: "divider",
      key: "divider-1",
    },
    {
      key: "share-track",
      icon: <Share sx={{ fontSize: "1.2rem" }} />,
      label: "Share",
      onClick: () => handleShareTrack(menuTrack),
    },
    {
      key: "goto-artist",
      icon: <Person sx={{ fontSize: "1.2rem" }} />,
      label: "Go to artist",
      onClick: () => handleNavigateToArtist(menuTrack),
    },
    {
      type: "divider",
      key: "divider-2",
    },
    {
      key: "report-track",
      icon: <Report sx={{ fontSize: "1.2rem" }} />,
      label: "Report track",
      onClick: () => handleReportTrack(menuTrack),
    },
  ];
  return baseItems;
}, [
  menuTrack,
  handleAddToPlaylist,
  handleToggleFavorite,
  handlePlayNext,
  handleShareTrack,
  handleNavigateToArtist,
  handleReportTrack,
]);

const handlePlay = (event, song) => {
    event.stopPropagation();
    const isCurrent = currentTrack?.id === song.id;
    
    if (isCurrent) {
      isPlaying ? pause() : handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: displayedSongs,
        client,
      });
    } else {
      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: displayedSongs,
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
          flexWrap: "nowrap",
          gap: { xs: 1, md: 2 },
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
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
          <Box sx={{ minWidth: 0 }}>
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
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: { xs: "none", sm: "block" },
              }}
            >
              {subtitle}
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
            minWidth: 120,
            flexShrink: 0,
            whiteSpace: "nowrap",
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
            gridTemplateColumns: {
              md: "50px minmax(0,1fr) repeat(3, 120px)",
              lg: "50px minmax(0,1fr) repeat(4, 120px)",
            },
            gap: 2,
            px: 3,
            py: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            #
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
            }}
          >
            TITLE
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
              textAlign: "center",
              gridColumn: { lg: "3 / 4" },
              display: { md: "none", lg: "block" },
            }}
          >
            DURATION
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
              textAlign: "center",
              gridColumn: { md: "3 / 4", lg: "4 / 5" },
            }}
          >
            PLAYS
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
              textAlign: "center",
              gridColumn: { md: "4 / 5", lg: "5 / 6" },
            }}
          >
            ADD
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
              fontWeight: 600,
              textAlign: "center",
              gridColumn: { md: "5 / 6", lg: "6 / 7" },
            }}
          >
            MORE ACTIONS
          </Typography>
        </Box>

        {/* Songs List */}
        <List sx={{ py: 0 }}>
          {displayedSongs.map((song, index) => {
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




                <Box
                  sx={{
                    width: "100%",
                    display: { xs: "flex", md: "grid" },
                    flexWrap: { xs: "wrap", md: "unset" },
                    alignItems: "center",
                    gap: { xs: 1.25, md: 2 },
                    gridTemplateColumns: {
                      md: "50px minmax(0,1fr) 120px 120px 120px",
                      lg: "50px minmax(0,1fr) 120px 120px 120px 120px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      gridColumn: { md: "1 / 2" },
                      width: { xs: 40, md: 50 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", md: "center" },
                      order: { xs: 0, md: "auto" },
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

                  <Box
                    sx={{
                      gridColumn: { md: "2 / 3" },
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      minWidth: 0,
                      flex: { xs: 1, md: "unset" },
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: 48,
                        height: 48,
                        flexShrink: 0,
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
                      <IconButton
                        size="small"
                        onClick={(e) => handlePlay(e, song)}
                        aria-label="Play song"
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: isCurrent
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, isHovered ? 0.2 : 0),
                          color: isCurrent
                            ? theme.palette.primary.contrastText
                            : theme.palette.primary.main,
                          width: 36,
                          height: 36,
                          opacity: isHovered || isCurrent ? 1 : 0,
                          transition: "all 0.2s ease",
                          borderRadius: "50%",
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
                    </Box>

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

                  <Box
                    sx={{
                      gridColumn: { lg: "3 / 4" },
                      display: { xs: "none", md: "none", lg: "flex" },
                      alignItems: "center",
                      gap: 0.5,
                      justifyContent: { lg: "center" },
                    }}
                  >
                    <AccessTime sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
                    <Typography
                      variant="body2"
                      sx={{
                        color: alpha(theme.palette.text.primary, 0.8),
                        fontSize: "0.875rem",
                        lineHeight: 1,
                      }}
                    >
                      {song.duration || "0:00"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      gridColumn: { md: "3 / 4", lg: "4 / 5" },
                      display: { xs: "none", md: "flex" },
                      alignItems: "center",
                      gap: 0.5,
                      justifyContent: "center",
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 14, color: alpha(theme.palette.text.primary, 0.6) }} />
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.8), fontSize: "0.875rem" }}>
                      {song.plays?.toLocaleString?.() || 0}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      gridColumn: { md: "4 / 5", lg: "5 / 6" },
                      display: "flex",
                      justifyContent: { xs: "flex-start", md: "center" },
                      order: { xs: 2, md: "auto" },
                      ml: { xs: "auto", md: 0 },
                    }}
                  >
                    <AddButton
                      track={song}
                      handleAddToPlaylist={handleAddToPlaylist}
                      handleRemoveFromPlaylist={handleRemoveFromPlaylist}
                      sx={{ display: "flex" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      gridColumn: { md: "5 / 6", lg: "6 / 7" },
                      display: "flex",
                      justifyContent: "center",
                      width: { xs: "auto", md: "100%" },
                      order: { xs: 3, md: "auto" },
                      ml: { xs: 1, md: 0 },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(event) => handleMoreClick(event, song)}
                      aria-label="More options"
                      sx={{
                        color: "rgba(255,255,255,0.65)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "@media (max-width:414px)": {
                          display: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <MoreHoriz />
                    </IconButton>
                  </Box>

                  
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Current Song Progress Bar */}
        {currentTrack && displayedSongs.some(song => song.id === currentTrack.id) && (
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
      {displayedSongs.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            color: alpha(theme.palette.text.primary, 0.5),
          }}
        >
          <QueueMusic sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
           {emptyMessage}
          </Typography>
          <Typography variant="body2">
            {emptyDescription}
          </Typography>
        </Box>
      )}
      <ActionMenu
        isMobile={isMobileActions}
        anchorEl={menuAnchorEl}
        open={!isMobileActions && Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        drawerOpen={drawerOpen}
        onCloseDrawer={handleDrawerClose}
        items={menuItems}
        drawerTitle="More actions"
        drawerSubtitle={menuTrack?.title}
        showCancel
      />
      <AddToPlaylistModal
        open={playlistDialogOpen}
        onClose={handleCloseAddToPlaylist}
        track={playlistTrack}
      />
    </Box>
  );
};

export default SongList;
