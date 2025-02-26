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
import AlbumCoverUpload from "./AlbumCoverUpload";
import { CUSTOM_ALBUM, GET_PRESIGNED_URL } from "../../../utils/mutations";
import { GET_PRESIGNED_URL_DOWNLOAD } from "../../../utils/mutations";
import { useForm } from "react-hook-form";



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

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function CustomAlbum({ albumOpen, setAlbumOpen, profile, refetch }) {
  const [inputModal, setInputModel] = useState(false);
  const [createCustomAlbum] = useMutation(CUSTOM_ALBUM);
const [ albumId, setAlbumId] = useState('');



  const handleAlbumInputModel = () => setInputModel(true);

  const artistId = profile?.data?._id;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: "",
      releaseDate: "",
    },
  });

  const handleClose = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Album data are not saved!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#441a49",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, close it!",
      customClass: {
        popup: "custom-swal-popup",
        container: "custom-swal-container",
        confirmButton: "custom-confirm-button",
      },
    });

    if (result.isConfirmed) {
      setAlbumOpen(false);
      await Swal.fire({
        title: "Closed!",
        text: "Your album has been closed.",
        icon: "success",
        customClass: {
          popup: "custom-swal-popup",
        },
      });
    }
  };

const onSubmit = async (data) => {
  try {
    console.log("Submitting album data:", data);

    const response = await createCustomAlbum({
      variables: {
        title: data.title,
        releaseDate: data.releaseDate,
        artistId: artistId,
        albumCoverImage: "",
      },
    });

    await refetch();

    console.log("Response:", response);
    const newAlbumId = response.data.createCustomAlbum._id;
    console.log("new created id:", albumId);

    if (response.data) {
      setAlbumId(newAlbumId);
      setAlbumOpen(false);
      setInputModel(true);
    }
  } catch (err) {
    console.error("Error creating album:", err);

    // Check for specific error messages from the backend
    if (err.message.includes("An album with this title already exists")) {
      Swal.fire({
        icon: "error",
        title: "Title already exists",
        text: "An album with this title already exists. Click on dropdown menu to find your album.",
        customClass: {
          popup: "custom-alert",
        },
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error creating album. Check console for details.",
        customClass: {
          popup: "custom-alert",
        },
      });
    }
  }
};


  return (
    <div>
      <Modal
        open={albumOpen}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{ zIndex: 10 }}
      >
        <Box sx={style}>
          <Button variant="contained" size={"small"} onClick={handleClose}>
            <CloseIcon />
          </Button>

          <Paper
            sx={{
              width: "100%",
              height: "90%",
              margin: "1rem",
              bgcolor: "#441a49",
              padding: "16px",
            }}
          >
            <Stack>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "2rem" }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "Roboto",
                    marginLeft: { xs: "0", md: "0" },
                    fontSize: { xs: "1.8rem", md: "2rem", lg: "2.3rem" },
                    fontWeight: 700,
                    mt: 4,
                    color: "white",
                    mb: "2",
                  }}
                >
                  Create Album
                </Typography>

                {/* Title */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "start", md: "center" },
                  }}
                >
                  <label
                    htmlFor="title"
                    style={{
                      color: "white",
                      minWidth: "150px",
                      fontFamily: "roboto",
                      fontWeight: "500",
                      fontSize: "18px",
                    }}
                  >
                    Title
                  </label>
                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    {...register("title")}
                    sx={{
                      bgcolor: "var(--secondary-background-color)",
                      color: "white",
                      "& .MuiInputLabel-root": { color: "white" },
                      "& .MuiInputBase-root": { color: "white" },
                    }}
                  />
                </Box>

                {/* Release Date */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "start", md: "center" },
                  }}
                >
                  <label
                    htmlFor="releaseDate"
                    style={{
                      color: "white",
                      minWidth: "150px",
                      fontFamily: "roboto",
                      fontWeight: "500",
                      fontSize: "18px",
                    }}
                  >
                    Release Date
                  </label>
                  <TextField
                    id="releaseDate"
                    name="releaseDate"
                    type="date"
                    fullWidth
                    sx={{
                      bgcolor: "var(--secondary-background-color)",
                      color: "white",
                      "& .MuiInputLabel-root": { color: "white" },
                      "& .MuiInputBase-root": { color: "white" },
                    }}
                    {...register("releaseDate", {
                      required: "Release date is required",
                      validate: {
                        notInFuture: (value) => {
                          const today = new Date().toISOString().split("T")[0];
                          return (
                            value <= today ||
                            "Release date cannot be in the future"
                          );
                        },
                      },
                    })}
                    error={!!errors.releaseDate}
                    helperText={errors.releaseDate?.message}
                  />
                </Box>

                {/* Submit Button */}
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#1a5d5d",
                    color: "white",
                    "&:hover": { bgcolor: "gray" },
                    mt: 2,
                  }}
                  onClick={handleSubmit(onSubmit)}
                >
                  Create album
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Modal>

      {/* trigger input model */}

      <AlbumCoverUpload
        inputModal={inputModal}
        setInputModel={setInputModel}
        handleAlbumInputModel={handleAlbumInputModel}
        albumId={albumId}
      />
    </div>
  );
}
