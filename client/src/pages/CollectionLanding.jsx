import { Box, Collapse, Container, Stack, Typography, alpha, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const COLLECTION_ITEMS = [
  {
    label: "Playlists",
    path: "/collection/playlist",
    children: [
      { label: "Create Playlist", path: "/collection/playlist/create_playlist" },
      { label: "Recently Played", path: "/collection/playlist/recent_played" },
    ],
  },
  { label: "Liked Songs", path: "/collection/liked_songs" },
  { label: "Albums", path: "/collection/albums" },
  { label: "Artists", path: "/collection/artists" },
  { label: "Stations", path: "/collection/stations" },
  { label: "Short Videos", path: "/collection/short_videos" },
  { label: "Downloads", path: "/collection/downloads" },
];

export default function CollectionLanding() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [playlistOpen, setPlaylistOpen] = useState(false);

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
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Collections
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
          Pick a collection to continue.
        </Typography>
        <Stack spacing={1.5}>
          {COLLECTION_ITEMS.map((item) => (
            <Box key={item.path}>
              <Box
                onClick={() => {
                  if (item.children) {
                    setPlaylistOpen((prev) => !prev);
                    return;
                  }
                  navigate(item.path);
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  background: alpha(theme.palette.background.paper, 0.7),
                  fontWeight: 700,
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>{item.label}</Box>
                  {item.children && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.85rem",
                        color: theme.palette.text.secondary,
                        transform: playlistOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▼
                    </Box>
                  )}
                </Box>
              </Box>
              {item.children && (
                <Collapse in={playlistOpen} timeout="auto" unmountOnExit>
                <Stack spacing={1} sx={{ mt: 1, ml: 2 }}>
                  {item.children.map((child) => (
                    <Box
                      key={child.path}
                      onClick={() => navigate(child.path)}
                      sx={{
                        px: 2,
                        py: 1.25,
                        borderRadius: 2,
                        cursor: "pointer",
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        background: alpha(theme.palette.background.paper, 0.55),
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {child.label}
                    </Box>
                  ))}
                </Stack>
                </Collapse>
              )}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
