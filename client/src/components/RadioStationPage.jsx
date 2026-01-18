import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApolloClient, useQuery } from "@apollo/client";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ShareIcon from "@mui/icons-material/Share";
import ReportIcon from "@mui/icons-material/Report";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import PersonIcon from "@mui/icons-material/Person";
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../utils/plabackUtls/handleSongPlayBack.js";
import { RADIO_STATION, RADIO_STATION_SONGS } from "../utils/queries";
import { useSongsWithPresignedUrls } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";
import { AddButton } from "./AddButton.jsx";
import AddToPlaylistModal from "./AddToPlaylistModal.jsx";

const formatTotalDuration = (seconds) => {
  const total = Number(seconds || 0);
  if (!total) return "0:00";
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const RadioStationPage = () => {
  const theme = useTheme();
  const client = useApolloClient();
  const navigate = useNavigate();
  const { stationId } = useParams();
  const [emptyModalOpen, setEmptyModalOpen] = useState(false);
  const [trackMenuAnchor, setTrackMenuAnchor] = useState(null);
  const [trackDrawerOpen, setTrackDrawerOpen] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [touchTimer, setTouchTimer] = useState(null);
  const isMobile = useMediaQuery("(max-width:900px)");

  const { data: stationData } = useQuery(RADIO_STATION, {
    variables: { stationId },
    fetchPolicy: "cache-first",
  });
  const { data: stationSongsData } = useQuery(RADIO_STATION_SONGS, {
    variables: { stationId },
    fetchPolicy: "cache-first",
  });

  const station = stationData?.radioStation || null;
  const stationSongsRaw = useMemo(
    () => stationSongsData?.radioStationSongs || [],
    [stationSongsData?.radioStationSongs]
  );
  const { songsWithArtwork } = useSongsWithPresignedUrls(stationSongsRaw);

  const stationSongs = useMemo(() => {
    const processed = processSongs(songsWithArtwork).filter((song) => song.audioUrl);
    return processed.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  }, [songsWithArtwork]);

  useEffect(() => {
    if (!stationId) return;
    if (!stationSongsData) return;
    const hasSongs = stationSongsRaw.length > 0;
    if (!hasSongs) {
      setEmptyModalOpen(true);
    }
  }, [stationId, stationSongsData, stationSongsRaw.length]);

  const topSong = stationSongs[0] || null;
  const totalDuration = stationSongs.reduce(
    (sum, song) => sum + Number(song.durationSeconds || song.duration || 0),
    0
  );

  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause, playerState } = useAudioPlayer();

  const isCurrent = currentTrack?.id === topSong?.id;
  const isPlayingThisSong = isCurrent && isPlaying;

  const FALLBACK = useMemo(
    () =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
          <rect width="600" height="600" fill="#1a1a1a"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#ffffff" font-size="28" font-family="Arial">No Cover</text>
        </svg>`
      ),
    []
  );

  const getId = useCallback((obj) => {
    if (!obj) return "";
    return String(obj.id || obj._id || obj.songId || "");
  }, []);

  const handlePlayAll = () => {
    if (!topSong) return;
    if (isCurrent) {
      isPlayingThisSong
        ? pause()
        : handleTrendingSongPlay({
            song: topSong,
            incrementPlayCount,
            handlePlaySong,
            trendingSongs: stationSongs,
            client,
          });
      return;
    }
    handleTrendingSongPlay({
      song: topSong,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: stationSongs,
      client,
    });
  };

  const handlePlayStationSong = useCallback(
    (song) => {
      if (!song) return;
      const currentId = getId(currentTrack);
      const nextId = getId(song);
      if (currentId && nextId && currentId === nextId) {
        isPlaying
          ? pause()
          : handleTrendingSongPlay({
              song,
              incrementPlayCount,
              handlePlaySong,
              trendingSongs: stationSongs,
              client,
            });
        return;
      }
      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: stationSongs,
        client,
      });
    },
    [client, currentTrack, getId, handlePlaySong, incrementPlayCount, isPlaying, pause, stationSongs]
  );

  const handleAddToPlaylist = useCallback((track) => {
    if (!track) return;
    setPlaylistTrack(track);
    setPlaylistDialogOpen(true);
  }, []);

  const handleShareTrack = useCallback((track) => {
    if (!track) return;
    console.log("Share track:", track.title);
  }, []);

  const handleReportTrack = useCallback((track) => {
    if (!track) return;
    console.log("Report track:", track.title);
  }, []);

  const handleOpenTrackMenu = (event, track) => {
    event.stopPropagation();
    setSelectedTrack(track);
    if (isMobile) {
      setTrackDrawerOpen(true);
      setTrackMenuAnchor(null);
      return;
    }
    setTrackMenuAnchor(event.currentTarget);
  };

  const handleCloseTrackMenu = () => setTrackMenuAnchor(null);
  const handleCloseTrackDrawer = () => {
    setTrackDrawerOpen(false);
    setSelectedTrack(null);
  };

  const handleTouchStart = useCallback((track, e) => {
    const timer = setTimeout(() => {
      setSelectedTrack(track);
      if (isMobile) {
        setTrackDrawerOpen(true);
        setTrackMenuAnchor(null);
      } else {
        setTrackMenuAnchor(e.currentTarget);
      }
    }, 500);
    setTouchTimer(timer);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  if (!station) return null;

  const artwork = topSong?.artworkUrl || topSong?.artwork || topSong?.cover || FALLBACK;

  return (
    <>
      <Dialog open={emptyModalOpen} onClose={() => setEmptyModalOpen(false)}>
        <DialogTitle>Station is empty</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "rgba(0,0,0,0.7)" }}>
            This radio station does not have any songs yet.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmptyModalOpen(false)}>Close</Button>
          <Button
            onClick={() => navigate(-1)}
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            }}
          >
            Go Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hero Section (matches SongPage layout) */}
      <Box
        sx={{
          width: "100%",
          height: { xs: "auto", md: "40vh", lg: "35vh" },
          minHeight: { xs: 400, md: 450, lg: 500 },
          position: "relative",
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 3, sm: 4, md: 5, lg: 6 },
        }}
      >
        <Box
          component="img"
          src={artwork}
          alt={station.name}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.35)",
            transform: "scale(1.1)",
            zIndex: 0,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: {
              xs: "linear-gradient(to bottom, rgba(18, 18, 18, 0.95) 0%, rgba(18, 18, 18, 0.85) 100%)",
              md: "linear-gradient(to right, rgba(18, 18, 18, 0.95) 0%, rgba(18, 18, 18, 0.85) 40%, rgba(18, 18, 18, 0.4) 100%)",
            },
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "center", md: "center" },
            justifyContent: { xs: "center", md: "space-between" },
            gap: { xs: 4, md: 6, lg: 8 },
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 220, sm: 260, md: 300, lg: 340 },
              height: { xs: 220, sm: 260, md: 300, lg: 340 },
              flexShrink: 0,
              position: "relative",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <Box
              component="img"
              src={artwork}
              alt={station.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = FALLBACK;
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              color: "white",
              textAlign: { xs: "center", md: "left" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: { xs: "center", md: "flex-start" },
              maxWidth: {
                xs: "100%",
                md: "calc(100% - 350px)",
                lg: "calc(100% - 400px)",
              },
              paddingRight: { md: 2, lg: 4 },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: "block",
                color: "#E4C421",
                fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                fontWeight: 700,
                letterSpacing: "0.15em",
                mb: { xs: 1, md: 1.5 },
                textTransform: "uppercase",
              }}
            >
              RADIO STATION
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontSize: {
                  xs: "3.2rem",
                  sm: "3.8rem",
                  md: "4.2rem",
                  lg: "4.8rem",
                  xl: "5.2rem",
                },
                fontWeight: 800,
                mb: { xs: 1.5, md: 2 },
                lineHeight: 1.1,
                letterSpacing: "0.1em",
                background: "linear-gradient(45deg, #fff 20%, #E4C421 80%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: { xs: 2, md: 2 },
                overflowWrap: "anywhere",
                textAlign: { xs: "center", md: "left" },
                width: "100%",
              }}
              title={station.name}
            >
              {station.name}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
                maxWidth: { xs: "100%", md: "90%" },
                textAlign: { xs: "center", md: "left" },
              }}
            >
              {station.description || "Curated Afrofeel radio station"}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, mt: 3 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                {stationSongs.length} songs
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                {formatTotalDuration(totalDuration)} total duration
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Controls Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "column", md: "row" },
          justifyContent: "space-between",
          gap: { xs: 2, md: 0 },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, md: 3 },
          backgroundColor: "#121212",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <IconButton
            onClick={handlePlayAll}
            sx={{
              width: 52,
              height: 52,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            }}
          >
            {isPlayingThisSong ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Station Songs Section (SongPage list style) */}
      {stationSongs.length > 0 && (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, my: { xs: 4, sm: 5 } }}>
          <Box
            sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns: "0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr",
              alignItems: "center",
              py: 2.5,
              px: 0,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              borderRadius: "12px 12px 0 0",
              mt: { xs: 3, md: 4 },
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              #
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Title
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Artist
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Plays
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Duration
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              Add
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              More
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: "grid", md: "none" },
              gridTemplateColumns: "auto 1fr auto auto",
              alignItems: "center",
              py: 2,
              px: 0,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              borderRadius: "12px 12px 0 0",
              mt: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              #
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Title
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              Play
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
              More
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1.5, md: 0 },
              borderRadius: { xs: 2, md: "0 0 12px 12px" },
              overflow: "hidden",
              bgcolor: { md: "transparent" },
            }}
          >
            {stationSongs.map((track, index) => {
              const trackId = getId(track);
              const isCurrentTrack = getId(currentTrack) === trackId;
              const isActive = isCurrentTrack;
              const thumbnail = track.artworkUrl || track.artwork || track.albumCoverImageUrl || track.cover;
              const artistName = track.artistName || track?.artist?.artistAka || "Unknown Artist";

              return (
                <Box
                  key={trackId || index}
                  onTouchStart={(e) => handleTouchStart(track, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "auto 1fr auto auto",
                      md: "0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr",
                    },
                    alignItems: "center",
                    gap: { xs: 1.5, md: 0 },
                    py: { xs: 2, md: 2 },
                    px: 0,
                    borderBottom: { xs: "none", md: "1px solid" },
                    borderColor: { md: "divider" },
                    borderRadius: { xs: 2, md: 0 },
                    bgcolor: isActive ? "rgba(228,196,33,0.08)" : { xs: "background.paper", md: "transparent" },
                    mb: { xs: 1, md: 0 },
                    transition: "all 0.25s",
                    "&:hover": {
                      bgcolor: { xs: "action.hover", md: "action.hover" },
                      transform: { xs: "translateX(4px)", md: "none" },
                    },
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color: isActive ? "primary.main" : index < 3 ? "primary.main" : "text.secondary",
                      fontSize: { xs: "1rem", md: "1.15rem" },
                      fontWeight: 900,
                      textAlign: "center",
                      minWidth: { xs: 32, md: "auto" },
                      fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
                    }}
                  >
                    {index + 1}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 2, md: 2.5 },
                      overflow: "hidden",
                      gridColumn: { xs: "auto", md: "auto" },
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: { xs: 50, md: 60 },
                        height: { xs: 50, md: 60 },
                        borderRadius: { xs: 1.5, md: 2 },
                        overflow: "hidden",
                        flexShrink: 0,
                        cursor: "pointer",
                        boxShadow: { xs: 1, md: 3 },
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: { xs: 2, md: 4 },
                        },
                      }}
                      onClick={() => handlePlayStationSong(track)}
                    >
                      <Box
                        component="img"
                        src={thumbnail || FALLBACK}
                        alt={track.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK;
                        }}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "1rem", md: "1.05rem" },
                          color: "text.primary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {track.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.85rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: track.artistId ? "pointer" : "default",
                          "&:hover": { color: "primary.main" },
                        }}
                        onClick={() => {
                          if (track.artistId) navigate(`/artist/${track.artistId}`);
                        }}
                      >
                        {artistName}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      display: { xs: "none", md: "block" },
                      color: "text.secondary",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {artistName}
                  </Typography>

                  <Typography
                    sx={{
                      display: { xs: "none", md: "block" },
                      color: "text.secondary",
                      fontSize: "0.9rem",
                    }}
                  >
                    {Number(track.playCount || 0).toLocaleString()}
                  </Typography>

                  <Typography
                    sx={{
                      display: { xs: "none", md: "block" },
                      color: "text.secondary",
                      fontSize: "0.9rem",
                    }}
                  >
                    {track.duration || "--:--"}
                  </Typography>

                  <AddButton handleAddToPlaylist={handleAddToPlaylist} track={track} />

                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <IconButton
                      onClick={(event) => handleOpenTrackMenu(event, track)}
                      sx={{
                        color: "text.secondary",
                        backgroundColor: "action.hover",
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: "primary.main",
                          backgroundColor: "rgba(228,196,33,0.15)",
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Menu
        anchorEl={trackMenuAnchor}
        open={!isMobile && Boolean(trackMenuAnchor)}
        onClose={handleCloseTrackMenu}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 220 } }}
      >
        <MenuItem
          onClick={() => {
            if (selectedTrack) handlePlayStationSong(selectedTrack);
            handleCloseTrackMenu();
          }}
        >
          <ListItemIcon>
            {getId(currentTrack) === getId(selectedTrack) && isPlaying ? (
              <PauseIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {getId(currentTrack) === getId(selectedTrack) && isPlaying ? "Pause" : "Play"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTrack) handleAddToPlaylist(selectedTrack);
            handleCloseTrackMenu();
          }}
        >
          <ListItemIcon>
            <QueueMusicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add to playlist</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTrack) handleShareTrack(selectedTrack);
            handleCloseTrackMenu();
          }}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const artistId = selectedTrack?.artistId || selectedTrack?.artist?._id;
            if (artistId) navigate(`/artist/${artistId}`);
            handleCloseTrackMenu();
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Go to artist</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTrack) handleReportTrack(selectedTrack);
            handleCloseTrackMenu();
          }}
        >
          <ListItemIcon>
            <ReportIcon fontSize="small" sx={{ color: "#ff6b6b" }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ sx: { color: "#ff6b6b", fontWeight: 600 } }}>
            Report track
          </ListItemText>
        </MenuItem>
      </Menu>

      <Drawer anchor="bottom" open={trackDrawerOpen} onClose={handleCloseTrackDrawer}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            {selectedTrack?.title || "Track Options"}
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            {selectedTrack?.artistName || selectedTrack?.artist?.artistAka || "Unknown Artist"}
          </Typography>
          <List>
            <ListItem
              button
              onClick={() => {
                if (selectedTrack) handlePlayStationSong(selectedTrack);
                handleCloseTrackDrawer();
              }}
            >
              <ListItemIcon>
                {getId(currentTrack) === getId(selectedTrack) && isPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayArrowIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={getId(currentTrack) === getId(selectedTrack) && isPlaying ? "Pause" : "Play"}
              />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                if (selectedTrack) handleAddToPlaylist(selectedTrack);
                handleCloseTrackDrawer();
              }}
            >
              <ListItemIcon>
                <QueueMusicIcon />
              </ListItemIcon>
              <ListItemText primary="Add to playlist" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                if (selectedTrack) handleShareTrack(selectedTrack);
                handleCloseTrackDrawer();
              }}
            >
              <ListItemIcon>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText primary="Share" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                const artistId = selectedTrack?.artistId || selectedTrack?.artist?._id;
                if (artistId) navigate(`/artist/${artistId}`);
                handleCloseTrackDrawer();
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Go to artist" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                if (selectedTrack) handleReportTrack(selectedTrack);
                handleCloseTrackDrawer();
              }}
            >
              <ListItemIcon>
                <ReportIcon sx={{ color: "#ff6b6b" }} />
              </ListItemIcon>
              <ListItemText
                primary="Report track"
                primaryTypographyProps={{ sx: { color: "#ff6b6b", fontWeight: 600 } }}
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <AddToPlaylistModal
        open={playlistDialogOpen}
        onClose={() => {
          setPlaylistDialogOpen(false);
          setPlaylistTrack(null);
        }}
        track={playlistTrack}
      />
    </>
  );
};
