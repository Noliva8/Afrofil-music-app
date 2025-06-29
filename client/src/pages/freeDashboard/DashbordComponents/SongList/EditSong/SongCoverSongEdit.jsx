import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { resizeImageFile } from "../../../../../utils/ResizeImageFile";



import {
  GET_PRESIGNED_URL,
  GET_PRESIGNED_URL_DOWNLOAD,
  GET_PRESIGNED_URL_DELETE,
  ADD_ARTWORK,
} from "../../../../../utils/mutations";
import { SONG_OF_ARTIST } from "../../../../../utils/queries";





export default function SongCoverSongEdit({ song,onClose, songId }) {
  const navigate = useNavigate();
  const { handleSubmit } = useForm();
  
  // Initial display URL is the existing song.artwork (if any)
  const [displayUrl, setDisplayUrl] = useState(song.artwork || "");
  const [fileKey, setFileKey]       = useState("");       // S3 key for the new upload
  const [loading, setLoading]       = useState(false);

  // 1) GraphQL hooks
  const [getUploadUrl]   = useMutation(GET_PRESIGNED_URL);
  const [getDownloadUrl] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getDeleteUrl]   = useMutation(GET_PRESIGNED_URL_DELETE);
  const [addArtwork]     = useMutation(ADD_ARTWORK, {
    refetchQueries: [{ query: SONG_OF_ARTIST }],
  });



  // 2) Handle file selection & upload
  
const handleFileChange = async (e) => {
  const rawFile = e.target.files?.[0];
  if (!rawFile) return;

  setLoading(true);

  // 1️⃣ Attempt to downsize/compress
  let file = rawFile;
  try {
    // max 1000px longest edge, 0.8 quality
    file = await resizeImageFile(rawFile, 1000, 0.8);
  } catch (resizeErr) {
    console.warn('Image resize failed, falling back to original', resizeErr);
  }

  // 2️⃣ Generate a unique key
  const key = `${Date.now()}_${file.name}`;

  try {
    // a) Get a PUT URL
    const { data: up } = await getUploadUrl({
      variables: { bucket: "afrofeel-cover-images-for-songs", key, region: "us-east-2" },
    });

    // b) Upload the resized (or original) file
    await fetch(up.getPresignedUrl.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    // c) Get a GET URL for display
    const { data: down } = await getDownloadUrl({
      variables: {
        bucket: "afrofeel-cover-images-for-songs",
        key,
        region: "us-east-2",
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      },
    });

    const urlToDisplay = down.getPresignedUrlDownload.urlToDownload;
    setDisplayUrl(urlToDisplay);
    setFileKey(key);

  } catch (err) {
    console.error("Upload error:", err);
    Swal.fire("Upload failed", err.message, "error");
  } finally {
    setLoading(false);
  }
};


  // 3) On form submit: delete old cover then save the new one
  const onSubmit = async () => {
    setLoading(true);

    // If there was a previous cover, delete it first
    if (song.artwork) {
      try {
        const oldKey = decodeURIComponent(
          new URL(song.artwork).pathname.split("/").pop()
        );
        const { data: del } = await getDeleteUrl({
          variables: { bucket: "afrofeel-cover-images-for-songs", key: oldKey, region: "us-east-2" },
        });
        await fetch(del.getPresignedUrlDelete.urlToDelete, { method: "DELETE" });
      } catch (err) {
        console.warn("⚠️ Failed to delete old cover:", err);
        // continue anyway
      }
    }

    // Now update the song record
    try {
      await addArtwork({
        variables: { songId, artwork: displayUrl },
      });
   onClose();
      await Swal.fire("Done!", "Your new cover is live.", "success");
   
    } catch (err) {
      console.error("❌ Failed to save new cover:", err);
      Swal.fire("Update failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: "var(--secondary-background-color)",
        minHeight: 300,
      }}
    >
      <Typography variant="h6" color="white" gutterBottom>
        Update Song Cover
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 1,
            p: 4,
            textAlign: "center",
            position: "relative",
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="cover preview"
                style={{
                  maxHeight: 250,
                  maxWidth: "100%",
                  borderRadius: 4,
                  objectFit: "contain",
                }}
                onError={() => setDisplayUrl("")}
              />
              <IconButton
                onClick={() => setDisplayUrl("")}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "error.main", color: "#fff" },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </>
          ) : loading ? (
            <CircularProgress size={48} />
          ) : (
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
            >
              Choose New Cover
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          )}
        </Box>

      <Button
  fullWidth
  type="submit"
  disabled={loading || !(fileKey || displayUrl)}
  sx={{
    mt: 2,
    backgroundColor: "var(--primary-font-color)",
    color: "var(--primary-background-color)",
  }}
>
  Save &amp; Publish
</Button>

      </form>
    </Paper>
  );
}
