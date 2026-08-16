import "../CSS/CSS-HOME-FREE-PLAN/homeFreePlan.css";
import Bio from "../../components/homeFreePlanComponents/Bio.jsx";
import Language from "../../components/homeFreePlanComponents/Language.jsx";
import Country from "../../components/homeFreePlanComponents/Country.jsx";
import Region from "../../components/homeFreePlanComponents/Region.jsx";
import Genre from "../../components/homeFreePlanComponents/Genre.jsx";
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";






export default function HomeFreePlan() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 1180,
      mx: 'auto',
      px: isMobile ? 1 : 3,
      py: { xs: 2, md: 3 },
    }}>
      <Typography 
        component="h1" 
        sx={{ 
          mb: 0.75, 
          mt: isMobile ? 2 : 5,
          fontWeight: 900,
          fontSize: { xs: "1.8rem", md: "2.35rem" },
          color: theme.palette.text.primary,
          letterSpacing: 0,
        }}
      >
        Creator Profile
      </Typography>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          maxWidth: 680,
          lineHeight: 1.55,
        }}
      >
        Keep your public creator details current so listeners know where you are from, what you make, and how to discover your work.
      </Typography>

      {/* Bio */}
      <Grid container spacing={2.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12}} >
          <Bio />
        </Grid>
      </Grid>

      {/* Details Section */}
      <Grid
        container
        spacing={2.5}
        sx={{
          p: { xs: 0, md: 0.5 },
          borderRadius: "8px",
          background: alpha(theme.palette.background.paper, 0.2),
        }}
      >
        <Grid size={{ xs: 12, md: 6 }} >
          <Country />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} >
          <Region />
        </Grid> 

        <Grid size={{ xs: 12, md: 6 }}>
          <Language />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Genre />
        </Grid>
      </Grid>
    </Box>
  );
}
