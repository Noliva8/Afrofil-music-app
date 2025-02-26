import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import CardMedia from "@mui/material/CardMedia";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import musicNote from "../../images/Music-note.svg";
import { CREATE_SONG, UPDATE_ALBUM } from "../../utils/mutations";
import MainArtist from "../../components/songContentPart/inputsForSong/MainArtist";
import Featuring from "../../components/songContentPart/inputsForSong/FeaturingArtist";
import Composer from "../../components/songContentPart/inputsForSong/Composer";
import AlbumSong from "../../components/songContentPart/inputsForSong/AlbumInSong";
import Producer from "../../components/songContentPart/Producer";
import Title from "../../components/songContentPart/inputsForSong/Title";
import Genre from "../../components/songContentPart/inputsForSong/Genre";
import TruckNumber from "../../components/songContentPart/inputsForSong/TruckNumber";
import ReleaseDate from "../../components/songContentPart/inputsForSong/ReleaseDate";
import Duration from "../../components/songContentPart/inputsForSong/Duration";
import ArtistAuth from '../../utils/artist_auth';
import { GET_ALBUM } from "../../utils/queries";
import Swal from 'sweetalert2'
import CustomAlbum from "../../components/homeFreePlanComponents/albumContent/CustomAlbum";




export default function ContentFreePlan() {


  const [activeTab, setActiveTab] = useState(0);
  // custom album
  // -----------
  const [albumOpen, setAlbumOpen] = useState(false);

 const handleAlbumOpen = () => setAlbumOpen(true);

const handleClose = () => {
  Swal.fire({
    title: "Are you sure?",
    text: "Album data are not saved!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {
    if (result.isConfirmed) {
      setAlbumOpen(false); // Close the album if confirmed
      Swal.fire({
        title: "Deleted!",
        text: "Your file has been deleted.",
        icon: "success"
      });
    }
  });
};



  // Fetch albums to select from
  const { loading: loadingAlbums, error: errorAlbums, data: albumsData,  refetch } = useQuery(GET_ALBUM);

  // Mutate data 
  const [createSong, { data, loading, error }] = useMutation(CREATE_SONG);
  const [updateAlbum] = useMutation(UPDATE_ALBUM);

  const profile = ArtistAuth.getProfile();
  const artistAka = profile.data.artistAka;

 

// Store albums in an array for mapping
  const albums = albumsData?.albumOfArtist || [];
  console.log('Albums of artist:', albums);

 // useState to update value in select
const [albumToSelect, setAlbumToSelect] = useState('');


const handleAlbumChange = (event) => {
  console.log("Selected Album ID:", event.target.value);
  setAlbumToSelect(event.target.value);
};






  const defaultValues = {
    title: '',
    mainArtist: artistAka,
    featuringArtist: [''],
    composer: [''],
    album: albumsData?.albumOfArtist?.[0]?.title || 'Unknown',
    producer: [''],
    genre: '',
    trackNumber: 1,
    duration: 0, 
  };

  // Form handling
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues,
  });


 if (loadingAlbums) return <p>Loading albums...</p>;
  if (errorAlbums) return <p>Error loading albums: {error.message}</p>;

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  
  // Form submission handler
const onSubmit = async (data) => {
  try {
    const artistId = profile?.data?._id;
    const durationInSeconds = Math.round(data.duration * 60);
    const trackNumber = parseInt(data.trackNumber, 10);

    console.log('Form Data:', {
      artistId,
      albumId: albumToSelect,
      duration: durationInSeconds,
      trackNumber,
      ...data,
    });

    const response = await createSong({
      variables: {
        artistId,
        albumId: albumToSelect,
        duration: durationInSeconds,
        trackNumber,
        ...data,
      },
    });

    console.log('Song created successfully:', response);

    Swal.fire({
      title: "Good Job! Proceed to artwork upload",
      icon: "success",
      draggable: true,
    });

    // Update the album to include the newly created song
    const songId = response.data.createSong._id;
    await updateAlbum({
      variables: {
        albumId: albumToSelect,
        songId: [songId],
      },
    });
  } catch (error) {
    console.error('Error creating song:', error);
  }
};








  const addAlbum = async () => {
    const newAlbum = prompt("Enter new album name:");
    if (newAlbum) {
      console.log(`Album created: ${newAlbum}`);
      await refetch(); // Refresh album list after adding a new album
    }
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
            width: { xs: "600px", md: "700px", lg: "900px" },
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
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ width: "100%", mb: 5 }}
          >
            <Tab label="Details" sx={{ color: "white", fontSize: "1rem" }} />
            <Tab label="Artwork" sx={{ color: "white", fontSize: "1rem" }} />
            <Tab label="Lyrics" sx={{ color: "white", fontSize: "1rem" }} />
            <Tab label="File" sx={{ color: "white", fontSize: "1rem" }} />
          </Tabs>

          {/* Tab Content */}
          {activeTab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
              <Stack spacing={3} sx={{ width: "100%" }}>
                <Title register={register} errors={errors} />
                <MainArtist register={register} errors={errors} />
                <Featuring register={register} errors={errors} />
                <Composer register={register} errors={errors} />

                {/* <AlbumSong
  register={register}
  errors={errors}
  albumToSelect={albumToSelect}
  handleAlbumChange ={handleAlbumChange }
  albums={albums}
/> */}

                {/* Album  */}

                <Stack direction="row" spacing={5} alignItems="center">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "start", md: "center" },
                      gap: "10px",
                      flexDirection: { xs: "row", md: "row" },
                    }}
                  >
                    <label
                      htmlFor="album"
                      style={{
                        color: "white",
                        minWidth: "150px",
                        fontFamily: "roboto",
                        fontWeight: "500",
                        fontSize: "18px",
                      }}
                    >
                      Album
                    </label>

                    <select
                      id="album"
                      name="album"
                      value={albumToSelect}
                      onChange={handleAlbumChange}
                      style={{
                        minWidth: "200px",
                        backgroundColor: "var(--secondary-background-color)",
                        color: "white",
                        border: "none",
                        padding: "8px",
                        borderRadius: "4px",
                      }}
                    >
                      <option value="" disabled>
                        Select an album
                      </option>
                      {albums.map((album) => (
                        <option key={album._id} value={album._id}>
                          {album.title}
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Button
                   onClick={handleAlbumOpen}
                    variant="contained"
                    sx={{
                      bgcolor: "var(--primary-font-color)",
                      color: "var(--primary-background-color)",
                      "&:hover": { bgcolor: "gray" },
                    }}
                   
                  >
                    Create Album
                  </Button>

                </Stack>

                {/* end of album songs */}

                <Producer register={register} errors={errors} />
                <Genre register={register} errors={errors} />
                <TruckNumber register={register} errors={errors} />
                <ReleaseDate register={register} errors={errors} />
                <Duration
                  register={register}
                  errors={errors}
                  setValue={setValue}
                />
              </Stack>

              <Box sx={{ mt: 3, width: "100%" }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "#ee8623",
                    color: "var(--primary-font-color)",
                    fontFamily: "Roboto",
                    fontWeight: "600",
                    fontSize: "18px",
                    "&:hover": { bgcolor: "gray" },
                  }}
                >
                  Submit
                </Button>
              </Box>
            </form>
          )}




          {/* Other Tabs: Artwork, Lyrics, File */}
          {activeTab === 1 && (
            <Stack spacing={2} alignItems="center">
              <Card sx={{ width: 150, height: 150 }}>
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
        </Paper>
      </Box>

      {/* model */}
      <CustomAlbum
        albumOpen={albumOpen}
        setAlbumOpen={setAlbumOpen}
        handleAlbumOpen={handleAlbumOpen}
        handleClose={handleClose}
        refetch={refetch}
 
         profile={profile}

      />
    </Container>
  );
}