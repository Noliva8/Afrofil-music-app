import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_LANGUAGES } from "../../utils/mutations";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { toast } from "react-toastify";  // Import react-toastify

const Language = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);

  const [addBio, { loading: updating }] = useMutation(ADD_LANGUAGES);

  const [open, setOpen] = useState(false);
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "calc(100% - 24px)" : "90%",
    maxWidth: "400px",
    bgcolor: alpha(theme.palette.background.paper, 0.98),
    color: theme.palette.text.primary,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: theme.shadows[8],
    p: isMobile ? 2 : 4,
    borderRadius: "8px",
  };
  const cardStyle = {
    backgroundColor: alpha(theme.palette.background.paper, 0.88),
    color: theme.palette.text.primary,
    borderRadius: "8px",
    width: "100%",
    maxWidth: { xs: "100%", sm: 600 },
    minHeight: { xs: "auto", sm: 210 },
    height: "100%",
    margin: 0,
    padding: { xs: "12px", sm: "18px" },
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
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
    padding: { xs: "0.75rem", sm: "1rem" },
    borderRadius: "8px",
    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
    minHeight: 56,
    maxWidth: "100%",
    overflowY: "auto",
    overflowWrap: "anywhere",
    lineHeight: "1.6em",
    fontSize: "1rem",
    textAlign: "left",
    whiteSpace: "pre-wrap",
  };

  const handleOpen = () => {
    setFieldValue(data?.artistProfile?.languages?.join(", ") || ""); // Display languages as a comma-separated list
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFieldValue("");
  };

  const handleUpdate = async () => {
    if (!fieldValue.trim()) {
      toast.error("Languages cannot be empty."); // Show error toast
      return;
    }

    const languagesArray = fieldValue.split(",").map((lang) => lang.trim());

    try {
      await addBio({
        variables: {
          languages: languagesArray,
        },
      });

      refetch();
      toast.success("Languages updated successfully!"); // Show success toast
      handleClose();
    } catch (error) {
      console.error("Error updating languages:", error);
      toast.error("Error updating languages. Please try again."); // Show error toast
    }
  };

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ mt: { xs: 1, sm: 2.5 }, p: { xs: 0, sm: 1.25 }, width: "100%" }}
      >
        {loading ? (
          <Typography variant="h6" color="textSecondary">
            Loading...
          </Typography>
        ) : (
          <Card sx={cardStyle}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 1.25, sm: 2 }, "&:last-child": { pb: { xs: 1.25, sm: 2 } } }}>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  color: theme.palette.text.primary,
                  letterSpacing: 0,
                  marginBottom: "1rem",
                  fontSize: { xs: "1.35rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                Languages
              </Typography>
              
              {data?.artistProfile?.languages && data.artistProfile.languages.length > 0 ? (
                <Box component="ul" sx={{ ...bioContainerStyle, pl: { xs: 3, sm: 4 }, m: 0 }}>
                  {data.artistProfile.languages.map((language, index) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1,
                        fontSize: { xs: "1rem", sm: "1.15rem" },
                        fontFamily: "roboto",
                        color: theme.palette.text.primary,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {language}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    fontSize: "1rem",
                    lineHeight: "1.5em",
                    color: theme.palette.text.secondary,
                  }}
                >
                  This profile has not set the languages yet.
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: "center", pt: 0 }}>
              <Button
                onClick={handleOpen}
                variant="contained"
                sx={{
                  background: theme.palette.common.white,
                  color: theme.palette.common.black,
                  fontWeight: "bold",
                  fontSize: "1rem",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.88) },
                }}
                aria-label="Edit Languages"
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
        aria-labelledby="update-languages-modal"
        aria-describedby="modal-to-update-languages"
      >
        <Box sx={modalStyle}>
          <Typography
            variant="h5"
            id="update-languages-modal"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
            }}
          >
            Update Languages
          </Typography>
          <FormControl fullWidth>
            <FormLabel
              htmlFor="languages-textarea"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: "bold",
                letterSpacing: "0.03em",
              }}
            >
              Languages
            </FormLabel>
            <TextareaAutosize
              id="languages-textarea"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              minRows={4}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "0.8rem",
                backgroundColor: alpha(theme.palette.background.default, 0.72),
                color: theme.palette.text.primary,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: "5px",
                fontSize: "1rem",
              }}
              maxLength={500}
              aria-describedby="languages-helper-text"
            />
            <Typography
              variant="caption"
              id="languages-helper-text"
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
                fontSize: "1rem",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                textTransform: "none",
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

export default Language;
