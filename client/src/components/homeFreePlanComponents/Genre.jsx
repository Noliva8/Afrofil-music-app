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
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { toast } from "react-toastify";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [fieldValue, setFieldValue] = useState([]);
  const { loading, data, refetch } = useQuery(ARTIST_PROFILE);
  const [addGenre, { loading: updating }] = useMutation(ADD_GENRE);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      <Grid container justifyContent="center" alignItems="stretch" sx={{ mt: { xs: 1, sm: 2.5 }, p: { xs: 0, sm: 1.25 }, width: "100%" }}>
        {loading ? (
          <Typography variant="h6" color="textSecondary">Loading...</Typography>
        ) : (
          <Card sx={cardStyle}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 1.25, sm: 2 }, "&:last-child": { pb: { xs: 1.25, sm: 2 } } }}>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  textAlign: "center",
                  color: theme.palette.text.primary,
                  letterSpacing: 0,
                  marginBottom: "1rem",
                  fontSize: { xs: "1.35rem", sm: "1.75rem", md: "1.8rem" },
                }}
              >
                Genres
              </Typography>
              {data?.artistProfile?.genre && data.artistProfile.genre.length > 0 ? (
                <Box component="ul" sx={{ ...bioContainerStyle, pl: { xs: 3, sm: 4 }, m: 0 }}>
                  {data.artistProfile.genre.map((genre, index) => (
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
                      {genre}
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
                    marginTop: "1rem",
                  }}
                >
                  This profile has not set any genres yet.
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
                color: theme.palette.text.secondary,
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
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.14),
                        color: theme.palette.text.primary,
                      }}
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
                backgroundColor: alpha(theme.palette.background.default, 0.72),
                color: theme.palette.text.primary,
                borderRadius: "5px",
                "& .MuiSelect-select": { color: theme.palette.text.primary },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 320,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
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

export default Genre;
