import { useMemo, useState } from "react";
import Grid from "@mui/material/Grid2";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tabs,
  Tab,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloseRounded,
  LanguageRounded,
  LocationOnRounded,
  MoodRounded,
  MusicNoteRounded,
  PublicRounded,
  SearchRounded,
  StarRounded,
  TrendingFlatRounded,
  TrendingUpRounded,
  FavoriteBorderRounded,
  PlayArrowRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/** -----------------------------
 * DATA (replace later with API)
 * ------------------------------ */

// All African countries (kept)
const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Djibouti", "DR Congo",
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

// Diaspora hotspots (intentionally narrow)
const DIASPORA_HOTSPOTS = ["UK", "USA", "France", "Canada", "Germany"];

// Regions (African-first organizing principle)
const REGIONS = [
  { key: "west", label: "West Africa", subtitle: "Afrobeats, Highlife, Hiplife", emoji: "🌍" },
  { key: "east", label: "East Africa", subtitle: "Bongo Flava, Gengetone, Afro-pop", emoji: "🌊" },
  { key: "south", label: "Southern Africa", subtitle: "Amapiano, Afro-house, Kwaito", emoji: "🔥" },
  { key: "north", label: "North Africa", subtitle: "Rai, Arabic pop, Amazigh sounds", emoji: "🏜️" },
  { key: "central", label: "Central Africa", subtitle: "Soukous, Ndombolo, Afro-rumba", emoji: "💃" },
  { key: "diaspora", label: "Diaspora", subtitle: "Afro-fusion across the world", emoji: "✈️" },
];

// Genres (main list aligned with upload form)
const GENRES = [
  { name: "Afrobeats", color: "#FF6B6B", icon: "🎵" },
  { name: "Amapiano", color: "#4ECDC4", icon: "🎹" },
  { name: "Afro Pop", color: "#118AB2", icon: "🌟" },
  { name: "Afro-Fusion", color: "#EF476F", icon: "🌀" },
  { name: "Afro-House", color: "#06D6A0", icon: "🏠" },
  { name: "Afro-R&B", color: "#9D4EDD", icon: "💜" },
  { name: "Hip Hop", color: "#FF9E00", icon: "🎤" },
  { name: "Gospel (African)", color: "#7209B7", icon: "🙏" },
  { name: "R&B / Soul", color: "#00A878", icon: "💞" },
  { name: "Pop", color: "#FFD166", icon: "✨" },
];

const MOODS = [
  { name: "Party", emoji: "🎉", color: "#FF6B6B" },
  { name: "Chill", emoji: "😌", color: "#74C0FC" },
  { name: "Love", emoji: "💕", color: "#F06595" },
  { name: "Focus", emoji: "🧠", color: "#51CF66" },
  { name: "Workout", emoji: "💪", color: "#FF922B" },
  { name: "Spiritual", emoji: "🙏", color: "#9D4EDD" },
  { name: "Street", emoji: "🚦", color: "#00A878" },
  { name: "Sad", emoji: "🥲", color: "#4E6E81" },
  { name: "Happy", emoji: "😊", color: "#FFD43B" },
  { name: "Late Night", emoji: "🌙", color: "#6741D9" },
];

// Trending artists (placeholder)
const TRENDING_ARTISTS = [
  { name: "Burna Boy", country: "Nigeria", plays: "5.8M", color: "#FF6B6B" },
  { name: "Ayra Starr", country: "Nigeria", plays: "2.4M", color: "#4ECDC4" },
  { name: "Tems", country: "Nigeria", plays: "3.2M", color: "#FFD166" },
  { name: "Rema", country: "Nigeria", plays: "4.1M", color: "#06D6A0" },
  { name: "Black Sherif", country: "Ghana", plays: "1.8M", color: "#118AB2" },
  { name: "Sauti Sol", country: "Kenya", plays: "2.1M", color: "#EF476F" },
  { name: "Master KG", country: "South Africa", plays: "3.5M", color: "#7209B7" },
  { name: "Diamond Platnumz", country: "Tanzania", plays: "4.3M", color: "#FF9E00" },
];

/** -----------------------------
 * UI BUILDING BLOCKS
 * ------------------------------ */

function SectionHeader({ title, subtitle, onViewAll, icon }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
      <Box sx={{ 
        display: "flex", 
        alignItems: { xs: "flex-start", sm: "center" }, 
        justifyContent: "space-between", 
        mb: 0.75,
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {icon}
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
            {title}
          </Typography>
        </Box>
        {onViewAll && (
          <Button
            endIcon={<TrendingFlatRounded />}
            onClick={onViewAll}
            size={isMobile ? "small" : "medium"}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: theme.palette.primary.main,
              "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
              alignSelf: { xs: "flex-start", sm: "center" },
              mt: { xs: 0.5, sm: 0 }
            }}
          >
            View All
          </Button>
        )}
      </Box>
      {subtitle && (
        <Typography variant="body1" sx={{ 
          color: theme.palette.text.secondary,
          fontSize: { xs: '0.9rem', sm: '1rem' }
        }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function CountriesDialog({ open, onClose, title, items, badgeLabel, onPick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return items;
    return items.filter((x) => x.toLowerCase().includes(t));
  }, [items, searchTerm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 4 },
          background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          m: { xs: 1, sm: 2 },
          maxHeight: '90vh'
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          pb: 2,
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
          <LocationOnRounded sx={{ color: theme.palette.primary.main, fontSize: { xs: 20, sm: 24 } }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </Typography>
          </Box>
          <Chip label={`${items.length} ${badgeLabel}`} size="small" color="primary" />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
        <TextField
          fullWidth
          placeholder={`Search ${badgeLabel}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: alpha(theme.palette.text.primary, 0.55) }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
            },
          }}
        />

        <Grid container spacing={{ xs: 1.5, sm: 2 }} disableEqualOverflow>
          {filtered.map((item) => (
            <Grid key={item} xs={6} sm={4} md={3}>
              <Paper
                onClick={() => onPick(item)}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    transform: "translateY(-2px)",
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <Typography variant="body1" sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  {item}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`, 
        p: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 }
      }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }} size={isMobile ? "small" : "medium"}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CountryCard({ label, chipLabel, onClick, variant = "primary" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const accent = variant === "primary" ? theme.palette.primary.main : theme.palette.info.main;

  return (
    <Card
      onClick={() => onClick(label)}
      sx={{
        borderRadius: { xs: 2, sm: 3 },
        cursor: "pointer",
        transition: "all 0.25s ease",
        background: `linear-gradient(135deg, ${alpha(accent, 0.14)} 0%, ${alpha(accent, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        height: '100%',
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 18px 38px ${alpha(theme.palette.common.black, 0.14)}`,
          borderColor: accent,
        },
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ 
            bgcolor: accent, 
            width: { xs: 36, sm: 44 }, 
            height: { xs: 36, sm: 44 },
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            <PublicRounded sx={{ fontSize: 'inherit' }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
              fontWeight: 800,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {label}
            </Typography>
            <Chip
              label={chipLabel}
              size="small"
              sx={{
                mt: 0.75,
                backgroundColor: alpha(accent, 0.12),
                color: accent,
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.8125rem' }
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RegionCard({ region, onClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Card
      onClick={() => onClick(region.label)}
      sx={{
        borderRadius: { xs: 2, sm: 3 },
        cursor: "pointer",
        transition: "all 0.25s ease",
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
        height: { xs: 100, sm: 124, md: 128 },
        width: "100%",
        minWidth: 0,
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 18px 38px ${alpha(theme.palette.common.black, 0.14)}`,
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 2.5 }, 
        height: "100%", 
        display: "flex",
        alignItems: 'center'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Avatar sx={{ 
            width: { xs: 36, sm: 42 }, 
            height: { xs: 36, sm: 42 }, 
            bgcolor: alpha(theme.palette.primary.main, 0.12), 
            color: theme.palette.primary.main 
          }}>
            <Typography sx={{ 
              fontSize: { xs: 16, sm: 20 }, 
              fontWeight: 900 
            }}>
              {region.emoji}
            </Typography>
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{
                fontWeight: 900,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {region.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.75rem', sm: '0.82rem' },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                mt: 0.25
              }}
            >
              {region.subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function GenreCard({ genre, onClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      onClick={() => onClick(genre.name)}
      sx={{
        borderRadius: { xs: 2, sm: 3 },
        cursor: "pointer",
        transition: "all 0.25s ease",
        background: `linear-gradient(135deg, ${alpha(genre.color, 0.16)} 0%, ${alpha(genre.color, 0.06)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        height: '100%',
        minHeight: { xs: 100, sm: 118 },
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 18px 38px ${alpha(genre.color, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 }, 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: { xs: 1, sm: 1.75 } }}>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>{genre.icon}</Typography>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
            fontWeight: 900, 
            color: genre.color,
            fontSize: { xs: '0.95rem', sm: '1.25rem' }
          }}>
            {genre.name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary, 
            fontWeight: 600,
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            Explore
          </Typography>
          <IconButton size="small" sx={{ color: genre.color, p: { xs: 0.5, sm: 0.75 } }}>
            <PlayArrowRounded sx={{ fontSize: { xs: 16, sm: 20 } }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

function MoodCard({ mood, onClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      onClick={() => onClick(mood.name)}
      sx={{
        borderRadius: { xs: 2, sm: 3 },
        cursor: "pointer",
        transition: "all 0.25s ease",
        background: `linear-gradient(135deg, ${alpha(mood.color, 0.16)} 0%, ${alpha(mood.color, 0.06)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        height: '100%',
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 18px 38px ${alpha(mood.color, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>{mood.emoji}</Typography>
            <Typography variant={isMobile ? "subtitle1" : "subtitle1"} sx={{ 
              fontWeight: 800, 
              mt: 0.5,
              fontSize: { xs: '0.95rem', sm: '1.1rem' }
            }}>
              {mood.name}
            </Typography>
          </Box>
          <Chip
            label="Play"
            size="small"
            sx={{
              backgroundColor: alpha(mood.color, 0.18),
              color: mood.color,
              fontWeight: 800,
              fontSize: { xs: '0.7rem', sm: '0.8125rem' }
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/** -----------------------------
 * MAIN EXPLORE
 * ------------------------------ */

export default function Explore() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);

  const [dialogs, setDialogs] = useState({
    africaCountries: false,
    diaspora: false,
  });

  const openDialog = (key) => setDialogs((p) => ({ ...p, [key]: true }));
  const closeDialog = (key) => setDialogs((p) => ({ ...p, [key]: false }));

  const handlePick = (type, value) => {
    const slug = encodeURIComponent(String(value || "").trim());
    if (!slug) return;
    navigate(`/explore/${type}/${slug}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflowX: "hidden",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.82
        )} 100%)`,
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ 
        py: { xs: 2, sm: 3, md: 4 }, 
        px: { xs: 1.5, sm: 2, md: 4 } 
      }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 2, sm: 3 }}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent="space-between"
          >
            <Box sx={{ maxWidth: 760 }}>
              <Typography
                variant={isMobile ? "h4" : "h3"}
                sx={{
                  fontWeight: 950,
                  letterSpacing: { xs: "-0.5px", sm: "-1px" },
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                }}
              >
                Explore Africa
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ 
                color: theme.palette.text.secondary, 
                fontWeight: 400,
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
              }}>
                Discover new sounds across Africa, then follow the diaspora wave.
              </Typography>
            </Box>
          </Stack>

          {/* Tabs (now actually controls what renders) */}
          <Paper
            sx={{
              mt: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, sm: 3 },
              background: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: "blur(10px)",
              overflow: 'hidden'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: { xs: 48, sm: 56 },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: { xs: '0.85rem', sm: '0.98rem' },
                  py: { xs: 1, sm: 1.5 },
                  minHeight: "auto",
                  minWidth: { xs: 80, sm: 120 }
                },
              }}
            >
              <Tab icon={<LocationOnRounded sx={{ fontSize: { xs: 18, sm: 20 } }} />} iconPosition="start" label="Africa" />
              <Tab icon={<MusicNoteRounded sx={{ fontSize: { xs: 18, sm: 20 } }} />} iconPosition="start" label="Genres" />
              <Tab icon={<MoodRounded sx={{ fontSize: { xs: 18, sm: 20 } }} />} iconPosition="start" label="Moods" />
              <Tab icon={<StarRounded sx={{ fontSize: { xs: 18, sm: 20 } }} />} iconPosition="start" label="Featured" />
            </Tabs>
          </Paper>
        </Box>

        {/* TAB 0: AFRICA */}
        {tabValue === 0 && (
          <>
            {/* Regions */}
            <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
              <SectionHeader
                title="Explore by Region"
                subtitle="Start with a scene: West, East, Southern, North, Central, and Diaspora."
                icon={<LocationOnRounded sx={{ 
                  color: theme.palette.primary.main, 
                  fontSize: { xs: 22, sm: 26, md: 28 } 
                }} />}
              />
              <Grid container spacing={{ xs: 2, sm: 3 }} disableEqualOverflow justifyContent="center">
                {REGIONS.map((r) => (
                  <Grid key={r.key} xs={12} sm={6} md={4} sx={{ minWidth: 0 }}>
                    <RegionCard region={r} onClick={(key) => handlePick("region", key)} />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* African Countries */}
            <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
              <SectionHeader
                title="Countries across Africa"
                subtitle="Discover music by country. (You can later map this to charts + local trends.)"
                onViewAll={() => openDialog("africaCountries")}
                icon={<PublicRounded sx={{ 
                  color: theme.palette.primary.main, 
                  fontSize: { xs: 22, sm: 26, md: 28 } 
                }} />}
              />

              <Grid container spacing={{ xs: 1.5, sm: 3 }} disableEqualOverflow>
                {AFRICAN_COUNTRIES.slice(0, isMobile ? 4 : isTablet ? 6 : 8).map((c) => (
                  <Grid key={c} xs={6} sm={4} md={3}>
                    <CountryCard 
                      label={c} 
                      chipLabel="Africa" 
                      variant="primary" 
                      onClick={(v) => handlePick("country", v)} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Diaspora (smaller + lower) */}
            <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
              <SectionHeader
                title="Diaspora hotspots"
                subtitle="African sounds traveling globally (kept intentionally small)."
                onViewAll={() => openDialog("diaspora")}
                icon={<LanguageRounded sx={{ 
                  color: theme.palette.info.main, 
                  fontSize: { xs: 22, sm: 26, md: 28 } 
                }} />}
              />
              <Grid container spacing={{ xs: 1.5, sm: 3 }} disableEqualOverflow>
                {DIASPORA_HOTSPOTS.slice(0, isMobile ? 4 : 5).map((c) => (
                  <Grid key={c} xs={6} sm={4} md={3}>
                    <CountryCard 
                      label={c} 
                      chipLabel="Diaspora" 
                      variant="info" 
                      onClick={(v) => handlePick("country", v)} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}

        {/* TAB 1: GENRES */}
        {tabValue === 1 && (
          <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
            <SectionHeader
              title="Genres"
              subtitle="Tap a genre to open a dedicated discovery page or build a queue."
              icon={<MusicNoteRounded sx={{ 
                color: theme.palette.secondary.main, 
                fontSize: { xs: 22, sm: 26, md: 28 } 
              }} />}
            />
            <Grid container spacing={{ xs: 1.5, sm: 3 }} disableEqualOverflow>
              {GENRES.map((g) => (
                <Grid key={g.name} xs={6} sm={4} md={3}>
                  <GenreCard genre={g} onClick={(v) => handlePick("genre", v)} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 2: MOODS */}
        {tabValue === 2 && (
          <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
            <SectionHeader
              title="Moods & Vibes"
              subtitle="One tap should start playback (station/queue)."
              icon={<MoodRounded sx={{ 
                color: theme.palette.success.main, 
                fontSize: { xs: 22, sm: 26, md: 28 } 
              }} />}
            />
            <Grid container spacing={{ xs: 1.5, sm: 2 }} disableEqualOverflow>
              {MOODS.map((m) => (
                <Grid key={m.name} xs={6} sm={4} md={3}>
                  <MoodCard mood={m} onClick={(v) => handlePick("mood", v)} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 3: FEATURED (stub) */}
        {tabValue === 3 && (
          <Box sx={{ mb: { xs: 5, sm: 6, md: 7 } }}>
            <SectionHeader
              title="Featured"
              subtitle="Add editorial playlists, new releases, cultural moments, and spotlight artists here."
              icon={<StarRounded sx={{ 
                color: theme.palette.primary.main, 
                fontSize: { xs: 22, sm: 26, md: 28 } 
              }} />}
            />
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: { xs: 2, sm: 3 },
                border: `1px dashed ${alpha(theme.palette.divider, 0.35)}`,
                background: alpha(theme.palette.background.paper, 0.55),
              }}
            >
              <Typography sx={{ 
                color: theme.palette.text.secondary, 
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>
                Recommended: Featured should be your highest-quality curated content (playlists + new releases + regional highlights).
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Dialogs */}
        <CountriesDialog
          open={dialogs.africaCountries}
          onClose={() => closeDialog("africaCountries")}
          title="All African Countries"
          items={AFRICAN_COUNTRIES}
          badgeLabel="countries"
          onPick={(v) => {
            closeDialog("africaCountries");
            handlePick("country", v);
          }}
        />

        <CountriesDialog
          open={dialogs.diaspora}
          onClose={() => closeDialog("diaspora")}
          title="Diaspora Hotspots"
          items={DIASPORA_HOTSPOTS}
          badgeLabel="countries"
          onPick={(v) => {
            closeDialog("diaspora");
            handlePick("country", v);
          }}
        />
      </Container>
    </Box>
  );
}