import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_BIO } from "../../utils/mutations";


import Grid from '@mui/material/Grid2';
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import FormControl from "@mui/material/FormControl";
import  Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import ArtistAccountProfile from "./ArtistAccountProfile";

import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";  




const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "600px",
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
  width: '100%',
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
  maxHeight: "auto",
  overflowY: "auto",
  lineHeight: "1.6em",
  fontSize: "1rem", // Adjusted font size for better readability
  textAlign: "justify",
  whiteSpace: "pre-wrap",
  wordSpacing: "0.1em",
};

const MAX_BIO_LENGTH = 150;

const Bio = () => {
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addBio, { loading: updating }] = useMutation(ADD_BIO);

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setFieldValue(data?.artistProfile.bio || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFieldValue("");
  };

  const handleUpdate = async () => {
    if (!fieldValue.trim()) {
      toast.error("Bio cannot be empty."); // Show error toast
      return;
    }

    if (fieldValue.length > 500) {
      toast.error("Bio cannot exceed 500 characters."); // Show error toast
      return;
    }

    try {
      await addBio({
        variables: {
          bio: fieldValue,
        },
      });

      refetch();
      toast.success("Bio updated successfully!"); // Show success toast
      handleClose();
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Error updating bio. Please try again."); // Show error toast
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
                Biography
              </Typography>
              
              {data?.artistProfile?.bio ? (
                <Box sx={bioContainerStyle}>

                  <Box sx={{width: '300px', height: '400px'}}>
<ArtistAccountProfile />
                  </Box>







                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#441a49', 
                      lineHeight: "1.6em",
                      fontSize:  '1.3rem',
                      wordSpacing: "0.1em",
                      fontFamily: 'roboto', 
                      padding: '10px'
                    }}
                  >
                    {data.artistProfile.bio}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    fontSize: "1rem",
                    lineHeight: "1.5em",
                    color: "#b0b0b0",
                  }}
                >
                  This profile has not set the bio yet.
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
                aria-label="Edit Bio"
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
        aria-labelledby="update-bio-modal"
        aria-describedby="modal-to-update-bio"
      >
        <Box sx={modalStyle}>
          <Typography
            variant="h5"
            id="update-bio-modal"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
            }}
          >
            Update Bio
          </Typography>
          <FormControl fullWidth>
            <FormLabel
              htmlFor="bio-textarea"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: "0.03em",
              }}
            >
              Biography
            </FormLabel>
            <TextareaAutosize
              id="bio-textarea"
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
              aria-describedby="bio-helper-text"
            />
            <Typography
              variant="caption"
              id="bio-helper-text"
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

export default Bio;
