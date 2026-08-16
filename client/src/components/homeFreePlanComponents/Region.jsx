import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_REGION } from "../../utils/mutations";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { toast } from "react-toastify";

const REGIONS = [
  "West Africa",
  "East Africa",
  "Southern Africa",
  "North Africa",
  "Central Africa",
  "Diaspora",
];

const Region = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addRegion, { loading: updating }] = useMutation(ADD_REGION);
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
    textAlign: "left",
    whiteSpace: "pre-wrap",
  };

  const handleOpen = () => {
    setFieldValue(data?.artistProfile?.region || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFieldValue("");
  };

  const handleUpdate = async () => {
    if (!fieldValue.trim()) {
      toast.error("Region cannot be empty.");
      return;
    }

    try {
      await addRegion({
        variables: {
          region: fieldValue,
        },
      });

      refetch();
      toast.success("Region updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating region:", error);
      toast.error("Error updating region. Please try again.");
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
                Region
              </Typography>

              {data?.artistProfile?.region ? (
                <Box sx={bioContainerStyle}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontSize: { xs: "1rem", sm: "1.1rem" }, fontWeight: 700, overflowWrap: "anywhere" }}
                  >
                    {data.artistProfile.region}
                  </Typography>
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
                  This profile has not set a region yet.
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
                aria-label="Edit Region"
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
        aria-labelledby="update-region-modal"
        aria-describedby="modal-to-update-region"
      >
        <Box sx={modalStyle}>
          <Typography
            variant="h5"
            id="update-region-modal"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
            }}
          >
            Update Region
          </Typography>
          <FormControl fullWidth>
            <FormLabel
              htmlFor="region-select"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: "bold",
                letterSpacing: "0.03em",
              }}
            >
              Region
            </FormLabel>
            <TextField
              id="region-select"
              select
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              fullWidth
              sx={{
                marginTop: "10px",
                backgroundColor: alpha(theme.palette.background.default, 0.72),
                borderRadius: "5px",
                "& .MuiInputBase-input": { color: theme.palette.text.primary },
                "& fieldset": { borderColor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              <MenuItem value="">Select region</MenuItem>
              {REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </TextField>
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

export default Region;
