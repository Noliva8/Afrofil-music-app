import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
} from "@mui/material";
import { PlayArrow, MoreVert, Star } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import TrendingSongs from "./homeFreePlanComponents/TrendingSongs";
import TopManagers from "./homeFreePlanComponents/TopManagers";
import RecommendedSongs from "./homeFreePlanComponents/RecommendedSongs";
import TopArtist from "./homeFreePlanComponents/TopArtist";
import TopProducer from "./homeFreePlanComponents/TopProducer";

const MainMenu = ({ songsWithArtwork, onSongPlay, playingSongId,  nowPlaying, isPlaying}) => {
  

  return (
    <Box
      sx={{
        pt: { xs: 8, md: 10 },
        mt: 5,
        px: { xs: 2, md: 4 },
        backgroundColor: "#0A0A0A",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <TrendingSongs
        songsWithArtwork={songsWithArtwork}
        playingSongId={playingSongId}
        onSongPlay={onSongPlay}
        isPlaying={isPlaying}
        nowPlaying={nowPlaying}
      />

      <RecommendedSongs />

      {/* Top Artists & Creators */}
      <Grid2 container spacing={4}>
        {/* Top Artists */}
        <TopArtist />

        {/* Top Producers */}

        <TopManagers />

        <TopProducer />
      </Grid2>
    </Box>
  );
};

export default MainMenu;
