import { useState } from "react";
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
import { alpha, useTheme } from '@mui/material/styles';
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
    bgcolor: alpha(theme.palette.background.paper, 0.98),
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: theme.shadows[8],
    p: isMobile ? 2 : 4,
    borderRadius: "8px",
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const cardStyle = {
    backgroundColor: alpha(theme.palette.background.paper, 0.88),
    color: theme.palette.text.primary,
    borderRadius: "8px",
    width: '100%',
    margin: 0,
    padding: isMobile ? "14px" : "18px",
    boxSizing: "border-box",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: theme.shadows[2],
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      borderColor: alpha(theme.palette.primary.main, 0.42),
      boxShadow: theme.shadows[3],
    },
  };

  const bioContainerStyle = {
    backgroundColor: alpha(theme.palette.background.default, 0.52),
    color: theme.palette.text.primary,
    padding: isMobile ? "0.5rem" : "1rem",
    borderRadius: "8px",
    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
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
                  color: theme.palette.text.primary,
                  letterSpacing: 0,
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
                      color: theme.palette.text.primary, 
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
                    color: theme.palette.text.secondary,
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
                  background: theme.palette.common.white,
                  color: theme.palette.common.black,
                  fontWeight: "bold",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  padding: isMobile ? "0.4rem 1.2rem" : "0.6rem 1.5rem",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.88) },
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
                color: theme.palette.text.secondary,
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
                backgroundColor: alpha(theme.palette.background.default, 0.72),
                color: theme.palette.text.primary,
                borderRadius: "5px",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                fontSize: isMobile ? "0.95rem" : "1rem",
              }}
              maxLength={500}
              aria-describedby="bio-helper-text"
            />
            <Typography
              variant="caption"
              id="bio-helper-text"
              sx={{ color: theme.palette.text.secondary, marginTop: "5px" }}
            >
              {fieldValue.length}/500 characters
            </Typography>
            <Button
              onClick={handleUpdate}
              variant="contained"
              sx={{
                marginTop: "15px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                fontWeight: "bold",
                fontSize: isMobile ? "0.9rem" : "1rem",
                padding: isMobile ? "0.5rem 1.3rem" : "0.6rem 1.5rem",
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})` },
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
