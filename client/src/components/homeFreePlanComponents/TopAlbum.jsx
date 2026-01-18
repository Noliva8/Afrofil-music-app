import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks.js";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";

export default function TopAlbum({ songsWithArtwork = [] }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    showAll,
    handleWheel,
    handleNavClick,
    checkScrollPosition,
    handleShowAll,
  } = useScrollNavigation();

  const topAlbums = (() => {
    const normalizedSongs = processSongs(songsWithArtwork);
    console.log("[TopAlbum] sample songs:", normalizedSongs.slice(0, 3));
    const map = new Map();

    normalizedSongs.forEach((song) => {
      const albumId = song.albumId;
      if (!albumId) return;
      const albumTitle = (song.albumName || "").trim();
      if (!albumTitle || albumTitle.toLowerCase() === "single" || albumTitle.toLowerCase() === "unknown") {
        return;
      }
      const plays = Number(song.playCount || 0);
      const trendingScore = Number(song.trendingScore || 0);
      const score = plays + trendingScore;

      if (!map.has(albumId)) {
        map.set(albumId, {
          id: albumId,
          title: albumTitle,
          cover: song.albumCoverImageUrl || song.profilePictureUrl || "",
          artistId: song.artistId || "",
          artistName: song.artistName || "Unknown Artist",
          plays: 0,
          score: 0,
          tracks: 0,
        });
      }
      const entry = map.get(albumId);
      entry.plays += plays;
      entry.score += score;
      entry.tracks += 1;
    });

    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);
  })();

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  const AlbumCard = ({ album }) => (
    <Box
      onClick={() => navigate(`/album/${album.id}`)}
      sx={{
        cursor: "pointer",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 2,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
        width: 220,
        flexShrink: 0,
        "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: 170,
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      >
        {album.cover ? (
          <Box
            component="img"
            src={album.cover}
            alt={album.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
            }}
          >
            No Cover
          </Box>
        )}
      </Box>
      <Typography sx={{ fontWeight: 700 }} noWrap>
        {album.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontWeight: 600,
          "&:hover": { color: "#E4C421" },
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (album.artistId) navigate(`/artist/${album.artistId}`);
        }}
      >
        {album.artistName}
      </Typography>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
        {album.tracks} tracks • {album.plays.toLocaleString()} plays
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>
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
              background: "linear-gradient(180deg, #FFD700 0%, #FF8C42 100%)",
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
              ALBUMS YOU CAN'T MISS
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Top albums climbing fast this week
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleShowAll}
          sx={{
            color: "#FFD700",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            borderRadius: 2,
            px: 2,
            "&:hover": {
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              borderColor: "#FFD700",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {showAll ? "SHOW LESS" : "VIEW ALL"}
          </Typography>
        </IconButton>
      </Box>

      {showAll ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
            px: { xs: 1, sm: 2 },
          }}
        >
          {topAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Box>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            "&:hover .scroll-arrows": {
              opacity: 1,
            },
          }}
        >
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
                color: "#FFD700",
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
                color: "#FFD700",
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
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 2,
              pb: 2,
              px: { xs: 1, sm: 2 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              "&-ms-overflow-style": "none",
            }}
          >
            {topAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
