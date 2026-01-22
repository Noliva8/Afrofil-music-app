import React, { useState } from "react";
import {  useEffect } from "react";
import { useApolloClient } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client";
import { useForm, Controller} from "react-hook-form"

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useFieldArray } from 'react-hook-form';

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

import Title from "../../../../../components/songContentPart/inputsForSong/Title";
import FeaturingArtist from "../../../../../components/songContentPart/inputsForSong/FeaturingArtist";
import Producer from "../../../../../components/songContentPart/Producer";
import Composer from "../../../../../components/songContentPart/inputsForSong/Composer";
import AlbumSong from "../../../../../components/songContentPart/inputsForSong/AlbumInSong";

import SongLabel from "../../../../../components/songContentPart/inputsForSong/SongLabel";

import Genre from "../../../../../components/songContentPart/inputsForSong/Genre";
import ReleaseDate from "../../../../../components/songContentPart/inputsForSong/ReleaseDate";
import TruckNumber from "../../../../../components/songContentPart/inputsForSong/TruckNumber";
import Mood from "../../../../../components/songContentPart/Mood";

import LyricsEditSong from "./LyricsEditSong";
import SongCoverSongEdit from "./SongCoverSongEdit";
import { UPDATE_SONG } from "../../../../../utils/mutations";
import { GET_ALBUM } from "../../../../../utils/queries";







const steps = ["Song upload", "Add Metadata", "Lyrics", "Artwork"];

export default function  MetadataEdit( {song, onClose, refetch}){
 const theme = useTheme();
 const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const [updateSong] = useMutation(UPDATE_SONG);

 const [activeStep, setActiveStep] = useState(0);
 const [songId, setSongId] = useState('');




console.log('check again how the song looks like', song)





const {
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({

    defaultValues: {

      title: '',
      featuringArtist: [],
      producer: [],
      composer: [],
      trackNumber: 1,
      genre: '',
      mood: [],
      subMoods: [],
      label: '',
      releaseDate: '',
      album: null,

    },
  });



console.log(song);

// query the albums to display them
// ------------------------------

const { loading: albumLoading, error: albumError, data: albumData,  refetch: refetchAlbums} =useQuery(GET_ALBUM);
const [albumToSelect, setAlbumToSelect] = useState('');
const [albums, setAlbums] = useState([]);

// a. populate albums in drop down menu


useEffect(() => {
  if (albumData && !albumError) {
    setAlbums(albumData.albumOfArtist || []);  
  }
}, [albumData, albumError]);


useEffect(() => {
  if (song?.album && albums.length) {
    const existing = albums.find((a) => a._id === song.album._id);
    if (existing) {
      setAlbumToSelect(existing);
      setValue('album', existing._id);        
    } else {
      console.warn('Album not in list:', song.album._id);
    }
  }
}, [song, albums, setValue]);


const handleAlbumChange = (event) => {
  const selectedId = event.target.value;
  const existing = albums.find((a) => a._id === selectedId);
  if (existing) {
    setAlbumToSelect(existing);
    setValue('album', existing._id);       
  }
};



// b populate other field once song is clicked



useEffect(() => {
  if (song) {
    reset({
      title: song.title || '',
      featuringArtist: song.featuringArtist || [''],
      producer: song.producer?.length
        ? song.producer.map(p => ({ name: p.name || '', role: p.role || '' }))
        : [{ name: '', role: '' }],
    composer: song.composer?.length
  ? song.composer.map(c => ({ name: c.name || '', contribution: c.contribution || '' }))
  : [{ name: '', contribution: '' }],

      trackNumber: song.trackNumber || 1,
      genre: song.genre || '',
      label: song.label || '',
      releaseDate: song.releaseDate
        ? song.releaseDate.split('T')[0] // ISO date for `<input type="date" />`
        : '',
      album: song.album?._id || null,
      mood: song.mood || [],
      subMoods: song.subMoods || [],
    });

    setAlbumToSelect(song.album || null);
  }
}, [song, reset]);








// b.

const onSubmit = async (formData) => {
  try {
    console.log("📥 Raw formData:", formData);
setSongId(song._id);
    const variables = {
      songId: song._id,
      title: formData.title,
      album: albumToSelect?._id,
      releaseDate: formData.releaseDate || new Date().toISOString().split('T')[0],
      featuringArtist: Array.isArray(formData.featuringArtist)
        ? formData.featuringArtist.map((s) => s.trim())
        : typeof formData.featuringArtist === 'string'
          ? formData.featuringArtist.split(',').map((s) => s.trim())
          : [],
      trackNumber: Number.isInteger(parseInt(formData.trackNumber))
        ? parseInt(formData.trackNumber)
        : 1,
      genre: formData.genre,
       mood: formData.mood || [],
 subMoods: Object.values(formData.subMoods || {}).flat(),
      producer: Array.isArray(formData.producer)
        ? formData.producer
        : [],
      composer: Array.isArray(formData.composer)
        ? formData.composer
        : [],
      label: formData.label || '',
      lyrics: formData.lyrics || '',
    };

   

    const response = await updateSong({ variables });

setActiveStep(1);

await refetch(); 
  

  } catch (error) {
    console.error("❌ Mutation failed:", error);
    if (error.graphQLErrors) {
      console.error("❌ GraphQL Errors:", error.graphQLErrors);
    }
    if (error.networkError) {
      console.error("🌐 Network Error:", error.networkError);
    }
  }
};


if (albumLoading) return 'album is loading ...';
if (albumError) return `Error! ${albumError.message}`;

    return(
 <>
      {activeStep === 0 && (
        <Fade in timeout={500}>
          <Paper
            elevation={3}
            sx={{
              backgroundColor: theme.palette.primary.main,
              padding: isMobile ? 2 : 4,
              width: "100%",
              height: "auto",
              borderRadius: theme.spacing(4),
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              maxWidth: isMobile ? '100%' : '800px',
              mx: 'auto'
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
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

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Title Field - Responsive */}
              <Box mb={2} sx={{ width: '100%' }}>
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

              {/* Responsive Form Components */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 2
              }}>
                <Box>
                  <FeaturingArtist 
                    register={register}  
                    errors={errors} 
                    setValue={setValue} 
                    watch={watch} 
                  />
                </Box>
                <Box>
                  <Producer 
                    register={register} 
                    watch={watch} 
                    setValue={setValue} 
                    errors={errors} 
                  />
                </Box>
              </Box>

              <Composer 
                register={register} 
                errors={errors} 
                watch={watch} 
                setValue={setValue} 
              />

              <AlbumSong
                key="album"
                register={register}
                Controller={Controller}
                control={control}
                errors={errors}
                albumToSelect={albumToSelect}
                refetchAlbums={refetchAlbums} 
                setValue={setValue}
                albums={albums}
                handleAlbumChange={handleAlbumChange}
              />

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: 2,
                mt: 2
              }}>
                <Box>
                  <TruckNumber key="track" register={register} errors={errors} />
                </Box>
                <Box>
                  <Genre 
                    register={register} 
                    Controller={Controller}  
                    control={control}  
                    errors={errors} 
                  />
                </Box>
                <Box>
                  <SongLabel register={register} errors={errors}/>
                </Box>
              </Box>

              <Mood control={control} watch={watch} />
              <ReleaseDate register={register} errors={errors} />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                mt: 3
              }}>
                <Button
                  variant="contained"
                  sx={{
                    color: 'var(--primary-background-color)',
                    backgroundColor: 'var(--primary-font-color)',
                    fontFamily: 'Roboto',
                    width: isMobile ? '100%' : 'auto',
                    py: 1.5
                  }}
                  type="submit"
                >
                  Update Song
                </Button>
              </Box>
            </form>
          </Paper>
        </Fade>
      )}

      {/* Keep your existing activeStep 1 and 2 components exactly as they were */}
      {activeStep === 1 && (
        <Box>
          <LyricsEditSong  
            activeStep={activeStep} 
            setActiveStep={setActiveStep} 
            songId={songId} 
            song={song}
          />
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <SongCoverSongEdit
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            songId={songId}
            song={song}
            onClose={onClose}
          />
        </Box>
      )}
    </>
  )
}