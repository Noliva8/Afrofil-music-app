import React, { useRef } from "react";
import Paper from "@mui/material/Paper";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Button from "@mui/material/Button";

export default function SongUpload({
  handleSongUpload,
  isSongLoading,
}) {
  const songRef = useRef(null);

  return (
    <Paper
      sx={{
        width: "100%",
        padding: "1rem",
        display: "flex",
        height: "50vh",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        bgcolor: "var(--primary-background-color)",
      }}
    >
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        sx={{
          bgcolor: "var(--secondary-background-color)",
          fontSize: "2rem",
          padding: "1rem",
        }}
        disabled={isSongLoading} // Disable button while loading
      >
        {isSongLoading ? "Uploading..." : "Upload your song"}
        <input
          type="file"
          id="song"
          accept="audio/mpeg, audio/wav, audio/flac"
          name="song"
          className="albumCoverImage"
          style={{ display: "none" }}
          onChange={handleSongUpload}
          ref={songRef}
        />
      </Button>
    </Paper>
  );
}