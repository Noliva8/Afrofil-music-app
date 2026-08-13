import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApolloClient, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SONG_BY_ID } from '../utils/queries';
import { processSongs } from '../utils/someSongsUtils/someSongsUtils';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext';
import { eventBus } from '../utils/Contexts/playerAdapters';
import { presignAudioForTrack } from '../utils/plabackUtls/handleSongPlayBack';

const SharedTrack = () => {
  const { trackId } = useParams();
  const client = useApolloClient();
  const [playError, setPlayError] = useState('');
  const [isPreparing, setIsPreparing] = useState(true);
  const autoPlayAttemptedRef = useRef(false);
  const { data, loading, error } = useQuery(SONG_BY_ID, {
    variables: { songId: trackId },
    fetchPolicy: 'network-only',
  });
  const { songsWithArtwork, loading: presignLoading } = useSongsWithPresignedUrls(
    data?.publicSong ? [data.publicSong] : []
  );
  const { handlePlaySong } = useAudioPlayer();

  const processedSong = useMemo(() => {
    if (!songsWithArtwork.length) return null;
    return processSongs(songsWithArtwork)[0] || null;
  }, [songsWithArtwork]);

  const rawSong = data?.publicSong || null;
  const displaySong = processedSong || rawSong;
  const artworkUrl =
    displaySong?.artworkUrl ||
    displaySong?.artworkPresignedUrl ||
    rawSong?.artworkPresignedUrl ||
    rawSong?.artwork ||
    '/logo-512.png';

  const playSharedTrack = useCallback(async () => {
    if (!processedSong || !handlePlaySong) return false;
    setIsPreparing(true);
    setPlayError('');
    eventBus.emit('OPEN_FULL_SCREEN_PLAYER');

    try {
      const signedTrack = await presignAudioForTrack(processedSong, client);
      if (!signedTrack?.audioUrl) {
        setPlayError('This song is not available for playback right now.');
        return false;
      }

      const playbackTrack = {
        ...signedTrack,
        url: signedTrack.audioUrl,
        teaserUrl: signedTrack.teaserUrl,
        isTeaser: false,
        allowGuestFullPlayback: true,
        maxDuration: undefined,
      };

      const started = await handlePlaySong(playbackTrack, [], null, {
        prepared: {
          queue: [playbackTrack],
          queueIds: [playbackTrack.id],
          currentIndex: 0,
        },
      });
      eventBus.emit('OPEN_FULL_SCREEN_PLAYER');

      if (!started) {
        setPlayError('Tap play to start the song.');
      }

      return Boolean(started);
    } finally {
      setIsPreparing(false);
    }
  }, [client, handlePlaySong, processedSong]);

  useEffect(() => {
    if (!processedSong || autoPlayAttemptedRef.current) return;
    autoPlayAttemptedRef.current = true;
    playSharedTrack();
  }, [playSharedTrack, processedSong]);

  if (loading || presignLoading) {
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
          This shared song could not be found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 5,
        background: 'linear-gradient(135deg, #101418 0%, #20241d 55%, #121212 100%)',
        color: '#fff',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <Box
          component="img"
          src={artworkUrl}
          alt={displaySong?.title || 'Song artwork'}
          sx={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: 2,
            boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
            mb: 2,
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          {displaySong?.title || 'Opening song'}
        </Typography>

        {isPreparing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <>
            {playError && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', mb: 2 }}>
                {playError}
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={playSharedTrack}
              disabled={isPreparing}
            >
              Play song
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default SharedTrack;
