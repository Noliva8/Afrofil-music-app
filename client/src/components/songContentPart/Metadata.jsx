import React from "react";

    import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Title from './inputsForSong/Title'
import FeaturingArtist from './inputsForSong/FeaturingArtist'
import Producer from '../songContentPart/Producer'
import Composer from './inputsForSong/Composer'
import AlbumSong from "./inputsForSong/AlbumInSong";
import TruckNumber from './inputsForSong/TruckNumber'
import Genre from './inputsForSong/Genre'
import Label from './inputsForSong/Label'

export default function Metadata({register, errors, albumToSelect, albums, handleAlbumChange, refetch}) {





return(
    <>
   <Box sx={{
    width: {
        xs: '100%'
    },

    minWidth: {
        xs: '360px',
        sm: '600px',
        md: '660px',
        lg: "800px",
        xl: "1200px",
    },
    
     maxWidth: {
        xl: '1500px'
    },
    height: 'auto',
    
   
    
   }}>
<Paper

sx={{
    width: {
        xs: '100%'
    },

    minWidth: {
        xs: '360px',
        sm: '600px',
        md: '660px'
    },
    
     maxWidth: {
        xl: '1500px'
    },
    height: '100%',
    backgroundColor: 'var(--primary-background-color)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
   }}>
<Title register={register} errors={errors}/>
<FeaturingArtist register={register} errors={errors} />
< Producer register={register} errors={errors}/>
< Composer register={register} errors={errors}/>
< AlbumSong register={register} errors={errors} albumToSelect={albumToSelect} albums={albums} handleAlbumChange={handleAlbumChange} refetch={refetch}/>
<TruckNumber register={register} errors={errors} />
<Genre register={register} errors={errors}  />
<Label register={register} errors={errors} />
</Paper>
   

   </Box>

    </>
)


}