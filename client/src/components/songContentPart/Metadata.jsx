import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Collapse,
  IconButton,
  Typography,
  useTheme,
  Fade,
  Button,
} from "@mui/material";
import Title from "./inputsForSong/Title";
import FeaturingArtist from "./inputsForSong/FeaturingArtist";
import Producer from "../songContentPart/Producer";
import Composer from "./inputsForSong/Composer";
import AlbumSong from "./inputsForSong/AlbumInSong";
import CustomAlbum from "../homeFreePlanComponents/albumContent/CustomAlbum";
import TruckNumber from "./inputsForSong/TruckNumber";
import SongLabel from "./inputsForSong/SongLabel";
import Genre from './inputsForSong/Genre';
import ReleaseDate from './inputsForSong/ReleaseDate';
import {
  MusicNote as MusicNoteIcon,
  People as PeopleIcon,
  Album as AlbumIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Label,
} from "@mui/icons-material";
import TextField from "@mui/material/TextField";

import InputAdornment from "@mui/material/InputAdornment";

export default function Metadata({
  Controller,
  onSubmit,
  handleSubmit,
  control,
  register,
  refetchAlbums,
  errors,
  albumToSelect,
  albums,
  handleAlbumChange,
}) {
  const theme = useTheme();




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
  
{...register('title', {required: 'Title is required'})}

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


          <FeaturingArtist register={register} errors={errors} />
          <Producer register={register} errors={errors} />
          <Composer register={register} errors={errors} />
          
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
