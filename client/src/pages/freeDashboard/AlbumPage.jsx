import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApolloClient, useQuery, useMutation } from "@apollo/client";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ShareIcon from "@mui/icons-material/Share";
import ReportIcon from "@mui/icons-material/Report";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";

import { SONGS_OF_ALBUM } from "../../utils/queries";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../../utils/mutations";
import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils";
import { getFullKeyFromUrlOrKey } from "../../utils/someSongsUtils/songsWithPresignedUrlHook";
import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";
import { PlayButton } from "../../components/PlayButton.jsx";
import { ShuffleButton } from "../../components/ShuffleButton.jsx";
import AddToPlaylistModal from "../../components/AddToPlaylistModal.jsx";

export const AlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const client = useApolloClient();
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, isAdPlaying, handlePlaySong, pause, playerState } =
    useAudioPlayer();
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [albumCoverUrl, setAlbumCoverUrl] = useState(null);
  const [isSubtitleHovered, setIsSubtitleHovered] = useState(false);
  const [trackMenuAnchor, setTrackMenuAnchor] = useState(null);
  const [trackDrawerOpen, setTrackDrawerOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [touchTimer, setTouchTimer] = useState(null);
  const [longPressTrack, setLongPressTrack] = useState(null);
  const isMobile = useMediaQuery("(max-width:900px)");



  const { data, loading, error } = useQuery(SONGS_OF_ALBUM, {
    variables: { albumId },
    skip: !albumId,
    fetchPolicy: "cache-first",
  });

console.log('does album has songs?', data);
  const albumMeta = data?.getAlbum || null;
  const albumTitle = albumMeta?.title || "Single";
  const albumArtist = albumMeta?.artist || null;

  const isSingle = useMemo(() => {
    const normalized = String(albumTitle || "").toLowerCase();
    return !normalized || normalized === "unknown" || normalized === "single";
  }, [albumTitle]);

  useEffect(() => {
    const rawCover = albumMeta?.albumCoverImage;
    if (!rawCover) {
      setAlbumCoverUrl(null);
      return;
    }

    const key = getFullKeyFromUrlOrKey(rawCover);
    if (!key) {
      setAlbumCoverUrl(rawCover);
      return;
    }

    let alive = true;
    const presign = async () => {
      try {
        const resp = await getPresignedUrlDownload({
          variables: {
            bucket: "afrofeel-cover-images-for-songs",
            key,
            region: "us-east-2",
          },
        });
        const url = resp?.data?.getPresignedUrlDownload?.url;
        if (alive) setAlbumCoverUrl(url || rawCover);
      } catch {
        if (alive) setAlbumCoverUrl(rawCover);
      }
    };
    presign();

    return () => {
      alive = false;
    };
  }, [albumMeta?.albumCoverImage, getPresignedUrlDownload]);


  const albumSongsRaw = useMemo(() => albumMeta?.songs ?? [], [albumMeta]);
  const albumSongs = useMemo(() => {
    return albumSongsRaw.map((s, index) => ({
      ...s,
      id: s.id || s._id || `${index}`,
      _id: s._id || s.id,
      albumId: albumId || albumMeta?._id || albumMeta?.id || null,
      albumName: albumTitle,
      artist: albumArtist,
      artistId: albumArtist?._id || albumArtist?.id || null,
      artistName: albumArtist?.artistAka || "Unknown Artist",
      artwork: s.artwork || null,
      plays: s.playCount ?? s.plays ?? 0,
      playCount: s.playCount ?? s.plays ?? 0,
      duration: s.duration ?? 0,
    }));
  }, [albumSongsRaw, albumId, albumMeta, albumTitle, albumArtist]);

  const { songsWithArtwork } = useSongsWithPresignedUrls(albumSongs);
  const processedAlbumSongs = useMemo(
    () => processSongs(songsWithArtwork || []),
    [songsWithArtwork]
  );

  const getId = useCallback((obj) => String(obj?.id || obj?._id || obj?.songId || ""), []);
  const playableTrack = processedAlbumSongs?.[0] || null;
  const playingId = useMemo(() => getId(currentTrack), [currentTrack, getId]);
  const selectedTrackId = useMemo(() => getId(selectedTrack), [selectedTrack, getId]);
  const playableId = useMemo(() => getId(playableTrack), [playableTrack, getId]);
  const isSongPlaying = Boolean(playableTrack && playableId && playingId === playableId && isPlaying);
  const isSelectedTrackCurrent = useMemo(
    () => Boolean(selectedTrackId && playingId && selectedTrackId === playingId),
    [selectedTrackId, playingId]
  );
  const playContextSongs = useMemo(() => processedAlbumSongs || [], [processedAlbumSongs]);
  const isShuffled = Boolean(playerState?.shuffle);

  const handlePrimaryPlay = useCallback(async () => {
    if (!playableTrack) return;
    if (isAdPlaying) return;
    if (isSongPlaying) {
      pause();
      return;
    }
    await handleTrendingSongPlay({
      song: playableTrack,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: playContextSongs,
      client,
    });
  }, [
    playableTrack,
    isAdPlaying,
    isSongPlaying,
    pause,
    incrementPlayCount,
    handlePlaySong,
    playContextSongs,
    client,
  ]);

  const handlePlayAlbumSong = useCallback(
    async (track) => {
      if (!track) return;
      const trackId = getId(track);
      if (trackId && playingId && trackId === playingId && isPlaying) {
        pause();
        return;
      }
      await handleTrendingSongPlay({
        song: track,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: playContextSongs,
        client,
      });
    },
    [getId, playingId, isPlaying, pause, incrementPlayCount, handlePlaySong, playContextSongs, client]
  );

  const handleAddToFavorites = useCallback((track) => {
    if (!track) return;
    console.log("Add to favorites", getId(track));
  }, [getId]);

  const handleAddToPlaylist = useCallback((track) => {
    if (!track) return;
    setPlaylistTrack(track);
    setPlaylistDialogOpen(true);
  }, []);

  const handlePlayNext = useCallback((track) => {
    if (!track) return;
    console.log("Play next:", track.title);
  }, []);

  const handleShareTrack = useCallback((track) => {
    if (!track) return;
    console.log("Share track:", track.title);
  }, []);

  const handleReportTrack = useCallback((track) => {
    if (!track) return;
    console.log("Report track:", track.title);
  }, []);

  const handleTouchStart = useCallback(
    (track, e) => {
      const timer = setTimeout(() => {
        setSelectedTrack(track);
        setLongPressTrack(track);
        if (isMobile) {
          setTrackDrawerOpen(true);
          setTrackMenuAnchor(null);
        } else {
          setTrackMenuAnchor(e.currentTarget);
        }
      }, 500);
      setTouchTimer(timer);
    },
    [isMobile]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  const formatDuration = useCallback((duration) => {
    if (!duration) return "--:--";
    if (typeof duration === "string") return duration;
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, []);

  const handleCloseTrackDrawer = useCallback(() => {
    setTrackDrawerOpen(false);
    setLongPressTrack(null);
    setSelectedTrack(null);
  }, []);

  const MarqueeText = ({ text, hovered, variant = "subtitle2", sx = {}, duration = "10s" }) => (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "1.8em",
        ...sx,
      }}
      onMouseEnter={() => hovered?.set(true)}
      onMouseLeave={() => hovered?.set(false)}
    >
      {!hovered?.value && (
        <Typography variant={variant} sx={{ pr: 4 }}>
          {text}
        </Typography>
      )}
      {hovered?.value && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            willChange: "transform",
            animation: `titleMarquee ${duration} linear infinite`,
            "@keyframes titleMarquee": {
              "0%": { transform: "translateX(0)" },
              "100%": { transform: "translateX(-50%)" },
            },
          }}
        >
          <Typography variant={variant} sx={{ pr: 4 }}>
            {text}
          </Typography>
          <Typography variant={variant} aria-hidden="true" sx={{ pr: 4 }}>
            {text}
          </Typography>
        </Box>
      )}
    </Box>
  );

  const subtitleValue = `${isSingle ? "Single" : "Album"} • ${
    albumArtist?.artistAka || "Unknown Artist"
  }`;

  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
        <rect width="600" height="600" fill="#1a1a1a"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#ffffff" font-size="28" font-family="Arial">No Cover</text>
      </svg>`
    );

  const heroCover =
    albumCoverUrl ||
    processedAlbumSongs?.[0]?.artworkUrl ||
    processedAlbumSongs?.[0]?.artwork ||
    FALLBACK;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "white" }}>Loading album…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "white" }}>Failed to load album. {error.message}</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Hero Section */}
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
          src={heroCover}
          alt={albumTitle || "Album cover"}
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
              src={heroCover}
              alt={albumTitle || "Album cover"}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              {isSingle ? "SINGLE" : "ALBUM"}
            </Typography>

            <Typography
              variant="h1"
              onClick={() => {
                if (albumId) {
                  navigate(`/album/${albumId}`);
                }
              }}
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
                cursor: albumId ? "pointer" : "default",
                "&:hover": {
                  textDecoration: albumId ? "underline" : "none",
                },
              }}
              title={albumTitle || ""}
            >
              {isSingle ? "Single" : albumTitle}
            </Typography>

            <Box sx={{ width: "100%", mb: { xs: 2, md: 3 }, maxWidth: { xs: "100%", md: "90%" } }}>
              <MarqueeText
                text={subtitleValue}
                hovered={{ value: isSubtitleHovered, set: setIsSubtitleHovered }}
                variant="h5"
                duration="12s"
                sx={{
                  height: { xs: "1.8em", sm: "2em" },
                  textAlign: { xs: "center", md: "left" },
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                justifyContent: { xs: "center", md: "flex-start" },
              }}
            >
              <Typography
                onClick={() => {
                  const artistId = albumArtist?._id || albumArtist?.id;
                  if (artistId) navigate(`/artist/${artistId}`);
                }}
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: albumArtist?._id || albumArtist?.id ? "pointer" : "default",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {albumArtist?.artistAka || "Unknown Artist"}
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
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <PlayButton
            handlePrimaryPlay={handlePrimaryPlay}
            isArtistTrackPlaying={isSongPlaying}
            playableTrack={playableTrack}
          />
          <ShuffleButton playableTrack={playableTrack} isShuffled={isShuffled} />
        </Box>
      </Box>

      {/* Tracks Section */}
      {processedAlbumSongs.length > 0 && (
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
            {["#", "Title", "Album", "Plays", "Duration", "Add", "More"].map((label) => (
              <Typography
                key={label}
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  textAlign: label === "Add" || label === "More" ? "center" : "left",
                }}
              >
                {label}
              </Typography>
            ))}
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
            {processedAlbumSongs.map((track, index) => {
              const trackId = getId(track);
              const isCurrent = playingId && trackId && playingId === trackId;
              const thumbnail =
                track.thumbnail ||
                track.artwork ||
                track.artworkUrl ||
                track.albumCoverImageUrl ||
                track.cover;

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
                    bgcolor: { xs: "background.paper", md: "transparent" },
                    mb: { xs: 1, md: 0 },
                    transition: "all 0.25s",
                    "&:hover": {
                      bgcolor: { xs: "action.hover", md: "action.hover" },
                      transform: { xs: "translateX(4px)", md: "none" },
                      "& .album-thumb-overlay": {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    },
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color: index < 3 ? "primary.main" : "text.secondary",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      textAlign: "center",
                      minWidth: 24,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbumSong(track);
                      }}
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                        flexShrink: 0,
                        position: "relative",
                        cursor: "pointer",
                        "&:hover .album-thumb-overlay": {
                          opacity: 1,
                          transform: "translateY(0)",
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={thumbnail || FALLBACK}
                        alt={track.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <Box
                        className="album-thumb-overlay"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          opacity: 0,
                          transform: "translateY(6px)",
                          transition: "all 0.2s ease",
                          backgroundColor: "rgba(0,0,0,0.35)",
                        }}
                      >
                        <IconButton
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            "&:hover": { bgcolor: theme.palette.primary.main },
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        onClick={() => {
                          if (trackId) {
                            navigate(`/song/${trackId}`, { state: { song: track } });
                          }
                        }}
                        sx={{
                          color: "text.primary",
                          fontWeight: 700,
                          fontSize: "1rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: trackId ? "pointer" : "default",
                          "&:hover": {
                            color: trackId ? "primary.main" : "text.primary",
                            textDecoration: trackId ? "underline" : "none",
                          },
                        }}
                      >
                        {track.title}
                      </Typography>
                      <Typography
                        onClick={() => {
                          const artistId = albumArtist?._id || albumArtist?.id;
                          if (artistId) navigate(`/artist/${artistId}`);
                        }}
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: albumArtist?._id || albumArtist?.id ? "pointer" : "default",
                          "&:hover": {
                            color: albumArtist?._id || albumArtist?.id ? "primary.main" : "text.secondary",
                            textDecoration: albumArtist?._id || albumArtist?.id ? "underline" : "none",
                          },
                        }}
                      >
                        {track.artistName || albumArtist?.artistAka || "Unknown Artist"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: { xs: "none", md: "block" }, px: 2, overflow: "hidden" }}>
                    <Typography
                      onClick={() => {
                        if (albumId) {
                          navigate(`/album/${albumId}`);
                        }
                      }}
                      sx={{
                        color: "text.primary",
                        fontSize: "1rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 500,
                        cursor: albumId ? "pointer" : "default",
                        "&:hover": {
                          color: albumId ? "primary.main" : "text.primary",
                          textDecoration: albumId ? "underline" : "none",
                        },
                      }}
                    >
                      {albumTitle}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", px: 2 }}>
                    <Typography
                      sx={{
                        color: "text.primary",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {(track.playCount ?? track.plays ?? 0).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", md: "block" }, px: 2 }}>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.95rem",
                        fontWeight: 500,
                      }}
                    >
                      {formatDuration(track.duration)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
                    <IconButton
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(track);
                      }}
                      sx={{
                        color: "text.secondary",
                        backgroundColor: "action.hover",
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: "primary.main",
                          backgroundColor: "rgba(228,196,33,0.15)",
                          transform: "scale(1.1) rotate(90deg)",
                        },
                      }}
                    >
                      <AddIcon sx={{ fontSize: "1.4rem" }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
                    <IconButton
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrack(track);
                        setTrackMenuAnchor(e.currentTarget);
                      }}
                      sx={{
                        color: "text.secondary",
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: "text.primary",
                          backgroundColor: "action.hover",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <MoreHorizIcon sx={{ fontSize: "1.6rem" }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center" }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbumSong(track);
                      }}
                      sx={{
                        color: isCurrent && isPlaying ? "primary.main" : "text.secondary",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "action.hover",
                        "&:hover": {
                          color: "primary.main",
                          backgroundColor: "rgba(228,196,33,0.15)",
                        },
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <PauseIcon sx={{ fontSize: "1.2rem" }} />
                      ) : (
                        <PlayArrowIcon sx={{ fontSize: "1.2rem" }} />
                      )}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center" }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrack(track);
                        if (isMobile) {
                          setTrackDrawerOpen(true);
                          setTrackMenuAnchor(null);
                        } else {
                          setTrackMenuAnchor(e.currentTarget);
                        }
                      }}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "action.hover",
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          backgroundColor: "rgba(228,196,33,0.15)",
                        },
                      }}
                    >
                      <MoreHorizIcon sx={{ fontSize: "1.4rem" }} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {!processedAlbumSongs.length && (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 6 }}>
          <Typography sx={{ color: "text.secondary" }}>No tracks found.</Typography>
        </Box>
      )}

      {/* Track Options Dropdown Menu */}
      <Menu
        anchorEl={trackMenuAnchor}
        open={!isMobile && Boolean(trackMenuAnchor)}
        onClose={() => {
          setTrackMenuAnchor(null);
          setLongPressTrack(null);
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#181818",
            color: "#fff",
            minWidth: isMobile ? 280 : 220,
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            maxHeight: "70vh",
            overflow: "auto",
          },
        }}
        transformOrigin={{
          horizontal: isMobile ? "center" : "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: isMobile ? "center" : "right",
          vertical: "bottom",
        }}
      >
        {isMobile && selectedTrack && (
          <>
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {selectedTrack?.title || "Track Options"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.7 }}>
                {selectedTrack?.artistName || "Unknown Artist"}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2 }} />
          </>
        )}

        <MenuItem
          onClick={() => {
            if (selectedTrack) handlePlayAlbumSong(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            {isSelectedTrackCurrent && isPlaying ? (
              <PauseIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            ) : (
              <PlayArrowIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            )}
            {isSelectedTrackCurrent && isPlaying ? "Pause" : "Play"}
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTrack) handleAddToFavorites(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <FavoriteBorderIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            Add to Favorites
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTrack) handleAddToPlaylist(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <PlaylistAddIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            Add to Playlist
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTrack) handlePlayNext(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <SkipNextIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            Play Next
          </Box>
        </MenuItem>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />

        <MenuItem
          onClick={() => {
            if (selectedTrack) handleShareTrack(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <ShareIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            Share
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedTrack) {
              const artistId = selectedTrack.artistId || selectedTrack?.artist?._id;
              if (artistId) navigate(`/artist/${artistId}`);
            }
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <PersonIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
            Go to Artist
          </Box>
        </MenuItem>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />

        <MenuItem
          onClick={() => {
            if (selectedTrack) handleReportTrack(selectedTrack);
            setTrackMenuAnchor(null);
          }}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: 500,
            color: "#ff6b6b",
            "&:hover": { backgroundColor: "rgba(255,107,107,0.1)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <ReportIcon sx={{ color: "#ff6b6b" }} />
            Report Track
          </Box>
        </MenuItem>
      </Menu>

      {/* Track options drawer (mobile) */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={trackDrawerOpen}
          onClose={handleCloseTrackDrawer}
          PaperProps={{
            sx: {
              maxHeight: "70vh",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "#181818",
              color: "#fff",
            },
          }}
        >
          <Box sx={{ p: 2, pt: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 6,
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 3,
                mx: "auto",
                mb: 3,
              }}
            />

            {selectedTrack && (
              <Box sx={{ mb: 2, px: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {selectedTrack.title || "Track Options"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {selectedTrack.artistName || selectedTrack?.artist?.artistAka || "Unknown Artist"}
                </Typography>
              </Box>
            )}

            <List sx={{ py: 0 }}>
              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handlePlayAlbumSong(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  {isSelectedTrackCurrent && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={isSelectedTrackCurrent && isPlaying ? "Pause" : "Play"}
                  primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }}
                />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handleAddToFavorites(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  <FavoriteBorderIcon />
                </ListItemIcon>
                <ListItemText primary="Add to Favorites" primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handleAddToPlaylist(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  <PlaylistAddIcon />
                </ListItemIcon>
                <ListItemText primary="Add to Playlist" primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handlePlayNext(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  <SkipNextIcon />
                </ListItemIcon>
                <ListItemText primary="Play Next" primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }} />
              </ListItem>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handleShareTrack(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText primary="Share" primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }} />
              </ListItem>

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) {
                    const artistId = selectedTrack.artistId || selectedTrack?.artist?._id;
                    if (artistId) navigate(`/artist/${artistId}`);
                  }
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.75)", minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Go to Artist" primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 600 } }} />
              </ListItem>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />

              <ListItem
                button
                onClick={() => {
                  if (selectedTrack) handleReportTrack(selectedTrack);
                  handleCloseTrackDrawer();
                }}
                sx={{ borderRadius: 2, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,107,107,0.12)" } }}
              >
                <ListItemIcon sx={{ color: "#ff6b6b", minWidth: 40 }}>
                  <ReportIcon />
                </ListItemIcon>
                <ListItemText primary="Report Track" primaryTypographyProps={{ sx: { color: "#ff6b6b", fontWeight: 600 } }} />
              </ListItem>
            </List>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseTrackDrawer}
              sx={{
                mt: 1.5,
                color: "rgba(255,255,255,0.85)",
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.5)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Drawer>
      )}
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

