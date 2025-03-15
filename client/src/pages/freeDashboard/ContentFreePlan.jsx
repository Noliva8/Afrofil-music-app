import React, { useState } from "react";
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
import { GET_PRESIGNED_URL } from "../../utils/mutations";
import { WaveFile } from "wavefile";
import { useForm } from "react-hook-form"

import { SONG_OF_ARTIST, SONG_HASH } from "../../utils/queries";
import musicNote from "../../images/Music-note.svg";
import { CREATE_SONG, SONG_UPLOAD, UPDATE_ALBUM } from "../../utils/mutations";
import ArtistAuth from "../../utils/artist_auth";
import CustomAlbum from "../../components/homeFreePlanComponents/albumContent/CustomAlbum";
import Swal from "sweetalert2";
import SongUpload from "../../components/songContentPart/SongUpload";
import "../CSS/CSS-HOME-FREE-PLAN/content.css";
// ----------------------------------------------





const steps = ["Song upload", "Details", "Lyrics", "Artwork"];

export default function ContentFreePlan() {

  const [audioHash, setAudioHash] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isSongLoading, setIsSongLoading] = useState(false);
 const { register, handleSubmit, setValue, watch } = useForm({
    mode: "onChange",
  });
  const [originalSongUrl, setOriginalSongUrl] = useState("");
  const [convertedSongUrl, setConvertedSongUrl] = useState("");
  const [skipped, setSkipped] = React.useState(new Set());
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
  console.log("handleSongUpload called");
  event.preventDefault();

  const songFile = event.target.files[0];
  console.log(songFile);

  if (!songFile) {
    Swal.fire({ icon: "error", title: "Oops...", text: "No song selected!" });
    return;
  }

  const allowedFormats = ["audio/mpeg", "audio/wav", "audio/flac"];
  if (!allowedFormats.includes(songFile.type)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Format",
      text: "Only MP3, WAV, and FLAC are allowed.",
    });
    return;
  }

  if (songFile.size > 10 * 1024 * 10240) {
    Swal.fire({
      icon: "error",
      title: "File too large",
      text: "Please upload a file smaller than 10MB.",
    });
    return;
  }

  // Task 1: Read and Hash the Song
  const readAndHashSong = async (file) => {
    try {
      console.log("Reading file...");
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const audioData = reader.result;
            if (!audioData || audioData.byteLength === 0) {
              throw new Error("Failed to read file or file is empty");
            }

            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(audioData);

            console.log("Audio decoded successfully");
            const numChannels = audioBuffer.numberOfChannels;
            const duration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;

            console.log("Number of channels:", numChannels);
            console.log("The length of the song:", duration);
            console.log("The sample rate of the song:", sampleRate);

            const channels = [];
            for (let i = 0; i < numChannels; i++) {
              channels.push(audioBuffer.getChannelData(i));
            }

            const computedHash = generateHash(channels);
            console.log("Computed Hash:", computedHash);

            resolve(computedHash);
          } catch (error) {
            console.error("Error processing audio:", error);
            Swal.fire({
              icon: "error",
              title: "Audio processing error",
              text: error.message || "Failed to create fingerprint.",
            });
            reject(error);
          }
        };

        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error("Error reading song file:", error);
      throw error;
    }
  };

  // Task 2: Upload Original Song to S3
  const uploadOriginalSong = async (file) => {
    try {
      console.log("Uploading original song to S3...");
      await uploadToS3OriginalSongs(file);
      console.log("Upload to S3 successful");
      Swal.fire({
        icon: "success",
        title: "Upload Successful",
        text: "Your song has been uploaded to S3.",
      });
    } catch (error) {
      console.error("Error uploading song to S3:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "Failed to upload song.",
      });
    }
  };

  // Task 3: Send Song to Server using SONG_UPLOAD mutation
  const sendSongToServer = async (file, hash) => {
    try {
      console.log("Checking if song exists on the server...");

      const { data: songData } = await client.query({
        query: SONG_OF_ARTIST,
        variables: { audioHash: hash, artistId: currentArtistId },
      });

      if (songData?.SongsOfArtist) {
        Swal.fire({
          icon: "info",
          title: "Song already uploaded",
          text: "This song exists in your songs.",
        });
        return;
      }

      console.log("Uploading song to server...");


      const { data } = await client.mutate({
        mutation: SONG_UPLOAD,
        variables: { file },
      });


      console.log("Song uploaded to server successfully:", data);
      Swal.fire({
        icon: "success",
        title: "Song Uploaded to Server",
        text: "Your song is now stored on the server.",
      });
    } catch (error) {
      console.error("Error uploading song to server:", error);
      Swal.fire({
        icon: "error",
        title: "Server Upload Failed",
        text: error.message || "Failed to upload song to server.",
      });
    }
  };

  // Execute tasks independently
  const hashPromise = readAndHashSong(songFile);
  const uploadPromise = uploadOriginalSong(songFile);

  hashPromise
    .then((hash) => sendSongToServer(songFile, hash))
    .catch((err) => console.error("Hashing failed:", err));

  uploadPromise.catch((err) => console.error("Upload to S3 failed:", err));

  setIsSongLoading(false);
};

// Helper function to generate hash
const generateHash = (channels) => {
  let hash = 0;
  const step = Math.max(1, Math.floor(channels[0].length / 1000));
  for (let i = 0; i < channels[0].length; i += step) {
    for (let j = 0; j < channels.length; j++) {
      hash += Math.abs(channels[j][i]);
    }
  }
  return Math.abs(hash).toString(16);
};


  // upload original song method
  // ---------------------------
  const uploadToS3OriginalSongs = async (songFile) => {
    try {
      setIsSongLoading(true);
      const { data } = await getPresignedUrl({
        variables: {
          bucket: "afrofeel-original-songs",
          key: songFile.name,
          region: "us-west-2",
        },
      });

      const presignedUrl = data.getPresignedUrl.url;

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: songFile,
        headers: { "Content-Type": songFile.type },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const originalUrl = `https://afrofeel-profile-picture.s3.us-west-2.amazonaws.com/${songFile.name}`;
      console.log("Upload successful:", originalUrl);

      setOriginalSongUrl(originalUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Error",
        text: "Failed to upload file.",
      });
    } finally {
      setIsSongLoading(false);
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
              uploadToS3OriginalSongs={uploadToS3OriginalSongs}
              
              
            />
          </Paper>
        </Box>

        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1rem",
            }}
          >
            <Button
              onClick={handleBackStep}
              variant="contained"
              disabled={activeStep === 0}
              sx={{
                bgcolor: "var(--primary-background-color)",
                color: "var(--button-color)",
                "&:hover": {
                  bgcolor: "var(--button-color)",
                  color: "var(--primary-background-color)", // Change this to your desired hover text color
                },
              }}
            >
              {" "}
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNextStep}
                sx={{
                  bgcolor: "var(--primary-background-color)",
                  color: "var(--button-color)",
                  "&:hover": {
                    bgcolor: "var(--button-color)",
                    color: "var(--primary-background-color)", // Change this to your desired hover text color
                  },
                }}
              >
                {" "}
                Submit
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextStep}
                sx={{
                  bgcolor: "var(--primary-background-color)",
                  color: "var(--button-color)",
                  "&:hover": {
                    bgcolor: "var(--button-color)",
                    color: "var(--primary-background-color)", // Change this to your desired hover text color
                  },
                }}
              >
                {" "}
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
