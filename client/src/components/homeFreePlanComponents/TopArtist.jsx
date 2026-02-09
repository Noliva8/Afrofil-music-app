import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tooltip from "@mui/material/Tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  PlayCircle, 
  Verified 
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useScrollNavigation } from "../../utils/someSongsUtils/scrollHooks.js";
import { processSongs } from "../../utils/someSongsUtils/someSongsUtils.js";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/system";

// Animation for rank glow
const rankGlow = keyframes`
  0% { box-shadow: 0 0 5px #FFD700; }
  50% { box-shadow: 0 0 20px #FFD700, 0 0 30px rgba(255, 215, 0, 0.5); }
  100% { box-shadow: 0 0 5px #FFD700; }
`;

// Animation for avatar hover
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

export default function TopArtistsRow({ songsWithArtwork = [] }) {
  const theme = useTheme();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [hoveredArtist, setHoveredArtist] = useState(null);

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

  const topArtists = (() => {
    const normalizedSongs = processSongs(songsWithArtwork);
    const map = new Map();
    
    (normalizedSongs || []).forEach((song) => {
      const id = song?.artistId;
      if (!id) return;
      
      const plays = Number(song.playCount || 0);
      const trendingScore = Number(song.trendingScore || 0);
      const score = plays + (trendingScore * 1.5); // Boost trending artists

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: song.artistName || "Unknown Artist",
          profileImage: song.profilePictureUrl || "",
          plays: 0,
          trendingScore: 0,
          songsCount: 0,
          score: 0,
          isVerified: Math.random() > 0.7, // Simulate verified status
        });
      }
      
      const entry = map.get(id);
      entry.plays += plays;
      entry.trendingScore += trendingScore;
      entry.songsCount += 1;
      entry.score += score;
    });

    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map((artist, index) => ({
        ...artist,
        rank: index + 1,
        rankColor: getRankColor(index + 1),
      }));
  })();

  function getRankColor(rank) {
    switch(rank) {
      case 1: return "#FFD700"; // Gold
      case 2: return "#C0C0C0"; // Silver
      case 3: return "#CD7F32"; // Bronze
      default: return "#E4C421"; // Yellow
    }
  }

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  const ArtistCard = ({ artist }) => (
    <Card
      sx={{
        flexShrink: 0,
        width: 240,
        height: 320,
        background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)",
        borderRadius: 3,
        border: `1px solid ${artist.rankColor}30`,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: hoveredArtist === artist.id ? "scale(1.05)" : "scale(1)",
        "&:hover": {
          transform: "scale(1.05)",
          borderColor: artist.rankColor,
          boxShadow: `0 10px 30px ${artist.rankColor}40`,
          "& .artist-avatar": {
            animation: `${floatAnimation} 2s ease-in-out infinite`,
          },
          "& .rank-badge": {
            animation: `${rankGlow} 2s ease-in-out infinite`,
          }
        },
      }}
      onMouseEnter={() => setHoveredArtist(artist.id)}
      onMouseLeave={() => setHoveredArtist(null)}
      onClick={() => navigate(`/artist/${artist.id}`)}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 20%, ${artist.rankColor}15 0%, transparent 50%)`,
          opacity: 0.3,
        }}
      />

      {/* Rank badge */}
      <Box
        className="rank-badge"
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: artist.rankColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000",
          fontWeight: 900,
          fontSize: "1.1rem",
          zIndex: 2,
          border: "2px solid white",
        }}
      >
        #{artist.rank}
      </Box>

      {/* Verified badge */}
      {artist.isVerified && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
          }}
        >
          <Tooltip title="Verified Artist">
            <Verified sx={{ color: "#1DA1F2", fontSize: 24 }} />
          </Tooltip>
        </Box>
      )}

      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Artist avatar */}
        <Box
          className="artist-avatar"
          sx={{
            position: "relative",
            mb: 2.5,
            "&::after": {
              content: '""',
              position: "absolute",
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: "50%",
              background: `linear-gradient(45deg, ${artist.rankColor}, transparent)`,
              zIndex: 0,
            }
          }}
        >
          <Avatar
            src={artist.profileImage || undefined}
            sx={{
              width: 120,
              height: 120,
              border: `3px solid ${artist.rankColor}`,
              bgcolor: "rgba(0,0,0,0.8)",
              position: "relative",
              zIndex: 1,
              "& .MuiAvatar-img": {
                objectFit: "cover",
              }
            }}
          >
            {artist.name.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        {/* Artist name */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: "1.25rem",
            textAlign: "center",
            mb: 1,
            background: `linear-gradient(45deg, ${artist.rankColor}, #fff)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {artist.name}
        </Typography>

        {/* Stats row */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 1.5,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PlayCircle sx={{ fontSize: 16, color: artist.rankColor }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {artist.plays.toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: artist.rankColor }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {artist.songsCount} tracks
            </Typography>
          </Box>
        </Box>

        {/* Hover play button */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            opacity: hoveredArtist === artist.id ? 1 : 0,
            transform: hoveredArtist === artist.id ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.3s ease",
          }}
        >
          <IconButton
            sx={{
              backgroundColor: artist.rankColor,
              color: "#000",
              "&:hover": {
                backgroundColor: artist.rankColor,
                transform: "scale(1.1)",
              },
            }}
          >
            <PlayCircle sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mb: 8, px: { xs: 2, sm: 3, md: 4 } }}>
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
              background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)",
              borderRadius: 2,
            }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                background: "linear-gradient(45deg, #FFD700 30%, #FFA500 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                letterSpacing: "-0.5px",
              }}
            >
              Top artists
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Most streamed artists this week
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
        // Grid view for "View All"
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, minmax(0, 1fr))",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 3,
            px: { xs: 1, sm: 2 },
          }}
        >
          {topArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </Box>
      ) : (
        // Horizontal scroll view
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            "&:hover .scroll-arrow": {
              opacity: 1,
            },
          }}
        >
          {/* Navigation arrows */}
          {showLeftArrow && (
            <IconButton
              className="scroll-arrow"
              onClick={() => handleNavClick("left")}
              sx={{
                position: "absolute",
                left: { xs: 8, sm: 16 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                color: "#FFD700",
                opacity: 0,
                transition: "opacity 0.3s, transform 0.2s",
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                border: "1px solid rgba(255, 215, 0, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.95)",
                  transform: "translateY(-50%) scale(1.1)",
                  borderColor: "#FFD700",
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }} />
            </IconButton>
          )}

          {showRightArrow && (
            <IconButton
              className="scroll-arrow"
              onClick={() => handleNavClick("right")}
              sx={{
                position: "absolute",
                right: { xs: 8, sm: 16 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 20,
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                color: "#FFD700",
                opacity: 0,
                transition: "opacity 0.3s, transform 0.2s",
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                border: "1px solid rgba(255, 215, 0, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.95)",
                  transform: "translateY(-50%) scale(1.1)",
                  borderColor: "#FFD700",
                },
              }}
            >
              <ChevronRight sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }} />
            </IconButton>
          )}

          {/* Artists row */}
          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 3,
              py: 2,
              px: { xs: 2, sm: 3 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 215, 0, 0.3)",
                borderRadius: 4,
              },
            }}
          >
            {topArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </Box>

          {/* Scroll indicator */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
              opacity: 0.6,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 4,
                backgroundColor: "rgba(255, 215, 0, 0.3)",
                borderRadius: 2,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: "30%",
                  backgroundColor: "#FFD700",
                  borderRadius: 2,
                  animation: `${keyframes`
                    0% { transform: translateX(0); }
                    50% { transform: translateX(140%); }
                    100% { transform: translateX(0); }
                  `} 2s ease-in-out infinite`,
                }
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}