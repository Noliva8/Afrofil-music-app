import React, { useState, useEffect } from "react";
import { useApolloClient } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client";
import { useRef } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import CardMedia from "@mui/material/CardMedia";
import { WaveFile } from "wavefile";
import Fade from '@mui/material/Fade';
import { useForm } from "react-hook-form"
import CircularProgress from '@mui/material/CircularProgress';
import  CircularWithValueLabel from '../../components/songContentPart/UploadProgress';
import { SONG_OF_ARTIST, SONG_HASH } from "../../utils/queries";
import musicNote from "../../images/Music-note.svg";
import { CREATE_SONG, SONG_UPLOAD, UPDATE_SONG, GET_PRESIGNED_URL} from "../../utils/mutations";
import { GET_ALBUM, SONG_BY_ID } from "../../utils/queries";
import ArtistAuth from "../../utils/artist_auth";
import CustomAlbum from "../../components/homeFreePlanComponents/albumContent/CustomAlbum";
import Swal from "sweetalert2";
import SongUpload from "../../components/songContentPart/SongUpload";
import Metadata from "../../components/songContentPart/Metadata";
import "../CSS/CSS-HOME-FREE-PLAN/content.css";

// ----------------------------------------------





const steps = ["Song upload", "Metadata", "Lyrics", "Artwork"];

export default function ContentFreePlan() {


  // will be deleted
  const [originalSongUrl, setOriginalSongUrl] = useState("");
  const [convertedSongUrl, setConvertedSongUrl] = useState("");
  // ------------------

const [audioHash, setAudioHash] = useState(null);
// query the albums to display them
// ------------------------------

const { loading: albumLoading, error: albumError, data: albumData,  refetch} =useQuery(GET_ALBUM);

const { loading: songByIdLoading, error: songByIdError, data: songByIdData, refetch: songByIdRefetch} = useQuery(SONG_BY_ID);





const [albumToSelect, setAlbumToSelect] = useState('');
const [albums, setAlbums] = useState('')
const [songId, setSongId]= useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [ uploadProgress, setUploadProgress] = useState(0);

  const [skipped, setSkipped] = React.useState(new Set());
const { register, handleSubmit, formState: { errors } } = useForm();


const [updateSong] = useMutation(UPDATE_SONG);
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [createSong] = useMutation(CREATE_SONG);
  const [songUpload] =useMutation(SONG_UPLOAD);
  const client = useApolloClient();



  const handleNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBackStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const profile = ArtistAuth.getProfile();
  const currentArtistId = profile?.data?.artistAka;





const handleSongUpload = async (event) => {
  setIsSongLoading(true);
  setUploadProgress(10); // Step 1: User selects file
  event.preventDefault();

  const songFile = event.target.files[0];
  if (!songFile) {
    Swal.fire({ icon: "error", title: "Oops...", text: "No song selected!" });
    setIsSongLoading(false);
    return;
  }

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

  // we are using useMutation to send the file to the server
  // -----------------------------------------------------

try{

const { data} = await songUpload({
  variables: { file: songFile },
})

}catch(error){
console.error(error);
}
 
};







// // Helper function to generate hash
// const generateHash = (channels) => {
//   let hash = 0;
//   const step = Math.max(1, Math.floor(channels[0].length / 1000));
//   for (let i = 0; i < channels[0].length; i += step) {
//     for (let j = 0; j < channels.length; j++) {
//       hash += Math.abs(channels[j][i]);
//     }
//   }
//   return Math.abs(hash).toString(16);
// };


  // // upload original song method
  // // ---------------------------
  // const uploadToS3OriginalSongs = async (songFile) => {
  //   try {
  //     setIsSongLoading(true);
  //     const { data } = await getPresignedUrl({
  //       variables: {
  //         bucket: "afrofeel-original-songs",
  //         key: songFile.name,
  //         region: "us-west-2",
  //       },
  //     });

  //     const presignedUrl = data.getPresignedUrl.url;

  //     const response = await fetch(presignedUrl, {
  //       method: "PUT",
  //       body: songFile,
  //       headers: { "Content-Type": songFile.type },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Upload failed");
  //     }
  //     const originalUrl = `https://afrofeel-original-songs.s3.us-west-2.amazonaws.com/${songFile.name}`;
  //     console.log("Upload successful:", originalUrl);

  //     setOriginalSongUrl(originalUrl);
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Upload Error",
  //       text: "Failed to upload file.",
  //     });
  //   } finally {
  //     setIsSongLoading(false);
  //   }
  // };

  


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

// ---------------------------------------
// Form submition
// -------------


// fetch data to populate them in defaultValues. 
// --------------------------------------------




 


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
        {/* Step Title */}
        <Box sx={{ alignSelf: "flex-start", padding: "0.5rem" }}>
          <Typography
            variant="h3"
            sx={{
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
        audioHash={audioHash}
        setAudioHash={setAudioHash}
        isSongLoading={isSongLoading}
        setIsSongLoading={setIsSongLoading}
        originalSongUrl={originalSongUrl}
        setOriginalSongUrl={setOriginalSongUrl}
        convertedSongUrl={convertedSongUrl}
        setConvertedSongUrl={setConvertedSongUrl}
        handleSongUpload={handleSongUpload}
        
      />
    </Paper>
  </Box>
)}

{activeStep === 1 && (
  <Box sx={{ overflowY: 'scroll', height: '100%'}}>
 <Metadata register={register} errors={errors} albumToSelect={albumToSelect} albums={albums} refetch={refetch} handleAlbumChange={ handleAlbumChange }/>
  </Box>
)}

{activeStep === 2 && (
  <Box>
    {/* we display details lyrics which is option */}
  </Box>
)}

{activeStep === 3 && (
  <Box sx={{width: '100%', height: '100vh'}}>
  
  </Box>
)}





<Box>
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      padding: "1rem",
    }}
  >
    {/* Back Button - Only appears on Step 2 (Lyrics) and Submit Step */}
    {activeStep === 2 || activeStep === steps.length - 1 ? (
      <Button
        onClick={handleBackStep}
        variant="contained"
        sx={{
          bgcolor: "var(--primary-background-color)",
          color: "var(--button-color)",
          "&:hover": {
            bgcolor: "var(--button-color)",
            color: "var(--primary-background-color)",
          },
        }}
      >
        Back
      </Button>
    ) : null}

    {/* Skip Button - Only for Step 2 (Lyrics) */}
    {activeStep === 2 && (
      <Button
        variant="outlined"
        onClick={handleNextStep}
        sx={{
          borderColor: "var(--button-color)",
          color: "var(--button-color)",
          "&:hover": {
            bgcolor: "var(--button-color)",
            color: "var(--primary-background-color)",
          },
        }}
      >
        Skip
      </Button>
    )}

    {/* Next or Submit Button */}
    {activeStep === steps.length - 1 ? (
      <Button
        variant="contained"
        onClick={handleSubmit} // Call final submit handler
        sx={{
          bgcolor: "var(--primary-background-color)",
          color: "var(--button-color)",
          "&:hover": {
            bgcolor: "var(--button-color)",
            color: "var(--primary-background-color)",
          },
        }}
      >
        Submit
      </Button>
    ) : (
      activeStep !== 0 && (
        <Button
          variant="contained"
          onClick={handleNextStep}
          sx={{
            bgcolor: "var(--primary-background-color)",
            color: "var(--button-color)",
            "&:hover": {
              bgcolor: "var(--button-color)",
              color: "var(--primary-background-color)",
            },
          }}
        >
          Next
        </Button>
      )
    )}
  </Box>

  {/* Circular Progress */}
  {isSongLoading && uploadProgress > 0 && uploadProgress < 100 && (
    <Box>
      <CircularWithValueLabel progress={uploadProgress} />
    </Box>
  )}

  {/* Fade-out effect after upload is complete */}
  <Fade in={uploadProgress > 0 && uploadProgress < 100} timeout={1000}>
    <Box>
      <CircularWithValueLabel progress={uploadProgress} />
    </Box>
  </Fade>
</Box>



      </Box>
    </>
  );
}
