

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApolloClient, useQuery } from "@apollo/client";
import { SongCard } from "./otherSongsComponents/songCard.jsx";



import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Icons
import Description from "@mui/icons-material/Description";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ReportIcon from '@mui/icons-material/Report';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

// Hooks & Utils
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../utils/handlePlayCount";
import { SONG_BY_ID, SONGS_OF_ALBUM } from "../utils/queries";
import { useSongsWithPresignedUrls } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";
import { handleTrendingSongPlay } from "../utils/plabackUtls/handleSongPlayBack.js";
import { useScrollNavigation } from "../utils/someSongsUtils/scrollHooks.js";
import { similarSongsUtil } from "../utils/someSongsUtils/similarSongsHook.js";

// Components
import { PlayButton } from "./PlayButton";
import AddToPlaylistModal from "./AddToPlaylistModal.jsx";
import { ActionButtonsGroup } from "./ActionButtonsGroup.jsx";
import { ActionMenu } from "./ActionMenu.jsx";
import { TrackListSection } from "./TrackListSection.jsx";

export const SingleSongPage = () => {
  // Audio player context
  const {
    currentTrack: playingTrack,
    isPlaying: playerIsPlaying,
    isAdPlaying,
    handlePlaySong,
    pause,
    playerState,
  } = useAudioPlayer();

  const navigate = useNavigate();
  const client = useApolloClient();
  const { incrementPlayCount } = usePlayCount();

  // State
  const [isSubtitleHovered, setIsSubtitleHovered] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackMenuAnchor, setTrackMenuAnchor] = useState(null);
  const [trackDrawerOpen, setTrackDrawerOpen] = useState(false);
  const [touchTimer, setTouchTimer] = useState(null);
  const [longPressTrack, setLongPressTrack] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);


  const isMobile = useMediaQuery("(max-width:900px)");
  const { songId, albumId } = useParams();
  const location = useLocation();

const theme = useTheme();

  const {
    scrollContainerRef: recommendedScrollContainerRef,
    showLeftArrow: showRecommendedLeftArrow,
    showRightArrow: showRecommendedRightArrow,
    showAll: showAllRecommended,
    handleWheel: handleRecommendedWheel,
    handleNavClick: handleRecommendedNavClick,
    checkScrollPosition: checkRecommendedScrollPosition,
    handleShowAll: handleShowAllRecommended,
  } = useScrollNavigation();

  // -----------------------
  // Helper Functions
  // -----------------------
  const getId = useCallback((obj) => {
    if (!obj) return "";
    return String(obj.id || obj._id || obj.songId || "");
  }, []);

  const normalizeId = useCallback((value) => {
    if (!value) return null;
    if (typeof value === "object") return value._id || value.id || null;
    const str = String(value);
    if (str.includes("[object Object]")) return null;
    return str;
  }, []);

  const isCloudFrontExpired = useCallback((url, leewaySec = 60) => {
    if (!url) return true;
    try {
      const u = new URL(url);
      const exp = Number(u.searchParams.get("Expires"));
      if (!exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return exp <= now + leewaySec;
    } catch {
      return true;
    }
  }, []);

  const formatDuration = useCallback((duration) => {
    if (!duration) return '--:--';
    
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (typeof duration === 'string') {
      return duration;
    }
    
    return '--:--';
  }, []);

  // const getFullKeyFromUrlOrKey = useCallback((value) => {
  //   if (!value || typeof value !== "string") return null;
  //   if (!value.startsWith("http://") && !value.startsWith("https://")) {
  //     return value.replace(/^\/+/, "");
  //   }
  //   try {
  //     const u = new URL(value);
  //     return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  //   } catch {
  //     return null;
  //   }
  // }, []);

  // -----------------------
  // 1) Song from navigation state
  // -----------------------
  const songFromStateRaw = location.state?.song ?? null;

  const songFromState = useMemo(() => {
    if (!songFromStateRaw) return null;
    const stateId = getId(songFromStateRaw);
    if (!stateId) return null;
    return String(stateId) === String(songId) ? songFromStateRaw : null;
  }, [songFromStateRaw, songId, getId]);

  const stateHasFreshSignedArtwork = useMemo(() => 
    !isCloudFrontExpired(songFromState?.artworkUrl),
    [songFromState, isCloudFrontExpired]
  );

  const skipSongFetch = Boolean(songFromState && stateHasFreshSignedArtwork);

  // -----------------------
  // 2) Fetch song by ID
  // -----------------------
  const { loading, error, data } = useQuery(SONG_BY_ID, {
    variables: { songId },
    skip: skipSongFetch,
    fetchPolicy: "cache-first",
  });

  const fallbackSong = data?.publicSong ?? null;
  const fallbackSongs = useMemo(() => (fallbackSong ? [fallbackSong] : []), [fallbackSong]);

  // -----------------------
  // 3) Process song with presigned URLs
  // -----------------------
  const { songsWithArtwork } = useSongsWithPresignedUrls(fallbackSongs);
  const processedSongFetched = useMemo(() => {
    const processed = processSongs(songsWithArtwork);
    return processed?.[0] || null;
  }, [songsWithArtwork]);

  // -----------------------
  // 4) Resolve album ID
  // -----------------------
  const resolvedAlbumId = useMemo(() => {
    const candidates = [
      albumId,
      songFromState?.albumId,
      songFromState?.album?._id,
      songFromState?.album?.id,
      songFromState?.album,
      processedSongFetched?.albumId,
      processedSongFetched?.album?._id,
      processedSongFetched?.album?.id,
      processedSongFetched?.album,
    ];
    const normalized = candidates.map(normalizeId).filter(Boolean);
    return normalized[0] || null;
  }, [albumId, songFromState, processedSongFetched, normalizeId]);

  // -----------------------
  // 5) Fetch album songs
  // -----------------------
  const { data: albumSongsData } = useQuery(SONGS_OF_ALBUM, {
    variables: { albumId: resolvedAlbumId },
    skip: !resolvedAlbumId,
    fetchPolicy: "cache-first",
  });

  const albumSongsRaw = useMemo(() => albumSongsData?.getAlbum?.songs ?? [], [albumSongsData]);
  
  const albumSongs = useMemo(() => {
    const albumMeta = albumSongsData?.getAlbum;
    const albumIdFromResponse = albumMeta?._id || albumMeta?.id || null;
    const albumArtist = albumMeta?.artist ? {
      ...albumMeta.artist,
      _id: albumMeta.artist._id || albumMeta.artist.id,
      id: albumMeta.artist.id || albumMeta.artist._id,
      artistAka: albumMeta.artist.artistAka,
    } : null;

    return albumSongsRaw.map((s) => ({
      ...s,
      _id: s._id || s.id,
      id: s.id || s._id,
      albumId: s.albumId || albumIdFromResponse,
      album: s.album || albumMeta,
      artistId: s.artistId || s.artist?._id || s.artist?.id || albumArtist?._id || albumArtist?.id || null,
      artist: s.artist || albumArtist || null,
      artistName: s.artistName || s.artist?.artistAka || albumArtist?.artistAka || "Unknown Artist",
      artwork: s.artwork || s.artworkUrl || s.artworkPresignedUrl || null,
      artworkKey: s.artworkKey || null,
      albumCoverImageUrl: albumMeta?.albumCoverImage || null,
      cover: s.cover || null,
      streamAudioFileUrl: s.streamAudioFileUrl || s.audioUrl || null,
      audioUrl: s.audioUrl || s.streamAudioFileUrl || s.audioFileUrl || null,
      artistFollowers: s.artistFollowers || albumArtist?.followerCount || albumMeta?.artist?.followerCount || 0,
      plays: s.playCount ?? s.plays ?? 0,
      playCount: s.playCount ?? s.plays ?? 0,
      duration: s.duration ?? 0,
      releaseYear: s.releaseDate ? new Date(s.releaseDate).getFullYear() : null,
      genre: s.genre || "",
      mood: s.mood || [],
      fullOriginal: {
        ...s,
        artist: s.artist || albumArtist || null,
        album: s.album || albumMeta || null,
      },
    }));
  }, [albumSongsRaw, albumSongsData]);

  const { songsWithArtwork: albumSongsWithArtwork } = useSongsWithPresignedUrls(albumSongs);
  const processedAlbumSongs = useMemo(
    () => processSongs(albumSongsWithArtwork || []),
    [albumSongsWithArtwork]
  );

  const { songsWithArtwork: recommendedSongsWithArtwork } =
    useSongsWithPresignedUrls(recommendedSongs);
  const processedRecommendedSongs = useMemo(
    () => processSongs(recommendedSongsWithArtwork || []),
    [recommendedSongsWithArtwork]
  );
  const popularSongs = useMemo(() => {
    const source = processedAlbumSongs?.length
      ? processedAlbumSongs
      : processedRecommendedSongs;
    const filtered = (source || []).filter((track) => {
      const trackId = getId(track);
      return trackId && String(trackId) !== String(songId);
    });
    return filtered
      .slice()
      .sort((a, b) => {
        const playsA = Number(a.playCount ?? a.plays ?? 0);
        const playsB = Number(b.playCount ?? b.plays ?? 0);
        return playsB - playsA;
      })
      .slice(0, 10);
  }, [processedAlbumSongs, processedRecommendedSongs, getId, songId]);

  // -----------------------
  // 6) Final song for rendering
  // -----------------------
  const song = processedSongFetched || songFromState || null;

  // -----------------------
  // 7) Artwork
  // -----------------------
  const artwork = useMemo(() => {
    if (!song) return null;
    return (
      song.artworkUrl ||
      song.artworkPresignedUrl ||
      song.artwork ||
      song.cover ||
      song.image ||
      null
    );
  }, [song]);

  // -----------------------
  // 8) Playable track
  // -----------------------
  const playableTrack = useMemo(() => {
    if (!song) return null;
// console.log('see song again:,', song)
    const id = getId(song);
    const artistId = String(song.artistId || song.artist?._id || song.artist || "");
    const resolvedAlbumId = String(song.albumId || song.album?._id || song.album || albumId || "");
    const audioUrl = song.audioUrl || song.streamAudioFileUrl || song.audioFileUrl || null;

    return {
      ...song,
      id,
      artistId,
      albumId: resolvedAlbumId,
      audioUrl,
      artworkUrl: artwork || song.artworkUrl || song.artworkPresignedUrl || song.artwork || null,
      fullOriginal: song.fullOriginal || song,
    };
  }, [song, artwork, albumId, getId]);

  const playingId = useMemo(() => getId(playingTrack), [playingTrack, getId]);
  const playableId = useMemo(() => getId(playableTrack), [playableTrack, getId]);
  const selectedTrackId = useMemo(() => getId(selectedTrack), [selectedTrack, getId]);
  const isSelectedTrackCurrent = useMemo(
    () => Boolean(selectedTrackId && playingId && selectedTrackId === playingId),
    [selectedTrackId, playingId]
  );

  const isSongPlaying = Boolean(
    playableTrack && playableId && playingId === playableId && playerIsPlaying
  );

  const playContextSongs = useMemo(() => {
    if (processedAlbumSongs?.length) return processedAlbumSongs;
    return playableTrack ? [playableTrack] : [];
  }, [processedAlbumSongs, playableTrack]);

  // -----------------------
useEffect(() => {
  checkRecommendedScrollPosition();
  window.addEventListener("resize", checkRecommendedScrollPosition);
  return () => window.removeEventListener("resize", checkRecommendedScrollPosition);
}, [checkRecommendedScrollPosition, processedRecommendedSongs.length]);

useEffect(() => {
  let alive = true;
  if (!songId) {
    setRecommendedSongs([]);
    return;
  }

  const fetchSimilar = async () => {
    setRecommendedLoading(true);
    const pack = await similarSongsUtil(client, songId);
    if (!alive) return;
    const normalized = Array.isArray(pack?.songs) ? pack.songs : [];
    const filtered = normalized.filter((s) => String(getId(s)) !== String(songId));
    setRecommendedSongs(filtered);
    setRecommendedLoading(false);
  };

  fetchSimilar();

  return () => {
    alive = false;
  };
}, [client, songId, getId]);




  // -----------------------


  // 9) Display fields
  // -----------------------
  const albumName = song?.albumName || song?.album?.title || null;

  const displayText = song?.title || "Song";
  const subtitleValue = song?.artistName || song?.artist?.artistAka || "Unknown Artist";
  const downloadCount = Number(song?.downloadCount ?? song?.downloads ?? song?.artistDownloadCounts ?? 0);
  const shareCount = Number(song?.shareCount ?? song?.shares ?? 0);
  const playCount = Number(song?.playCount ?? song?.plays ?? 0);

  const FALLBACK = useMemo(() =>
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

  // -----------------------
  // 10) Handlers
  // -----------------------
  const handlePrimaryPlay = useCallback(async () => {
    if (!playableTrack) return;

    if (isAdPlaying) {
      console.warn("Ad is playing, waiting to start the song.");
      return;
    }

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


  const handlePlayAlbumSong = useCallback(async (track) => {
    if (!track) return;

    const trackId = getId(track);
    const currentId = getId(playingTrack);

    if (trackId && currentId && trackId === currentId && playerIsPlaying) {
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
  }, [client, handlePlaySong, incrementPlayCount, playContextSongs, getId, playingTrack, playerIsPlaying, pause]);

  const handleShare = useCallback(() => {
    if (!songId) return;

    const shareUrl = `${window.location.origin}/album/${albumId || "album"}/${songId}`;
    const title = song?.title || "Song";
    const text =  song?.artist?.artistAka || "Listen to this track";

    const shareFallback = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log("Link copied to clipboard");
      } catch (err) {
        console.warn("Share failed", err);
      }
    };

    if (navigator?.share) {
      navigator.share({ title, text, url: shareUrl }).catch((err) => {
        console.warn("Native share failed", err);
      });
    } else {
      shareFallback();
    }
  }, [songId, albumId, song]);

  const handleAddToFavorites = useCallback(() => {
    if (!song) return;
    setIsFavorite(!isFavorite);
    console.log("Add to favorites", getId(song));
  }, [song, getId, isFavorite]);

  const handleAddToPlaylist = useCallback((track) => {
    if (!track) return;
    setPlaylistTrack(track);
    setPlaylistDialogOpen(true);
  }, []);

  const handlePlayNext = useCallback((track) => {
    console.log('Play next:', track.title);
    // Implement play next logic
  }, []);

  const handleShareTrack = useCallback((track) => {
    console.log('Share track:', track.title);
    // Implement track sharing logic
  }, []);

  const handleReportTrack = useCallback((track) => {
    console.log('Report track:', track.title);
    // Implement report logic
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((track, e) => {
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
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  // -----------------------
  // 11) Menu handlers
  // -----------------------
  const handleOpenMenu = (event) => {
    if (isMobile) {
      setDrawerOpen(true);
      return;
    }
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);
  const handleCloseDrawer = () => setDrawerOpen(false);
  const handleCloseTrackDrawer = () => {
    setTrackDrawerOpen(false);
    setLongPressTrack(null);
    setSelectedTrack(null);
  };

  const handleOpenTrackMenu = useCallback(
    (track, event) => {
      event?.stopPropagation();
      if (!track) return;
      setSelectedTrack(track);
      if (isMobile) {
        setTrackDrawerOpen(true);
        setTrackMenuAnchor(null);
      } else {
        setTrackMenuAnchor(event?.currentTarget || null);
      }
    },
    [isMobile]
  );

  const mainMenuItems = useMemo(
    () => [
      { icon: <Description />, label: "Play now", onClick: handlePrimaryPlay, fontWeight: 400 },
      { icon: <SkipNextIcon />, label: "Play next", onClick: () => console.log("Play next clicked"), fontWeight: 400 },
      { icon: <ShareIcon />, label: "Share", onClick: handleShare, fontWeight: 400 },
    ],
    [handlePrimaryPlay, handleShare]
  );

  const trackMenuItems = useMemo(() => {
    const isPlayingSelected = isSelectedTrackCurrent && playerIsPlaying;
    return [
      {
        icon: isPlayingSelected ? <PauseIcon sx={{ color: "rgba(255,255,255,0.7)" }} /> : <PlayArrowIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: isPlayingSelected ? "Pause" : "Play",
        onClick: () => selectedTrack && handlePlayAlbumSong(selectedTrack),
      },
      {
        icon: <FavoriteBorderIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Add to Favorites",
        onClick: () => selectedTrack && handleAddToFavorites(selectedTrack),
      },
      {
        icon: <PlaylistAddIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Add to Playlist",
        onClick: () => selectedTrack && handleAddToPlaylist(selectedTrack),
      },
      {
        icon: <SkipNextIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Play Next",
        onClick: () => selectedTrack && handlePlayNext(selectedTrack),
      },
      { type: "divider" },
      {
        icon: <ShareIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Share",
        onClick: () => selectedTrack && handleShareTrack(selectedTrack),
      },
      {
        icon: <PersonIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Go to Artist",
        onClick: () => {
          const artistId = selectedTrack?.artistId || selectedTrack?.artist?._id;
          if (artistId) navigate(`/artist/${artistId}`);
        },
      },
      { type: "divider" },
      {
        icon: <ReportIcon sx={{ color: "#ff6b6b" }} />,
        label: "Report Track",
        onClick: () => selectedTrack && handleReportTrack(selectedTrack),
        color: "#ff6b6b",
        hoverBg: "rgba(255,107,107,0.1)",
      },
    ];
  }, [
    handleAddToFavorites,
    handleAddToPlaylist,
    handlePlayAlbumSong,
    handlePlayNext,
    handleReportTrack,
    handleShareTrack,
    isSelectedTrackCurrent,
    navigate,
    playerIsPlaying,
    selectedTrack,
  ]);

  // Marquee Text Component
  const MarqueeText = ({ text, hovered, variant = "subtitle2", sx = {}, duration = "10s" }) => (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        height: "1.6em",
        ...sx,
      }}
      title={text || ""}
      onMouseEnter={() => setIsSubtitleHovered(true)}
      onMouseLeave={() => setIsSubtitleHovered(false)}
    >
      {!hovered && (
        <Typography
          variant={variant}
          noWrap
          sx={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text || ""}
        </Typography>
      )}

      {hovered && (
        <Box
          sx={{
            maxWidth: "100%",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            willChange: "transform",
            transform: "translateZ(0)",
            animation: `marquee ${duration} linear infinite`,
            "@keyframes marquee": {
              "0%": { transform: "translateX(0)" },
              "100%": { transform: "translateX(-50%)" },
            },
          }}
        >
          <Typography variant={variant} sx={{ pr: 4 }}>
            {text || ""}
          </Typography>
          <Typography variant={variant} aria-hidden="true" sx={{ pr: 4 }}>
            {text || ""}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // -----------------------
  // 12) Loading / error states
  // -----------------------
  if (!songFromState && loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "white" }}>Loading song…</Typography>
      </Box>
    );
  }

  if (!songFromState && error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "white" }}>
          Failed to load song. {error.message}
        </Typography>
      </Box>
    );
  }

  if (!song) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: "white" }}>
          Song not found for id: {songId}
        </Typography>
      </Box>
    );
  }


  // -----------------------
  // 13) RENDER
  // -----------------------
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
        {/* Blurred Background */}
        {artwork && (
          <Box
            component="img"
            src={artwork}
            alt={song?.title || "Song cover"}
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
        )}

        {/* Gradient Overlay */}
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

        {/* Content */}
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
          {/* Artwork */}
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
              src={artwork || FALLBACK}
              alt={song?.title || "Song cover"}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = FALLBACK;
              }}
            />
          </Box>

          {/* Text Content */}
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
              SONG
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
              title={displayText || ""}
            >
              {displayText || ""}
            </Typography>

            <Box sx={{ width: "100%", mb: { xs: 2, md: 3 }, maxWidth: { xs: "100%", md: "90%" } }}>
              <MarqueeText
                text={subtitleValue}
                hovered={isSubtitleHovered}
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
                gap: 2,
                flexWrap: "wrap",
                justifyContent: { xs: "center", md: "flex-start" },
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
              }}
            >
              <Typography sx={{ color: "inherit" }}>
                Plays {Number.isFinite(playCount) ? playCount.toLocaleString() : "0"}
              </Typography>
              <Typography sx={{ color: "inherit" }}>
                Downloads {Number.isFinite(downloadCount) ? downloadCount.toLocaleString() : "0"}
              </Typography>
              <Typography sx={{ color: "inherit" }}>
                Shares {Number.isFinite(shareCount) ? shareCount.toLocaleString() : "0"}
              </Typography>
            </Box>
          </Box>

          {/* Artist Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.08)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {song?.artistProfileImage ? (
                <Box
                  component="img"
                  src={song.artistProfileImage}
                  alt={song.artistName || "Artist"}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                  N/A
                </Typography>
              )}
            </Box>

            <Typography
              onClick={() => {
                const artistId = song?.artistId || song?.artist?._id || song?.artist;
                if (artistId) navigate(`/artist/${artistId}`);
              }}
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                fontSize: "1rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: song?.artistId || song?.artist ? "pointer" : "default",
                "&:hover": { color: "primary.main" },
              }}
            >
              {song?.artistName || song?.artist?.artistAka || "Unknown Artist"}
            </Typography>
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
          <PlayButton
            handlePrimaryPlay={handlePrimaryPlay}
            isArtistTrackPlaying={isSongPlaying}
            playableTrack={playableTrack}
          />

        </Box>

        <ActionButtonsGroup
          isFavorite={isFavorite}
          onToggleFavorite={handleAddToFavorites}
          onShare={handleShare}
          onMore={handleOpenMenu}
        />
      </Box>
      <ActionMenu
        isMobile={isMobile}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        drawerOpen={drawerOpen}
        onCloseDrawer={handleCloseDrawer}
        items={mainMenuItems}
      />

      <TrackListSection
        tracks={processedAlbumSongs}
        getId={getId}
        playingId={playingId}
        songId={songId}
        playerIsPlaying={playerIsPlaying}
        isMobile={isMobile}
        fallbackArtwork={FALLBACK}
        onPlayTrack={handlePlayAlbumSong}
        onOpenTrackMenu={handleOpenTrackMenu}
        onAddToPlaylist={handleAddToPlaylist}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onNavigateTrack={(id) => navigate(`/song/${id}`)}
        onNavigateArtist={(id) => navigate(`/artist/${id}`)}
        onNavigateAlbum={(id) => navigate(`/album/${id}`)}
        formatDuration={formatDuration}
      />

      {(recommendedLoading || processedRecommendedSongs.length > 0) && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: { xs: 4, md: 6 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.pxToRem(20),
                letterSpacing: 0.2,
                mb: 2,
              }}
            >
              Recommended for you
            </Typography>
            {processedRecommendedSongs.length > 0 && (
              <IconButton
                onClick={handleShowAllRecommended}
                sx={{
                  color: "#E4C421",
                  "&:hover": { backgroundColor: "rgba(228, 196, 33, 0.1)" },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    fontFamily: theme.typography.fontFamily,
                  }}
                >
                  {showAllRecommended ? "Show Less" : "Show All"}
                </Typography>
              </IconButton>
            )}
          </Box>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.9rem",
              mt: -1,
              mb: 1,
            }}
          >
            Based on this song
          </Typography>

          {recommendedLoading && (
            <Typography sx={{ color: "text.secondary", mb: 2 }}>
              Loading recommendations…
            </Typography>
          )}

          {processedRecommendedSongs.length > 0 && (
            <>
              {showAllRecommended ? (
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
                    py: { xs: 1, sm: 1.5 },
                  }}
                >
                  {processedRecommendedSongs.map((rec) => {
                    const isPlayingThisSong =
                      playingTrack &&
                      rec?.id &&
                      String(playingTrack.id) === String(rec.id) &&
                      playerIsPlaying;
                    return (
                      <Box
                        key={rec.id}
                        sx={{
                          flex: "0 0 auto",
                          width: {
                            xs: theme.customSizes?.musicCard?.xs ?? 140,
                            sm: theme.customSizes?.musicCard?.sm ?? 160,
                            md: theme.customSizes?.musicCard?.md ?? 180,
                            lg: theme.customSizes?.musicCard?.lg ?? 200,
                          },
                        }}
                      >
                        <SongCard
                          song={rec}
                          isPlayingThisSong={isPlayingThisSong}
                          onPlayPause={() =>
                            handleTrendingSongPlay({
                              song: rec,
                              incrementPlayCount,
                              handlePlaySong,
                              trendingSongs: processedRecommendedSongs,
                              client,
                            })
                          }
                          onOpenArtist={() => {
                            const songId = rec.id || rec._id || rec.songId;
                            const albumId = rec.albumId || rec.album?._id || rec.album;

                            if (albumId && songId) {
                              navigate(`/album/${albumId}/${songId}`);
                              return;
                            }

                            if (songId) {
                              navigate(`/song/${songId}`);
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box
                  sx={{
                    position: "relative",
                    "--song-card-size": (theme) => ({
                      xs: `${theme.customSizes?.musicCard?.xs ?? 140}px`,
                      sm: `${theme.customSizes?.musicCard?.sm ?? 160}px`,
                      md: `${theme.customSizes?.musicCard?.md ?? 180}px`,
                      lg: `${theme.customSizes?.musicCard?.lg ?? 200}px`,
                    }),
                  }}
                >
                  {showRecommendedLeftArrow && (
                    <IconButton
                      className="album-scroll-arrows"
                      onClick={() => handleRecommendedNavClick("left")}
                      sx={{
                        position: "absolute",
                        left: { xs: 4, sm: 8, md: 10 },
                        top: "calc(var(--song-card-size) / 2)",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "#E4C421",
                        opacity: 1,
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

                  {showRecommendedRightArrow && (
                    <IconButton
                      className="album-scroll-arrows"
                      onClick={() => handleRecommendedNavClick("right")}
                      sx={{
                        position: "absolute",
                        right: { xs: 4, sm: 8, md: 10 },
                        top: "calc(var(--song-card-size) / 2)",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "#E4C421",
                        opacity: 1,
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
                    ref={recommendedScrollContainerRef}
                    onScroll={checkRecommendedScrollPosition}
                    onWheel={handleRecommendedWheel}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: {
                        xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
                        sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
                        md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
                        lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
                      },
                      overflowX: "auto",
                      pb: 0,
                      px: { xs: 0.5, sm: 1 },
                      py: { xs: 1, sm: 1.5 },
                      scrollbarWidth: "none",
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },
                      "&-ms-overflow-style": "none",
                    }}
                  >
                    {processedRecommendedSongs.map((rec) => {
                      const isPlayingThisSong =
                        playingTrack &&
                        rec?.id &&
                        String(playingTrack.id) === String(rec.id) &&
                        playerIsPlaying;
                      return (
                        <Box
                          key={rec.id}
                          sx={{
                            flex: "0 0 auto",
                            width: {
                              xs: theme.customSizes?.musicCard?.xs ?? 140,
                              sm: theme.customSizes?.musicCard?.sm ?? 160,
                              md: theme.customSizes?.musicCard?.md ?? 180,
                              lg: theme.customSizes?.musicCard?.lg ?? 200,
                            },
                          }}
                        >
                          <SongCard
                            song={rec}
                            isPlayingThisSong={isPlayingThisSong}
                            onPlayPause={() =>
                              handleTrendingSongPlay({
                                song: rec,
                                incrementPlayCount,
                                handlePlaySong,
                                trendingSongs: processedRecommendedSongs,
                                client,
                              })
                            }
                            onOpenArtist={() => {
                              const songId = rec.id || rec._id || rec.songId;
                              const albumId = rec.albumId || rec.album?._id || rec.album;

                              if (albumId && songId) {
                                navigate(`/album/${albumId}/${songId}`);
                                return;
                              }

                              if (songId) {
                                navigate(`/song/${songId}`);
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      )}





      {popularSongs.length > 0 && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: { xs: 4, md: 6 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.pxToRem(20),
              letterSpacing: 0.2,
              mb: 2,
            }}
          >
            Popular songs by {song?.artistName || song?.artist?.artistAka || "Unknown Artist"}
          </Typography>

          <List sx={{ p: 0 }}>
            {popularSongs.map((track, index) => {
              const trackId = getId(track);
              const albumIdForLink = track.albumId || track.album?._id || track.album;
              const cover =
                track.artworkUrl ||
                track.artwork ||
                track.cover ||
                track.image ||
                FALLBACK;
              const plays = Number(track.playCount ?? track.plays ?? 0);
              const secondaryText = `${track.albumName || "Single"} • ${plays.toLocaleString()} plays`;
              const isPlayingThisSong =
                playingId && trackId && String(playingId) === String(trackId) && playerIsPlaying;
              return (
                <ListItem
                  key={trackId || index}
                  sx={{
                    px: 0,
                    py: 1.2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2,
                      overflow: "hidden",
                      flexShrink: 0,
                      bgcolor: "action.hover",
                      mr: 2,
                      position: "relative",
                      cursor: "pointer",
                      "&:hover .popular-song-play": {
                        opacity: 1,
                        transform: "translate(-50%, -50%) scale(1)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={cover}
                      alt={track.title || "Track"}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK;
                      }}
                    />
                    <IconButton
                      className="popular-song-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbumSong(track);
                      }}
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) scale(0.95)",
                        opacity: 0,
                        transition: "all 0.2s ease",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "#E4C421",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.85)",
                        },
                      }}
                    >
                      {isPlayingThisSong ? (
                        <PauseIcon sx={{ fontSize: 22 }} />
                      ) : (
                        <PlayArrowIcon sx={{ fontSize: 22 }} />
                      )}
                    </IconButton>
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        onClick={() => {
                          if (trackId) navigate(`/song/${trackId}`);
                        }}
                        sx={{
                          color: "text.primary",
                          fontWeight: 600,
                          cursor: "pointer",
                          "&:hover": {
                            color: "#E4C421",
                          },
                        }}
                      >
                        {track.title || "Untitled Track"}
                      </Typography>
                    }
                    secondary={secondaryText}
                    secondaryTypographyProps={{ sx: { color: "text.secondary" } }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}



















      <ActionMenu
        isMobile={isMobile}
        anchorEl={trackMenuAnchor}
        open={!isMobile && Boolean(trackMenuAnchor)}
        onClose={() => {
          setTrackMenuAnchor(null);
          setLongPressTrack(null);
        }}
        drawerOpen={trackDrawerOpen}
        onCloseDrawer={handleCloseTrackDrawer}
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
