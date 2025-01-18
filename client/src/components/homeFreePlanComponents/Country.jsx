import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_COUNTRY } from "../../utils/mutations";
import {
  Box,
  Modal,
  FormControl,
  Button,
  FormLabel,
  TextareaAutosize,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";  // Import react-toastify
import "react-toastify/dist/ReactToastify.css";  // Import styles


const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "400px",
  bgcolor: "#441a49",
  color: "#fff",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: "12px", // Slightly rounded corners
};

const cardStyle = {
  backgroundColor: "#1a5d5d",
  color: "#fff",
  borderRadius: "12px", // Rounded corners
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  boxSizing: "border-box",
  transition: "transform 0.2s ease-in-out, box-shadow 0.3s ease", // Added smooth animation
  "&:hover": {
    transform: "scale(1.05)", // Slightly zoomed on hover
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)", // Enhanced shadow on hover
  },
};

const bioContainerStyle = {
  backgroundColor: "white",
  color: "#441a49",
  padding: "1rem",
  borderRadius: "8px",
  minWidth: "400px",
  maxHeight: "300px",
  overflowY: "auto",
 
  textAlign: "justify",
  whiteSpace: "pre-wrap",
  
};

const MAX_BIO_LENGTH = 150;

const Country = () => {
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addCountry, { loading: updating }] = useMutation(ADD_COUNTRY);

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setFieldValue(data?.artistProfile.country || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFieldValue("");
  };

  const handleUpdate = async () => {
    if (!fieldValue.trim()) {
      toast.error("Country cannot be empty."); // Show error toast
      return;
    }

    try {
      await addCountry({
        variables: {
          country: fieldValue,
        },
      });

      refetch();
      toast.success("Country updated successfully!"); // Show success toast
      handleClose();
    } catch (error) {
      console.error("Error updating country:", error);
      toast.error("Error updating country. Please try again."); // Show error toast
    }
  };

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ marginTop: "20px", padding: "10px" }}
      >
        {loading ? (
          <Typography variant="h6" color="textSecondary">
            Loading...
          </Typography>
        ) : (
          <Card sx={cardStyle}>
            <CardContent>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "#e3e3e3",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                Country
              </Typography>
              
              {data?.artistProfile?.country ? (
                <Box sx={bioContainerStyle}>
                  <Typography 
                   variant="body2" sx={{ color: '#441a49', fontSize: '1.3rem', fontWeight:'400' }}
                  >
                    {data.artistProfile.country}
                  </Typography>
                </Box>
              ) : 
              (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    fontSize: "1rem",
                    lineHeight: "1.5em",
                    color: "#b0b0b0",
                  }}
                >

                  This profile has not set a country yet.
                </Typography>
              )}
            </CardContent>
            <CardActions style={{ justifyContent: "center" }}>
              <Button
                onClick={handleOpen}
                variant="contained"
                sx={{
                  backgroundColor: "#6c2d73",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "20px",
                  "&:hover": { backgroundColor: "#8a3b92" },
                }}
                aria-label="Edit Country"
              >
                Edit
              </Button>
            </CardActions>
          </Card>
        )}
      </Grid>
    
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="update-country-modal"
        aria-describedby="modal-to-update-country"
      >
        <Box sx={modalStyle}>
          <Typography
            variant="h5"
            id="update-country-modal"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
            }}
          >
            Update Country
          </Typography>
          <FormControl fullWidth>
            <FormLabel
              htmlFor="country-textarea"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: "0.03em",
              }}
            >
              Country
            </FormLabel>
            <TextareaAutosize
              id="country-textarea"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              minRows={4}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "0.8rem",
                backgroundColor: "#fff",
                color: "#000",
                borderRadius: "5px",
                fontSize: "1rem",
              }}
              maxLength={500}
              aria-describedby="country-helper-text"
            />
            <Typography
              variant="caption"
              id="country-helper-text"
              sx={{ color: "#fff", marginTop: "5px" }}
            >
              {fieldValue.length}/500 characters
            </Typography>
            <Button
              onClick={handleUpdate}
              variant="contained"
              sx={{
                marginTop: "15px",
                backgroundColor: "#6c2d73",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
                padding: "0.6rem 1.5rem",
                borderRadius: "20px",
                "&:hover": { backgroundColor: "#8a3b92" },
              }}
              disabled={updating}
            >
              {updating ? "Updating..." : "Update"}
            </Button>
          </FormControl>
        </Box>
      </Modal>

      {/* ToastContainer to render toasts */}
      <ToastContainer />
    </>
  );
};

export default Country;
