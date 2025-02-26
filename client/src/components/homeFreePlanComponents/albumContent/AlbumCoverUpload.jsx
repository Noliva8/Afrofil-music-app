import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import "./customAlbum.css";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import { useMutation } from "@apollo/client";
import { CUSTOM_ALBUM, GET_PRESIGNED_URL } from "../../../utils/mutations";
import { UPDATE_ALBUM } from "../../../utils/mutations";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "500px", md: "50%", lg: "900px" },
  height: "50vh",
  bgcolor: "#1a5d5d",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function AlbumCoverUpload({
  inputModal,
  setInputModel,
  albumId,
  handleAlbumInputModel,
}) {
  const fileInputRef = useRef(null);

  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
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
      setIsLoadingImage(true);
      setProgress(0); // Reset progress before starting

      const { data } = await getPresignedUrl({
        variables: {
          bucket: "afrofeel-album-covers",
          key: file.name,
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
          const imageUrl = uploadedUrl.split("?")[0];
          setUploadedImageUrl(imageUrl); // Set the uploaded image URL

          // Update the album with the uploaded image URL
          await UpdateAlbum({
            variables: {
              albumId: albumId,
              albumCoverImage: imageUrl,
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

          setInputModel(false);
        } else {
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
    } finally {
      setIsLoadingImage(false);
    }
  };

  return (
    <div>
      <Modal
        open={inputModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{ zIndex: 10 }}
      >
        <Box sx={style}>
          <Typography variant="h6">Upload Album Cover</Typography>
          <Paper
            sx={{
              width: { xs: "200px", sm: "250px" },
              height: "100px",
              bgcolor: "#1a5d5d",
              margin: "0 auto",
              display: "flex",
              padding: "16px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ bgcolor: "#441a49" }}
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
              <Typography variant="body2" color="textSecondary">
                Uploading... {progress}%
              </Typography>
              <Box sx={{ width: "100%", height: "10px", backgroundColor: "#ccc" }}>
                <Box
                  sx={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "#4caf50",
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
