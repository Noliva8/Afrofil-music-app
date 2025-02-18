import { useState } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import CardMedia from "@mui/material/CardMedia";
import musicNote from "../../images/Music-note.svg";

export default function ContentFreePlan() {
  const [activeTab, setActiveTab] = useState(0);
  const [albums, setAlbums] = useState(["Album 1", "Album 2", "Album 3"]);
  const [featuringArtists, setFeaturingArtists] = useState([""]);
  const [producers, setProducers] = useState([""]);
  const [genres] = useState(["Pop", "Rock", "Jazz", "Hip Hop", "Classical"]);
   const [composers, setComposers] = useState([""]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const addFeaturingArtist = () => {
    setFeaturingArtists([...featuringArtists, ""]);
  };

  const deleteFeaturingArtist = (index) => {
    setFeaturingArtists(featuringArtists.filter((_, i) => i !== index));
  };

  const addProducer = () => {
    setProducers([...producers, ""]);
  };

  const deleteProducer = (index) => {
    setProducers(producers.filter((_, i) => i !== index));
  };


  

  const addComposer = () => {
    setComposers([...composers, ""]);
  };

  const deleteComposer = (index) => {
    setComposers(composers.filter((_, i) => i !== index));
  };


  const addAlbum = () => {
    const newAlbum = prompt("Enter new album name:");
    if (newAlbum) setAlbums([...albums, newAlbum]);
  };

  return (
    <Container sx={{ padding: 2, width: "100%" }}>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "start",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: "Roboto",
            marginLeft: { xs: "2.7rem", md: "0" },
            fontSize: { xs: "1.8rem", md: "2.5rem", lg: "3rem" },
            fontWeight: 700,
            mt: 4,
            color: "white",
          }}
        >
          Upload Song
        </Typography>



        <Paper
          sx={{
            height: "90vh",
            width: { xs: "350px", md: "700px", lg: "900px" },
            padding: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: { xs: "0 auto" },
            bgcolor: "var(--primary-background-color)",
            overflowY: "auto",
            borderRadius: "10px",
          }}
        >
          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ width: "100%", mb: 5 }}
          >
            <Tab
              label="Details"
              sx={{
                color: "white",
                fontSize: "1rem",
                fontFamily: "roboto",
                fontWeight: "600",
              }}
            />
            <Tab
              label="Artwork"
              sx={{
                color: "white",
                fontSize: "1rem",
                fontFamily: "roboto",
                fontWeight: "600",
              }}
            />
            <Tab
              label="Lyrics"
              sx={{
                color: "white",
                fontSize: "1rem",
                fontFamily: "roboto",
                fontWeight: "600",
              }}
            />
            <Tab
              label="File"
              sx={{
                color: "white",
                fontSize: "1rem",
                fontFamily: "roboto",
                fontWeight: "600",
              }}
            />
          </Tabs>




          {/* Tab Content */}
          {activeTab === 0 && (
            <Stack spacing={3} sx={{ width: "100%" }}>


              {/* title of the song */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "start",
                    md: "center",
                  },
                  gap: "10px",
                  flexDirection: {
                    xs: "column",
                    md: "row",
                  },
                }}
              >
                <label
                  htmlFor="title"
                  style={{
                    color: "white",
                    minWidth: "150px",
                    textWrap: "nowrap",
                    fontFamily: "roboto",
                    fontWeight: "500",
                    textShadow: "revert-layer",
                    fontSize: "18px",
                    textSpacing: "2px",
                  }}
                >
                  Title of the song:
                </label>
                <TextField
                  id="title"
                   name="title"
                  fullWidth
                  variant="outlined"
                  sx={{
                    bgcolor: "var(--secondary-background-color)",
                    "& .MuiInputBase-root": { color: "white" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "white",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "gray",
                    },
                  }}
                />
              </Box>



           <Box
  sx={{
    display: "flex",
    alignItems: {
      xs: "start",
      md: "center",
    },
    gap: "10px",
    flexDirection: {
      xs: "column",
      md: "row",
    },
  }}
>
  <label
    htmlFor="mainArtist"
    style={{
      color: "white",
      minWidth: "150px",
      textWrap: "nowrap",
      fontFamily: "roboto",
      fontWeight: "500",
      textShadow: "revert-layer",
      fontSize: "18px",
      textSpacing: "2px",
    }}
  >
    Main Artist
  </label>

  <TextField
    fullWidth
    id="mainArtist"
    name="mainArtist" // Fixed syntax here
    sx={{
      bgcolor: "var(--secondary-background-color)",
      color: "white",
      "& .MuiInputLabel-root": { color: "white" },
      "& .MuiInputBase-root": { color: "white" },
    }}
  />
</Box>


{/* Featuring Artist - Add More and Delete */}
{featuringArtists.map((_, index) => (
  <Stack
    key={index}
    direction="row"
    spacing={1}
    alignItems="center"
  >
    <Box
      sx={{
        display: "flex",
        alignItems: {
          xs: "start",
          md: "center",
        },
        gap: "10px",
        flexDirection: {
          xs: "column",
          md: "row",
        },
      }}
    >
      <label
        htmlFor={`featuring-${index}`} // Unique id
        style={{
          color: "white",
          minWidth: "150px",
          textWrap: "nowrap",
          fontFamily: "roboto",
          fontWeight: "500",
          textShadow: "revert-layer",
          fontSize: "18px",
          textSpacing: "2px",
        }}
      >{`Featuring Artist ${index + 1}`}</label>

      <TextField
        fullWidth
        id={`featuring-${index}`} // Unique id
        name={`featuring-${index}`} // Unique name
        sx={{
          bgcolor: "var(--secondary-background-color)",
          color: "white",
          "& .MuiInputLabel-root": { color: "white" },
          "& .MuiInputBase-root": { color: "white" },
        }}
      />
    </Box>

    <Button
      variant="contained"
      sx={{
        bgcolor: "var(--secondary-background-color)",
        fontSize: { xs: "12px", md: "14px" },
        color: "white",
        "&:hover": { bgcolor: "gray" },
      }}
      onClick={addFeaturingArtist}
    >
      Add More
    </Button>
    {index > 0 && (
      <Box sx={{ direction: "column" }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => deleteFeaturingArtist(index)}
          sx={{
            "&:hover": { bgcolor: "red", color: "white" },
          }}
        >
          Delete
        </Button>
      </Box>
    )}
  </Stack>
))}




 <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "start",
              md: "center",
            },
            gap: "10px",
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <label
            htmlFor="composer"
            style={{
              color: "white",
              minWidth: "150px",
              textWrap: "nowrap",
              fontFamily: "roboto",
              fontWeight: "500",
              textShadow: "revert-layer",
              fontSize: "18px",
              textSpacing: "2px",
            }}
          >
            Composer
          </label>
          <TextField
            fullWidth
            id="composer"
            name="composer"
            sx={{
              bgcolor: "var(--secondary-background-color)",
              color: "white",
              "& .MuiInputLabel-root": { color: "white" },
              "& .MuiInputBase-root": { color: "white" },
            }}
          />
        </Box>

        <Button
          variant="contained"
          sx={{
            bgcolor: "var(--secondary-background-color)",
            color: "white",
            "&:hover": { bgcolor: "gray" },
          }}
          onClick={addComposer} // Add new composer when clicked
        >
          Add Composer
        </Button>
      </Stack>

      {/* Render Composers */}
      {composers.map((_, index) => (
        <Stack key={index} direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "start",
                md: "center",
              },
              gap: "10px",
              flexDirection: {
                xs: "column",
                md: "row",
              },
            }}
          >
            <label
              htmlFor={`composer-${index}`}
              style={{
                color: "white",
                minWidth: "150px",
                textWrap: "nowrap",
                fontFamily: "roboto",
                fontWeight: "500",
                textShadow: "revert-layer",
                fontSize: "18px",
                textSpacing: "2px",
              }}
            >
              {`Composer ${index + 1}`}
            </label>

            <TextField
              fullWidth
              id={`composer-${index}`}
              name={`composer-${index}`}
              sx={{
                bgcolor: "var(--secondary-background-color)",
                color: "white",
                "& .MuiInputLabel-root": { color: "white" },
                "& .MuiInputBase-root": { color: "white" },
              }}
            />
          </Box>

          {index > 0 && (
            <Box sx={{ direction: "column" }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => deleteComposer(index)} // Delete selected composer
                sx={{
                  "&:hover": { bgcolor: "red", color: "white" },
                }}
              >
                Delete
              </Button>
            </Box>
          )}
        </Stack>
      ))}



              {/* Album Dropdown with Create Album Button */}
              <Stack direction="row" spacing={1} alignItems="center">

    <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "start",
              md: "center",
            },
            gap: "10px",
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <label
            htmlFor="album"
            style={{
              color: "white",
              minWidth: "150px",
              textWrap: "nowrap",
              fontFamily: "roboto",
              fontWeight: "500",
              textShadow: "revert-layer",
              fontSize: "18px",
              textSpacing: "2px",
            }}
          >
           Album
          </label>

                <TextField
                  select

                  id="album"
                  name="album"
                  fullWidth
                  sx={{ minWidth: '200px', 
                    bgcolor: "var(--secondary-background-color)",
                    color: "white",
                    "& .MuiInputLabel-root": { color: "white" },
                    "& .MuiInputBase-root": { color: "white" },
                  }}
                >
                

                  {albums.map((album, index) => (
                    <MenuItem key={index} value={album}>
                      {album}
                    </MenuItem>
                  ))}
                </TextField>

                   </Box>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "var(--secondary-background-color)",
                    color: "white",
                    "&:hover": { bgcolor: "gray" },
                  }}
                  onClick={addAlbum}
                >
                  Create Album
                </Button>
              </Stack>



              {/* Producer - Add More and Delete */}
              {producers.map((_, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <TextField
                    label={`Producer ${index + 1}`}
                    fullWidth
                    sx={{
                      bgcolor: "var(--secondary-background-color)",
                      color: "white",
                      "& .MuiInputLabel-root": { color: "white" },
                      "& .MuiInputBase-root": { color: "white" },
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "black",
                      color: "white",
                      "&:hover": { bgcolor: "gray" },
                    }}
                    onClick={addProducer}
                  >
                    Add Producer
                  </Button>
                  {index > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => deleteProducer(index)}
                      sx={{
                        "&:hover": { bgcolor: "red", color: "white" },
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              ))}









              {/* Genre Dropdown */}
              <TextField
                select
                label="Genre"
                fullWidth
                sx={{
                  bgcolor: "var(--secondary-background-color)",
                  color: "white",
                  "& .MuiInputLabel-root": { color: "white" },
                  "& .MuiInputBase-root": { color: "white" },
                }}
              >
                {genres.map((genre, index) => (
                  <MenuItem key={index} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Track Number"
                type="number"
                fullWidth
                sx={{
                  bgcolor: "var(--secondary-background-color)",
                  color: "white",
                  "& .MuiInputLabel-root": { color: "white" },
                  "& .MuiInputBase-root": { color: "white" },
                }}
              />
              <TextField
                label="Release Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  bgcolor: "var(--secondary-background-color)",
                  color: "white",
                  "& .MuiInputLabel-root": { color: "white" },
                  "& .MuiInputBase-root": { color: "white" },
                }}
              />
              <TextField
                label="Duration (mm:ss)"
                fullWidth
                sx={{
                  bgcolor: "var(--secondary-background-color)",
                  color: "white",
                  "& .MuiInputLabel-root": { color: "white" },
                  "& .MuiInputBase-root": { color: "white" },
                }}
              />
              <TextField
                label="Label"
                fullWidth
                sx={{
                  bgcolor: "var(--secondary-background-color)",
                  color: "white",
                  "& .MuiInputLabel-root": { color: "white" },
                  "& .MuiInputBase-root": { color: "white" },
                }}
              />
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2} alignItems="center">
              <Card
                sx={{
                  width: 150,
                  height: 150,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: 120, height: 120, objectFit: "contain" }}
                  image={musicNote}
                  alt="Music Note"
                />
              </Card>
              <Button
                variant="contained"
                component="label"
                sx={{
                  bgcolor: "black",
                  color: "white",
                  "&:hover": { bgcolor: "gray" },
                }}
              >
                Upload Artwork
                <input hidden accept="image/*" type="file" />
              </Button>
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Lyrics
              </Typography>
              <TextareaAutosize
                minRows={5}
                placeholder="Enter song lyrics here..."
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "1rem",
                  borderRadius: "5px",
                  borderColor: "#ccc",
                  backgroundColor: "var(--secondary-background-color)",
                  color: "white",
                }}
              />
            </Stack>
          )}

          {activeTab === 3 && (
            <Stack alignItems="center">
              <Button
                variant="contained"
                component="label"
                sx={{
                  bgcolor: "black",
                  color: "white",
                  "&:hover": { bgcolor: "gray" },
                }}
              >
                Upload Your Song
                <input hidden accept="audio/*" type="file" />
              </Button>
            </Stack>
          )}

          {/* Submit Button */}
          <Box sx={{ mt: 3, width: "100%" }}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                bgcolor: "black",
                color: "white",
                "&:hover": { bgcolor: "gray" },
              }}
            >
              Submit Song
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
