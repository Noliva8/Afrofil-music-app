import '../../components/homeFreePlanComponents/homeFreePlanComponentStyles/artistAccountProfile.css';
import React, { useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import ArtistAuth from '../../utils/artist_auth';
import { ADD_PROFILE_IMAGE } from '../../utils/mutations';
import { ARTIST_PROFILE } from '../../utils/artistQuery';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { GET_PRESIGNED_URL } from '../../utils/mutations';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { GET_PRESIGNED_URL_DELETE } from '../../utils/mutations';
import { GET_PRESIGNED_URL_DOWNLOAD } from '../../utils/mutations';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";







const ArtistAccountProfile = () => {


  const { loading, error, data: artistData, refetch } = useQuery(ARTIST_PROFILE);


  const [addProfileImage] = useMutation(ADD_PROFILE_IMAGE);
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [ getPresignedUrlDelete ] = useMutation(GET_PRESIGNED_URL_DELETE);

   const [isInputVisible, setInputVisible] = useState(false);
   const fileInputRef = useRef(null);
   const [displayEditButton , setDisplayEditButton] = useState(false);





   const profileData = ArtistAuth.getProfile();

  const handleProfileImageUpload = async (e) => {
  e.preventDefault();


// delete existing image before uploading
// -------------------------------------

const profileImageUrl = artistData.artistProfile.profileImage;
console.log("Profile Image URL:", profileImageUrl);

const lastSlashIndex = profileImageUrl.lastIndexOf('/');
// Extract the key using substring
const keyToDelete = profileImageUrl.substring(lastSlashIndex + 1);
console.log("Extracted Key:", keyToDelete); // Corrected variable name

try {
  const { data: dataToDelete } = await getPresignedUrlDelete({
    variables: {
      bucket: "afrofeel-profile-picture",
      key: keyToDelete,
      region: "us-west-2",
    },
  });

  const presignedUrlForDelete = dataToDelete.getPresignedUrlDelete.urlToDelete;
  console.log("Presigned URL to delete:", presignedUrlForDelete);

  // Step 2: Delete the file from S3
  const deleteResponse = await fetch(presignedUrlForDelete, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json", // Adjust the content type as necessary
    },
  });

  if (deleteResponse.ok) {
    console.log("File deleted successfully");
  } else {
    console.error("File delete failed:", deleteResponse.statusText, await deleteResponse.text());
    return;
  }
} catch (error) {
  console.error("Error during delete process:", error);
  return;
}
// end delete image



  const file = e.target.files[0];
  if (!file) {
    console.error("No file selected.");
    return;
  }

const allowedTypes = ["image/jpeg", "image/png"]; 
const maxSize = 5 * 1024 * 1024; // 5 MB

// Validate file type
if (!allowedTypes.includes(file.type)) {
    console.error("Invalid file type. Please upload an image file (JPEG, PNG, GIF).");
    toast.error("Invalid file type. Please upload an image file (JPEG, PNG, GIF).");
    return;
}

// Validate file size
if (file.size > maxSize) {
    console.error("File size exceeds the maximum limit of 5 MB.");
toast.error("File size exceeds the maximum limit of 5 MB.).");
    return;
}


  let uploadedFileUrl = ""; // Ensure it's initialized as a string

  try {
    // Step 1: Get the presigned URL
    const { data } = await getPresignedUrl({
      variables: {
        bucket: "afrofeel-profile-picture",
        key: file.name,
        region: "us-west-2",
      },
    });

    const presignedUrl = data.getPresignedUrl.url;
    console.log("Presigned URL:", presignedUrl);

    // Step 2: Upload the file to S3
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      console.log("File uploaded successfully");
      uploadedFileUrl = `https://afrofeel-profile-picture.s3.us-west-2.amazonaws.com/${file.name}`;
    } else {
      console.error("File upload failed:", response.statusText, await response.text());
      toast.error("File upload failed.");
      return;
    };
   
  } catch (error) {
    console.error("Error during upload process:", error);
    return;
  }

  console.log("Uploaded File URL:", uploadedFileUrl);  
  
  // Make sure uploadedFileUrl is a string and not an array
  if (Array.isArray(uploadedFileUrl)) {
    console.error("Error: uploadedFileUrl is an array, not a string.");
    uploadedFileUrl = uploadedFileUrl[0]; // Convert to string if it's wrapped in an array
  }

try {
  // Step 3: Update the artist's profile with the uploaded image URL
  const { data: updatedArtistData, errors } = await addProfileImage({
    variables: { profileImage: uploadedFileUrl },
  });

  if (errors) {
    console.error("GraphQL errors:", errors);
  } else {
    console.log("Artist profile updated successfully:", updatedArtistData.updateArtistProfile);
    // Optionally refetch the artist profile to update the UI
    refetch();
  }
} catch (error) {
  console.error("Error updating artist profile:", error.message || error);
  if (error.graphQLErrors) {
    console.error("GraphQL errors:", error.graphQLErrors);
  }
  if (error.networkError) {
    console.error("Network errors:", error.networkError);
  }
}


// grant the sccess to the artist to display the profile picture
// -----------------------------------------------------------


try{

const {data: readData} = await getPresignedUrlDownload({
    variables: {
        bucket: "afrofeel-profile-picture",
        key: file.name,
        region: "us-west-2",
      },
})

const presignedUrlReadData = readData.getPresignedUrlDownload.urlToDownload;

// read the file from s3
// --------------------

 const response = await fetch(presignedUrlReadData, {
      method: "GET",
      headers: {
        "Content-Type": file.type,
      },
    });

 if (response.ok) {
      console.log("profile picture displayed successfully");
      
    } else {
      console.error("profile picture display failed:", response.statusText, await response.text());
      toast.error("profile picture display failed.");
      return;
    };



} catch(error){
 console.error("Error during display process:", error);
    return;

}



};
// end handle File upload




if (loading) return <p>Loading...</p>;
if (error) return <p>Error fetching profile data: {error.message}</p>;
if (!artistData || !artistData.artistProfile) return <p>No profile data available</p>;

const profileImageUrl = artistData.artistProfile.profileImage;
  console.log("Profile Image URL:", profileImageUrl);

const lastSlashIndex = profileImageUrl.lastIndexOf('/');
// Extract the key using substring
const key = profileImageUrl.substring(lastSlashIndex + 1);
console.log("Extracted Key:", key); 







   const handleUploadButtonClick = () => {
    setInputVisible(true);
    
    fileInputRef.current.click(); 
    
  };






  return (
    <div className="artistAcountProfileContainer">

      <div className="artistAcountProfile" >
       
        <button className='editProfilePicture' type="button" onClick={handleUploadButtonClick} >  < UploadFileIcon />profile picture</button>


            {isInputVisible && (
              <>
              <label for="profileImage" id="profileImage-label">Upload</label>
                <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    className='inputUpload'
                    accept="image/png, image/jpeg"
                    onChange={handleProfileImageUpload}
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                />
                </>
            )}

      </div>








       <button type='button' className='editProfile' style={{display: 'none'}}>Edit</button>



       

      <div className="artistAcount">
        <h2>Your Account</h2>
        <h3>{profileData?.data?.fullName || "Unknown User"}</h3>
        <h3>aka {profileData?.data?.artistAka || "Unknown Alias"}</h3>
      </div>

    </div>
  );
};

export default ArtistAccountProfile;
