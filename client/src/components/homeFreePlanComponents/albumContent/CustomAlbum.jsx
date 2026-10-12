import { useState, lazy, Suspense, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useMutation } from "@apollo/client";
import { CUSTOM_ALBUM } from "../../../utils/mutations";
import { useForm } from "react-hook-form";
import { alpha, useTheme } from "@mui/material/styles";
import AlbumCoverUpload from "./AlbumCoverUpload";
import './customAlbum.css';
const LazyReleaseDatePicker = lazy(() => import("./ReleaseDatePicker.jsx"));
const ReleaseDateFallback = () => {
  const theme = useTheme();

  return (
    <TextField
      fullWidth
      placeholder="Loading release date picker..."
      disabled
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.7),
        borderRadius: "8px",
        "& .MuiInputBase-root": { color: theme.palette.text.primary },
        "& .MuiInputBase-input::placeholder": {
          color: alpha(theme.palette.text.secondary, 0.8),
        },
      }}
    />
  );
};

const getModalSx = (theme) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "calc(100% - 24px)", sm: "500px", md: "50%", lg: "900px" },
  height: "auto",
  maxHeight: "80vh",
  bgcolor: alpha(theme.palette.background.paper, 0.96),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
  boxShadow: 24,
  borderRadius: "8px",
  p: { xs: 2, sm: 3 },
  overflowY: "auto",
});

export default function CustomAlbum({ albumOpen, setAlbumOpen, profile, refetchAlbums }) {
  const theme = useTheme();
  const [inputModal, setInputModel] = useState(false);
  const [createCustomAlbum] = useMutation(CUSTOM_ALBUM);
  const [albumId, setAlbumId] = useState('');
  const artistId = profile?.data?._id;
  const closeButtonRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      releaseDate: null, // Default value for date field
    },
  });

  const releaseDateValue = watch("releaseDate");

  const handleClose = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Album data are not saved!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#441a49",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, close it!",
    });

    if (result.isConfirmed) {
      setAlbumOpen(false);
      await Swal.fire({
        title: "Closed!",
        text: "Your album has been closed.",
        icon: "success",
      });
    }
  };

  useEffect(() => {
    if (albumOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [albumOpen]);

  const onSubmit = async (data) => {
    try {

      const response = await createCustomAlbum({
        variables: {
          title: data.title,
          releaseDate: data.releaseDate,
          artistId: artistId,
          albumCoverImage: "",
        },
        
      });

      // Refetch albums to ensure the dropdown reflects the new album
      await refetchAlbums();

      const newAlbumId = response.data.createCustomAlbum._id;

      if (response.data) {
        setAlbumId(newAlbumId);
        setAlbumOpen(false);  // Close the modal
        setInputModel(true);  // Trigger the album cover input modal
      }
    } catch (err) {
      console.error("Error creating album:", err);

      // Handle specific error messages from the server
      if (err.message.includes("An album with this title already exists")) {
        Swal.fire({
          icon: "error",
          title: "Title already exists",
          text: "An album with this title already exists. Click on the dropdown menu to find your album.",
          customClass: {
            popup: "custom-alert",
          },
          confirmButtonText: "OK", // Confirm button text
        }).then(() => {
          setAlbumOpen(false);  // Close the modal after the user clicks "OK"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error creating album.",
          customClass: {
            popup: "custom-alert",
          },
          confirmButtonText: "OK",
        }).then(() => {
          setAlbumOpen(false);  // Close the modal after the user clicks "OK"
        });
      }
    }
  };


  return (
    <div>
      <Modal
        open={albumOpen}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={getModalSx(theme)}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              minWidth: 40,
              color: theme.palette.text.secondary,
              borderColor: alpha(theme.palette.text.primary, 0.14),
              bgcolor: alpha(theme.palette.background.default, 0.32),
              "&:hover": {
                color: theme.palette.text.primary,
                borderColor: alpha(theme.palette.primary.main, 0.45),
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
            ref={closeButtonRef}
          >
            <CloseIcon />
          </Button>

          <Paper
            elevation={0}
            sx={{
              width: "100%",
              bgcolor: alpha(theme.palette.background.default, 0.42),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              p: { xs: 2, sm: 2.5 },
              borderRadius: "8px",
            }}
          >
            <Stack spacing={2}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: "1.8rem", md: "2rem", lg: "2.3rem" },
                  fontWeight: 900,
                  color: theme.palette.text.primary,
                  textAlign: "left",
                }}
              >
                Create Album
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: "1rem" }}>Title</Typography>
                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    variant="outlined"
                    autoFocus
                    {...register("title")}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        color: theme.palette.text.primary,
                        borderRadius: "8px",
                        "& fieldset": {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        "&:hover fieldset": {
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: "1rem" }}>Release Date</Typography>
                  <Suspense fallback={<ReleaseDateFallback />}>
                    <LazyReleaseDatePicker
                      value={releaseDateValue}
                      onChange={(date) => setValue("releaseDate", date)}
                      error={errors.releaseDate}
                      helperText={errors.releaseDate?.message}
                    />
                  </Suspense>
                </Box>

                <Button
                  variant="contained"
                  sx={{
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    },
                    padding: "12px 24px",
                    fontSize: "1.2rem",
                    borderRadius: "8px",
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

      <AlbumCoverUpload
        inputModal={inputModal}
        setInputModel={setInputModel}
        albumId={albumId}
        onCoverUploaded={refetchAlbums}
      />
    </div>
  );
}
