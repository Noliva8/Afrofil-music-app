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






export default function HomeFreePlan() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 1200,
      mx: 'auto',
      p: isMobile ? 2 : 3
    }}>
      <Typography 
        component="h2" 
        variant={isMobile ? "h6" : "h5"} 
        sx={{ 
          mb: 2, 
          mt: isMobile ? 4 : 9,
          fontWeight: 600,
          color: '#ffffff'
        }}
      >
        Profile Information
      </Typography>

      {/* Bio */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12}} >
          <Bio />
        </Grid>
      </Grid>

      {/* Details Section - Responsive columns */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4}} >
          <Country />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4}} >
          <Region />
        </Grid> 

        <Grid size={{ xs: 12, sm: 6, md: 4}}>
          <Language />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4}}>
          <Genre />
        </Grid>
      </Grid>
    </Box>
  );
}
