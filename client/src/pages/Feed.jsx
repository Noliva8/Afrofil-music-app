import React from "react";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme, alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

export default function Feed() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.82
        )} 100%)`,
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: "-1px",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Feed
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
            Follow your favorite artists and playlists to receive the latest updates.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px dashed ${alpha(theme.palette.divider, 0.35)}`,
            background: alpha(theme.palette.background.paper, 0.55),
            maxWidth: 720,
          }}
        >
          <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 2 }}>
            Sign in to build your personalized feed.
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Follow artists you love and add playlists to get notifications on new releases and updates.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/loginSignin")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
              },
            }}
          >
            Sign in
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
