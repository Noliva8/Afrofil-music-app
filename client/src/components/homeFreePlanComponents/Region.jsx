import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery";
import { ADD_REGION } from "../../utils/mutations";
import {
  Box,
  Modal,
  FormControl,
  Button,
  FormLabel,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";

const REGIONS = [
  "West Africa",
  "East Africa",
  "Southern Africa",
  "North Africa",
  "Central Africa",
  "Diaspora",
];

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
  borderRadius: "12px",
};

const cardStyle = {
  backgroundColor: "#1a5d5d",
  color: "#fff",
  borderRadius: "12px",
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  boxSizing: "border-box",
  transition: "transform 0.2s ease-in-out, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
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

const Region = () => {
  const [fieldValue, setFieldValue] = useState("");
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addRegion, { loading: updating }] = useMutation(ADD_REGION);
  const [open, setOpen] = useState(false);

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
                Region
              </Typography>

              {data?.artistProfile?.region ? (
                <Box sx={bioContainerStyle}>
                  <Typography
                    variant="body2"
                    sx={{ color: "#441a49", fontSize: "1.3rem", fontWeight: "400" }}
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
                    color: "#b0b0b0",
                  }}
                >
                  This profile has not set a region yet.
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
                color: "#fff",
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
                backgroundColor: "#fff",
                borderRadius: "5px",
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

    </>
  );
};

export default Region;
