import React from "react";
import "../CSS/CSS-HOME-FREE-PLAN/homeFreePlan.css";
import Bio from "../../components/homeFreePlanComponents/Bio.jsx";
import Language from "../../components/homeFreePlanComponents/Language.jsx";
import Country from "../../components/homeFreePlanComponents/Country.jsx";
import Genre from "../../components/homeFreePlanComponents/Genre.jsx";
import AppTheme from "../../components/theme.jsx";

import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ArtistAccountProfile from "../../components/homeFreePlanComponents/ArtistAccountProfile.jsx";

export default function HomeFreePlan() {
  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Profile Information
      </Typography>

      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
       
        <Grid size={{ xs: 12 }}>
          <Bio />
        </Grid>


      </Grid>


    </Box>

    //     <div className="wrapper">
    //       <div className="inner-wrapper">
    //         <header>
    //           <h1>Complete Your Profile</h1>
    //         </header>

    //         <main className="mainWrapper">

    // <Grid>
    // <Grid size={3}>
    //  <ArtistAccountProfile />
    // </Grid>

    // <Grid size={8}>
    //    <Bio />
    // </Grid>

    // <Grid size={3}>
    //  <Language />
    // </Grid>

    //        <Grid size={3}>
    //     <Language />
    // </Grid>

    //      <Grid size={3}>
    //       <Country />
    // </Grid>

    //   <Grid size={3}>
    //           <Genre />
    // </Grid>

    //       </Grid>

    //         </main>
    //       </div>

    //       <footer>
    //         <h4>This is the footer</h4>
    //       </footer>
    //     </div>
  );
}
