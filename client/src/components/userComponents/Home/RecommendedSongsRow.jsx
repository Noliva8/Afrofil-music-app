import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import useTheme from '@mui/material/styles/useTheme';
import SectionHeader from '../../common/SectionHeader.jsx';
import { SongCard } from '../../otherSongsComponents/songCard.jsx';
import { useSongsWithPresignedUrls } from '../../../utils/someSongsUtils/songsWithPresignedUrlHook.js';
import { similarSongsUtil } from '../../../utils/someSongsUtils/similarSongsHook.js';
import { useAudioPlayer } from '../../../utils/Contexts/AudioPlayerContext.jsx';
import { usePlayCount } from '../../../utils/handlePlayCount';
import { handleTrendingSongPlay } from '../../../utils/plabackUtls/handleSongPlayBack.js';
import { useApolloClient } from '@apollo/client';
import { dedupeSongs } from '../../../utils/songHelpers';

const ROW_LIMIT = 8;
const getSongId = (song) => String(song?.id || song?._id || song?.songId || '').trim();

export default function RecommendedSongsRow({
  recentSongs = [],
  existingTracks = [],
  username,
  onReady,
}) {
  const theme = useTheme();
  const client = useApolloClient();
  const { currentTrack, isPlaying: isTrackPlaying, handlePlaySong, pause } = useAudioPlayer();
  const { incrementPlayCount } = usePlayCount();
  const [similarSongs, setSimilarSongs] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);

  const firstRecentId = useMemo(() => {
    const song = recentSongs?.[0];
    return song ? song._id || song.id || song.songId || null : null;
  }, [recentSongs]);

  useEffect(() => {
    if (!firstRecentId) {
      setSimilarSongs([]);
      setSimilarLoading(false);
      return;
    }

    let canceled = false;
    setSimilarLoading(true);
    similarSongsUtil(client, firstRecentId)
      .then((pack) => {
        if (canceled) return;
        setSimilarSongs(pack.songs || []);
      })
      .catch(() => {
        if (!canceled) setSimilarSongs([]);
      })
      .finally(() => {
        if (!canceled) setSimilarLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [client, firstRecentId]);

  const existingIds = useMemo(
    () =>
      new Set(
        [...recentSongs, ...existingTracks]
          .map(getSongId)
          .filter(Boolean)
      ),
    [recentSongs, existingTracks]
  );

  const deduped = dedupeSongs(similarSongs);
  const filtered = deduped.filter((song) => {
    const id = getSongId(song);
    return id && !existingIds.has(id);
  });
  const finalCandidates = filtered.length ? filtered : deduped;
  const limited = finalCandidates.slice(0, ROW_LIMIT);
  const { songsWithArtwork, loading: artworkLoading } = useSongsWithPresignedUrls(limited);
  const displayedSongs = songsWithArtwork.length ? songsWithArtwork : limited;
  const isLoading = similarLoading || artworkLoading;

  useEffect(() => {
    onReady?.(!isLoading);
  }, [isLoading, onReady]);

  const handlePlay = async (track) => {
    const trackId = String(track.id || track._id || track.songId || '');
    const currentlySelected = currentTrack?.id === trackId;

    if (currentlySelected && isTrackPlaying) {
      pause();
      return;
    }

    await handleTrendingSongPlay({
      song: track,
      incrementPlayCount,
      handlePlaySong,
      trendingSongs: displayedSongs,
      client,
    });
  };

  const headerTitle = username ? `Made for ${username}` : 'Recommended for you';
  const headerSubtitle = 'AI-powered curated mix';

  return (
    <Box sx={{ mt: 4 }}>
      <SectionHeader title={headerTitle} subtitle={headerSubtitle} />
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <LinearProgress />
          <Box
            sx={{
              display: 'flex',
              gap: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
              overflowX: 'auto',
              pb: 2,
              px: { xs: 1, sm: 2 },
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {Array.from({ length: ROW_LIMIT }).map((_, index) => (
              <Skeleton
                key={`recommended-skeleton-${index}`}
                variant="rectangular"
                width={150}
                height={150}
                sx={{ borderRadius: 3, flexShrink: 0 }}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: theme.spacing(theme.customSpacing?.cardGap?.xs ?? 1.5),
            overflowX: 'auto',
            pb: 2,
            px: { xs: 1, sm: 2 },
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {displayedSongs.slice(0, ROW_LIMIT).map((song, index) => {
            const baseId = song.id || song._id || song.songId;
            const trackId = baseId ? String(baseId) : `recommended-${index}`;
            const isCurrent = currentTrack?.id === trackId;

            return (
              <Box key={trackId} sx={{ flexShrink: 0 }}>
                <SongCard
                  song={song}
                  isPlayingThisSong={isCurrent && isTrackPlaying}
                  onPlayPause={() => handlePlay(song)}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
