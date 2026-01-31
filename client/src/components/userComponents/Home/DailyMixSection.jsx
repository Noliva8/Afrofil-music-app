import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import useTheme from '@mui/material/styles/useTheme';
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { SongCard, CompactSongCard } from "../../otherSongsComponents/songCard.jsx";
import { useScrollNavigation } from "../../../utils/someSongsUtils/scrollHooks.js";
import SectionHeader from "../../common/SectionHeader.jsx";



export default function DailyMixSection({
  mixProfileLabel,
  mixQueue = [],
  currentTrack,
  isTrackPlaying,
  handleTrackPlay,
  mixError,
  loading = false,
}) {
  const theme = useTheme();
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


  useEffect(() => {
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [checkScrollPosition]);



  const renderCard = (CardComponent, track, index) => {
    const baseId = track.id || track._id || track.songId;
    const trackId = baseId ? String(baseId) : `daily-mix-${index}`;
    const isCurrent = currentTrack?.id === trackId;

    return (
      <CardComponent
        key={trackId}
        song={track}
        isPlayingThisSong={isCurrent && isTrackPlaying}
        onPlayPause={() => handleTrackPlay(track)}
        imgLoading="eager"
      />
    );
  };

  const spacingGap = {
    xs: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
    sm: theme.spacing(theme.customSpacing?.cardGap?.sm ?? 1.75),
    md: theme.spacing(theme.customSpacing?.cardGap?.md ?? 2),
    lg: theme.spacing(theme.customSpacing?.cardGap?.lg ?? 2.25),
  };
  const rowQueue = mixQueue;
  const placeholderCards = Array.from({ length: 8 });

  useEffect(() => {
    checkScrollPosition();
  }, [checkScrollPosition, rowQueue.length, showAll]);

  if (loading) {
    return (
      <>
        <SectionHeader
          title={mixProfileLabel}
          subtitle="AI Daily Mix"
          actionLabel={showAll ? "Show Less" : "Show All"}
          onAction={handleShowAll}
        />
        <Box
          sx={{
            display: "flex",
            gap: spacingGap,
            flexWrap: "nowrap",
            overflowX: "hidden",
            px: { xs: 1, sm: 2 },
            minHeight: 220,
          }}
        >
          {placeholderCards.map((_, index) => (
            <Skeleton
              key={`mix-skeleton-${index}`}
              variant="rectangular"
              width={150}
              height={150}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      </>
    );
  }

  return (
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 }, overflowX: 'visible' }}>
      <SectionHeader
        title={mixProfileLabel}
        subtitle="AI Daily Mix"
        actionLabel={showAll ? "Show Less" : "Show All"}
        onAction={handleShowAll}
      />

      {showAll ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: { xs: "center", sm: "flex-start" },
            gap: spacingGap,
            px: { xs: 0.5, sm: 1 },
          }}
        >
          {mixQueue.map((track, index) => (
            <Box key={`compact-${track._id || track.id || `mix-${index}`}`} sx={{ flexShrink: 0 }}>
              {renderCard(CompactSongCard, track, index)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            overflowX: "visible",
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
                color: "#E4C421",
                opacity: 0,
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
                color: "#E4C421",
                opacity: 0,
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

          {/* Fixed Scrollable Container */}
          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              flexWrap: "nowrap", // Forces single row
              overflowX: "auto", // Enables horizontal scrolling
              overflowY: "hidden", // Prevents vertical scrolling
              gap: spacingGap,
              pb: 2,
              px: { xs: 1, sm: 2 },
              width: "100%",
              scrollBehavior: "smooth", // Smooth scrolling
              scrollSnapType: "x mandatory",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(228,196,33,0.4)",
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: "rgba(228,196,33,0.6)",
                },
              },
              "& > div": {
                flexShrink: 0, // Prevents cards from shrinking
                scrollSnapAlign: "start",
              },
            }}
          >
            {rowQueue.map((track, index) => (
              <Box 
                key={`scroll-${track._id || track.id || `mix-${index}`}`}
                sx={{ 
                  flexShrink: 0,
                  minWidth: 150, // Ensures cards have minimum width
                }}
              >
                {renderCard(SongCard, track, index)}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {mixError && (
        <Typography variant="caption" color="error" sx={{ mt: 1, px: 1 }}>
          {mixError}
        </Typography>
      )}
    </Box>
  );
}





// --------------------
