import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import FeaturingArtist from "./inputsForSong/FeaturingArtist";
import Producer from "../songContentPart/Producer";
import Composer from "./inputsForSong/Composer";
import AlbumSong from "./inputsForSong/AlbumInSong";
import TruckNumber from "./inputsForSong/TruckNumber";
import SongLabel from "./inputsForSong/SongLabel";
import Genre from './inputsForSong/Genre';
import Mood from "./Mood";
import ReleaseDate from './inputsForSong/ReleaseDate';
import {
  MusicNote as MusicNoteIcon,
} from "@mui/icons-material";
import TextField from "@mui/material/TextField";

import InputAdornment from "@mui/material/InputAdornment";



export default function Metadata({
  Controller,
  setValue,
  onSubmit,
  handleSubmit,
   watch,
  control,
  register,
  refetchAlbums,
  errors,
  albumToSelect,
  albums,
  handleAlbumChange,
}) {
  const theme = useTheme();

  const normalizeTitle = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };



  return (
    <Fade in timeout={500}>
      <Paper
        elevation={3}
        sx={{
          backgroundColor: theme.palette.primary.main,
          padding: theme.spacing(1),
          width: "100%",

          p: 4,
          height: "auto",
          borderRadius: theme.spacing(4),
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #6a11cb 30%, #2575fc 90%)",
            WebkitBackgroundClip: "text",

            color: "white",
            textAlign: "center",
            mb: 3,
          }}
        >
          Song Details
        </Typography>

        <form onSubmit={handleSubmit((onSubmit))}>

          {/* input 1 */}

<Box mb={2}
sx={{
   display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'start'
}}>

  <Typography
    variant="body1"
    sx={{
     
      color: "#ffffff",
      fontWeight: 500,
      mb: 0.5,
    }}
  >
    Title
  </Typography>

  <TextField
    fullWidth
    
    placeholder="Enter song title"
  
{...register('title', {
  required: 'Title is required',
  setValueAs: normalizeTitle,
})}

error={!!errors.title}
  helperText={errors.title?.message || ''}
    margin="normal"
    variant="outlined"
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <MusicNoteIcon color="primary" />
        </InputAdornment>
      ),
    }}
    
    sx={{
      "& .MuiOutlinedInput-root": {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        color: "#ffffff",
        "& fieldset": {
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
        "&:hover fieldset": {
          borderColor: "#ffde00",
        },
        "&.Mui-focused fieldset": {
          borderColor: "#ffde00",
        },
      },
      "& .MuiInputLabel-root": {
        color: "rgba(255, 255, 255, 0.7)",
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: "#ffde00",
      },
    }}
  />





</Box>


          <FeaturingArtist register={register} watch={watch} setValue={setValue} errors={errors} />
          <Producer register={register} watch={watch} setValue={setValue} errors={errors} />
          <Composer register={register} watch={watch} setValue={setValue} errors={errors}  />
          
          <AlbumSong
          key="album"
          register={register}
          Controller={Controller}
          control={control}
          errors={errors}
          albumToSelect={albumToSelect}
           refetchAlbums={refetchAlbums} 
          albums={albums}
          handleAlbumChange={handleAlbumChange}
        />


           <TruckNumber key="track" register={register} errors={errors} />
           <Genre register={register} Controller={Controller}  control={control}  errors={errors} />
           <Mood control={control} watch={watch} /> 
           <SongLabel register={register} errors={errors}/>
           <ReleaseDate register={register} errors={errors} />


            <Button
    variant="contained"
    sx={{
      color: 'var(--primary-background-color)',
      backgroundColor: 'var(--primary-font-color)',
      fontFamily: 'Roboto',
    }}
    type="submit"
  >
    Next
  </Button>


        </form>

      <Box
  sx={{
    display: 'flex',
    justifyContent: 'flex-end', 
    mt: 3,
    margin: '2rem'
  }}
>
 
</Box>



      </Paper>
    </Fade>
  );
}
