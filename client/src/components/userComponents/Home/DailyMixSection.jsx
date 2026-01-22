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
  const MAX_ROW_SONGS = 8;
  const rowQueue = mixQueue.slice(0, MAX_ROW_SONGS);
  const placeholderCards = Array.from({ length: MAX_ROW_SONGS });

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
    <>
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

            <Box
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: spacingGap,
              pb: 2,
              px: { xs: 1, sm: 2 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              "&-ms-overflow-style": "none",
            }}
            >
              {rowQueue.map((track, index) => (
              <Box key={`scroll-${track._id || track.id || `mix-${index}`}`} sx={{ flexShrink: 0 }}>
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
    </>
  );
}
