import '../../components/homeFreePlanComponents/homeFreePlanComponentStyles/artistAccountProfile.css';
import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { ADD_PROFILE_IMAGE } from '../../utils/mutations';
import { ARTIST_PROFILE } from '../../utils/artistQuery';
import { GET_PRESIGNED_URL } from '../../utils/mutations';
import { GET_PRESIGNED_URL_DELETE } from '../../utils/mutations';
import { GET_PRESIGNED_URL_DOWNLOAD } from '../../utils/mutations';
import { toast } from "react-toastify";
// import './homeFreePlanComponentStyles/artistAccountProfile.css'
import customProfileImage from '../../images/custom-profile.jpg'
import Paper from "@mui/material/Paper";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import ArtistAuth from '../../utils/artist_auth';
import { resizeImageFile } from '../../utils/ResizeImageFile';

// Keep folder path when extracting keys from URLs/keys
const deriveKeyFromUrl = (url) => {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return String(url).replace(/^\/+/, '');
  try {
    const u = new URL(url);
    return decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
  } catch {
    return "";
  }
};



const ArtistAccountProfile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const { loading, error, data: artistData, refetch } = useQuery(ARTIST_PROFILE);

  const [addProfileImage] = useMutation(ADD_PROFILE_IMAGE);

  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [ getPresignedUrlDelete ] = useMutation(GET_PRESIGNED_URL_DELETE);

   const [isInputVisible, setInputVisible] = useState(false);
   const fileInputRef = useRef(null);
   const [displayEditButton , setDisplayEditButton] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
     
     const [isLoadingImage, setIsLoadingImage] = useState(true);

       const profile = ArtistAuth.getProfile();
const email = profile?.data?.email;
const fullName = profile?.data?.fullName;





  //  const profileData = ArtistAuth.getProfile();
  
const handleProfileImageUpload = async (e) => {
  e.preventDefault();

  // Get the current profile image URL from the database
  const profileImageUrl = artistData.artistProfile.profileImage;

  // Helper: derive full key (keeps folder path) from URL or key
  // If there is an existing image, prepare to delete it later
  let keyToDelete = deriveKeyFromUrl(profileImageUrl);

  // Step 1: Upload new image only if it's provided
  const file = e.target.files[0];
  if (!file) {
    toast.error("No file selected.");
    return;
  }

  let optimizedFile = file;
  try {
    optimizedFile = await resizeImageFile(file, 600, 0.85);
  } catch (resizeError) {
    console.warn("Image optimization failed, uploading original instead.", resizeError);
  }

  // Validate file type and size
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (!allowedTypes.includes(optimizedFile.type)) {
    toast.error("Invalid file type. Please upload an image file (JPEG, PNG).");
    return;
  }
  if (optimizedFile.size > maxSize) {
    toast.error("File size exceeds the maximum limit of 5 MB.");
    return;
  }


  let uploadedFileUrl = ""; 
  const uploadPrefix = "profile-picture/";

  try {
    // Step 2: Get the presigned URL for uploading the new image to S3
    setIsLoadingImage(true);



    const { data } = await getPresignedUrl({
      variables: {
        bucket: "afrofeel-profile-picture",
        key: `${uploadPrefix}${file.name}`,
        region: "us-west-2",
      },
    });

    const presignedUrl = data.getPresignedUrl.url;

    // Step 3: Upload the file to S3
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: optimizedFile,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      uploadedFileUrl = `https://afrofeel-profile-picture.s3.us-west-2.amazonaws.com/${uploadPrefix}${file.name}`;
    } else {
      console.error("File upload failed:", response.statusText, await response.text());
      toast.error("File upload failed.");
      return;
    }

    
  } catch (error) {
    console.error("Error during upload process:", error);
    toast.error("Error uploading image.");
    return;
  }

  // Step 4: Update the database with the new image URL
  try {
    const { data: updatedArtistData, errors } = await addProfileImage({
      variables: { profileImage: uploadedFileUrl },
    });

    if (errors) {
      console.error("GraphQL errors:", errors);
      toast.error("Error updating profile with new image.");
      return;
    } else {
      // Optionally refetch the artist profile to update the UI
      refetch();
       toast.success("Profile image updated successfully!");
        setIsLoadingImage(false);
    }
  } catch (error) {
    console.error("Error updating artist profile:", error.message || error);
    toast.error("Error updating profile with new image.");
     setIsLoadingImage(false);
    return;
  }

  // Step 5: Delete the old image from S3 if it exists
  if (keyToDelete) {
    try {
      const { data: dataToDelete } = await getPresignedUrlDelete({
        variables: {
          bucket: "afrofeel-profile-picture",
          key: keyToDelete.startsWith(uploadPrefix) ? keyToDelete : `${uploadPrefix}${keyToDelete}`,
          region: "us-west-2",
        },
      });

      const presignedUrlForDelete = dataToDelete.getPresignedUrlDelete.urlToDelete;

      // Delete the old image from S3
      const deleteResponse = await fetch(presignedUrlForDelete, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (deleteResponse.ok) {
      } else {
        console.error("File delete failed:", deleteResponse.statusText, await deleteResponse.text());
        toast.error("Error deleting the old file from S3.");
      }
    } catch (error) {
      console.error("Error during delete process:", error);
      toast.error("Error during the deletion of the old file.");
      return;
    }
  }



  // Step 6: Optionally, grant access to the new image for display (optional step)
  try {
    const { data: readData } = await getPresignedUrlDownload({
      variables: {
        bucket: "afrofeel-profile-picture",
        key: `${uploadPrefix}${file.name}`,
        region: "us-west-2",
      },
    });

    const presignedUrlReadData = readData.getPresignedUrlDownload.url;
    setProfileImage(presignedUrlReadData);
  } catch (error) {
    console.error("Error during display process:", error);
    toast.error("Error during the display process.");
    return;
  }
};

// end handle File upload








// grant access to the artist to view profile anytime this component loads
// ----------------------------------------------------------------------

  let key = null;
  if (artistData && artistData.artistProfile && artistData.artistProfile.profileImage) {
    key = deriveKeyFromUrl(artistData.artistProfile.profileImage);
  }


  // UseEffect for fetching the presigned URL for the profile image
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!key) return; // If no key, don't fetch

      try {
        // Fetch the presigned URL for downloading
        const { data } = await getPresignedUrlDownload({
          variables: {
            bucket: 'afrofeel-profile-picture',
            key: key,
            region: 'us-west-2',
          },
        });

        const presignedUrl = data.getPresignedUrlDownload.url;
        
        // Fetch the image from S3 using the presigned URL
        // const imageResponse = await fetch(presignedUrl);
        // if (!imageResponse.ok) {
        //   throw new Error('Failed to fetch image from presigned URL');
        // }
        
        // // Convert the image response into a Blob (binary data)
        // const imageBlob = await imageResponse.blob();
        
        // // Create an Object URL for the image (for displaying in an <img> tag or as background)
        // const imageObjectURL = URL.createObjectURL(imageBlob);
        
        // Set the image URL
        setProfileImage(presignedUrl);
        setIsLoadingImage(false); // Mark loading as false once image is fetched
      } catch (error) {
        console.error('Error during profile image fetch:', error);
        toast.error('Failed to fetch profile image.');
        setIsLoadingImage(false);
      }
    };

    fetchPresignedUrl(); // Call the function to fetch the URL and image
  }, [key]);


  // Early return for loading/error states before render
  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error fetching profile data: {error.message}</p>;
  if (!artistData || !artistData.artistProfile) return <p>No profile data available</p>;


// end grant access to artist to viwe profile

   const handleUploadButtonClick = () => {
    setInputVisible(true);
    fileInputRef.current.click(); 
    
  };




return (
  <>
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: "8px",
          bgcolor: alpha(theme.palette.background.default, 0.48),
          border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Profile image
          </Typography>

          {isMobile ? (
            <Tooltip title={artistData.artistProfile.profileImage ? "Edit image" : "Add image"}>
              <span>
                <IconButton
                  onClick={handleUploadButtonClick}
                  disabled={isLoadingImage}
                  aria-label={artistData.artistProfile.profileImage ? "Edit image" : "Add image"}
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: theme.palette.common.white,
                    color: theme.palette.common.black,
                    "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.88) },
                    "&.Mui-disabled": {
                      backgroundColor: alpha(theme.palette.common.white, 0.5),
                      color: alpha(theme.palette.common.black, 0.4),
                    },
                  }}
                >
                  <PhotoCameraRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button
              onClick={handleUploadButtonClick}
              variant="contained"
              sx={{
                background: theme.palette.common.white,
                color: theme.palette.common.black,
                borderRadius: "8px",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.88) },
              }}
              disabled={isLoadingImage}
            >
              {artistData.artistProfile.profileImage ? "Edit" : "Add"}
            </Button>
          )}

        </Box>
        
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              width: { xs: 160, sm: 200 },
              height: { xs: 160, sm: 200 },
              borderRadius: "50%",
              overflow: "hidden",
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              border: `3px solid ${theme.palette.common.white}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="artistAcountProfile"
              onClick={handleUploadButtonClick}
              style={{
                backgroundImage: `url(${profileImage || customProfileImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: "100%",
                width: "100%",
                cursor: "pointer",
              }}
            />
          </Paper>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              {fullName}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {email}
            </Typography>
            {isLoadingImage && (
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: theme.palette.text.secondary }}>
                Uploading and updating profile image...
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>

    <input
      type="file"
      id="profileImage"
      name="profileImage"
      className="inputUpload"
      accept="image/png, image/jpeg"
      onChange={handleProfileImageUpload}
      ref={fileInputRef}
      style={{ display: 'none' }} // Hide the file input
    />
  </>
);

}




export default ArtistAccountProfile;
