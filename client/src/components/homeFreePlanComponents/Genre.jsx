import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ARTIST_PROFILE } from "../../utils/artistQuery"; // Ensure ARTIST_PROFILE is defined
import { ADD_GENRE } from "../../utils/mutations";
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import { toast } from "react-toastify";

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
  lineHeight: "1.6em",
  fontSize: "1rem", // Adjusted font size for better readability
  textAlign: "justify",
  whiteSpace: "pre-wrap",
  wordSpacing: "0.1em",
};

const MAIN_GENRES = [
  "Afrobeats",
  "Amapiano",
  "Afro Pop",
  "Afro-Fusion",
  "Afro-House",
  "Afro-R&B",
  "Hip Hop",
  "Gospel (African)",
  "R&B / Soul",
  "Pop",
  "Bongo Flava",
  "Ghanaian Drill (Asakaa)",
  "Naija Pop",
  "Coupe-Decale",
  "Gengetone",
  "Gqom",
  "Kwaito",
  "Azonto",
  "Reggaeton",
  "Dancehall",
  "Reggae",
  "Latin Pop",
  "Trap",
  "Drill (UK/US)",
  "Electronic",
  "K-Pop",
  "Highlife",
  "Soukous",
  "Rumba",
  "Zouk",
  "Kizomba",
  "Ragga",
  "Soca",
  "Jazz",
  "Blues",
  "Rock",
  "Alternative",
  "Traditional",
  "Fuji",
  "Juju",
  "Apala",
  "Mbalax",
  "Zouglou",
  "Rai",
  "Gnawa",
  "Taarab",
  "Maskandi",
  "Palmwine",
  "Folk",
  "Spoken Word",
];

const Genre = () => {
  const [fieldValue, setFieldValue] = useState([]);
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addGenre, { loading: updating }] = useMutation(ADD_GENRE);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpen = () => {
    setFieldValue(data?.artistProfile?.genre || []);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFieldValue([]);
  };

  const handleUpdate = async () => {
    if (!fieldValue.length) {
      toast.error("Genres cannot be empty.");
      return;
    }

    try {
      const { data } = await addGenre({
        variables: {
          genre: fieldValue,
        },
      });

      if (data?.addGenre) {
        refetch();
        toast.success("Genres updated successfully!");
        handleClose();
      } else {
        toast.error("Error updating genres.");
      }
    } catch (error) {
      console.error("Error updating genres:", error);
      toast.error("Error updating genres. Please try again.");
    }
  };

  return (
    <>
      <Grid container justifyContent="center" alignItems="center" style={{ marginTop: "20px", padding: "10px" }}>
        {loading ? (
          <Typography variant="h6" color="textSecondary">Loading...</Typography>
        ) : (
          <Card sx={cardStyle}>
            <CardContent>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  textAlign: "center",
                  color: "#e3e3e3",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                  fontSize: "1.8rem", // Larger text for heading
                }}
              >
                Genres
              </Typography>
              {data?.artistProfile?.genre && data.artistProfile.genre.length > 0 ? (
                <Box sx={bioContainerStyle}>
                  <ul>
                    {data.artistProfile.genre.map((genre, index) => (
                      <li key={index} style={{ marginBottom: "8px", fontSize: '1.3rem', fontFamily: 'roboto', color: '#441a49' }}>
                        {genre}
                      </li>
                    ))}
                  </ul>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    fontSize: "1rem",
                    lineHeight: "1.5em",
                    color: "#b0b0b0",
                    marginTop: "1rem",
                  }}
                >
                  This profile has not set any genres yet.
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
                  "&:hover": {
                    backgroundColor: "#8a3b92",
                  },
                }}
                aria-label="Edit genres"
              >
                Edit
              </Button>
            </CardActions>
          </Card>
        )}
      </Grid>

      {/* Modal for updating genres */}
      <Modal open={open} onClose={handleClose} aria-labelledby="update-genre-modal" aria-describedby="modal-to-update-genre">
        <Box sx={modalStyle}>
          <Typography
            variant="h5"
            id="update-genre-modal"
            gutterBottom
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
              fontSize: "1.6rem", // Adjust font size for modal header
            }}
          >
            Update Genres
          </Typography>
          <FormControl fullWidth>
            <FormLabel
              htmlFor="genre-select"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: "0.03em",
                fontSize: "1rem", // Slightly smaller label text
              }}
            >
              Genres
            </FormLabel>
            <Select
              id="genre-select"
              multiple
              value={fieldValue}
              open={menuOpen}
              onOpen={() => setMenuOpen(true)}
              onClose={() => setMenuOpen(false)}
              onChange={(e) => {
                setFieldValue(e.target.value);
                setMenuOpen(false);
              }}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      onDelete={() =>
                        setFieldValue((prev) => prev.filter((genre) => genre !== value))
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ))}
                </Box>
              )}
              sx={{
                mt: 1,
                backgroundColor: "#fff",
                color: "#000",
                borderRadius: "5px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(0,0,0,0.2)",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 320,
                  },
                },
              }}
            >
              {MAIN_GENRES.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
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
                "&:hover": {
                  backgroundColor: "#8a3b92",
                },
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

export default Genre;
