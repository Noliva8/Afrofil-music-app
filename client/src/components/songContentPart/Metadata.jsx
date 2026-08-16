import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
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
          backgroundColor: alpha(theme.palette.background.paper, 0.88),
          padding: theme.spacing(1),
          width: "100%",

          p: 4,
          height: "auto",
          borderRadius: "8px",
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: theme.shadows[2],
        }}
      >
        
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 900,
            color: theme.palette.text.primary,
            textAlign: "left",
            mb: 0.5,
          }}
        >
          Song Details
        </Typography>
        <Typography
          sx={{
            color: theme.palette.text.secondary,
            mb: 3,
            lineHeight: 1.55,
          }}
        >
          Add the information listeners will see when your track goes live.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit((onSubmit))}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            columnGap: 2,
            rowGap: 0.5,
            "& > *": {
              minWidth: 0,
            },
          }}
        >

          {/* input 1 */}

<Box mb={2}
sx={{
   display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'start',
      gridColumn: { xs: "1", md: "1 / -1" },
}}>

  <Typography
    variant="body1"
    sx={{
     
      color: theme.palette.text.primary,
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
          <MusicNoteIcon sx={{ color: theme.palette.primary.main }} />
        </InputAdornment>
      ),
    }}
    
    sx={{
      "& .MuiOutlinedInput-root": {
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        color: theme.palette.text.primary,
        borderRadius: "8px",
        "& fieldset": {
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
        "&:hover fieldset": {
          borderColor: alpha(theme.palette.primary.main, 0.45),
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.primary.main,
        },
      },
      "& .MuiInputLabel-root": {
        color: "rgba(255, 255, 255, 0.7)",
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: theme.palette.primary.main,
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


            <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
    variant="contained"
    sx={{
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      color: theme.palette.primary.contrastText,
      fontFamily: theme.typography.fontFamily,
      borderRadius: "8px",
      px: 3,
      py: 1.1,
      textTransform: "none",
      fontWeight: 800,
    }}
    type="submit"
  >
    Next
  </Button>
  </Box>


        </Box>

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
