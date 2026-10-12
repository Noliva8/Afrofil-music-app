import { useState, useRef, useContext } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Swal from "sweetalert2";
import "./customAlbum.css";
import Paper from "@mui/material/Paper";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useMutation } from "@apollo/client";
import { GET_PRESIGNED_URL } from "../../../utils/mutations";
import { UPDATE_ALBUM } from "../../../utils/mutations";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ActivityMonitorContext,
  PREDEFINED_ACTIVITIES,
} from "../../../utils/Contexts/activityMonitoring.jsx";

const getModalSx = (theme) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "calc(100% - 24px)", sm: "500px", md: "50%", lg: "900px" },
  minHeight: { xs: 320, sm: 360 },
  bgcolor: alpha(theme.palette.background.paper, 0.96),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
  boxShadow: 24,
  borderRadius: "8px",
  p: { xs: 2, sm: 3 },
});

export default function AlbumCoverUpload({
  inputModal,
  setInputModel,
  albumId,
  onCoverUploaded,
}) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const { updateActivity } = useContext(ActivityMonitorContext);

  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [progress, setProgress] = useState(0); // State for progress bar
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_URL);
  const [UpdateAlbum] = useMutation(UPDATE_ALBUM);

  const handleAlbumImageUpload = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];

    // cover image integrity check
    // -------------------------
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "No file selected!",
        customClass: {
          popup: "custom-alert",
        },
      });
      return;
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Invalid file type. Please upload an image file (JPEG, PNG).",
        customClass: {
          popup: "custom-alert",
        },
      });
      return;
    }

    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Image size exceeds allowed size. Upload less than 5MB.",
        customClass: {
          popup: "custom-alert",
        },
      });
      return;
    }

    // File upload
    // -----------
    try {
      updateActivity?.(PREDEFINED_ACTIVITIES.UPLOADING, {
        uploadType: "album_cover",
        filename: file.name,
        fileSize: file.size,
        mimetype: file.type,
      });
      setIsLoadingImage(true);
      setProgress(0); // Reset progress before starting

      const objectKey = `album-covers/${file.name}`;

      const { data } = await getPresignedUrl({
        variables: {
          bucket: "afrofeel-album-covers",
          key: objectKey,
          region: "us-west-2",
        },
      });

      const uploadedUrl = data.getPresignedUrl.url;

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent); // Update progress state
        }
      });

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const canonicalUrl = `https://afrofeel-album-covers.s3.us-west-2.amazonaws.com/${objectKey}`;

          // Update the album with the uploaded image URL
          await UpdateAlbum({
            variables: {
              albumId: albumId,
              albumCoverImage: canonicalUrl,
            },
          });

          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Album created successfully!",
            customClass: {
              popup: "custom-swal-popup",
            },
          });

          setIsLoadingImage(false);
          setInputModel(false);
          onCoverUploaded?.();
        } else {
          setIsLoadingImage(false);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to upload image to S3.",
            customClass: {
              popup: "custom-alert",
            },
          });
        }
      };

      xhr.onerror = () => {
        setIsLoadingImage(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to upload image. Please try again.",
          customClass: {
            popup: "custom-alert",
          },
        });
      };

      xhr.send(file); // Send the file

    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to upload image. Please try again.",
        customClass: {
          popup: "custom-alert",
        },
      });
    }
  };

  return (
    <div>
      <Modal
        open={inputModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <Box sx={getModalSx(theme)}>
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 900,
              mb: 2,
            }}
          >
            Upload Album Cover
          </Typography>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              minHeight: 180,
              bgcolor: alpha(theme.palette.background.default, 0.42),
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.34)}`,
              borderRadius: "8px",
              margin: "0 auto",
              display: "flex",
              padding: { xs: 2, sm: 3 },
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 800,
                "&:hover": {
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              }}
            >
              Upload album cover
              <input
                type="file"
                id="albumCoverImage"
                name="albumCoverImage"
                className="albumCoverImage"
                accept="image/png, image/jpeg"
                onChange={handleAlbumImageUpload}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </Button>
          </Paper>

          {isLoadingImage && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Uploading... {progress}%
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 10,
                  backgroundColor: alpha(theme.palette.text.primary, 0.12),
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: theme.palette.success.main,
                    transition: "width 0.1s ease-in-out",
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </div>
  );
}
