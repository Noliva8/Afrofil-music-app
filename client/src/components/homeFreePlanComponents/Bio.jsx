import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_BIO } from "../../utils/mutations";

import Grid from '@mui/material/Grid2';
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import ArtistAccountProfile from "./ArtistAccountProfile";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { toast } from "react-toastify"; 

const Bio = () => {
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addBio, { loading: updating }] = useMutation(ADD_BIO);
  const [open, setOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? '95%' : isTablet ? '85%' : '90%',
    maxWidth: "600px",
    bgcolor: "#441a49",
    color: "#fff",
    border: "2px solid #000",
    boxShadow: 24,
    p: isMobile ? 2 : 4,
    borderRadius: "12px",
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const cardStyle = {
    backgroundColor: "#1a5d5d",
    color: "#fff",
    borderRadius: "12px",
    width: '100%',
    margin: isMobile ? "10px auto" : "20px auto",
    padding: isMobile ? "15px" : "20px",
    boxSizing: "border-box",
    transition: "transform 0.2s ease-in-out, box-shadow 0.3s ease",
    "&:hover": {
      transform: isMobile ? "none" : "scale(1.02)",
      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
    },
  };

  const bioContainerStyle = {
    backgroundColor: "white",
    color: "#441a49",
    padding: isMobile ? "0.5rem" : "1rem",
    borderRadius: "8px",
    width: '100%',
    maxHeight: "auto",
    overflowY: "auto",
    lineHeight: "1.6em",
    fontSize: isMobile ? "1rem" : "1.3rem",
    textAlign: "justify",
    whiteSpace: "pre-wrap",
    wordSpacing: "0.1em",
  };

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
      toast.error("Bio cannot be empty.");
      return;
    }

    if (fieldValue.length > 500) {
      toast.error("Bio cannot exceed 500 characters.");
      return;
    }

    try {
      await addBio({
        variables: {
          bio: fieldValue,
        },
      });

      refetch();
      toast.success("Bio updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Error updating bio. Please try again.");
    }
  };

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ 
          marginTop: isMobile ? "10px" : "20px", 
          padding: isMobile ? "5px" : "10px" 
        }}
      >
        {loading ? (
          <Typography variant="h6" color="textSecondary">
            Loading...
          </Typography>
        ) : (
          <Card sx={cardStyle}>
            <CardContent>
              <Typography
                variant={isMobile ? "h5" : "h4"}
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

              <Box sx={{ mb: 2 }}>
                <ArtistAccountProfile />
              </Box>
              
              {data?.artistProfile?.bio ? (
                <Box sx={bioContainerStyle}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#441a49', 
                      lineHeight: "1.6em",
                      fontSize: isMobile ? '1rem' : '1.3rem',
                      wordSpacing: "0.1em",
                      fontFamily: 'roboto', 
                      padding: isMobile ? '5px' : '10px'
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
                    fontSize: isMobile ? "0.9rem" : "1rem",
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
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  padding: isMobile ? "0.4rem 1.2rem" : "0.6rem 1.5rem",
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
            variant={isMobile ? "h6" : "h5"}
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
                fontSize: isMobile ? '0.95rem' : '1rem'
              }}
            >
              Biography
            </FormLabel>
            <TextareaAutosize
              id="bio-textarea"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              minRows={isMobile ? 3 : 4}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: isMobile ? "0.6rem" : "0.8rem",
                backgroundColor: "#fff",
                color: "#000",
                borderRadius: "5px",
                fontSize: isMobile ? "0.95rem" : "1rem",
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
                fontSize: isMobile ? "0.9rem" : "1rem",
                padding: isMobile ? "0.5rem 1.3rem" : "0.6rem 1.5rem",
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

    </>
  );
};

export default Bio;
