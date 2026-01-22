// MainMenu.jsx
import Box from '@mui/material/Box';
import Grid2 from "@mui/material/Grid2";
import TrendingSongs from "./homeFreePlanComponents/TrendingSongs";
import NewUploaded from "./homeFreePlanComponents/NewUploaded";
import TopManagers from "./homeFreePlanComponents/TopManagers";
import RecommendedSongs from "./homeFreePlanComponents/RecommendedSongs";
import TopArtist from "./homeFreePlanComponents/TopArtist";
import TopProducer from "./homeFreePlanComponents/TopProducer";
import TopAlbum from "./homeFreePlanComponents/TopAlbum";
import SuggestedSongs from "./homeFreePlanComponents/SuggestedSongs";
import SongOfMonth from "./homeFreePlanComponents/SongOfMonth";
import RadioStations from "./homeFreePlanComponents/RadioStations";
import { useNavigate } from "react-router-dom";
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';


const MainMenu = ({
  songsWithArtwork,
  newUploadsWithArtwork,
  suggestedSongsWithArtwork,
  songOfMonthWithArtwork,
  radioStations,
  refetch
}) => {

  const navigate = useNavigate();
    const theme = useTheme();

  const handleCardClick = (song) => {
    const albumId = song?.albumId || song?.album?._id || song?.album;
    const songId = song?.id || song?._id;
    if (albumId && songId) {
      navigate(`/album/${albumId}/${songId}`, { state: { song } });
      return;
    }
    if (songId) {
      navigate(`/song/${songId}`, { state: { song } });
    }
  };




  return (
  <Box
       sx={{
         minHeight: "100vh",
         overflowX: "hidden",
         background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
           theme.palette.background.paper,
           0.82
         )} 100%)`,
         py: 5
       }}
     >


{/* 1. Trending */}

      <TrendingSongs
        songsWithArtwork={songsWithArtwork}
        onCardClick={handleCardClick}
        refetch={refetch}
      />

      <NewUploaded
        songsWithArtwork={newUploadsWithArtwork}
        onCardClick={handleCardClick}
        refetch={refetch}
      />

   <TopArtist songsWithArtwork={songsWithArtwork} />
   <TopAlbum songsWithArtwork={songsWithArtwork} />
   <SuggestedSongs
     suggestedSongsWithArtwork={suggestedSongsWithArtwork}
     onCardClick={handleCardClick}
   />
   <SongOfMonth
     songOfMonthWithArtwork={songOfMonthWithArtwork}
     onCardClick={handleCardClick}
   />
   <RadioStations stations={radioStations} />

 <Box sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
   <TopProducer songsWithArtwork={songsWithArtwork} />
 </Box>



{/* 6. song of the month => plays, like, share, downloads */}
{/* 7. Lastly Radio stations */}

    </Box>
  );
};

export default MainMenu;
