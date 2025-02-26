import '../../components/homeFreePlanComponents/homeFreePlanComponentStyles/artistAccountProfile.css';
import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { ADD_PROFILE_IMAGE } from '../../utils/mutations';
import { ARTIST_PROFILE } from '../../utils/artistQuery';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { GET_PRESIGNED_URL } from '../../utils/mutations';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { GET_PRESIGNED_URL_DELETE } from '../../utils/mutations';
import { GET_PRESIGNED_URL_DOWNLOAD } from '../../utils/mutations';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import './homeFreePlanComponentStyles/artistAccountProfile.css'
import customProfileImage from '../../images/custom-profile.jpg'
import Paper from "@mui/material/Paper";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ArtistAuth from '../../utils/artist_auth';
import Divider from '@mui/material/Divider';




const ArtistAccountProfile = () => {


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
const artistAka = profile?.data?.artistAka;
const fullName = profile?.data?.fullName;





  //  const profileData = ArtistAuth.getProfile();
  
const handleProfileImageUpload = async (e) => {
  e.preventDefault();

  // Get the current profile image URL from the database
  const profileImageUrl = artistData.artistProfile.profileImage;
  console.log("Profile Image URL:", profileImageUrl);

  // If there is an existing image, prepare to delete it later
  let keyToDelete = "";
  if (profileImageUrl) {
    const lastSlashIndex = profileImageUrl.lastIndexOf('/');
    keyToDelete = profileImageUrl.substring(lastSlashIndex + 1);
  }

  // Step 1: Upload new image only if it's provided
  const file = e.target.files[0];
  if (!file) {
    toast.error("No file selected.");
    return;
  }

  // Validate file type and size
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (!allowedTypes.includes(file.type)) {
    toast.error("Invalid file type. Please upload an image file (JPEG, PNG).");
    return;
  }
  if (file.size > maxSize) {
    toast.error("File size exceeds the maximum limit of 5 MB.");
    return;
  }


  let uploadedFileUrl = ""; 

  try {
    // Step 2: Get the presigned URL for uploading the new image to S3
    setIsLoadingImage(true);
    const { data } = await getPresignedUrl({
      variables: {
        bucket: "afrofeel-profile-picture",
        key: file.name,
        region: "us-west-2",
      },
    });

    const presignedUrl = data.getPresignedUrl.url;
    console.log("Presigned URL for upload:", presignedUrl);

    // Step 3: Upload the file to S3
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      console.log("File uploaded successfully to S3");
      uploadedFileUrl = `https://afrofeel-profile-picture.s3.us-west-2.amazonaws.com/${file.name}`;
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
      console.log("Artist profile updated successfully:", updatedArtistData.updateArtistProfile);
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
          key: keyToDelete,
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
        console.log("Old file deleted successfully from S3");
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
        key: file.name,
        region: "us-west-2",
      },
    });

    const presignedUrlReadData = readData.getPresignedUrlDownload.urlToDownload;

    // Read the file from S3
    const response = await fetch(presignedUrlReadData, {
      method: "GET",
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      console.log("Profile picture displayed successfully");
    } else {
      console.error("Profile picture display failed:", response.statusText, await response.text());
      toast.error("Profile picture display failed.");
      return;
    }
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
    const profileImageUrl = artistData.artistProfile.profileImage;
    const lastSlashIndex = profileImageUrl.lastIndexOf('/');
    key = profileImageUrl.substring(lastSlashIndex + 1);
   
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

        const presignedUrl = data.getPresignedUrlDownload.urlToDownload;
        
        // Fetch the image from S3 using the presigned URL
        const imageResponse = await fetch(presignedUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image from presigned URL');
        }
        
        // Convert the image response into a Blob (binary data)
        const imageBlob = await imageResponse.blob();
        
        // Create an Object URL for the image (for displaying in an <img> tag or as background)
        const imageObjectURL = URL.createObjectURL(imageBlob);
        
        // Set the image URL
        setProfileImage(imageObjectURL);
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
    {isLoadingImage ? (
      <p>Uploading and updating profile image...</p>
    ) : artistData.artistProfile.profileImage ? (
      <>


<Box

>
<Paper elevation={1} sx={{minWidth: '400px', minHeight: "400px", bgcolor: 'var( --primary-background-color)', display:'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div
          className="artistAcountProfile"
          onClick={handleUploadButtonClick}
          style={{
                 
            backgroundImage: `url(${profileImage})`,
            backgroundSize: 'cover',  
            backgroundPosition: 'center',
            borderRadius: '50px 0 0 0',
            height: '350px',            
      width: '350px',            
            cursor: 'pointer',
          }}
        > 
          </div>
</Paper >


 <Box sx={{display: 'flex', flexDirection: 'column', }}>
<Typography sx={{marginBottom: '-8px'}} variant='h6'>{fullName}</Typography>
<Typography sx={{fontStyle: 'italic', fontWeight: 'bold'}} variant="body">{email}</Typography>
</Box>
<Divider />

</Box>
      </>
    ) : artistData.artistProfile === '' ? (
      <>

<Box
  sx={{
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    gap: { xs: "1rem", sm: "3rem", md: "6rem" }, 
    width: "100%", // Full width
    flexDirection: { xs: "column", sm: "row" }, 
  }}
>
  {/* Profile Image Container */}
  <Paper
    elevation={1}
    sx={{
      minWidth: { xs: "250px", sm: "350px", md: "400px" }, // Responsive size
      minHeight: { xs: "250px", sm: "350px", md: "400px" },
      bgcolor: "var(--primary-background-color)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      className="artistAcountProfile"
      onClick={handleUploadButtonClick}
      style={{
        backgroundImage: `url(${customProfileImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100%", // Make it responsive
        width: "100%",
        cursor: "pointer",
      }}
    ></div>
  </Paper>

  {/* User Info */}
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      textAlign: { xs: "center", sm: "left" }, // Center text on mobile
    }}
  >
    <Typography variant="h6">{fullName}</Typography>
    <Typography variant="body2">{email}</Typography>
  </Box>
</Box>


       
      </>
    ) : (
      <>

<Box sx={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '6rem'}}>
     <Paper elevation={1} sx={{minWidth: '400px', minHeight: "400px", bgcolor: 'var( --primary-background-color)', display:'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div
          className="artistAcountProfile"
          onClick={handleUploadButtonClick}
          style={{
            backgroundImage: `url(${customProfileImage})`,
            backgroundSize: 'cover',   // Ensures the image covers the entire circular div
            backgroundPosition: 'center',
            height: '300px',        
            width: '300px',           
            cursor: 'pointer',
          }}
        > 
        </div>
        </Paper>

        <Typography variant='h6'>{fullName}</Typography>
<Typography variant="body2">{email}</Typography>


</Box>

      </>
    )}

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
