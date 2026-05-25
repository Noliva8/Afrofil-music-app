import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApolloClient, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SONG_BY_ID } from '../utils/queries';
import { processSongs } from '../utils/someSongsUtils/someSongsUtils';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { useAudioPlayer } from '../utils/Contexts/AudioPlayerContext';
import { eventBus } from '../utils/Contexts/playerAdapters';
import { presignAudioForTrack } from '../utils/plabackUtls/handleSongPlayBack';
import { useUser } from '../utils/Contexts/userContext';

const SharedTrack = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { isGuest } = useUser();
  const [playError, setPlayError] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
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
  const artistName = displaySong?.artistName || rawSong?.artist?.artistAka || 'FloLup artist';
  const artworkUrl =
    displaySong?.artworkUrl ||
    displaySong?.artworkPresignedUrl ||
    rawSong?.artworkPresignedUrl ||
    rawSong?.artwork ||
    '/logo-512.png';

  const playSharedTrack = async () => {
    if (!processedSong || !handlePlaySong) return;
    setIsPreparing(true);
    setPlayError('');

    try {
      const signedTrack = await presignAudioForTrack(processedSong, client);
      if (!signedTrack?.audioUrl) {
        setPlayError('This song is not available for playback right now.');
        return;
      }

      const playbackTrack = {
        ...signedTrack,
        url: signedTrack.audioUrl,
        teaserUrl: isGuest ? signedTrack.audioUrl : signedTrack.teaserUrl,
        isTeaser: Boolean(isGuest),
        maxDuration: isGuest ? 30 : undefined,
      };

      handlePlaySong(playbackTrack, [], null, {
        prepared: {
          queue: [playbackTrack],
          queueIds: [playbackTrack.id],
          currentIndex: 0,
        },
      });
      setTimeout(() => eventBus.emit('OPEN_FULL_SCREEN_PLAYER'), 150);
    } finally {
      setIsPreparing(false);
    }
  };

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
      <Box sx={{ width: '100%', maxWidth: 520 }}>
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
            mb: 3,
          }}
        />

        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 0 }}>
            Shared on FloLup
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.05 }}>
            {displaySong?.title || 'Untitled song'}
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.78)' }}>
            {artistName}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {displaySong?.albumName && <Chip label={displaySong.albumName} />}
            {displaySong?.genre && <Chip label={displaySong.genre} />}
            {displaySong?.duration && <Chip label={displaySong.duration} />}
          </Stack>

          {isGuest && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
              Guests can preview the first 30 seconds. Log in to play the full song.
            </Typography>
          )}

          {playError && <Typography color="error">{playError}</Typography>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={playSharedTrack}
              disabled={isPreparing}
            >
              {isPreparing ? 'Preparing...' : isGuest ? 'Play teaser' : 'Play song'}
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/')}>
              Open FloLup
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default SharedTrack;
