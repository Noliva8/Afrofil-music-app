// MainMenu.jsx
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import TrendingSongs from "./homeFreePlanComponents/TrendingSongs";
import TopManagers from "./homeFreePlanComponents/TopManagers";
import RecommendedSongs from "./homeFreePlanComponents/RecommendedSongs";
import TopArtist from "./homeFreePlanComponents/TopArtist";
import TopProducer from "./homeFreePlanComponents/TopProducer";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import ShieldMoonRoundedIcon from "@mui/icons-material/ShieldMoonRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { useNavigate } from "react-router-dom";

const MainMenu = ({ 
  songsWithArtwork,
  refetch,
  onSwitchToLogin
   }) => {

  const navigate = useNavigate();

  const handleCardClick = (song) => {
    const artistId = song?.artistId || song?.artist?._id;
    if (!artistId) return;
    navigate(`/artist/${artistId}`, { state: { song } });
  };




  const handleStartListening = () => {
    if (typeof onSwitchToLogin === "function") onSwitchToLogin();
  };

  return (
    <Box
      sx={{
        pt: { xs: 8, md: 10 },
        mt: 5,
        px: { xs: 2, md: 4 },
        backgroundColor: "#0A0A0A",
        color: "white",
        minHeight: "100vh",
        pb: { xs: 20, sm: 24 }
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          mb: { xs: 6, md: 8 },
          px: { xs: 2.5, sm: 3.5, md: 5 },
          py: { xs: 3.5, sm: 4.5, md: 5.5 },
          background: `
            radial-gradient(circle at 20% 20%, rgba(228,196,33,0.12) 0, transparent 32%),
            radial-gradient(circle at 85% 10%, rgba(178,80,53,0.22) 0, transparent 28%),
            linear-gradient(135deg, #0f0f0f 0%, #131313 60%, #0f0f0f 100%)
          `,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          gap: { xs: 3, md: 4 }
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label="AfroFeel"
              sx={{
                bgcolor: "rgba(228,196,33,0.14)",
                color: "#E4C421",
                fontWeight: 700,
                borderRadius: "999px",
                border: "1px solid rgba(228,196,33,0.3)"
              }}
            />
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              Sound that travels with you
            </Typography>
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.8px",
              lineHeight: 1.1,
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.1rem" }
            }}
          >
            Playlists built for the moment. Ads when they make sense.
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.74)",
              maxWidth: 520,
              fontSize: { xs: 15, sm: 16 }
            }}
          >
            Discover curated Afro sounds, smart ad breaks, and a studio built for artists.
            Switch seamlessly between listening and creating.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
            <Button
              size="large"
              onClick={handleStartListening}
              startIcon={<PlayArrowRoundedIcon />}
              sx={{
                px: 3.5,
                py: 1.4,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
                background: "linear-gradient(90deg, #E4C421, #B25035)",
                color: "#0f0f0f",
                "&:hover": {
                  background: "linear-gradient(90deg, #F8D347, #C96146)",
                  transform: "translateY(-1px)"
                }
              }}
            >
              Start listening
            </Button>

            <Button
              size="large"
              variant="outlined"
              onClick={() => navigate("/artist/register")}
              endIcon={<RocketLaunchRoundedIcon />}
              sx={{
                px: 3.5,
                py: 1.4,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
                color: "#E4C421",
                borderColor: "rgba(228,196,33,0.4)",
                "&:hover": { borderColor: "#E4C421", background: "rgba(228,196,33,0.08)" }
              }}
            >
              Enter the Studio
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ mt: 2 }}
          >
            {[
              { icon: <GraphicEqRoundedIcon />, label: "Hand-tuned mixes" },
              { icon: <ShieldMoonRoundedIcon />, label: "Smart ad pacing" },
              { icon: <QueueMusicRoundedIcon />, label: "Artist-friendly tools" }
            ].map((item) => (
              <Stack key={item.label} direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.08)",
                    color: "#E4C421"
                  }}
                >
                  {item.icon}
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.78)", fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 260, md: 320 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 3,
              p: 3,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: 2
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #E4C421 0%, #B25035 100%)",
                  display: "grid",
                  placeItems: "center",
                  color: "#0f0f0f",
                  fontWeight: 800,
                  letterSpacing: "-0.5px"
                }}
              >
                AF
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                  Golden Hour in Lagos
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                  Burna • Tems • Ayra Starr
                </Typography>
              </Box>
              <Box
                sx={{
                  ml: "auto",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(228,196,33,0.18)",
                  border: "1px solid rgba(228,196,33,0.35)",
                  display: "grid",
                  placeItems: "center",
                  color: "#E4C421"
                }}
              >
                <PlayArrowRoundedIcon />
              </Box>
            </Stack>

            <Box
              sx={{
                height: 12,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
                position: "relative"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, rgba(228,196,33,0.9), rgba(178,80,53,0.9))",
                  width: "42%"
                }}
              />
            </Box>

            <Stack direction="row" justifyContent="space-between" sx={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              <Typography>01:12</Typography>
              <Typography>03:48</Typography>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Stack spacing={1.5}>
              {[
                "Offline-ready playlists",
                "Ad-smart streaming",
                "Upload & track plays (for artists)"
              ].map((item) => (
                <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "linear-gradient(90deg, #E4C421, #B25035)"
                    }}
                  />
                  <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: 14 }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      <TrendingSongs
        songsWithArtwork={songsWithArtwork}
        onCardClick={handleCardClick}
        refetch={refetch}
      />
      <RecommendedSongs />
      <Grid2 container spacing={4}>
        <TopArtist />
        <TopManagers />
        <TopProducer />
      </Grid2>
    </Box>
  );
};

export default MainMenu;
