import React, { useState, useEffect } from "react";
import { ARTIST_PROFILE } from "../utils/artistQuery";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../utils/mutations";
import { useQuery, useMutation } from "@apollo/client";
import { Link } from "react-router-dom";

// import StudioNavBar from "./StudioNavBar";
import { SitemarkIcon } from "../components/themeCustomization/customIcon";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import "../pages/CSS/freeAppNavBar.css";
import ArtistAuth from "../utils/artist_auth";
import AppBar from "@mui/material/AppBar";
import MuiToolbar from "@mui/material/Toolbar";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import MenuButton from "./MenuButton";
import Divider from "@mui/material/Divider";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Typography from "@mui/material/Typography";
import { tabsClasses } from "@mui/material/Tabs";
import Button from '@mui/material/Button';
import AccountMenu from "./AccountMenu";

const Toolbar = styled(MuiToolbar)({
  width: "100%",
  padding: "12px",
  display: "flex",

  justifyContent: "center",
  gap: "12px",
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: "8px",
    p: "8px",
    pb: 0,
  },
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

export default function FreePlanAppNavBar({handleShowMobileMenu,  handleshowAccountMenu, showAccountMenu, artistProfile, profileImage}) {





  return (
    <>
      {/* App Bar */}

      <AppBar
        position="fixed"
        sx={{
          display: { xs: "auto", md: "none" },
          boxShadow: 0,
          bgcolor: "var(--primary-background-color)",
          backgroundImage: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          top: "var(--template-frame-height, 0px)",
        }}
      >
        <Box sx={{ px: 5 }}>
          <Toolbar variant="regular">
            {/* added */}
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                flexGrow: 1,
                width: "100%",

                gap: 1,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "center", mr: "auto", alignItems: 'center'}}
              >
                <SitemarkIcon />
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ color: "var(--primary-font-color)" }}
                >
                  Studio
                </Typography>
              </Stack>

              <Box  sx={{display: 'flex', gap: '25px'}} >


              <Button onClick={handleshowAccountMenu}>
                <Avatar alt={artistProfile.fullName} src={profileImage} sx={{border: '1px solid #e59f25'}} />
                </Button>

                <AccountMenu 
                handleShowMobileMenu= {handleshowAccountMenu} 
                showAccountMenu={showAccountMenu} 
                profileImage= {profileImage}
                artistProfile={artistProfile}
                />



                

              <MenuButton aria-label="menu" onClick={handleShowMobileMenu}>
                <MenuRoundedIcon sx={{color: 'white', fontSize: '2rem'}} />
              </MenuButton>

              </Box>


            </Stack>
          </Toolbar>
        </Box>
      </AppBar>
    </>
  );
}

export function CustomIcon() {
  return (
    <Box
      sx={{
        width: "1.5rem",
        height: "1.5rem",
        bgcolor: "black",
        borderRadius: "999px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        backgroundImage:
          "linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)",
        color: "hsla(210, 100%, 95%, 0.9)",
        border: "1px solid",
        borderColor: "hsl(210, 100%, 55%)",
        boxShadow: "inset 0 2px 5px rgba(255, 255, 255, 0.3)",
      }}
    >
      <DashboardRoundedIcon color="inherit" sx={{ fontSize: "1rem" }} />
    </Box>
  );
}




