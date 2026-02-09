import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { AddButton } from "./AddButton.jsx";

const DEFAULT_FALLBACK_ARTWORK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#1a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="24" font-family="Arial">No Cover</text></svg>`
  );

export const TrackListSection = ({
  tracks,
  getId,
  playingId,
  songId,
  playerIsPlaying,
  isMobile,
  fallbackArtwork = DEFAULT_FALLBACK_ARTWORK,
  onPlayTrack,
  onOpenTrackMenu,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onTouchStart,
  onTouchEnd,
  onNavigateTrack,
  onNavigateArtist,
  onNavigateAlbum,
  formatDuration,
}) => {
  const resolveAlbumId = (track) => {
    const rawAlbumId = track.albumId;
    const rawAlbum = track?.album;
    const albumIdFromTrack =
      typeof rawAlbumId === "string"
        ? rawAlbumId.includes("[object Object]")
          ? ""
          : rawAlbumId
        : rawAlbumId?._id || rawAlbumId?.id || "";
    const albumIdFromAlbum =
      typeof rawAlbum === "string"
        ? rawAlbum.includes("[object Object]")
          ? ""
          : rawAlbum
        : rawAlbum?._id || rawAlbum?.id || "";
    return albumIdFromTrack || albumIdFromAlbum;
  };

  if (!tracks?.length) return null;

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, my: { xs: 4, sm: 5 } }}>
      {/* Desktop Header */}
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
          Album
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

      {/* Mobile Header */}
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
          gap: 3
        }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
          #
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Title
        </Typography>

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
          Add
        </Typography>

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
          More
        </Typography>

      </Box>

      {/* Tracks List */}
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
        {tracks.map((track, index) => {
          const trackId = getId(track);
          const isCurrent = playingId && trackId && playingId === trackId;
          const isRouteMatch = songId && trackId && String(trackId) === String(songId);
          const isActive = isCurrent || isRouteMatch;
          const thumbnail =
            track.thumbnail ||
            track.artworkUrl ||
            track.albumCoverImageUrl ||
            track.cover ||
            track.artwork ||
            track.album?.albumCoverImage;
          const artistName = track.artistName || track?.artist?.artistAka || "Unknown Artist";
          const albumName = track.albumName || track?.album?.title || "Single";
          const albumIdForLink = resolveAlbumId(track);

          return (
            <Box
              key={trackId || index}
              onTouchStart={(e) => onTouchStart?.(track, e)}
              onTouchEnd={onTouchEnd}
              onTouchMove={onTouchEnd}
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
                      "& .play-overlay": {
                        opacity: 1,
                        transform: "translateY(0)",
                        bgcolor: "rgba(0,0,0,0.35)",
                      },
                    },
                  }}
                  onClick={() => onPlayTrack?.(track)}
                >
                  <Box
                    component="img"
                    src={thumbnail || fallbackArtwork}
                    alt={track.title}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      if (fallbackArtwork) e.currentTarget.src = fallbackArtwork;
                    }}
                  />
                  <Box
                    className="play-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(6px)",
                      transition: "all 0.2s ease",
                      backgroundColor: isActive && playerIsPlaying ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)",
                    }}
                  >
                    <IconButton
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack?.(track);
                      }}
                      sx={{
                        width: { xs: 38, md: 44 },
                        height: { xs: 38, md: 44 },
                        borderRadius: "50%",
                        bgcolor: "rgba(228,196,33,0.25)",
                        border: "1px solid rgba(228,196,33,0.5)",
                        "&:hover": {
                          bgcolor: "rgba(228,196,33,0.35)",
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      {isActive && playerIsPlaying ? (
                        <PauseIcon sx={{ fontSize: { xs: 18, md: 22 }, color: "primary.contrastText" }} />
                      ) : (
                        <PlayArrowIcon sx={{ fontSize: { xs: 20, md: 24 }, color: "primary.contrastText", ml: 0.2 }} />
                      )}
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: { xs: 0.5, md: 0.5 } }}>
                  <Typography
                    onClick={() => trackId && onNavigateTrack?.(trackId)}
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      fontSize: { xs: "1rem", md: "1.15rem" },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.01em",
                      fontFamily: "'Clash Display', 'Space Grotesk', 'Sora', sans-serif",
                      cursor: trackId ? "pointer" : "default",
                      "&:hover": {
                        color: trackId ? "primary.main" : "text.primary",
                        textDecoration: trackId ? "underline" : "none",
                      },
                    }}
                  >
                    {track.title || "Untitled"}
                  </Typography>

                  <Typography
                    onClick={() => {
                      const artistId = track.artistId || track?.artist?._id || track?.artist;
                      if (artistId) onNavigateArtist?.(artistId);
                    }}
                    sx={{
                      color: "text.secondary",
                      fontSize: { xs: "0.85rem", md: "0.975rem" },
                      cursor: track.artistId || track?.artist?._id || track?.artist ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 500,
                      "&:hover": {
                        color: track.artistId || track?.artist?._id || track?.artist ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    {artistName}
                  </Typography>

                  <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                    <Typography
                      onClick={() => albumIdForLink && onNavigateAlbum?.(albumIdForLink)}
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.8rem",
                        cursor: albumIdForLink ? "pointer" : "default",
                        fontWeight: 500,
                        "&:hover": {
                          color: albumIdForLink ? "primary.main" : "text.secondary",
                          textDecoration: albumIdForLink ? "underline" : "none",
                        },
                      }}
                    >
                      {albumName}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "action.disabled" }} />
                      <Typography sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.8rem" }}>
                        {(track.playCount ?? track.plays ?? 0).toLocaleString()}
                      </Typography>
                      <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "action.disabled" }} />
                      <Typography sx={{ color: "text.primary", fontWeight: 500, fontSize: "0.8rem" }}>
                        {formatDuration?.(track.duration)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <AddButton
                handleAddToPlaylist={onAddToPlaylist}
                handleRemoveFromPlaylist={onRemoveFromPlaylist}
                track={track}
                sx={{ display: { xs: "flex", md: "none" } }}
              />

              <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center" }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTrackMenu?.(track, e);
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

              <Box sx={{ display: { xs: "none", md: "block" }, overflow: "hidden", px: 2 }}>
                <Typography
                  onClick={() => albumIdForLink && onNavigateAlbum?.(albumIdForLink)}
                  sx={{
                    color: "text.primary",
                    fontSize: "1rem",
                    cursor: albumIdForLink ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                    "&:hover": {
                      color: albumIdForLink ? "primary.main" : "text.primary",
                      textDecoration: albumIdForLink ? "underline" : "none",
                    },
                  }}
                >
                  {albumName}
                </Typography>
              </Box>

              <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", px: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "rgba(228,196,33,0.08)",
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    minWidth: 100,
                    border: "1px solid",
                    borderColor: "rgba(228,196,33,0.15)",
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 16, color: "primary.main", opacity: 0.8 }} />
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
              </Box>

              <Box sx={{ display: { xs: "none", md: "block" }, px: 2 }}>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  {formatDuration?.(track.duration)}
                </Typography>
              </Box>

              <AddButton
                handleAddToPlaylist={onAddToPlaylist}
                handleRemoveFromPlaylist={onRemoveFromPlaylist}
                track={track}
              />

              <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
                <IconButton
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTrackMenu?.(track, e);
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
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
