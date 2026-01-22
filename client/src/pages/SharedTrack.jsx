import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { SONG_BY_ID } from '../utils/queries';
import { processSongs } from '../utils/someSongsUtils/someSongsUtils';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext';
import { eventBus } from '../utils/Contexts/playerAdapters';

const SharedTrack = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(SONG_BY_ID, {
    variables: { songId: trackId },
    fetchPolicy: 'network-only',
  });
  const { songsWithArtwork, loading: presignLoading } = useSongsWithPresignedUrls(
    data?.publicSong ? [data.publicSong] : []
  );
  const { handlePlaySong } = useAudioPlayer();
  const playedRef = React.useRef(false);

  useEffect(() => {
    if (playedRef.current) return;
    if (!loading && !error && !presignLoading && songsWithArtwork.length && handlePlaySong) {
      const [processed] = processSongs(songsWithArtwork);
      if (processed) {
        playedRef.current = true;
        handlePlaySong(processed, [], null, {
          prepared: {
            queue: [processed],
            queueIds: [processed.id],
            currentIndex: 0,
          },
        });
        // Return to main UI then open fullscreen so the player is visible
        navigate('/', { replace: true });
        setTimeout(() => eventBus.emit('OPEN_FULL_SCREEN_PLAYER'), 150);
      }
    }
  }, [loading, error, presignLoading, songsWithArtwork, handlePlaySong, navigate]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.publicSong) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Typography color="error">
          Unable to load this track. Please try again later.
        </Typography>
      </Box>
    );
  }

  return null;
};

export default SharedTrack;
