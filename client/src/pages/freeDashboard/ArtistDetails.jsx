import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import Button from "@mui/material/Button";
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
import ArtistAuth from "../../utils/artist_auth";
import { GET_ALBUM } from "../../utils/queries";
import Swal from "sweetalert2";












export default function ArtistDetails() {
  const [albumToSelect, setAlbumToSelect] = useState("");
  const [albumOpen, setAlbumOpen] = useState(false);
  // Mutate data
  const [createSong, { data, loading, error }] = useMutation(CREATE_SONG);
  const [updateAlbum] = useMutation(UPDATE_ALBUM);

  const profile = ArtistAuth.getProfile();
  const artistAka = profile.data.artistAka;

  // custom album
  // -----------
  const handleAlbumOpen = () => setAlbumOpen(true);

  const handleClose = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Album data are not saved!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setAlbumOpen(false); // Close the album if confirmed
        Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success",
        });
      }
    });
  };

  // Fetch albums to select from
  const {
    loading: loadingAlbums,
    error: errorAlbums,
    data: albumsData,
    refetch,
  } = useQuery(GET_ALBUM);

  // Store albums in an array for mapping
  const albums = albumsData?.albumOfArtist || [];
  console.log("Albums of artist:", albums);

  // useState to update value in select

  const handleAlbumChange = (event) => {
    console.log("Selected Album ID:", event.target.value);
    setAlbumToSelect(event.target.value);
  };

  const defaultValues = {
    title: "",
    mainArtist: artistAka,
    featuringArtist: [""],
    composer: [""],
    album: albumsData?.albumOfArtist?.[0]?.title || "Unknown",
    producer: [""],
    genre: "",
    trackNumber: 1,
    duration: 0,
  };

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues,
  });

  if (loadingAlbums) return <p>Loading albums...</p>;
  if (errorAlbums)
    return (
      <p>Error loading albums: {errorAlbums.message || "Unknown error"}</p>
    );



  // Form submission handler
  const onSubmit = async (data) => {
    try {
      const artistId = profile?.data?._id;
      const durationInSeconds = Math.round(data.duration * 60);
      const trackNumber = parseInt(data.trackNumber, 10);

      console.log("Form Data:", {
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

      console.log("Song created successfully:", response);

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
      console.error("Error creating song:", error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <Stack spacing={3} sx={{ width: "100%" }}>
          <Title
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <MainArtist
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <Featuring
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <Composer
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />

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

          <Producer
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <Genre
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <TruckNumber
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <ReleaseDate
            register={register}
            errors={errors}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
          <Duration
            register={register}
            errors={errors}
            setValue={setValue}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        </Stack>

     

      </form>



         <CustomAlbum
        albumOpen={albumOpen}
        setAlbumOpen={setAlbumOpen}
        handleAlbumOpen={handleAlbumOpen}
        handleClose={handleClose}
        refetch={refetch}
        profile={profile}
      />
    </>
  );
}
