import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useTheme from "@mui/material/styles/useTheme";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import Collapse from "@mui/material/Collapse";




import { useAudioPlayer } from "../../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../../utils/handlePlayCount.js";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks.js";
import { SongCardHero, CompactSongCardHero} from "./songCard.jsx";
import { handleTrendingSongPlay } from "../../utils/plabackUtls/handleSongPlayBack.js";


import {
  COMPACT_LIMIT,
} from "../../CommonSettings/songsRowNumberControl.js";
import { NEW_UPLOADS_PUBLIC } from "../../utils/queries.js";
import { TRENDING_SONGS_PUBLICV2 } from "../../utils/queries.js";

import { useSongsWithPresignedUrls } from "../../utils/someSongsUtils/songsWithPresignedUrlHook.js";



const getSongTimestamp = (song) => {
  const raw =
    song?.fullOriginal?.createdAt ||
    song?.fullOriginal?.releaseDate ||
    song?.fullOriginal?.album?.releaseDate ||
    song?.createdAt ||
    null;
  const ts = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ts) ? ts : 0;
};




// 1) Horizontal rail



export function SongRow({
  songs = [],
  railRef,
  currentTrackId,
  isPlaying,
  onPlayPause,
  onCardClick,
}) {
  const theme = useTheme();
console.log("hello ...")



  const {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    handleWheel,
    handleNavClick,
    checkScrollPosition,
  } = useScrollNavigation();

  const scrollerRef = railRef ?? scrollContainerRef;


  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [checkScrollPosition]);


  const gap = {
    xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
    sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
    md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
    lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
  };

  return (
    <Box sx={{ position: "relative", "&:hover .scroll-arrows": { opacity: 1 } }}>
      {showLeftArrow && (
        <IconButton
          className="scroll-arrows"
          onClick={() => handleNavClick("left")}
          sx={{
            position: "absolute",
            left: { xs: 4, sm: 8, md: 10 },
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#6FFFD2",
            opacity: 0,
            transition: "opacity 0.3s",
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.9)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
        </IconButton>
      )}

      {showRightArrow && (
        <IconButton
          className="scroll-arrows"
          onClick={() => handleNavClick("right")}
          sx={{
            position: "absolute",
            right: { xs: 4, sm: 8, md: 10 },
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#6FFFD2",
            opacity: 0,
            transition: "opacity 0.3s",
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.9)" },
          }}
        >
          <ChevronRight sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
        </IconButton>
      )}

      <Box
        ref={scrollerRef}
        onScroll={checkScrollPosition}
        onWheel={handleWheel}
        sx={{
          display: "flex",
          overflowX: "auto",
          gap,
          pb: 2,
          px: { xs: 1, sm: 2 },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "&-ms-overflow-style": "none",
        }}
      >
        {songs.map((song, index) => {
          const isPlayingThisSong = currentTrackId === song.id && isPlaying;

          const isHero = index === 0;
          const heroArtworkReady = Boolean(song?.artworkUrl || song?.artwork || song?.cover);
        
          const heroImageProps =
            isHero && heroArtworkReady
              ? { imgLoading: "eager", imgFetchPriority: "high" }
              : { imgLoading: "lazy", imgFetchPriority: "auto" };

          return (
            <Box
              key={
                song.id
                  ? String(song.id)
                  : song._id
                  ? String(song._id)
                  : song.songId
                  ? String(song.songId)
                  : `song-row-${index}`
              }
              sx={{ flexShrink: 0 }}
            >
              <SongCardHero
                song={song}
                isPlayingThisSong={isPlayingThisSong}
                onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
                onPlayPause={() => onPlayPause(song)}
                {...heroImageProps}
                imgDecoding="async"
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}







export function SongRowCompact({
  songs = [],
  currentTrackId,
  isPlaying,
  onPlayPause,
  onCardClick,
}) {
  const theme = useTheme();

  const gap = {
    xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
    sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
    md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
    lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: { xs: "center", sm: "flex-start" },
        gap,
        px: { xs: 0.5, sm: 1 },
      }}
    >
      {songs.map((song) => {
        const isPlayingThisSong = currentTrackId === song.id && isPlaying;

        return (
          <Box key={song.id}>
            <CompactSongCardHero
              song={song}
              isPlayingThisSong={isPlayingThisSong}
              onOpenArtist={onCardClick ? () => onCardClick(song) : undefined}
              onPlayPause={() => onPlayPause(song)}
            />
          </Box>
        );
      })}
    </Box>
  );
}




export function SongRowContainerHero({
  header = "",
  subHeader = "",
  songsWithArtwork = [], 
  onCardClick,
})
 {
  const client = useApolloClient();
  const theme = useTheme();




  const sectionRef = useRef(null);
  const railRef = useRef(null);
  const savedScrollLeftRef = useRef(0);

  const [showAll, setShowAll] = useState(false);

  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();



  // ✅ Base songs: trust parent (already 10 + presigned + processed)
  const baseSongs = useMemo(() => {
    return Array.isArray(songsWithArtwork) ? songsWithArtwork : [];
  }, [songsWithArtwork]);



  // ✅ Base IDs for trimming duplicates
  const baseIdSet = useMemo(() => {
    return new Set(
      baseSongs.map((s) => String(s?._id ?? s?.id ?? s?.songId ?? ""))
    );
  }, [baseSongs]);



  // ✅ ONLY when showAll, fetch up to COMPACT_LIMIT

// 1 Trendings

  const { data: TrendingsCompactData } = useQuery(TRENDING_SONGS_PUBLICV2, {
    variables: { limit: COMPACT_LIMIT },
    skip: !showAll, // ✅ don't fetch until Show All
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });




// //   2 NewUpload
// // --------------

//   const { data: compactData } = useQuery(NEW_UPLOADS_PUBLIC, {
//     variables: { limit: COMPACT_LIMIT },
//     skip: !showAll, // ✅ don't fetch until Show All
//     notifyOnNetworkStatusChange: true,
//     fetchPolicy: "network-only",
//   });




  // ✅ Compute extra raw songs (from 20 result) excluding the base 10
  const extraSongsRaw = useMemo(() => {
    if (!showAll) return [];

    const all = processSongs(TrendingsCompactData?.trendingSongsV2 ?? [])
      .filter((song) => song.audioUrl || song.streamAudioFileUrl || song.audioFileUrl)
      .sort((a, b) => getSongTimestamp(b) - getSongTimestamp(a))
      .slice(0, COMPACT_LIMIT);

    const extras = all.filter((song) => {
      const id = String(song?._id ?? song?.id ?? song?.songId ?? "");
      return id && !baseIdSet.has(id);
    });

    // keep only what we need to reach 20 total
    const need = Math.max(0, COMPACT_LIMIT - baseSongs.length);
    return extras.slice(0, need);
  }, [TrendingsCompactData, showAll, baseIdSet, baseSongs.length]);

  // ✅ Presign ONLY the extra songs
  const { songsWithArtwork: extraPresigned } = useSongsWithPresignedUrls(extraSongsRaw);

  // ✅ Merge final list (fallback to base if query fails or still loading)
  const mergedSongs = useMemo(() => {
    if (!showAll) return baseSongs;

    const extra = Array.isArray(extraPresigned) ? extraPresigned : [];
    const merged = [...baseSongs, ...extra];

    return merged.slice(0, COMPACT_LIMIT);
  }, [baseSongs, extraPresigned, showAll]);

  const isHeroReady = baseSongs.length > 0 && Boolean(baseSongs[0]?.artworkUrl);

  const onPlayPause = useCallback(
    (song) => {
      const isCurrent = currentTrack?.id === song.id;
      const isPlayingThisSong = isCurrent && isPlaying;

      if (isCurrent && isPlayingThisSong) {
        pause();
        return;
      }

      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs: mergedSongs,
        client,
      });
    },
    [
      currentTrack?.id,
      isPlaying,
      pause,
      incrementPlayCount,
      handlePlaySong,
      mergedSongs,
      client,
    ]
  );

  // ✅ No-jump toggle (kept)
  const toggleShowAllNoJump = useCallback(() => {
    const sectionEl = sectionRef.current;
    const railEl = railRef.current;

    if (!showAll && railEl) {
      savedScrollLeftRef.current = railEl.scrollLeft;
    }

    if (!sectionEl) {
      setShowAll((v) => !v);
      return;
    }

    const topBefore = sectionEl.getBoundingClientRect().top;

    const prevMinH = sectionEl.style.minHeight;
    sectionEl.style.minHeight = `${sectionEl.offsetHeight}px`;

    setShowAll((v) => !v);

    requestAnimationFrame(() => {
      const topAfter = sectionEl.getBoundingClientRect().top;
      const delta = topAfter - topBefore;
      if (delta) window.scrollBy({ top: delta, left: 0 });

      requestAnimationFrame(() => {
        if (railRef.current && showAll) {
          railRef.current.scrollLeft = savedScrollLeftRef.current || 0;
        }
        sectionEl.style.minHeight = prevMinH;
      });
    });
  }, [showAll]);



  if (!isHeroReady) {
    return null;
  }

  return (
    <Box ref={sectionRef} sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 4,
              height: 32,
              background: "linear-gradient(180deg, #B0FFD6 0%, #6FFFD2 100%)",
              borderRadius: 2,
            }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                background: "linear-gradient(45deg, #B0FFD6 20%, #6FFFD2 80%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                letterSpacing: "-0.5px",
              }}
            >
              {header}
            </Typography>



            {!!subHeader && (
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {subHeader}
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton
          onClick={toggleShowAllNoJump}
          sx={{
            color: "#6FFFD2",
            "&:hover": { backgroundColor: "rgba(111, 255, 210, 0.1)" },
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
            {showAll ? "Show Less" : "Show All"}
          </Typography>
        </IconButton>

      </Box>

      {/* Rail (base 10) */}
      <Collapse in={!showAll} timeout={220} unmountOnExit>
        <SongRow
          songs={baseSongs}
          railRef={railRef}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onCardClick={onCardClick}
        />
      </Collapse>

      {/* Grid (base 10 + presigned extras up to 20) */}
      <Collapse in={showAll} timeout={220} unmountOnExit>
        <SongRowCompact
          songs={mergedSongs}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onCardClick={onCardClick}
        />
      </Collapse>
    </Box>
  );
}





