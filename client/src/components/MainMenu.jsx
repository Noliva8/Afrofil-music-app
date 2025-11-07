// MainMenu.jsx
import { Box } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import TrendingSongs from "./homeFreePlanComponents/TrendingSongs";
import TopManagers from "./homeFreePlanComponents/TopManagers";
import RecommendedSongs from "./homeFreePlanComponents/RecommendedSongs";
import TopArtist from "./homeFreePlanComponents/TopArtist";
import TopProducer from "./homeFreePlanComponents/TopProducer";
import ArtistSongPage from "./ArtistSongPage";
import { useState } from "react";

const MainMenu = ({ 
  songsWithArtwork,refetch
   }) => {

  const [selectedArtist, setSelectedArtist] = useState(null);
  const [clickedCardSongId, setClickedCardSongId] = useState(null);
  const [clickedCardData, setClickedCardData] = useState(null);

 const handleCardClick = (songId, fullSong) => {
  setClickedCardSongId(songId);
  setClickedCardData(fullSong);

  // Activate Artist Page
  setSelectedArtist({
    id: fullSong.artist?._id,
    name: fullSong.artist?.artistAka || "Unknown Artist",
    image: fullSong.artist?.profileImage || "",
    genre: fullSong.genre || "",
    country: fullSong.artist?.country || "",
    topSongs: songsWithArtwork.filter(song => song.artist?._id === fullSong.artist?._id)
  });
};


  if (selectedArtist) {
    return (
      <Box sx={{ pt: { xs: 8, md: 10 }, mt: 5, px: { xs: 2, md: 4 }, backgroundColor: "#0A0A0A", color: "white", minHeight: "100vh", pb: { xs: 20, sm: 24 } }}>

     <ArtistSongPage

  
  onClose={() => {
    setSelectedArtist(null);
    setClickedCardData(null);
    setClickedCardSongId(null);
  }}
 artist={selectedArtist}
  initialSong={clickedCardData}
    
/>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: { xs: 8, md: 10 }, mt: 5, px: { xs: 2, md: 4 }, backgroundColor: "#0A0A0A", color: "white", minHeight: "100vh", pb: { xs: 20, sm: 24 } }}>
      <TrendingSongs
        songsWithArtwork={songsWithArtwork}
        onCardClick={handleCardClick}
        refetch={refetch}
      />
      <RecommendedSongs />
      <Grid2 container spacing={4}>
        <TopArtist />
        <TopManagers />
        <TopProducer />
      </Grid2>
    </Box>
  );
};

export default MainMenu;

