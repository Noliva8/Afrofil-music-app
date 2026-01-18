import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { QUERY_USER_PLAYLISTS } from "../utils/queries";
import { REMOVE_SONG_FROM_PLAYLIST } from "../utils/mutations";
import UserAuth from "../utils/auth";
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../utils/handlePlayCount";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";
import { useSongsWithPresignedUrls } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { similarSongsUtil } from "../utils/someSongsUtils/similarSongsHook";
import { presignAudioForTrack } from "../utils/plabackUtls/handleSongPlayBack";
import { PlayButton } from "../components/PlayButton";
import { ShuffleButton } from "../components/ShuffleButton";
import { ActionButtonsGroup } from "../components/ActionButtonsGroup";
import { ActionMenu } from "../components/ActionMenu";
import { TrackListSection } from "../components/TrackListSection";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import ShareIcon from "@mui/icons-material/Share";
import ShuffleIcon from "@mui/icons-material/Shuffle";

const LABELS = {
  playlist: "Playlists",
  liked_songs: "Liked Songs",
  albums: "Albums",
  artists: "Artists",
  stations: "Stations",
  short_videos: "Short Videos",
  downloads: "Downloads",
  create_playlist: "Create Playlist",
  recent_played: "Recently Played",
};

export default function CollectionPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:900px)");
  const { section, subsection, playlistId, songId } = useParams();
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [favoritePlaylistIds, setFavoritePlaylistIds] = useState(() => new Set());
  const navigate = useNavigate();
  const client = useApolloClient();
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause, playerState } = useAudioPlayer();
  const playingId = currentTrack?.id || currentTrack?._id || null;
  const isLoggedIn = Boolean(UserAuth?.getProfile?.()?.data?._id);
  const getId = useCallback((obj) => String(obj?._id || obj?.id || obj?.songId || ""), []);

  const shouldFetchPlaylists = section === "playlist" || Boolean(playlistId);
  const { data } = useQuery(QUERY_USER_PLAYLISTS, {
    variables: { limit: 50 },
    skip: !shouldFetchPlaylists || !isLoggedIn,
    fetchPolicy: "cache-and-network",
  });

  const playlists = data?.userPlaylists || [];
  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist._id === openPlaylistId) || null,
    [openPlaylistId, playlists]
  );

  useEffect(() => {
    if (playlistId) {
      setOpenPlaylistId(playlistId);
    }
  }, [playlistId]);

  const selectedSongs = selectedPlaylist?.songs || [];
  const { songsWithArtwork } = useSongsWithPresignedUrls(selectedSongs);
  const playContextSongs = processSongs(songsWithArtwork);

  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const totalDurationSeconds = useMemo(() => {
    const parseDuration = (value) => {
      if (!value) return 0;
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.includes(":")) {
        const parts = value.split(":").map((part) => Number(part) || 0);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    };
    return (selectedSongs || []).reduce((total, song) => total + parseDuration(song.duration ?? song.durationSeconds), 0);
  }, [selectedSongs]);
  const heroArtwork =
    playContextSongs[0]?.artworkUrl ||
    selectedSongs[0]?.artworkUrl ||
    selectedSongs[0]?.artwork ||
    selectedSongs[0]?.album?.albumCoverImage ||
    "";

  const formatDuration = (seconds) => {
    const safeSeconds = Number(seconds);
    if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) return "--:--";
    const total = Math.max(0, Math.floor(safeSeconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };
  const orderPlaylist = (songs, startId) => {
    if (!startId) return songs;
    const idx = songs.findIndex((s) => String(s.id) === String(startId));
    if (idx < 0) return songs;
    return [...songs.slice(idx), ...songs.slice(0, idx)];
  };

  const buildPlaylistQueue = async (baseSongs, seedId) => {
    if (!seedId) return baseSongs;
    const similarPack = await similarSongsUtil(client, seedId);
    const similarProcessed = processSongs(similarPack.songs || []);
    const baseIds = new Set(baseSongs.map((s) => String(s.id)));
    const filteredSimilar = similarProcessed.filter((s) => !baseIds.has(String(s.id)));
    return [...baseSongs, ...filteredSimilar];
  };

  const playPlaylistFromTrack = async (track, { shuffle = false } = {}) => {
    if (!track) return;
    const base = shuffle ? [...playContextSongs].sort(() => Math.random() - 0.5) : playContextSongs;
    const ordered = shuffle ? base : orderPlaylist(base, track.id);
    const combined = await buildPlaylistQueue(ordered, track.id);
    const queue = combined.slice(1);
    const trackReady = await presignAudioForTrack(track, client);
    if (!trackReady?.audioUrl) return;
    await handlePlaySong(trackReady, queue, {
      source: "playlist",
      sourceId: selectedPlaylist?._id || null,
      queuePosition: 0,
      queueLength: combined.length,
    });
  };

  const handlePlayAll = () => {
    if (!playContextSongs.length) return;
    playPlaylistFromTrack(playContextSongs[0]);
  };

  const handleShufflePlay = () => {
    if (!playContextSongs.length) return;
    playPlaylistFromTrack(playContextSongs[0], { shuffle: true });
  };
  const [removeSongFromPlaylist] = useMutation(REMOVE_SONG_FROM_PLAYLIST, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
    ],
  });

  const handleRemoveSong = useCallback(
    async (songId) => {
      if (!selectedPlaylist?._id || !songId) return;
      await removeSongFromPlaylist({
        variables: { playlistId: selectedPlaylist._id, songId },
      });
    },
    [removeSongFromPlaylist, selectedPlaylist]
  );

  const handleAddToPlaylist = useCallback(
    (track) => {
      if (!track) return;
      const trackId = String(track?._id || track?.id || "");
      const alreadyInSelectedPlaylist = Boolean(
        selectedPlaylist?.songs?.some(
          (song) => String(song?._id || song?.id || "") === trackId
        )
      );

      if (alreadyInSelectedPlaylist) {
        handleRemoveSong(trackId);
        return;
      }

      setPlaylistTrack(track);
      setPlaylistDialogOpen(true);
    },
    [handleRemoveSong, selectedPlaylist]
  );
  const handleCloseAddToPlaylist = useCallback(() => {
    setPlaylistDialogOpen(false);
    setPlaylistTrack(null);
  }, []);
  const primaryTrack = playContextSongs[0] || null;
  const isPlaylistPlaying =
    Boolean(primaryTrack) && currentTrack?.id === primaryTrack.id && isPlaying;

  const handlePrimaryPlay = () => {
    if (!primaryTrack) return;
    if (isPlaylistPlaying) {
      pause();
      return;
    }
    handlePlayAll();
  };
  const handleToggleFavorite = () => {
    if (!selectedPlaylist?._id) return;
    setFavoritePlaylistIds((prev) => {
      const next = new Set(prev);
      const key = String(selectedPlaylist._id);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const handleSharePlaylist = async () => {
    if (!selectedPlaylist?._id) return;
    const shareUrl = `${window.location.origin}/collection/playlist/${selectedPlaylist._id}`;
    const title = selectedPlaylist?.title || "Playlist";
    const text = `${title} on Afrofeel`;

    if (navigator?.share) {
      navigator.share({ title, text, url: shareUrl }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.warn("Share failed", err);
    }
  };
  const isFavorite = selectedPlaylist?._id
    ? favoritePlaylistIds.has(String(selectedPlaylist._id))
    : false;
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
  const [playlistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const handleOpenPlaylistMenu = (event) => {
    event.stopPropagation();
    if (isMobile) {
      setPlaylistDrawerOpen(true);
      setPlaylistMenuAnchor(null);
      return;
    }
    setPlaylistMenuAnchor(event.currentTarget);
  };
  const handleClosePlaylistMenu = () => {
    setPlaylistMenuAnchor(null);
    setPlaylistDrawerOpen(false);
  };

  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackMenuAnchor, setTrackMenuAnchor] = useState(null);
  const [trackDrawerOpen, setTrackDrawerOpen] = useState(false);
  const handleOpenTrackMenu = useCallback(
    (event, track) => {
      if (event) event.stopPropagation();
      if (!track) return;
      setSelectedTrack(track);
      if (isMobile) {
        setTrackDrawerOpen(true);
        setTrackMenuAnchor(null);
      } else {
        setTrackMenuAnchor(event?.currentTarget || null);
        setTrackDrawerOpen(false);
      }
    },
    [isMobile]
  );
  const handleCloseTrackMenu = useCallback(() => {
    setTrackMenuAnchor(null);
    setTrackDrawerOpen(false);
    setSelectedTrack(null);
  }, []);

  const handleReportTrack = useCallback((track) => {
    if (!track) return;
    console.log("Report track:", track.title);
  }, []);

  const selectedTrackId = useMemo(() => getId(selectedTrack), [selectedTrack, getId]);
  const isSelectedTrackCurrent = useMemo(
    () => Boolean(playingId && selectedTrackId && String(playingId) === String(selectedTrackId)),
    [playingId, selectedTrackId]
  );

  const handlePlaySelectedTrack = useCallback(() => {
    if (selectedTrack) {
      playPlaylistFromTrack(selectedTrack);
    }
  }, [playPlaylistFromTrack, selectedTrack]);

  const handleRemoveSelectedTrack = useCallback(() => {
    if (selectedTrack?._id) {
      handleRemoveSong(selectedTrack._id);
    }
  }, [handleRemoveSong, selectedTrack]);

  const handleShareTrack = useCallback(
    (track) => {
      if (!track?._id) return;
      const shareUrl = `${window.location.origin}/song/${track._id}`;
      const title = track.title || "Song";
      const text = track.artistName || track?.artist?.artistAka || "Listen to this track";

      const sharePayload = { title, text, url: shareUrl };
      const shareFallback = async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (err) {
          console.warn("Share failed", err);
        }
      };

      if (navigator?.share) {
        navigator.share(sharePayload).catch(() => shareFallback());
        return;
      }
      shareFallback();
    },
    []
  );

  const playlistMenuItems = useMemo(
    () => [
      {
        icon: isPlaylistPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />,
        label: isPlaylistPlaying ? "Pause" : "Play",
        onClick: handlePrimaryPlay,
      },
      {
        icon: <ShuffleIcon fontSize="small" />,
        label: "Shuffle play",
        onClick: handleShufflePlay,
      },
      {
        icon: <ShareIcon fontSize="small" />,
        label: "Share",
        onClick: handleSharePlaylist,
      },
    ],
    [handlePrimaryPlay, handleSharePlaylist, handleShufflePlay, isPlaylistPlaying]
  );

  const trackMenuItems = useMemo(() => {
    const items = [
      {
        icon: isSelectedTrackCurrent ? (
          <PauseIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
        ) : (
          <PlayArrowIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
        ),
        label: isSelectedTrackCurrent ? "Pause" : "Play",
        onClick: handlePlaySelectedTrack,
      },
      {
        icon: <ShuffleIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Shuffle play",
        onClick: handleShufflePlay,
      },
      { type: "divider" },
      {
        icon: <ShareIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Share",
        onClick: () => handleShareTrack(selectedTrack),
        disabled: !selectedTrack,
      },
      {
        icon: <DeleteOutlineIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Remove from playlist",
        onClick: handleRemoveSelectedTrack,
        disabled: !selectedTrack,
      },
      {
        icon: <OpenInNewIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "View song",
        onClick: () => {
          if (selectedTrack?._id) navigate(`/song/${selectedTrack._id}`);
        },
        disabled: !selectedTrack,
      },
      {
        icon: <PersonIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Go to artist",
        onClick: () => {
          const artistId = selectedTrack?.artist?._id;
          if (artistId) navigate(`/artist/${artistId}`);
        },
        disabled: !selectedTrack,
      },
      { type: "divider" },
      {
        icon: <ShareIcon fontSize="small" sx={{ color: "#ff6b6b" }} />,
        label: "Report track",
        onClick: () => {
          if (selectedTrack) handleReportTrack(selectedTrack);
        },
        color: "#ff6b6b",
        hoverBg: "rgba(255,107,107,0.1)",
        disabled: !selectedTrack,
      },
    ];
    return items;
  }, [
    handlePlaySelectedTrack,
    handleShufflePlay,
    handleShareTrack,
    handleRemoveSelectedTrack,
    handleReportTrack,
    isSelectedTrackCurrent,
    navigate,
    selectedTrack,
  ]);

  const sectionLabel = LABELS[section] || (playlistId ? "Playlists" : section) || "Collection";
  const subLabel = subsection ? LABELS[subsection] || subsection : null;
  const showSectionHeader = !(section === "playlist" && !subLabel && !selectedPlaylist);
  const getPlaylistArtwork = (playlist) =>
    playlist?.songs?.[0]?.artworkUrl ||
    playlist?.songs?.[0]?.artwork ||
    playlist?.songs?.[0]?.album?.albumCoverImage ||
    "";

  return (
    <Box
      sx={{
        minHeight: "70vh",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.85
        )} 100%)`,
      }}
    >
      <Box sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        {showSectionHeader && (
          <>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              {sectionLabel}
            </Typography>
            {subLabel && (
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {subLabel}
              </Typography>
            )}
          </>
        )}
        {shouldFetchPlaylists && !subLabel && !isLoggedIn && (
          <Typography sx={{ color: theme.palette.text.secondary }}>
            Log in to see your playlists.
          </Typography>
        )}
        {shouldFetchPlaylists && !subLabel && isLoggedIn && playlists.length === 0 && (
          <Typography sx={{ color: theme.palette.text.secondary }}>
            No playlists yet. Create one to get started.
          </Typography>
        )}
        {shouldFetchPlaylists && !subLabel && isLoggedIn && playlists.length > 0 && (
          <Box sx={{ display: "grid", gap: 3, mt: 2 }}>
            {selectedPlaylist && selectedSongs.length > 0 && (
              <Box
                sx={{
                  width: "100%",
                  minHeight: { xs: 360, md: 420 },
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 4,
                  backgroundColor: theme.palette.background.paper,
                  display: "flex",
                  alignItems: "center",
                  px: { xs: 2, sm: 3, md: 4 },
                  py: { xs: 3, md: 4 },
                }}
              >
                {heroArtwork && (
                  <Box
                    component="img"
                    src={heroArtwork}
                    alt={selectedPlaylist.title}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "blur(38px) brightness(0.35)",
                      transform: "scale(1.1)",
                      zIndex: 0,
                    }}
                  />
                )}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: {
                      xs: "linear-gradient(to bottom, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.85) 100%)",
                      md: "linear-gradient(to right, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.8) 45%, rgba(18,18,18,0.4) 100%)",
                    },
                    zIndex: 1,
                  }}
                />
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "center", md: "center" },
                    gap: { xs: 3, md: 5 },
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 220, sm: 260, md: 280 },
                      height: { xs: 220, sm: 260, md: 280 },
                      flexShrink: 0,
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Box
                      component="img"
                      src={heroArtwork}
                      alt={selectedPlaylist.title}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      color: "white",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: { xs: "center", md: "flex-start" },
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        color: "#E4C421",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        mb: 1,
                      }}
                    >
                      PLAYLIST
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        lineHeight: 1.1,
                        mb: 1.5,
                        background: "linear-gradient(45deg, #fff 20%, #E4C421 80%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {selectedPlaylist.title}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 2 }}>
                      {selectedSongs.length} songs • {formatDuration(totalDurationSeconds)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            {selectedPlaylist && selectedSongs.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "column", md: "row" },
                  justifyContent: "space-between",
                  gap: { xs: 2, md: 0 },
                  px: { xs: 2, sm: 3, md: 4 },
                  py: { xs: 2, md: 3 },
                  backgroundColor: "#121212",
                  borderRadius: 3,
                }}
              >
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <PlayButton
                    handlePrimaryPlay={handlePrimaryPlay}
                    isArtistTrackPlaying={isPlaylistPlaying}
                    playableTrack={primaryTrack}
                  />
                  <ShuffleButton
                    playableTrack={primaryTrack}
                    isShuffled={Boolean(playerState?.shuffle)}
                    onClick={handleShufflePlay}
                  />
                </Box>
                <ActionButtonsGroup
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleSharePlaylist}
                  onMore={handleOpenPlaylistMenu}
                />
              </Box>
            )}

              {selectedPlaylist && selectedSongs.length > 0 && (
                <TrackListSection
                  tracks={songsWithArtwork}
                getId={getId}
                playingId={playingId}
                songId={songId}
                playerIsPlaying={isPlaying}
                isMobile={isMobile}
                onPlayTrack={playPlaylistFromTrack}
                onOpenTrackMenu={handleOpenTrackMenu}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={(track) => handleRemoveSong(track?._id || track?.id)}
                onNavigateTrack={(id) => navigate(`/song/${id}`)}
                onNavigateArtist={(id) => navigate(`/artist/${id}`)}
                onNavigateAlbum={(id) => navigate(`/album/${id}`)}
                formatDuration={formatDuration}
              />
            )}
          </Box>
        )}

      </Box>
      <AddToPlaylistModal
        open={playlistDialogOpen}
        onClose={handleCloseAddToPlaylist}
        track={playlistTrack}
      />

      <ActionMenu
        isMobile={isMobile}
        anchorEl={playlistMenuAnchor}
        open={Boolean(playlistMenuAnchor)}
        onClose={handleClosePlaylistMenu}
        drawerOpen={playlistDrawerOpen}
        onCloseDrawer={handleClosePlaylistMenu}
        items={playlistMenuItems}
      />
      <ActionMenu
        isMobile={isMobile}
        anchorEl={trackMenuAnchor}
        open={!isMobile && Boolean(trackMenuAnchor)}
        onClose={handleCloseTrackMenu}
        drawerOpen={trackDrawerOpen}
        onCloseDrawer={handleCloseTrackMenu}
        items={trackMenuItems}
        menuPaperSx={{
          minWidth: isMobile ? 280 : 220,
          borderRadius: 3,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          maxHeight: "70vh",
          overflow: "auto",
        }}
        drawerTitle={selectedTrack?.title || "Track Options"}
        drawerSubtitle={selectedTrack?.artistName || selectedTrack?.artist?.artistAka || "Unknown Artist"}
      />

    </Box>
  );
}
