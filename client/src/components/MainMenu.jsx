// MainMenu.jsx
import { Box } from "@mui/material";
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

const MainMenu = ({
  songsWithArtwork,
  newUploadsWithArtwork,
  suggestedSongsWithArtwork,
  songOfMonthWithArtwork,
  radioStations,
  refetch
}) => {

  const navigate = useNavigate();

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
        pt: { xs: 8, md: 10 },
        mt: 0,
        px: { xs: 2, md: 4 },
        backgroundColor: "#0A0A0A",
        color: "white",
        minHeight: "100vh",
        pb: { xs: 20, sm: 24 }
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
