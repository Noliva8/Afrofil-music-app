// MainMenu.jsx
import { useMemo, useCallback, useState } from "react";
import Box from '@mui/material/Box';
import { SongRowContainer } from './otherSongsComponents/SongsRow';
import { SongRowContainerHero } from "./otherSongsComponents/SongRowHero";
import TopArtist from "./homeFreePlanComponents/TopArtist";
import TopProducer from "./homeFreePlanComponents/TopProducer";
import TopAlbum from "./homeFreePlanComponents/TopAlbum";
import SongList from "./otherSongsComponents/ListSong";
import SongOfMonth from "./homeFreePlanComponents/SongOfMonth";
import RadioStations from "./homeFreePlanComponents/RadioStations";
import { useNavigate } from "react-router-dom";
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
import { useAudioPlayer } from "../utils/Contexts/AudioPlayerContext";
import { usePlayCount } from "../utils/handlePlayCount";
import { useApolloClient } from "@apollo/client";
import AddToPlaylistModal from "./AddToPlaylistModal.jsx";
import { handleTrendingSongPlay } from "../utils/plabackUtls/handleSongPlayBack";
import { processSongs } from "../utils/someSongsUtils/someSongsUtils";


const MainMenu = ({
  songsWithArtwork,
  newUploadsWithArtwork,
  suggestedSongsWithArtwork,
  songOfMonthWithArtwork,
  radioStations,
  refetch,
  limit
}) => {

  const navigate = useNavigate();
  const client = useApolloClient();
  const { incrementPlayCount } = usePlayCount();
  const { currentTrack, isPlaying, handlePlaySong, pause } = useAudioPlayer();
  const trendingSongs = useMemo(() => (Array.isArray(songsWithArtwork) ? songsWithArtwork : []), [songsWithArtwork]);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState(null);

  const onTrendingPlayPause = useCallback(
    (song) => {
      const isCurrent = currentTrack?.id === song.id;
      const isPlayingThisSong = isCurrent && isPlaying;
      if (isPlayingThisSong) {
        pause();
        return;
      }

      handleTrendingSongPlay({
        song,
        incrementPlayCount,
        handlePlaySong,
        trendingSongs,
        client,
      });
    },
    [currentTrack?.id, isPlaying, pause, incrementPlayCount, handlePlaySong, trendingSongs, client]
  );

  const theme = useTheme();
  const handleAddToPlaylist = useCallback((track) => {
    if (!track) return;
    setPlaylistTrack(track);
    setPlaylistDialogOpen(true);
  }, []);

  const handleCloseAddToPlaylist = useCallback(() => {
    setPlaylistDialogOpen(false);
    setPlaylistTrack(null);
  }, []);



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




  const processedNewUploads = useMemo(
    () => processSongs(Array.isArray(newUploadsWithArtwork) ? newUploadsWithArtwork : []),
    [newUploadsWithArtwork]
  );

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

      {trendingSongs.length > 0 && (

<>
        {/* <Box sx={{ mb: 3, px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: "white",
              }}
            >
              Trending Right Now
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Fresh hits driving the queue
            </Typography>
          </Box>
          <SongRow
            songs={trendingSongs}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlayPause={onTrendingPlayPause}
            onCardClick={handleCardClick}
          />
        </Box> */}


            <SongRowContainerHero
              header="Trending Now"
              subHeader="The hottest tracks now"
                songsWithArtwork={trendingSongs}
              onCardClick={handleCardClick}
            />

</>



      )}




      <SongRowContainer
        header="Just Released"
        subHeader="The Latest Songs, Right Now"
        songsWithArtwork={processedNewUploads}
        onCardClick={handleCardClick}
        refetch={refetch}
        rowCode="newUpload"
      />



   <TopArtist songsWithArtwork={songsWithArtwork} />

   <TopAlbum songsWithArtwork={songsWithArtwork} />



      <SongList
        songsList={suggestedSongsWithArtwork}
        title="Suggested songs"
        subtitle="Based on trending songs"
        rowCode="suggestedSongs"
        emptyMessage="No songs available"
        emptyDescription="Start listening to get recommendations"
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

      <AddToPlaylistModal
        open={playlistDialogOpen}
        onClose={handleCloseAddToPlaylist}
        track={playlistTrack}
      />

    </Box>
  );
};

export default MainMenu;
