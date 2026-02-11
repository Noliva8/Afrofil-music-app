import { useState, lazy, Suspense } from "react";
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
import AlbumCoverUpload from "./AlbumCoverUpload";
import './customAlbum.css';
const LazyReleaseDatePicker = lazy(() => import("./ReleaseDatePicker.jsx"));
const ReleaseDateFallback = () => (
  <TextField
    fullWidth
    placeholder="Loading release date picker..."
    disabled
    sx={{
      bgcolor: "var(--secondary-background-color)",
      "& .MuiInputLabel-root": { color: "white !important" },
      "& .MuiInputBase-root": { color: "white !important" },
      "& .MuiInputBase-input": {
        color: "white !important",
        "&::placeholder": { color: "rgba(255,255,255,0.5)" },
      },
    }}
  />
);

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "500px", md: "50%", lg: "900px" },
  height: "auto",
  maxHeight: "80vh",
  bgcolor: "#2b2d42", // Dark background color
  border: "2px solid #8d99ae", // Light border for a cleaner look
  boxShadow: 24,
  borderRadius: "8px",
  p: 4,
};

export default function CustomAlbum({ albumOpen, setAlbumOpen, profile, refetchAlbums }) {
  const [inputModal, setInputModel] = useState(false);
  const [createCustomAlbum] = useMutation(CUSTOM_ALBUM);
  const [albumId, setAlbumId] = useState('');
  const artistId = profile?.data?._id;

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

      // Refetch albums to ensure the dropdown reflects the new album
      await refetchAlbums();

      console.log("Response:", response);
      const newAlbumId = response.data.createCustomAlbum._id;
      console.log("New created album ID:", newAlbumId);

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
        <Box sx={style}>
          <Button variant="contained" size={"small"} onClick={handleClose} sx={{ position: "absolute", top: "10px", right: "10px" }}>
            <CloseIcon />
          </Button>

          <Paper sx={{ width: "100%", height: "90%", margin: "1rem", bgcolor: "#441a49", padding: "20px", borderRadius: "8px" }}>
            <Stack spacing={2}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: { xs: "1.8rem", md: "2rem", lg: "2.3rem" },
                  fontWeight: 700,
                  color: "white",
                  textAlign: "center",
                }}
              >
                Create Album
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Typography sx={{ color: "white", fontWeight: "500", fontSize: "18px" }}>Title</Typography>
                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    variant="outlined"
                    {...register("title")}
                    sx={{
                      bgcolor: "#2f3e46",
                      color: "white",
                      borderRadius: "4px",
                      "& .MuiInputLabel-root": { color: "#ddd" },
                      "& .MuiInputBase-root": { color: "#fff" },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Typography sx={{ color: "white", fontWeight: "500", fontSize: "18px" }}>Release Date</Typography>
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
                    bgcolor: "#6c4f70", // Updated color for a polished look
                    color: "white",
                    "&:hover": { bgcolor: "#441a49" },
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

      <AlbumCoverUpload inputModal={inputModal} setInputModel={setInputModel} albumId={albumId} />
    </div>
  );
}
