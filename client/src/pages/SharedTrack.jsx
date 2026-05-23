import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApolloClient, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { SONG_BY_ID } from '../utils/queries';
import { processSongs } from '../utils/someSongsUtils/someSongsUtils';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext';
import { eventBus } from '../utils/Contexts/playerAdapters';
import { presignAudioForTrack } from '../utils/plabackUtls/handleSongPlayBack';

const SharedTrack = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
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
    if (error || (!loading && !data?.publicSong)) {
      playedRef.current = true;
      navigate('/', { replace: true });
      return;
    }

    if (!loading && !error && !presignLoading && songsWithArtwork.length && handlePlaySong) {
      const [processed] = processSongs(songsWithArtwork);
      const playSharedTrack = async () => {
        if (!processed) {
          playedRef.current = true;
          navigate('/', { replace: true });
          return;
        }

        const signedTrack = await presignAudioForTrack(processed, client);
        if (!signedTrack?.audioUrl) {
          playedRef.current = true;
          navigate('/', { replace: true });
          return;
        }

        playedRef.current = true;
        handlePlaySong(signedTrack, [], null, {
          prepared: {
            queue: [signedTrack],
            queueIds: [signedTrack.id],
            currentIndex: 0,
          },
        });
        navigate('/', { replace: true });
        setTimeout(() => eventBus.emit('OPEN_FULL_SCREEN_PLAYER'), 150);
      };

      playSharedTrack();
    }
  }, [client, data?.publicSong, loading, error, presignLoading, songsWithArtwork, handlePlaySong, navigate]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || (!loading && !data?.publicSong)) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Typography color="error">
          Redirecting...
        </Typography>
      </Box>
    );
  }

  return null;
};

export default SharedTrack;
