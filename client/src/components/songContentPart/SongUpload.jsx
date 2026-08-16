import { useRef } from "react";
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
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
        padding: { xs: "1.75rem", md: "2.5rem" },
        display: "flex",
        flexDirection: "column",
        
        minHeight: { xs: 360, md: 430 },
        height: "auto",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        borderRadius: "8px",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
        boxShadow: theme.shadows[2],
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 16,
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.34)}`,
          borderRadius: "8px",
          pointerEvents: "none",
        },
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.48),
          boxShadow: theme.shadows[3],
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
            textAlign: "center",
            maxWidth: 560,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
            }}
          >
            <MusicNoteIcon
              sx={{
                fontSize: "2.6rem",
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: { xs: "1.35rem", md: "1.7rem" },
              lineHeight: 1.2,
            }}
          >
            Drop your audio file here
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              mb: 1,
              fontSize: { xs: "0.875rem", md: "1rem" }
            }}
          >
            MP3, WAV, or FLAC. Maximum file size: 100MB.
          </Typography>
          {!isProfileComplete && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
                padding: "0.6rem 0.9rem",
                borderRadius: "8px",
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
              background: theme.palette.common.white,
              color: theme.palette.common.black,
              fontSize: { xs: "1rem", md: "1.125rem" },
              padding: { xs: "0.78rem 1.5rem", md: "0.95rem 2rem" },
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: theme.shadows[2],
              "&:hover": {
                background: alpha(theme.palette.common.white, 0.88),
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[3],
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
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500
              }}
            >
              Processing your song...
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
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
