import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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

// Helper to keep folder paths when deriving keys from stored URLs
const deriveKeyFromUrl = (url) => {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return String(url).replace(/^\/+/, "");
  try {
    const u = new URL(url);
    return decodeURIComponent((u.pathname || "").replace(/^\/+/, ""));
  } catch {
    return "";
  }
};

export default function SongCoverSongEdit({ song, onClose, songId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { handleSubmit } = useForm();
  
  const [displayUrl, setDisplayUrl] = useState(song.artwork || "");
  const [fileKey, setFileKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [getUploadUrl] = useMutation(GET_PRESIGNED_URL);
  const [getDownloadUrl] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getDeleteUrl] = useMutation(GET_PRESIGNED_URL_DELETE);
  const [addArtwork] = useMutation(ADD_ARTWORK, {
    refetchQueries: [{ query: SONG_OF_ARTIST }],
  });

  // Presign existing artwork so it displays even if stored URL is private
  useEffect(() => {
    const presignExisting = async () => {
      if (!song?.artwork) return;
      try {
        const key = deriveKeyFromUrl(song.artwork);
        if (!key) return;
        const { data } = await getDownloadUrl({
          variables: {
            bucket: "afrofeel-cover-images-for-songs",
            key,
            region: "us-east-2",
            expiresIn: 60 * 60 * 24 * 7,
          },
        });
        const presigned =
          data?.getPresignedUrlDownload?.urlToDownload ||
          data?.getPresignedUrlDownload?.url ||
          null;
        if (presigned) {
          setDisplayUrl(presigned);
          setFileKey(key);
        }
      } catch (err) {
        // keep existing displayUrl
      }
    };
    presignExisting();
  }, [song?.artwork, getDownloadUrl]);

  const handleFileChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setLoading(true);
    let file = rawFile;
    
    try {
      file = await resizeImageFile(rawFile, 1000, 0.8);
    } catch (resizeErr) {
      console.warn('Image resize failed, using original', resizeErr);
    }

    const key = `cover-images/${Date.now()}_${file.name}`;

    try {
      const { data: up } = await getUploadUrl({
        variables: { bucket: "afrofeel-cover-images-for-songs", key, region: "us-east-2" },
      });

      await fetch(up.getPresignedUrl.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      const { data: down } = await getDownloadUrl({
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key,
          region: "us-east-2",
          expiresIn: 60 * 60 * 24 * 7,
        },
      });

      const s3ObjectUrl = `https://afrofeel-cover-images-for-songs.s3.us-east-2.amazonaws.com/${key}`;

      setDisplayUrl(down.getPresignedUrlDownload.urlToDownload || s3ObjectUrl);
      setFileKey(key);
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Upload failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    if (song.artwork) {
      try {
        const oldKey = decodeURIComponent(
          (new URL(song.artwork).pathname || "").replace(/^\/+/, "")
        );
        const { data: del } = await getDeleteUrl({
          variables: {
            bucket: "afrofeel-cover-images-for-songs",
            key: oldKey.startsWith("cover-images/") ? oldKey : `cover-images/${oldKey}`,
            region: "us-east-2"
          },
        });
        await fetch(del.getPresignedUrlDelete.urlToDelete, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete old cover:", err);
      }
    }

    try {
      // Save canonical S3 URL (not presigned)
      const artworkUrlToSave = fileKey
        ? `https://afrofeel-cover-images-for-songs.s3.us-east-2.amazonaws.com/${fileKey}`
        : displayUrl;
      await addArtwork({
        variables: { songId, artwork: artworkUrlToSave },
      });
      onClose();
      await Swal.fire("Done!", "Your new cover is live.", "success");
    } catch (err) {
      console.error("Failed to save new cover:", err);
      Swal.fire("Update failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: isMobile ? 2 : 3,
        borderRadius: 2,
        backgroundColor: "var(--secondary-background-color)",
        width: "100%",
        maxWidth: isMobile ? "100%" : "600px",
        mx: "auto"
      }}
    >
      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        color="white" 
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Update Song Cover
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 1,
            p: isMobile ? 2 : 4,
            textAlign: "center",
            position: "relative",
            minHeight: isMobile ? 200 : 300,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.05)"
          }}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="cover preview"
                style={{
                  maxHeight: isMobile ? 180 : 250,
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
                size={isMobile ? "small" : "medium"}
              >
                <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </>
          ) : loading ? (
            <CircularProgress size={isMobile ? 40 : 48} />
          ) : (
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              size={isMobile ? "medium" : "large"}
              sx={{
                backgroundColor: "var(--primary-font-color)",
                color: "var(--primary-background-color)",
                '&:hover': {
                  backgroundColor: "var(--primary-font-color)",
                  opacity: 0.9
                }
              }}
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

        <Box sx={{ 
          display: "flex", 
          gap: 2,
          mt: 3,
          flexDirection: isMobile ? "column" : "row"
        }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            sx={{
              color: "white",
              borderColor: "white",
              '&:hover': {
                borderColor: "var(--primary-font-color)"
              }
            }}
          >
            Cancel
          </Button>
          
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || !(fileKey || displayUrl)}
            sx={{
              backgroundColor: "var(--primary-font-color)",
              color: "var(--primary-background-color)",
              '&:hover': {
                backgroundColor: "var(--primary-font-color)",
                opacity: 0.9
              },
              '&:disabled': {
                opacity: 0.7
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ color: "inherit", mr: 1 }} />
                Saving...
              </>
            ) : (
              "Save & Publish"
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
