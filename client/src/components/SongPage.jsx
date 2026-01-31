

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApolloClient, useQuery } from "@apollo/client";
import { SongCard } from "./otherSongsComponents/songCard.jsx";
import { AlbumCard, CompactAlbumCard } from "./otherSongsComponents/AlbumCard.jsx";
import { AddButton } from "./AddButton.jsx";
import AddToPlaylistModal from "./AddToPlaylistModal.jsx";


import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';

// Icons
import Description from "@mui/icons-material/Description";
import Shuffle from "@mui/icons-material/Shuffle";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ShareIcon from "@mui/icons-material/Share";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddIcon from '@mui/icons-material/Add';
import ReportIcon from '@mui/icons-material/Report';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

// Hooks & Utils
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { useMutation } from "@apollo/client";
import { usePlayCount } from "../utils/handlePlayCount";
import { SONG_BY_ID, SONGS_OF_ALBUM, OTHER_ALBUMS_ARTIST } from "../utils/queries";
import { GET_PRESIGNED_URL_DOWNLOAD, CREATE_BOOK_ARTIST } from "../utils/mutations";
import { useSongsWithPresignedUrls } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";
import { handleTrendingSongPlay } from "../utils/plabackUtls/handleSongPlayBack.js";
import { getFullKeyFromUrlOrKey } from "../utils/someSongsUtils/songsWithPresignedUrlHook";
import { useScrollNavigation } from "../utils/someSongsUtils/scrollHooks.js";
import { useBookingId } from "../utils/contexts/bookingIdContext";

// Components
import { ShuffleButton } from "./ShuffleButton.jsx";
import { PlayButton } from "./PlayButton";
import { ActionButtonsGroup } from "./ActionButtonsGroup.jsx";
import { ActionMenu } from "./ActionMenu.jsx";
import BookingArtistModal from "./BookingArtistModal.jsx";

export const SongPage = () => {
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
  const [menuBookingOpen, setMenuBookingOpen] = useState(false);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [createBooking] = useMutation(CREATE_BOOK_ARTIST);
  const [albumCovers, setAlbumCovers] = useState({});
  const { setBookingId } = useBookingId();


  const isMobile = useMediaQuery("(max-width:900px)");
  const { songId, albumId } = useParams();
  const location = useLocation();

const theme = useTheme();

  const {
    scrollContainerRef: albumScrollContainerRef,
    showLeftArrow: showAlbumLeftArrow,
    showRightArrow: showAlbumRightArrow,
    showAll: showAllAlbums,
    handleWheel: handleAlbumWheel,
    handleNavClick: handleAlbumNavClick,
    checkScrollPosition: checkAlbumScrollPosition,
    handleShowAll: handleShowAllAlbums,
  } = useScrollNavigation();

  // -----------------------
  // Helper Functions
  // -----------------------
  const getId = useCallback((obj) => {
    if (!obj) return "";
    return String(obj.id || obj._id || obj.songId || "");
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

  const getArtistBookingAvailability = useCallback((track) => {
    if (!track) return undefined;
    if (track.artistBookingAvailability !== undefined) return track.artistBookingAvailability;
    if (track.artist?.bookingAvailability !== undefined) return track.artist.bookingAvailability;
    if (track.fullOriginal?.artist?.bookingAvailability !== undefined)
      return track.fullOriginal.artist.bookingAvailability;
    return undefined;
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
  console.log('')

  const songFromState = useMemo(() => {
    if (!songFromStateRaw) return null;
    const stateId = getId(songFromStateRaw);
    if (!stateId) return null;
    return String(stateId) === String(songId) ? songFromStateRaw : null;
  }, [songFromStateRaw, songId, getId]);

  const stateHasFreshSignedArtwork = useMemo(
    () => !isCloudFrontExpired(songFromState?.artworkUrl),
    [songFromState, isCloudFrontExpired]
  );

  const stateHasBookingFlag = useMemo(
    () =>
      songFromState?.artistBookingAvailability !== undefined ||
      songFromState?.artist?.bookingAvailability !== undefined ||
      songFromState?.fullOriginal?.artist?.bookingAvailability !== undefined,
    [songFromState]
  );

  const skipSongFetch = Boolean(songFromState && stateHasFreshSignedArtwork && stateHasBookingFlag);

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
      songFromState?.album,
      processedSongFetched?.albumId,
      processedSongFetched?.album?._id,
      processedSongFetched?.album,
    ].filter(Boolean);
    if (!candidates.length) return null;
    return String(candidates[0]);
  }, [albumId, songFromState, processedSongFetched]);

  // -----------------------
  // 5) Fetch album songs
  // -----------------------
  const {
    data: albumSongsData,
    loading: albumSongsLoading,
    error: albumSongsError,
  } = useQuery(SONGS_OF_ALBUM, {
    variables: { albumId: resolvedAlbumId },
    skip: !resolvedAlbumId,
    fetchPolicy: "cache-first",
  });

  const albumSongsRaw = useMemo(() => albumSongsData?.getAlbum?.songs ?? [], [albumSongsData]);
  const albumArtistId = useMemo(
    () =>
      albumSongsData?.getAlbum?.artist?._id ||
      albumSongsData?.getAlbum?.artist?.id ||
      processedSongFetched?.artistId ||
      processedSongFetched?.artist?._id ||
      processedSongFetched?.artist?.id ||
      songFromState?.artistId ||
      songFromState?.artist?._id ||
      songFromState?.artist?.id ||
      null,
    [albumSongsData, processedSongFetched, songFromState]
  );
  const albumArtistName = useMemo(
    () =>
      albumSongsData?.getAlbum?.artist?.artistAka ||
      processedSongFetched?.artistName ||
      processedSongFetched?.artist?.artistAka ||
      songFromState?.artistName ||
      songFromState?.artist?.artistAka ||
      null,
    [albumSongsData, processedSongFetched, songFromState]
  );
  
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

  // -----------------------
  // 6) Final song for rendering
  // -----------------------
  const song = processedSongFetched || songFromState || null;
  const artistBookingAvailability = useMemo(
    () => getArtistBookingAvailability(song),
    [song, getArtistBookingAvailability]
  );
  const bookingAllowed = artistBookingAvailability !== false;

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
  // 9b) Other albums by artist
  // -----------------------
// a) fetch albums 



  const {
    data: otherAlbumsData,
    loading: otherAlbumsLoading,
    error: otherAlbumsError,
  } = useQuery(OTHER_ALBUMS_ARTIST, {
    variables: { albumId: resolvedAlbumId, artistId: albumArtistId },
    skip: !resolvedAlbumId || !albumArtistId,
    fetchPolicy: "cache-first",
  });



const albums = otherAlbumsData?.otherAlbumsByArtist;
console.log('see return album again:', albums)

const isSingleAlbumTitle = useCallback((title) => {
  const normalized = String(title || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized === "unknown" ||
    normalized === "single" ||
    normalized.includes("unknown")
  );
}, []);

const { displayAlbums, albumSectionTitle } = useMemo(() => {
  const allAlbums = Array.isArray(albums) ? albums : [];

  const singles = allAlbums.filter((album) => isSingleAlbumTitle(album?.title));
  const realAlbums = allAlbums.filter((album) => !isSingleAlbumTitle(album?.title));
  if (realAlbums.length > 0) {
    return { displayAlbums: realAlbums, albumSectionTitle: "More Albums by" };
  }
  if (singles.length > 0) {
    return { displayAlbums: singles, albumSectionTitle: "More Singles by" };
  }
  return { displayAlbums: [], albumSectionTitle: "" };
}, [albums, isSingleAlbumTitle]);

useEffect(() => {
  checkAlbumScrollPosition();
  window.addEventListener("resize", checkAlbumScrollPosition);
  return () => window.removeEventListener("resize", checkAlbumScrollPosition);
}, [checkAlbumScrollPosition, albums?.length]);


// b) presign each albumCoverImage fall back tp profile image to display in card





useEffect(() => {
  const albums = otherAlbumsData?.otherAlbumsByArtist ?? [];
  if (!albums.length) return;

  let alive = true;

  const fetchAlbumCovers = async () => {
    const entries = await Promise.all(
      albums.map(async (album) => {
        const raw =  album?.albumCoverImage ||
  album?.songs?.[0]?.artwork;

        if (!raw) return null;

        const key = getFullKeyFromUrlOrKey(raw); 
      console.log('keysss', key)
        if (!key) return null;
        

        try {
          const resp = await getPresignedUrlDownload({
            variables: {
              bucket: "afrofeel-cover-images-for-songs",
              key,
              region: "us-east-2",
            },
          });

          const url = resp?.data?.getPresignedUrlDownload?.url;
          if (!url) return null;

          return [album._id, url];
        } catch (e) {
          console.error("Failed to presign album cover:", album?._id, e);
          return null;
        }
      })
    );

    if (!alive) return;

    setAlbumCovers((prev) => ({
      ...prev,
      ...Object.fromEntries(entries.filter(Boolean)),
    }));
  };

  fetchAlbumCovers();

  return () => {
    alive = false;
  };
}, [otherAlbumsData, getPresignedUrlDownload, getFullKeyFromUrlOrKey, setAlbumCovers]);




console.log('see albums:',  albumCovers);


  // -----------------------


  // 9) Display fields
  // -----------------------
  const albumName = song?.albumName || song?.album?.title || null;


  const isSingle = useMemo(() =>
    !albumName ||
    String(albumName).toLowerCase() === "unknown" ||
    String(albumName).toLowerCase() === "single",
    [albumName]
  );

  const displayText = isSingle ? "Single" : albumName;
  const subtitleValue = isSingle
    ? song?.title || "Song"
    : `Album • ${song?.artistName || song?.artist?.artistAka || "Unknown Artist"}`;

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

  const handleAlbumCardClick = useCallback(
    (album) => {
      const albumIdTarget = album?._id || album?.id;
      const firstSongId = album?.songs?.[0]?._id || album?.songs?.[0]?.id;
      if (albumIdTarget && firstSongId) {
        navigate(`/album/${albumIdTarget}/${firstSongId}`);
      }
    },
    [navigate]
  );

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

  const handleMenuBookingOpen = useCallback(() => setMenuBookingOpen(true), []);
  const handleMenuBookingClose = useCallback(() => setMenuBookingOpen(false), []);
  const handleCreateBooking = useCallback(
    async (payload) => {
      const { data } = await createBooking({
        variables: {
          input: payload,
        },
      });
      const booking = data?.createBookArtist?.booking;
      if (booking?._id) {
        setBookingId(booking._id);
      }
      return booking;
    },
    [createBooking]
  );

  const handleMenuBookingSubmit = useCallback(
    async (data) => {
      try {
        await handleCreateBooking(data);
      } finally {
        handleMenuBookingClose();
      }
    },
    [handleCreateBooking, handleMenuBookingClose]
  );

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

  const mainMenuItems = useMemo(() => {
    const items = [
      { icon: <Description />, label: "Play now", onClick: handlePrimaryPlay, fontWeight: 400 },
      { icon: <Shuffle />, label: "Shuffle", onClick: () => console.log("Shuffle clicked"), fontWeight: 400 },
      { icon: <SkipNextIcon />, label: "Play next", onClick: () => console.log("Play next clicked"), fontWeight: 400 },
      { icon: <ShareIcon />, label: "Share", onClick: handleShare, fontWeight: 400 },
    ];
    if (bookingAllowed) {
      items.push({
        icon: <CalendarMonthIcon sx={{ color: "rgba(255,255,255,0.7)" }} />,
        label: "Book artist",
        onClick: handleMenuBookingOpen,
        fontWeight: 400,
      });
    }
    return items;
  }, [handlePrimaryPlay, handleShare, bookingAllowed, handleMenuBookingOpen]);

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

  const isShuffled = Boolean(playerState?.shuffle);

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
              {isSingle ? "SINGLE" : "ALBUM"}
            </Typography>

            <Typography
              variant="h1"
              onClick={() => {
                if (!isSingle && resolvedAlbumId) {
                  navigate(`/album/${resolvedAlbumId}`);
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
                cursor: !isSingle && resolvedAlbumId ? "pointer" : "default",
                "&:hover": {
                  textDecoration: !isSingle && resolvedAlbumId ? "underline" : "none",
                },
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

          <ShuffleButton
            playableTrack={playableTrack}
            isShuffled={isShuffled}
          />
        </Box>

        <ActionButtonsGroup
          isFavorite={isFavorite}
          onToggleFavorite={handleAddToFavorites}
          onShare={handleShare}
          onMore={handleOpenMenu}
          supportArtistId={song?.artistId || song?.artist?._id}
          supportArtistName={song?.artistName || song?.artist?.artistAka}
          supportSongId={song?.id || song?._id}
          isBookingEnabled={artistBookingAvailability}
          onBookingSubmit={handleCreateBooking}
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

      {bookingAllowed && (
        <BookingArtistModal
          open={menuBookingOpen}
          onClose={handleMenuBookingClose}
          artistName={song?.artist?.artistAka || song?.artistName}
          context={{
            artistId: song?.artistId || song?.artist?._id,
            songId: song?.id || song?._id,
          }}
          onSubmit={handleMenuBookingSubmit}
        />
      )}

      {/* Album Songs Section - Mobile Optimized */}
      {processedAlbumSongs.length > 0 && (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, my: { xs: 4, sm: 5 } }}>
          {/* Desktop Header */}
          <Box sx={{ 
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr',
            alignItems: 'center',
            py: 2.5,
            px: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            borderRadius: '12px 12px 0 0',
            mt: { xs: 3, md: 4 },
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              #
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Title
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Album
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Plays
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Duration
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              Add
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              More
            </Typography>
          </Box>

          {/* Mobile Header */}
          <Box sx={{ 
            display: { xs: 'grid', md: 'none' },
            gridTemplateColumns: 'auto 1fr auto auto',
            alignItems: 'center',
            py: 2,
            px: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            borderRadius: '12px 12px 0 0',
            mt: 3,
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              #
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Title
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              Play
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              More
            </Typography>
          </Box>

          {/* Tracks List */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.5, md: 0 },
            borderRadius: { xs: 2, md: '0 0 12px 12px' },
            overflow: 'hidden',
            bgcolor: { md: 'transparent' },
          }}>
            {processedAlbumSongs.map((track, index) => {
              const trackId = getId(track);
              const isCurrent = playingId && trackId && playingId === trackId;
              const isRouteMatch = songId && trackId && String(trackId) === String(songId);
              const isActive = isCurrent || isRouteMatch;
              const thumbnail = track.thumbnail || track.artwork || track.artworkUrl || track.albumCoverImageUrl || track.cover;
              const artistName = track.artistName || track?.artist?.artistAka || 'Unknown Artist';
              const albumName = track.albumName || track?.album?.title || 'Single';
              const rawAlbumId = track.albumId;
              const rawAlbum = track?.album;
              const albumIdFromTrack =
                typeof rawAlbumId === "string"
                  ? (rawAlbumId.includes("[object Object]") ? "" : rawAlbumId)
                  : (rawAlbumId?._id || rawAlbumId?.id || "");
              const albumIdFromAlbum =
                typeof rawAlbum === "string"
                  ? (rawAlbum.includes("[object Object]") ? "" : rawAlbum)
                  : (rawAlbum?._id || rawAlbum?.id || "");
              const albumIdForLink = albumIdFromTrack || albumIdFromAlbum;

              return (
                <Box 
                  key={trackId || index}
                  onTouchStart={(e) => handleTouchStart(track, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { 
                      xs: 'auto 1fr auto auto',
                      md: '0.5fr 2.5fr 1.5fr 1fr 1fr 0.5fr 0.5fr'
                    },
                    alignItems: 'center',
                    gap: { xs: 1.5, md: 0 },
                    py: { xs: 2, md: 2 },
                    px: 0,
                    borderBottom: { xs: 'none', md: '1px solid' },
                    borderColor: { md: 'divider' },
                    borderRadius: { xs: 2, md: 0 },
                    bgcolor: isActive ? 'rgba(228,196,33,0.08)' : { xs: 'background.paper', md: 'transparent' },
                    mb: { xs: 1, md: 0 },
                    transition: 'all 0.25s',
                    '&:hover': {
                      bgcolor: { xs: 'action.hover', md: 'action.hover' },
                      transform: { xs: 'translateX(4px)', md: 'none' },
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {/* Index Number */}
                  <Typography 
                    sx={{ 
                      color: isActive ? 'primary.main' : (index < 3 ? 'primary.main' : 'text.secondary'),
                      fontSize: { xs: '1rem', md: '1.15rem' },
                      fontWeight: 900,
                      textAlign: 'center',
                      minWidth: { xs: 32, md: 'auto' },
                      fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
                    }}
                  >
                    {index + 1}
                  </Typography>

                  {/* Track Info */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 2, md: 2.5 },
                    overflow: 'hidden',
                    gridColumn: { xs: 'auto', md: 'auto' },
                    minWidth: 0,
                  }}>
                    {/* Thumbnail */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: { xs: 50, md: 60 },
                        height: { xs: 50, md: 60 },
                        borderRadius: { xs: 1.5, md: 2 },
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: { xs: 1, md: 3 },
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: { xs: 2, md: 4 },
                      '& .play-overlay': {
                        opacity: 1,
                        transform: 'translateY(0)',
                        bgcolor: 'rgba(0,0,0,0.35)',
                      },
                    },
                  }}
                  onClick={() => handlePlayAlbumSong(track)}
                >
                  <Box
                        component="img"
                        src={thumbnail || FALLBACK}
                        alt={track.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK;
                    }}
                  />
                  <Box
                    className="play-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(6px)',
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive && playerIsPlaying ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)',
                    }}
                  >
                    <IconButton
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbumSong(track);
                      }}
                      sx={{
                        width: { xs: 38, md: 44 },
                        height: { xs: 38, md: 44 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(228,196,33,0.25)',
                        border: '1px solid rgba(228,196,33,0.5)',
                        '&:hover': {
                          bgcolor: 'rgba(228,196,33,0.35)',
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {isActive && playerIsPlaying ? (
                        <PauseIcon sx={{ fontSize: { xs: 18, md: 22 }, color: 'primary.contrastText' }} />
                      ) : (
                        <PlayArrowIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'primary.contrastText', ml: 0.2 }} />
                      )}
                    </IconButton>
                  </Box>
                </Box>

                {/* Title & Artist Info */}
                <Box sx={{ 
                  minWidth: 0, 
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: { xs: 0.5, md: 0.5 } 
                    }}>
                      <Typography
                        onClick={() => {
                          if (trackId) {
                            navigate(`/song/${trackId}`, { state: { song: track } });
                          }
                        }}

                        
                        sx={{
                          color: 'text.primary',
                          fontWeight: 700,
                          fontSize: { xs: '1rem', md: '1.15rem' },
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '-0.01em',
                          fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
                          cursor: trackId ? 'pointer' : 'default',
                          '&:hover': {
                            color: trackId ? 'primary.main' : 'text.primary',
                            textDecoration: trackId ? 'underline' : 'none',
                          },
                        }}
                      >
                        {track.title || 'Untitled'}
                      </Typography>
                      
                      <Typography
                        onClick={() => {
                          const artistId = track.artistId || track?.artist?._id || track?.artist;
                          if (artistId) navigate(`/artist/${artistId}`);
                        }}
                        sx={{
                          color: 'text.secondary',
                          fontSize: { xs: '0.85rem', md: '0.975rem' },
                          cursor: (track.artistId || track?.artist?._id || track?.artist) ? 'pointer' : 'default',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                          '&:hover': {
                            color: (track.artistId || track?.artist?._id || track?.artist) ? 'primary.main' : 'text.secondary',
                          },
                        }}
                      >
                        {artistName}
                      </Typography>

                      {/* Mobile Extra Info */}
                      <Box sx={{ 
                        display: { xs: 'flex', md: 'none' }, 
                        alignItems: 'center', 
                        gap: 1,
                        mt: 0.5,
                        flexWrap: 'wrap',
                      }}>
                        <Typography
                          onClick={() => {
                            if (albumIdForLink) {
                              navigate(`/album/${albumIdForLink}`);
                            }
                          }}
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.8rem',
                            cursor: albumIdForLink ? 'pointer' : 'default',
                            fontWeight: 500,
                            '&:hover': {
                              color: albumIdForLink ? 'primary.main' : 'text.secondary',
                              textDecoration: albumIdForLink ? 'underline' : 'none',
                            },
                          }}
                        >
                          {albumName}
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                        }}>
                          <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'action.disabled' }} />
                          <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.8rem' }}>
                            {(track.playCount ?? track.plays ?? 0).toLocaleString()}
                          </Typography>
                          <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'action.disabled' }} />
                          <Typography sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.8rem' }}>
                            {formatDuration(track.duration)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Mobile Play Button */}
                  <Box sx={{ 
                    display: { xs: 'flex', md: 'none' },
                    justifyContent: 'center',
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handlePlayAlbumSong(track)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'rgba(228,196,33,0.15)',
                        border: '1px solid rgba(228,196,33,0.3)',
                        '&:hover': { 
                          bgcolor: 'rgba(228,196,33,0.25)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      {isCurrent && playerIsPlaying ? (
                        <PauseIcon sx={{ 
                          fontSize: 20, 
                          color: 'primary.contrastText' 
                        }} />
                      ) : (
                        <PlayArrowIcon sx={{ 
                          fontSize: 20, 
                          color: 'primary.contrastText',
                          ml: 0.5 
                        }} />
                      )}
                    </IconButton>
                  </Box>

                  {/* Mobile More Button */}
                  <Box sx={{ 
                    display: { xs: 'flex', md: 'none' },
                    justifyContent: 'center',
                  }}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenTrackMenu(track, e)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(228,196,33,0.15)',
                        },
                      }}
                    >
                      <MoreHorizIcon sx={{ fontSize: '1.4rem' }} />
                    </IconButton>
                  </Box>

                  {/* Desktop-only Album */}
                  <Box sx={{ 
                    display: { xs: 'none', md: 'block' }, 
                    overflow: 'hidden',
                    px: 2 
                  }}>
                    <Typography
                      onClick={() => {
                        if (albumIdForLink) {
                          navigate(`/album/${albumIdForLink}`);
                        }
                      }}
                      sx={{
                        color: 'text.primary',
                        fontSize: '1rem',
                        cursor: albumIdForLink ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 500,
                        '&:hover': {
                          color: albumIdForLink ? 'primary.main' : 'text.primary',
                          textDecoration: albumIdForLink ? 'underline' : 'none',
                        },
                      }}
                    >
                      {albumName}
                    </Typography>
                  </Box>

                  {/* Desktop-only Plays */}
                  <Box sx={{ 
                    display: { xs: 'none', md: 'flex' }, 
                    alignItems: 'center',
                    px: 2 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      bgcolor: 'rgba(228,196,33,0.08)',
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      minWidth: 100,
                      border: '1px solid',
                      borderColor: 'rgba(228,196,33,0.15)',
                    }}>
                      <PlayArrowIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.8 }} />
                      <Typography
                        sx={{
                          color: 'text.primary',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {(track.playCount ?? track.plays ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Desktop-only Duration */}
                  <Box sx={{ 
                    display: { xs: 'none', md: 'block' },
                    px: 2 
                  }}>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                      }}
                    >
                      {formatDuration(track.duration)}
                    </Typography>
                  </Box>

                  {/* Desktop Add to Playlist Button */}
                 <AddButton handleAddToPlaylist={handleAddToPlaylist} track={track} />


                  {/* Desktop More Options Button */}
                  <Box sx={{ 
                    display: { xs: 'none', md: 'flex' }, 
                    justifyContent: 'center',
                  }}>
                    <IconButton
                      size="medium"
                      onClick={(e) => handleOpenTrackMenu(track, e)}
                      sx={{
                        color: 'text.secondary',
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: 'text.primary',
                          backgroundColor: 'action.hover',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <MoreHorizIcon sx={{ fontSize: '1.6rem' }} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}


{/* other section */}

{displayAlbums.length > 0 && (
<Box
sx={{
  my: { xs: 4, sm: 5 },
  px: { xs: 1, sm: 2, md: 3 },
}}
>

  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3,
      px: { xs: 0.5, sm: 1 },
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: "text.primary",
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.pxToRem(20),
        letterSpacing: 0.2,
      }}
    >
      {albumSectionTitle} {albumArtistName || song?.artistName || song?.artist?.artistAka || "Unknown Artist"}
    </Typography>

    <IconButton
      onClick={handleShowAllAlbums}
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
        {showAllAlbums ? "Show Less" : "Show All"}
      </Typography>
    </IconButton>
  </Box>

  {showAllAlbums ? (
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
      {displayAlbums.map((album, index) => {
        const albumId = album?._id || album?.id || `album-${index}`;
        return (
          <CompactAlbumCard
            key={albumId}
            album={album}
            albumCover={albumCovers?.[albumId]}
          />
        );
      })}
    </Box>
  ) : (
    <Box
      sx={{
        position: "relative",
        "--album-card-size": (theme) => ({
          xs: `${theme.customSizes?.musicCard?.xs ?? 140}px`,
          sm: `${theme.customSizes?.musicCard?.sm ?? 160}px`,
          md: `${theme.customSizes?.musicCard?.md ?? 180}px`,
          lg: `${theme.customSizes?.musicCard?.lg ?? 200}px`,
        }),
      }}
    >
      {showAlbumLeftArrow && (
        <IconButton
          className="album-scroll-arrows"
          onClick={() => handleAlbumNavClick("left")}
          sx={{
            position: "absolute",
            left: { xs: 4, sm: 8, md: 10 },
            top: "calc(var(--album-card-size) / 2)",
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

      {showAlbumRightArrow && (
        <IconButton
          className="album-scroll-arrows"
          onClick={() => handleAlbumNavClick("right")}
          sx={{
            position: "absolute",
            right: { xs: 4, sm: 8, md: 10 },
            top: "calc(var(--album-card-size) / 2)",
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
        ref={albumScrollContainerRef}
        onScroll={checkAlbumScrollPosition}
        onWheel={handleAlbumWheel}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          overflowX: "auto",
          gap: {
            xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
            sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
            md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
            lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
          },
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
        {displayAlbums.map((album, index) => {
          const albumId = album?._id || album?.id || `album-${index}`;
          return (
            <AlbumCard
              key={albumId}
              album={album}
              albumCover={albumCovers?.[albumId]}
            />
          );
        })}
      </Box>
    </Box>
  )}
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
