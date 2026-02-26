import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useForm, Controller } from "react-hook-form";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import MusicTempo from "music-tempo";

// Queries and Mutations
import {
  SONG_UPLOAD,
  UPDATE_SONG,
  GET_PRESIGNED_URL,
  GET_PRESIGNED_URL_DOWNLOAD,
  GET_PRESIGNED_URL_DELETE,
   NEW_SONG_UPLOAD
} from "../../utils/mutations";

import { GET_ALBUM } from "../../utils/queries";
import { SONG_UPLOAD_UPDATE } from "../../utils/subscription";

// Components
import SongUploadProgressComponent from "../../components/songContentPart/inputsForSong/songUploadUpdates";
import SongCover from "../../components/songContentPart/SongCover";
import SongUpload from "../../components/songContentPart/SongUpload";
import Metadata from "../../components/songContentPart/Metadata";
import Lyrics from '../../components/songContentPart/Lirycs';

// Utils
import ArtistAuth from "../../utils/artist_auth";
import detectTimeSignature from "../../utils/timeSignature";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { resizeImageFile } from "../../utils/ResizeImageFile";
import "../CSS/CSS-HOME-FREE-PLAN/content.css";

const steps = ["Song upload", "Add Metadata", "Lyrics", "Artwork"];





export default function ContentFreePlan() {

 // State management
  const [uploadState, setUploadState] = useState({
    progress: 0,
    isValid: null,
    duplicate: null,
    copyright: null,
    step: null,
    status: null,
    message: null
  });
  const [reloadFlag, setReloadFlag] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [albumToSelect, setAlbumToSelect] = useState('');
  const [albums, setAlbums] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [songId, setSongId] = useState('');
  const [songCoverImage, setSongCoverImage] = useState('');
  const [keyToDelete, setKeyToDelete] = useState('');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState('');

  // GraphQL operations
  const { loading: albumLoading, error: albumError, data: albumData, refetch: refetchAlbums } = useQuery(GET_ALBUM);
  const { loading: artistLoading, data: artistData } = useQuery(ARTIST_PROFILE);
  const { data: subscriptionData, loading: subscriptionLoading, error: subscriptionError } = useSubscription(SONG_UPLOAD_UPDATE);
  
  const [updateSong] = useMutation(UPDATE_SONG);
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDelete] = useMutation(GET_PRESIGNED_URL_DELETE);
  const [songUpload] = useMutation(SONG_UPLOAD);


const [newSongUpload] = useMutation( NEW_SONG_UPLOAD);

  // Form handling
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { title: '' }
  });

  // Responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const artistProfile = artistData?.artistProfile;
  const missingProfileFields = [
    !artistProfile?.profileImage && "profile image",
    !artistProfile?.country && "country",
    !artistProfile?.region && "region",
  ].filter(Boolean);
  const isProfileComplete = !artistLoading && missingProfileFields.length === 0;

  const showProfileBlockMessage = () => {
    const missingList = missingProfileFields.join(", ");
    Swal.fire({
      icon: "warning",
      title: "Complete your profile first",
      text: missingList
        ? `Please add your ${missingList} before uploading.`
        : "Please finish your profile before uploading.",
    });
  };





  

// upload image to s3 and save the url to the state
// ===============================================

  // Upload artwork to S3

  const handleSongImageUpload = async (file) => {
    try {
      setIsCoverUploading(true);

      // 1. Create temporary preview
      const previewUrl = URL.createObjectURL(file);
      setDisplayUrl(previewUrl);

      // Object key (with folder)
      const objectKey = `cover-images/${file.name}`;

      let optimizedFile = file;
      try {
        optimizedFile = await resizeImageFile(file, 1200, 0.82);
      } catch (resizeErr) {
        console.warn("Image optimization failed, using original file.", resizeErr);
      }

      // 2. Get presigned URL and upload
      const { data } = await getPresignedUrl({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key: objectKey,
          region: "us-east-2",
        },
      });

console.log('the data produced from song image upload:', data);

      await fetch(data.getPresignedUrl.url, {
        method: "PUT",
        body: optimizedFile,
        headers: { "Content-Type": file.type },
      });

      // 3. Get downloadable URL
      const { data: downloadData } = await getPresignedUrlDownload({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key: objectKey,
          region: "us-east-2",
          expiresIn: 604800 // 7 days (preview only)
        },
      });

      const imageUrlToDisplay = downloadData.getPresignedUrlDownload.url;
      const s3ObjectUrl = `https://afrofeel-cover-images-for-songs.s3.us-east-2.amazonaws.com/${objectKey}`;

      console.log('the link to display the image', imageUrlToDisplay);

      // 4. Update states: store canonical S3 URL (not presigned) for artwork
      setSongCoverImage(s3ObjectUrl);
      setKeyToDelete(objectKey);
      setDisplayUrl(imageUrlToDisplay || s3ObjectUrl);
      
      // 5. Clean up temporary preview
      URL.revokeObjectURL(previewUrl);
      
    } catch (error) {
      toast.error("Upload failed");
      throw error;
    } finally {
      setIsCoverUploading(false);
    }
  };


const deleteSongCoverImage = async () => {
    if (!keyToDelete) return;
    
    try {
      setIsCoverUploading(true);
      const { data } = await getPresignedUrlDelete({
        variables: { bucket: "afrofeel-cover-images-for-songs", key: keyToDelete, region: "us-east-2" }
      });
      
      await fetch(data.getPresignedUrlDelete.urlToDelete, { method: "DELETE" });
      
      setSongCoverImage('');
      setDisplayUrl('');
      setKeyToDelete('');
      toast.success("Image deleted");
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setIsCoverUploading(false);
    }
  };







// Display artwork from S3
const handleSongCoverDisplay = async (fileName) => {
  try {
    // 1. Get presigned URL for viewing
    const { data } = await getPresignedUrlDownload({
      variables: {
        bucket: "afrofeel-cover-images-for-songs",
        key: fileName,
        region: "us-east-2",
        expiresIn: 604800 // 7 days expiration
      },
    });

    // 2. Return the URL directly (no need to fetch if it's just for display)
    return data.getPresignedUrlDownload.url;
    
  } catch (error) {
    console.error("Display error:", error);
    toast.error("Failed to load image");
    throw error;
  }
};




  // Delete artwork from S3
  // ======================






// ======================================




  const profile = ArtistAuth.getProfile();
  const currentArtistId = profile?.data?.artistAka;

const navigate = useNavigate();



// deplecated

// const handleSongUpload = async (event) => {
//   event.preventDefault();

//   if (!isProfileComplete) {
//     showProfileBlockMessage();
//     return;
//   }

//   setIsSongLoading(true);
//   setUploadProgress(10); 

//   const songFile = event.target.files[0];
//   if (!songFile) {
//     Swal.fire({ icon: "error", title: "Oops...", text: "No song selected!" });
//     setIsSongLoading(false);
//     return;
//   }

//   setUploadProgress(20); 
//   const allowedFormats = ["audio/mpeg", "audio/wav", "audio/flac"];
//   if (!allowedFormats.includes(songFile.type)) {
//     Swal.fire({
//       icon: "error",
//       title: "Invalid Format",
//       text: "Only MP3, WAV, and FLAC are allowed.",
//     });
//     setIsSongLoading(false);
//     return;
//   }

//   if (songFile.size > 10 * 1024 * 10240) {
//     Swal.fire({
//       icon: "error",
//       title: "File too large",
//       text: "Please upload a file smaller than 100MB.",
//     });
//     setIsSongLoading(false);
//     return;
//   }

//    setActiveStep(1)



// // ===================

// // CALCULATE TEMPO, BEATS, TIME SIGNATURE BEFORE UPLOADING
// // -----------------------------------------------------

// const context = new AudioContext();
// const reader = new FileReader();

// reader.onload = async function (e) {
//   try {
//     const decodedBuffer = await context.decodeAudioData(e.target.result);
//     const sampleRate = decodedBuffer.sampleRate;
//     let audioData = [];

//     // Mix down to mono
//     if (decodedBuffer.numberOfChannels === 2) {
//       const channel1 = decodedBuffer.getChannelData(0);
//       const channel2 = decodedBuffer.getChannelData(1);
//       audioData = channel1.map((val, i) => (val + channel2[i]) / 2);
//     } else {
//       audioData = decodedBuffer.getChannelData(0);
//     }

//     // 🎯 Use the full audio buffer here (no trimming)
//     const mt = new MusicTempo(audioData);
//     console.log('🎵 Full Audio BPM:', mt.tempo);
//     console.log('🕒 Beats:', mt.beats);

//     // Detect time signature
//     const timeSignature = detectTimeSignature(mt.beats, mt.tempo);
//     console.log('🧭 Detected Time Signature:', timeSignature);

//     // Upload to server
//     const { data } = await songUpload({
//       variables: {
//         file: songFile,
//         tempo: Number(mt.tempo),
//         beats: mt.beats.map(Number),
//         timeSignature: parseInt(timeSignature),
//       },
//     });



//     console.log('✅ Upload successful:', data);
//     const songId = data.songUpload._id;
//     console.log('the song id from server:', songId);

//     setSongId(songId)
//   } catch (error) {
//      Swal.fire({
//       icon: "error",
//       title: "audio corrupted",
//       text: "Please play your song first and confirm if it works .",
//     }
//     );
//     console.error('❌ Error during full audio analysis:', error);
//     setActiveStep(0)
//      setIsSongLoading(false);
//   }




// };

// reader.readAsArrayBuffer(songFile);

// };




const handleNewSongUpload = async (event) => {



try {

if (!isProfileComplete) {
    showProfileBlockMessage();
    return;
  }

  const songFile = event.target.files[0];

  if (!songFile) {
    Swal.fire({ icon: "error", title: "Oops...", text: "No song selected!" });
    setIsSongLoading(false);
    return;
  }

 setIsSongLoading(true);

    const filename = songFile.name;
const mimetype = songFile.type;


  const allowedFormats = ["audio/mpeg", "audio/wav", "audio/flac"];
  if (!allowedFormats.includes(songFile.type)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Format",
      text: "Only MP3, WAV, and FLAC are allowed.",
    });
    setIsSongLoading(false);
    return;
  }

  if (songFile.size > 100 * 1024 * 1024) {
    Swal.fire({
      icon: "error",
      title: "File too large",
      text: "Please upload a file smaller than 100MB.",
    });
    setIsSongLoading(false);
    return;
  }

//  const bucket = import.meta.env.VITE_FLOLUP_ORIGINAL_SONGS_INPUT_BUCKET;
//  const region = import.meta.env.VITE_FLOLUP_REGION;

//   if (!bucket || !region) {
//     Swal.fire({
//       icon: "error",
//       title: "Configuration error",
//       text: "Upload bucket or region is missing. Please contact support.",
//     });
//     setIsSongLoading(false);
//     return;
//   }

const { data } = await newSongUpload({
  variables: {
    filename: filename ,
    mimetype: mimetype,
    region: 'us-east-2',
    bucket: 'flolup-original-songs'
  }
})
console.log('what is the data?', data)
const { url, key, song } = data.newSongUpload;


// Now upload file to S3
    const response = await fetch(url, {
      method: "PUT",
      body: songFile,
      headers: {
        "Content-Type": songFile.type,
      },
    });


    //   if (!response.ok) {
    //   throw new Error("Upload failed");
    // }

const songId = data.newSongUpload._id;
    setSongId(songId)

}catch(error){
Swal.fire({
      icon: "error",
      title: "audio corrupted",
      text: "Please play your song first and confirm if it works .",
    }
    );
    console.error('❌ Error during full audio analysis:', error);
    setActiveStep(0)
     setIsSongLoading(false);
  }
  


   setActiveStep(1)





}





// Centralized data processing from server

useEffect(() => {
  if (subscriptionData?.songUploadProgress) {
    const { step, status, message, percent, isComplete } = subscriptionData.songUploadProgress;
    
    const isFailureState = status === 'DUPLICATE' || status === 'COPYRIGHT_ISSUE';
    const isSuccessState = (status === 'COMPLETED' || status === 'SUCCESS') && isComplete;

  

    setUploadState(prev => ({
      ...prev,
      progress: percent || 0,
      step,
      status: isSuccessState ? 'COMPLETED' : status,
      message,
      ...(isFailureState && {
        isValid: false,
        ...(status === 'DUPLICATE' && { duplicate: { message } }),
        ...(status === 'COPYRIGHT_ISSUE' && { copyright: { message } })
      }),
      ...(isSuccessState && { isValid: true }),
      isComplete: isComplete || false
    }));

    setUploadFailed(isFailureState);

    if (isFailureState) {
      handleUploadFailure(status, message);
      return;
    }

    // ✅ Proceed to metadata when validation passes
    const safeToProceed = !isFailureState && status !== 'UPLOADING' && !uploadState.isValid;
    
    if (safeToProceed) {
      
      setIsSongLoading(false);
      // setActiveStep(1); // Go to metadata step
    }
  }
}, [subscriptionData]);





// Updated failure handler
const handleUploadFailure = (status, message) => {
  // Reset upload state immediately
  const resetUploadState = () => {
    setIsSongLoading(false);

  

    setUploadProgress(0);
    setUploadState({
      progress: 0,
      isValid: null,
      duplicate: null,
      copyright: null,
      step: null,
      status: null,
      message: null
    });
  };

  const isCopyrightIssue = status === 'COPYRIGHT_ISSUE';

  Swal.fire({
    icon: 'error',
    title: isCopyrightIssue ? 'Copyright Concern' : 'Duplicate Song',
    html: `<div style="margin-bottom: 1rem; text-align: left;">
            <p>${message}</p>
            <small style="color: #666;">
              ${isCopyrightIssue ? 'If you believe this is a mistake' : ''}
            </small>
          </div>`,
    showCancelButton: true,
    confirmButtonText: 'Upload New Song',
    cancelButtonText: isCopyrightIssue ? 'Report Issue' : 'Go to Dashboard',
    focusConfirm: false,
    allowOutsideClick: false,
    customClass: {
      actions: 'swal-actions',
      cancelButton: isCopyrightIssue ? 'swal-report-button' : ''
    }
  }).then((result) => {
    resetUploadState();
    
    if (result.isConfirmed) {
      // Upload new song flow
      setActiveStep(0);
      setTimeout(() => document.getElementById('song-upload-input')?.click(), 100);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      if (isCopyrightIssue) {
        // Handle copyright report flow
        handleCopyrightReport();
      } else {
        navigate('/artist/studio/dashboard');
      }
    }
  });
};

// Copyright report handler
const handleCopyrightReport = () => {
  Swal.fire({
    title: 'Report Copyright Issue',
    input: 'textarea',
    inputLabel: 'Please explain why you believe this is a mistake',
    inputPlaceholder: 'Describe your concerns...',
    showCancelButton: true,
    confirmButtonText: 'Submit Report',
    preConfirm: (reportText) => {
      // Add your report submission logic here
      console.log('Copyright report submitted:', reportText);
    }
  }).then(() => {
    // After reporting, keep user on upload screen
    setActiveStep(0);
  });
};








useEffect(() => {
  if (albumData && !albumError) {
    setAlbums(albumData.albumOfArtist || []);  
  }
}, [albumData, albumError]);

if (albumLoading) return 'album is loading ...';
if (albumError) return `Error! ${albumError.message}`;


const handleAlbumChange = (event) => {
  const selectedAlbum = albums.find(album => album._id === event.target.value);
  if (selectedAlbum) {
    setAlbumToSelect(selectedAlbum);  // Ensure state updates properly
    console.log("Selected Album:", selectedAlbum);
  }
};






const onSubmit = async (formData) => {
  setIsSubmitting(true);

 



  // 🚨 Guard clause for missing songId
  if (!songId) {
    console.error("🚨 Cannot submit: songId is missing.");
    Swal.fire({
      icon: 'warning',
      title: 'Please wait',
      text: 'Upload is still in progress. Try again shortly.',
    });
    setIsSubmitting(false);
    return;
  }

  try {

 const variables = {
  songId: songId,
  title: formData.title,
  album: albumToSelect?._id,
  releaseDate: formData.releaseDate || new Date().toISOString().split('T')[0],
    mood: formData.mood || [],
 subMoods: Object.values(formData.subMoods || {}).flat(),
  featuringArtist: Array.isArray(formData.featuringArtist)
  ? formData.featuringArtist.map(s => s.trim())
  : typeof formData.featuringArtist === 'string'
    ? formData.featuringArtist.split(',').map(s => s.trim())
    : [],

  trackNumber: Number.isInteger(parseInt(formData.trackNumber)) ? parseInt(formData.trackNumber) : 1,
  genre: formData.genre,


producer: Array.isArray(formData.producer)
  ? formData.producer
  : typeof formData.producer === 'string'
    ? formData.producer.split(',').map((entry) => {
        const [name, role = ''] = entry.split(':').map(s => s.trim());
        return { name, role };
      })
    : [],

composer: Array.isArray(formData.composer)
  ? formData.composer
  : typeof formData.composer === 'string'
    ? formData.composer.split(',').map((entry) => {
        const [name, contribution = ''] = entry.split(':').map(s => s.trim());
        return { name, contribution };
      })
    : [],


  label: formData.label || '',
  lyrics: formData.lyrics || '',
  artwork: songCoverImage,
};






  let data;
try {
  const response = await updateSong({ variables });
  data = response.data;

  console.log("📡 Mutation response data:", data);

} catch (mutationError) {
  console.error("💥 GraphQL mutation failed:", mutationError);
  throw mutationError; 
}


    // await Swal.fire({
    //   icon: 'success',
    //   title: 'Song Updated!',
    //   html: `
    //     <div style="text-align:center">
    //       <p>${formData.title} has been published</p>
    //       <small>Now available in your library</small>
    //     </div>
    //   `
    // });

    // navigate('/artist/studio/dashboard');
    setActiveStep(2)

  } catch (error) {
    console.error("🔥 Error during song update:", error);
    const gqlMessage = error?.graphQLErrors?.[0]?.message;
    const networkMessage =
      error?.networkError?.result?.errors?.[0]?.message ||
      error?.networkError?.result?.message;
    const message =
      gqlMessage || networkMessage || error.message || "Failed to update song.";

    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      html: `
        <div style="text-align:left">
          <p>${message}</p>
          ${error.networkError ? '<small>Please check your connection</small>' : ''}
        </div>
      `
    });
  } finally {
    setIsSubmitting(false);
    console.log("🟡 Submission process ended");
  }
};











  return (
    
<Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--secondary-background-color)",
        p: { xs: 2, sm: 3 },
        width: "100%",
        minHeight: "100vh",
        mx: "auto",
        maxWidth: 1400,
        overflowX: "hidden"
      }}
    >
      <SongUploadProgressComponent
        uploadState={uploadState}
        subscriptionLoading={subscriptionLoading}
        subscriptionError={subscriptionError}
      />

      {/* Responsive Step Title */}
      <Typography
        variant="h3"
        sx={{
          mt: { xs: 2, sm: 3 },
          fontSize: { xs: "1.5rem", sm: "2rem" },
          color: "white",
          textAlign: { xs: "center", sm: "left" },
          mb: 3
        }}
      >
        {steps[activeStep]}
      </Typography>

      {/* Dynamic Step Content */}
      <Box sx={{
        width: "100%",
        maxWidth: { xs: "100%", md: 1200 },
        mx: "auto"
      }}>
        {activeStep === 0 && (
          <Paper elevation={3} sx={{ 
            borderRadius: 2, 
            p: { xs: 2, sm: 3 },
            mb: 3,
            width: "100%"
          }}>


            <SongUpload
              isSongLoading={isSongLoading}
              setIsSongLoading={setIsSongLoading}
              handleSongUpload={handleNewSongUpload}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              setValue={setValue}
              isProfileComplete={isProfileComplete}
              missingProfileFields={missingProfileFields}
              onBlockedUpload={showProfileBlockMessage}
              uploadState={uploadState}
              subscriptionLoading={subscriptionLoading}
              subscriptionError={subscriptionError}
            />



          </Paper>
        )}

        {activeStep === 1 && (
          <Box sx={{ 
            overflowY: "auto",
            maxHeight: { xs: "70vh", md: "none" },
            width: "100%"
          }}>
            <Metadata
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              register={register}
              Controller={Controller}
              control={control}
              errors={errors}
              albumToSelect={albumToSelect}
              albums={albums}
              watch={watch}
              setValue={setValue}
              refetchAlbums={refetchAlbums}
              handleAlbumChange={handleAlbumChange}
            />
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ width: "100%" }}>
            <Lyrics
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              songId={songId}
            />
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ 
            width: "100%",
            minHeight: { xs: "auto", sm: "60vh" }
          }}>
            <SongCover
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              songId={songId}
              watch={watch}
              currentImageUrl={displayUrl || songCoverImage}
              onUpload={handleSongImageUpload}
              onDelete={deleteSongCoverImage}
              isLoading={isCoverUploading}
              onChangeImage={(url) => setSongCoverImage(url)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
