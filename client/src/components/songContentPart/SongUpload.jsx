import React, { useRef } from "react";
import {
  Paper,
  Button,
  Box,
  Typography,
  CircularProgress,
  Fade
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

export default function SongUpload({
  handleSongUpload,
  isSongLoading,
  activeStep,
  setValue,
  setActiveStep,
  isProfileComplete,
  missingProfileFields,
  onBlockedUpload
}) {
  const songRef = useRef(null);

  
const handleDragOver = (e) => {
  e.preventDefault();
};

const handleDrop = (e) => {
  e.preventDefault();

  if (!isProfileComplete) {
    if (onBlockedUpload) {
      onBlockedUpload();
    }
    return;
  }

  const file = e.dataTransfer.files[0];
  if (file) {
    // Create a real FileList-like event to pass to the input handler
    const fakeEvent = {
      preventDefault: () => {},
      target: { files: [file] }
    };

    handleSongUpload(fakeEvent);
  }
};






  return (
    <Paper
      elevation={3}
       onDragOver={handleDragOver}
  onDrop={handleDrop}
      sx={{
        width: "100%",
        padding: { xs: "1.5rem", md: "2rem" },
        display: "flex",
        flexDirection: "column",
        
        height: { xs: "60vh", md: "70vh" },
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        bgcolor: "var( --secondary-background-color)",
        borderRadius: "16px",
        border: "2px dashed var(--secondary-color)",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "var(--accent-color)",
          transform: "translateY(-2px)"
        }
      }}
    >
      {!isSongLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center"
          }}
        >
          <MusicNoteIcon
            sx={{
              fontSize: "4rem",
              color: "var(--button-color)",
              opacity: 0.8
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: "var(--button-color)",
              fontWeight: 600,
              fontSize: { xs: "1.25rem", md: "1.5rem" }
            }}
          >
            Drag & drop your song file here
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "var(--button-color)",
              mb: 2,
              fontSize: { xs: "0.875rem", md: "1rem" }
            }}
          >
            Supported formats: MP3, WAV, FLAC (Max 100MB)
          </Typography>
          {!isProfileComplete && (
            <Typography
              variant="body2"
              sx={{
                color: "#ffcf70",
                backgroundColor: "rgba(0,0,0,0.35)",
                border: "1px dashed rgba(255, 207, 112, 0.6)",
                padding: "0.6rem 0.9rem",
                borderRadius: "10px",
                maxWidth: 520
              }}
            >
              Complete your profile to upload. Missing:{" "}
              {missingProfileFields?.length ? missingProfileFields.join(", ") : "profile details"}.
            </Typography>
          )}
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: "var(--primary-background-color)",
              color: "var(--primary-font-color)",
              fontSize: { xs: "1rem", md: "1.125rem" },
              padding: { xs: "0.75rem 1.5rem", md: "1rem 2rem" },
              borderRadius: "12px",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              "&:hover": {
                bgcolor: "var(--accent-color)",
                border: '1px solid  #e4b120',
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
              },
              "&:active": {
                transform: "translateY(0)"
              }
            }}
            disabled={isSongLoading || !isProfileComplete}
          >
            Select File
            <input
              type="file"
              id="song"
              accept="audio/mpeg, audio/wav, audio/flac"
              name="song"
              style={{ display: "none" }}
              onChange={handleSongUpload}
              ref={songRef}

             
            />
          </Button>
        </Box>
      ) : (
        <Fade in={isSongLoading} timeout={500}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem"
            }}
          >
            <CircularProgress
              size={80}
              thickness={4}
              sx={{ color: "var(--accent-color)" }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "var(--text-primary)",
                fontWeight: 500
              }}
            >
              Processing your song...
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--text-secondary)",
                fontStyle: "italic"
              }}
            >
              Analyzing audio properties
            </Typography>
          </Box>
        </Fade>
      )}
    </Paper>
  );
}
