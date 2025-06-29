import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client";
import { useRef } from "react";
import { useSubscription } from '@apollo/client';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useForm, Controller} from "react-hook-form"
import { SONG_UPLOAD, UPDATE_SONG, GET_PRESIGNED_URL} from "../../utils/mutations";
import { GET_ALBUM, SONG_BY_ID } from "../../utils/queries";
import { SONG_UPLOAD_UPDATE } from "../../utils/subscription";
import SongUploadProgressComponent from "../../components/songContentPart/inputsForSong/songUploadUpdates";
import SongCover from "../../components/songContentPart/SongCover";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../../utils/mutations";
import { GET_PRESIGNED_URL_DELETE } from "../../utils/mutations";

import TestUploadProgressTracker from "../../components/songContentPart/TestUploadProgress";
import ArtistAuth from "../../utils/artist_auth";
import Swal from "sweetalert2";
import SongUpload from "../../components/songContentPart/SongUpload";
import Metadata from "../../components/songContentPart/Metadata";
import Lyrics from '../../components/songContentPart/Lirycs';
import "../CSS/CSS-HOME-FREE-PLAN/content.css";
import MusicTempo from "music-tempo";
import detectTimeSignature from "../../utils/timeSignature";
// ----------------------------------------------
import { toast } from "react-toastify";
const steps = ["Song upload", "Add Metadata", "Lyrics", "Artwork"];


// Utulity

function extractTitleFromFilename(filename) {
  // Remove path information (handles both Unix and Windows paths)
  const basename = filename.split(/[\\/]/).pop();
  // Remove file extension
  const title = basename.replace(/\.[^/.]+$/, "");
  // Clean up the title (optional)
  return title
    .replace(/[^a-zA-Z0-9 ]/g, ' ') 
    .replace(/\s+/g, ' ')            
    .trim();
}






export default function ContentFreePlan() {

// query the albums to display them
// ------------------------------

const { loading: albumLoading, error: albumError, data: albumData,  refetch: refetchAlbums} =useQuery(GET_ALBUM);

    const { data: subscriptionData, loading: subscriptionLoading, error: subscriptionError } = useSubscription(SONG_UPLOAD_UPDATE);


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
  const [skipped, setSkipped] = React.useState(new Set());
const [albumToSelect, setAlbumToSelect] = useState('');
const [albums, setAlbums] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [ uploadProgress, setUploadProgress] = useState(0);
const [songId, setSongId] = useState('');

  // Artwork state
  const [songCoverImage, setSongCoverImage] = useState('');
  const [keyToDelete, setKeyToDelete] = useState('');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState('');


const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({defaultValues: {
  title: '',
}});


const [updateSong] = useMutation(UPDATE_SONG);


  // S3 mutations
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDelete] = useMutation(GET_PRESIGNED_URL_DELETE);
 




  const [songUpload] =useMutation(SONG_UPLOAD);

  const client = useApolloClient();

// upload image to s3 and save the url to the state
// ===============================================

  // Upload artwork to S3

  const handleSongImageUpload = async (file) => {
    try {
      setIsCoverUploading(true);
      
      // 1. Create temporary preview
      const previewUrl = URL.createObjectURL(file);
      setDisplayUrl(previewUrl);

      // 2. Get presigned URL and upload
      const { data } = await getPresignedUrl({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key: file.name,
          region: "us-east-2",
        },
      });

console.log('the data produced from song image upload:', data);

      await fetch(data.getPresignedUrl.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Get downloadable URL
      const { data: downloadData } = await getPresignedUrlDownload({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key: file.name,
          region: "us-east-2",
          expiresIn: 604800 // 7 days
        },
      });


      const imageUrlToDisplay = downloadData.getPresignedUrlDownload.urlToDownload;

      console.log('the link to display the image', imageUrlToDisplay)

      // 4. Update states
      setSongCoverImage(downloadData.getPresignedUrlDownload.urlToDownload);
      setKeyToDelete(file.name);
      setDisplayUrl(downloadData.getPresignedUrlDownload.urlToDownload);
      
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
    return data.getPresignedUrlDownload.urlToDownload;
    
  } catch (error) {
    console.error("Display error:", error);
    toast.error("Failed to load image");
    throw error;
  }
};




  // Delete artwork from S3
  // ======================






// ======================================

const handleNextStep = (event) => {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  if (activeStep < steps.length - 1) {
    setActiveStep(activeStep + 1);
  }
};

const handleBackStep = (event) => {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  if (activeStep > 0) {
    setActiveStep(activeStep - 1);
  }
};


  const profile = ArtistAuth.getProfile();
  const currentArtistId = profile?.data?.artistAka;

const navigate = useNavigate();



const handleSongUpload = async (event) => {
 
  setIsSongLoading(true);
  setUploadProgress(10); 
  event.preventDefault();

  const songFile = event.target.files[0];
  if (!songFile) {
    Swal.fire({ icon: "error", title: "Oops...", text: "No song selected!" });
    setIsSongLoading(false);
    return;
  }

  // Extract and set title from filename
  const titleFromFilename = extractTitleFromFilename(songFile.name);
  setValue('title', titleFromFilename, { shouldValidate: true });


  setUploadProgress(20); 
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

  if (songFile.size > 10 * 1024 * 10240) {
    Swal.fire({
      icon: "error",
      title: "File too large",
      text: "Please upload a file smaller than 100MB.",
    });
    setIsSongLoading(false);
    return;
  }

   setActiveStep(1)



// ===================

// CALCULATE TEMPO, BEATS, TIME SIGNATURE BEFORE UPLOADING
// -----------------------------------------------------

const context = new AudioContext();
const reader = new FileReader();

reader.onload = async function (e) {
  try {
    const decodedBuffer = await context.decodeAudioData(e.target.result);
    const sampleRate = decodedBuffer.sampleRate;
    let audioData = [];

    // Mix down to mono
    if (decodedBuffer.numberOfChannels === 2) {
      const channel1 = decodedBuffer.getChannelData(0);
      const channel2 = decodedBuffer.getChannelData(1);
      audioData = channel1.map((val, i) => (val + channel2[i]) / 2);
    } else {
      audioData = decodedBuffer.getChannelData(0);
    }

    // 🎯 Use the full audio buffer here (no trimming)
    const mt = new MusicTempo(audioData);
    

    // Detect time signature
    const timeSignature = detectTimeSignature(mt.beats, mt.tempo);
    console.log('🧭 Detected Time Signature:', timeSignature);

    // Upload to server
    const { data } = await songUpload({
      variables: {
        file: songFile,
        tempo: Number(mt.tempo),
        beats: mt.beats.map(Number),
        timeSignature: parseInt(timeSignature),
      },
    });



    console.log('✅ Upload successful:', data);
    const songId = data.songUpload._id;
    console.log('the song id from server:', songId);

    setSongId(songId)
  } catch (error) {
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




};

reader.readAsArrayBuffer(songFile);

  
 
};






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

    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      html: `
        <div style="text-align:left">
          <p>${error.message}</p>
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
    <>

      <Box
        className="contentContainer"
        sx={{
          display: "flex",

          justifyContent: "flex-start",
          flexDirection: "column",
          bgcolor: "var(--secondary-background-color)",
          padding: "1rem",

          width: "100%",

          minWidth: "350px",
          maxWidth: "1400px",
          minHeight: "100vh",
          marginTop: {
            xs: "1rem",
            sm: "2rem",
          },
         
        }}
      >

        <SongUploadProgressComponent
     uploadState={uploadState}
      subscriptionLoading={subscriptionLoading}
      subscriptionError={subscriptionError}
       />
        {/* Step Title */}
        <Box sx={{ alignSelf: "flex-start", padding: "0.5rem" }}>
          <Typography
            variant="h3"
            sx={{
              mt: {xs: '2rem'},
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              color: "white",
            }}
          >
            {steps[activeStep]}
          </Typography>
        </Box>


{activeStep === 0 && (
  <Box>
    <Paper
      elevation={3}
      sx={{
        borderRadius: "10px",
        width: {
          xs: "350px",
          sm: "400px",
          md: "600px",
          lg: "800px",
          xl: "1200px",
        },
      }}
    >
      <SongUpload
      
        isSongLoading={isSongLoading}
        setIsSongLoading={setIsSongLoading}
        handleSongUpload={handleSongUpload}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        setValue={setValue}
        uploadState={uploadState}
      subscriptionLoading={subscriptionLoading}
      subscriptionError={subscriptionError}

        
      />
    </Paper>
  </Box>
)}

<Box>
  {/* Step 1: Metadata */}
  {activeStep === 1 && (
    <Box sx={{ overflowY: 'scroll', height: '100%', width: { xs: "350px", sm: "400px", md: "600px", lg: "800px", xl: "1200px" }}}>
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

  {/* Step 2: Lyrics */}
  {activeStep === 2 && (
    <Box>
      <Lyrics  activeStep={activeStep} setActiveStep={setActiveStep} songId={songId}/>
    </Box>
  )}

  {/* Step 3: Cover Art */}
  {activeStep === 3 && (
    <Box sx={{width: '100%', height: '100vh'}}>
      <SongCover 
      activeStep={activeStep}
       setActiveStep={setActiveStep}
        songId={songId}
        watch={watch}
        currentImageUrl={songCoverImage}
        onUpload={handleSongImageUpload}
        onDelete={deleteSongCoverImage}
        isLoading={isCoverUploading}
        onChangeImage={(url) => setSongCoverImage(url)}
      />
    </Box>
  )}





</Box>



{/* <TestUploadProgressTracker 
   uploadState={uploadState}
      subscriptionLoading={subscriptionLoading}
      subscriptionData= {subscriptionData}
      subscriptionError={subscriptionError} /> */}

      </Box>
    </>
  );
}
