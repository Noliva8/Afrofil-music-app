import { Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ARTIST_PROFILE } from "../utils/artistQuery";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../utils/mutations";
import { useQuery, useMutation } from "@apollo/client";

import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import FreePlanAppNavBar from "../components/FreePlanAppNavBar";
import StudioHeader from "../components/StudioHeader";
import SideMenu from "../components/SideNavBar";
import SideMenuReduced from "../components/SideNavBarReduced";
import { Typography } from "@mui/material";
import Grid from '@mui/material/Grid2';
import MobileSideMenu from "../components/MobileSideMenu";
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';



const theme = createTheme({
  palette: {
    primary: {
      main: '#441a49'
    },
    secondary: {
      main: '#ffde00'
    }

  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem'
    }
  },
  spacing: 8
});





export default function ArtistStudio() {
  const {
    loading,
    error,
    data: artistData,
    refetch,
  } = useQuery(ARTIST_PROFILE);

  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [profileImage, setProfileImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  
  const [isVisible, setIsVisible] = useState(false);

  // Open drawer
  const [openDrawer, setOpenDrawer] = useState(true);
  const handleShowDrawers = () => {
    setOpenDrawer((prev) => !prev);
  };

  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const handleShowMobileMenu = () => {
    setOpenMobileMenu((prev) => !prev);
  };

  // for the account menu
  // -------------------

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleshowAccountMenu = () => {
    setShowAccountMenu((prev) => !prev);
    console.log("biteeee");
  };

  // Show profile image anytime this profile loads (keep folder path)
  const deriveKeyFromUrl = (url) => {
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) return String(url).replace(/^\/+/, "");
    try {
      const u = new URL(url);
      return decodeURIComponent((u.pathname || "").replace(/^\/+/, ""));
    } catch {
      return "";
    }
  };

  let key = null;
  if (
    artistData &&
    artistData.artistProfile &&
    artistData.artistProfile.profileImage
  ) {
    key = deriveKeyFromUrl(artistData.artistProfile.profileImage);
  }

  // Fetch the presigned URL for the profile image
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!key) return; // If no key, don't fetch

      try {
        // Fetch the presigned URL for downloading
        const { data } = await getPresignedUrlDownload({
          variables: {
            bucket: "afrofeel-profile-picture",
            key: key,
            region: "us-west-2",
          },
        });


        const presignedUrl = data.getPresignedUrlDownload.url;


console.log('structure of url on artist side:', presignedUrl)
        // Fetch the image from S3 using the presigned URL
        // const imageResponse = await fetch(presignedUrl);
        // if (!imageResponse.ok) {
        //   throw new Error("Failed to fetch image from presigned URL");
        // }

        // // Convert the image response into a Blob (binary data)
        // const imageBlob = await imageResponse.blob();

        // // Create an Object URL for the image (for displaying in an <img> tag or as background)
        // const imageObjectURL = URL.createObjectURL(imageBlob);

        // Set the image URL
        setProfileImage(presignedUrl);
        setIsLoadingImage(false); // Mark loading as false once image is fetched
      } catch (error) {
        console.error("Error during profile image fetch:", error);
        setIsLoadingImage(false);
      }
    };

    fetchPresignedUrl(); // Call the function to fetch the URL and image
  }, [key]);

  // Early return for loading/error states before render
  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error fetching profile data: {error.message}</p>;
  if (!artistData || !artistData.artistProfile)
    return <p>No profile data available</p>;

  // end show profile

  const artistProfile = artistData.artistProfile;

  return (
    <>


<ThemeProvider theme={theme}>


  
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex",
      }}>
        <SideMenu
          openDrawer={openDrawer}
          profileImage={profileImage}
          artistProfile={artistProfile}
        />
        {!openDrawer && (
          <SideMenuReduced
            open={true}
            setOpenDrawer={setOpenDrawer}
            profileImage={profileImage}
            artistProfile={artistProfile}
          />
        )}
        
        <MobileSideMenu
          openMobileMenu={openMobileMenu}
          handleShowMobileMenu={handleShowMobileMenu}
          profileImage={profileImage}
          artistProfile={artistProfile}
        />
        <FreePlanAppNavBar
          profileImage={profileImage}
          artistProfile={artistProfile}
          handleShowMobileMenu={handleShowMobileMenu}
          handleshowAccountMenu={handleshowAccountMenu}
          showAccountMenu={showAccountMenu}
        />

        {/* Main content */}

        <Box
          component="main"
         sx={{
           flexGrow: 1,
            width: '100%',
            height: 'auto',

            overflow: "auto",
            bgcolor: "var(--primary-background-color)",
            alignItems: "center",
         }}
        >
          <Box
            spacing={4}
            sx={{
              alignItems: "center",
              mx: 3,
              
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <StudioHeader
              openDrawer={openDrawer}
              handleShowDrawers={handleShowDrawers}
              handleshowAccountMenu={handleshowAccountMenu}
              profileImage={profileImage}
            />

             <Box sx={{ overflowY: 'scroll',
           
             }}  >
              <Outlet />
          </Box>

          

          </Box>
        </Box>
      </Box>
</ThemeProvider>
    </>
  );
}
