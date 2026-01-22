import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import UserAuth from '../utils/auth';
import { useSongsWithPresignedUrls } from '../utils/someSongsUtils/songsWithPresignedUrlHook';
import { QUERY_LIKED_SONGS, QUERY_USER_PLAYLISTS } from '../utils/queries';
import { REMOVE_SONG_FROM_PLAYLIST } from '../utils/mutations';

const parseDurationValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (!value) return 0;
    if (value.includes(':')) {
      const parts = value.split(':').map((part) => Number(part) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const formatDuration = (value) => {
  const total = Math.max(0, Math.floor(parseDurationValue(value)));
  if (!Number.isFinite(total) || total === 0) return '--:--';
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

function EmptyState({ message }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        borderRadius: 3,
        p: { xs: 3, sm: 4 },
        background: alpha(theme.palette.background.paper, 0.9),
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        Your library is empty
      </Typography>
      <Typography sx={{ color: theme.palette.text.secondary }}>{message}</Typography>
    </Card>
  );
}

function PlaylistBadge() {
  const theme = useTheme();
  const gradient = `
    radial-gradient(circle at 35% 35%,
      ${alpha(theme.palette.primary.main, 0.9)} 0%,
      ${alpha(theme.palette.primary.main, 0.35)} 45%,
      ${alpha(theme.palette.primary.dark, 0.2)} 65%
    )
  `;

  return (
    <Box
      sx={{
        width: 68,
        height: 68,
        borderRadius: '50%',
        position: 'relative',
        background: gradient,
        border: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
        boxShadow: `inset 0 0 10px ${alpha(theme.palette.primary.dark, 0.35)}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '16%',
          borderRadius: '50%',
          border: `1px solid ${alpha(theme.palette.text.primary, 0.4)}`,
          background: alpha(theme.palette.background.paper, 0.6),
        }}
      />
    </Box>
  );
}

function LibrarySongRow({ song, playlistId, onRemove, artwork }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const goToSong = useCallback(
    (event) => {
      event.stopPropagation();
      navigate(`/song/${song._id}`);
    },
    [navigate, song._id]
  );
  const handleRemove = (event) => {
    event.stopPropagation();
    onRemove?.(playlistId, song._id);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 1.5,
        background: alpha(theme.palette.background.paper, 0.55),
      }}
    >
      <Box
        component="img"
        src={artwork || undefined}
        alt={song.title}
        onClick={goToSong}
        sx={{
          width: 26,
          height: 26,
          borderRadius: 1,
          objectFit: 'cover',
          background: alpha(theme.palette.text.primary, 0.1),
          cursor: 'pointer',
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }} noWrap>
          {song.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}
          onClick={goToSong}
          noWrap
        >
          {song.artist?.artistAka || 'Unknown Artist'}
        </Typography>
      </Box>
      {onRemove && (
        <IconButton size="small" onClick={handleRemove} sx={{ color: theme.palette.text.secondary }}>
          <RemoveCircleOutline fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

function PlaylistRow({ playlist, open, onToggle, onNavigate, onRemoveSong, songArtworkMap }) {
  const theme = useTheme();
  const songs = playlist.songs || [];

  return (
    <Card
      onClick={() => onNavigate(playlist._id)}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(
          theme.palette.secondary.main,
          0.1
        )})`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        mb: 1.5,
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PlaylistBadge />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {playlist.title}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {songs.length} songs
            </Typography>
          </Box>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(playlist._id);
          }}
          sx={{ color: theme.palette.text.secondary }}
        >
          {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
        </IconButton>
      </Box>
    </CardContent>
      {open && songs.length > 0 && (
        <>
          <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.3), mb: 1.25 }} />
          <Stack spacing={0.75} sx={{ px: 2, pb: 2 }}>
            {songs.map((song) => (
              <LibrarySongRow
                key={song._id}
                song={song}
                playlistId={playlist._id}
                onRemove={onRemoveSong}
                artwork={songArtworkMap?.get(String(song._id))}
              />
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
}

function FavoritesRow({ songs, open, onToggle, onNavigate }) {
  const theme = useTheme();
  const previewSongs = songs.slice(0, 3);

  return (
    <Card
      onClick={onNavigate}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(
          theme.palette.secondary.dark,
          0.12
        )})`,
      }}
    >
      <CardContent
        sx={{
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <PlaylistBadge />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Favorites
          </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {songs.length} liked song{songs.length === 1 ? '' : 's'}
        </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          sx={{ color: theme.palette.text.secondary }}
        >
          {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
        </IconButton>
      </CardContent>
      {open && previewSongs.length > 0 && (
        <Stack spacing={0.75} sx={{ px: 2, pb: 2 }}>
          {previewSongs.map((song) => (
            <Box
              key={song._id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                background: alpha(theme.palette.background.paper, 0.5),
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {song.title}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 1 }}>
                {formatDuration(song.durationSeconds ?? song.duration)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}

export default function Libraly() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(UserAuth?.getProfile?.()?.data?._id);
  const [openPlaylistIds, setOpenPlaylistIds] = useState(new Set());
  const [initialized, setInitialized] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(true);

  const { data: playlistData, loading: playlistsLoading } = useQuery(QUERY_USER_PLAYLISTS, {
    variables: { limit: 50 },
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
  });
  const { data: likedData, loading: likedLoading } = useQuery(QUERY_LIKED_SONGS, {
    variables: { limit: 12 },
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
  });

  const playlists = useMemo(() => playlistData?.userPlaylists || [], [playlistData]);
  const likedSongs = useMemo(() => likedData?.likedSongs || [], [likedData]);
  const { songsWithArtwork: likedSongsWithArtwork } = useSongsWithPresignedUrls(likedSongs);
  const playlistSongs = useMemo(() => playlists.flatMap((playlist) => playlist.songs || []), [playlists]);
  const { songsWithArtwork: playlistSongsWithArtwork } = useSongsWithPresignedUrls(playlistSongs);
  const playlistArtworkById = useMemo(() => {
    const map = new Map();
    (playlistSongsWithArtwork || []).forEach((song) => {
      if (!song?._id) return;
      const artwork =
        song.artworkUrl ||
        song.albumCoverImageUrl ||
        song.artwork ||
        song.album?.albumCoverImage ||
        '';
      map.set(String(song._id), artwork);
    });
    return map;
  }, [playlistSongsWithArtwork]);

  const [removeSongFromPlaylist] = useMutation(REMOVE_SONG_FROM_PLAYLIST, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
    ],
  });

  const handleRemoveSong = useCallback(
    async (playlistId, songId) => {
      if (!playlistId || !songId) return;
      try {
        await removeSongFromPlaylist({
          variables: { playlistId, songId },
        });
      } catch (error) {
        console.error('Failed to remove song from playlist', error);
      }
    },
    [removeSongFromPlaylist]
  );

  useEffect(() => {
    if (!initialized && playlists.length) {
      setOpenPlaylistIds(new Set(playlists.map((playlist) => playlist._id)));
      setInitialized(true);
    }
  }, [playlists, initialized]);

  const togglePlaylist = (playlistId) => {
    setOpenPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleOpenPlaylist = (playlistId) => {
    navigate(`/collection/playlist/${playlistId}`);
  };

  const emptyMessage =
    playlists.length || likedSongsWithArtwork.length
      ? 'Drop songs or playlists to change what you see here.'
      : 'Save playlists and songs to build your personal collection; they will show up in the library.';

  const isLoading = playlistsLoading || likedLoading;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 100%)`,
      }}
    >
      <Stack spacing={1.5} mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Your Library
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 600 }}>
          Browse the playlists, favorites, and liked songs you have saved.
        </Typography>
      </Stack>

      {isLoading && !playlists.length && !likedSongsWithArtwork.length && (
        <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>Loading library…</Typography>
      )}

      {likedSongsWithArtwork.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FavoritesRow
            songs={likedSongsWithArtwork}
            open={favoritesOpen}
            onToggle={() => setFavoritesOpen((prev) => !prev)}
            onNavigate={() => navigate('/collection/liked_songs')}
          />
        </Box>
      )}

      {playlists.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <Stack spacing={2}>
          {playlists.map((playlist) => (
            <PlaylistRow
              key={playlist._id}
              playlist={playlist}
              open={openPlaylistIds.has(playlist._id)}
              onToggle={togglePlaylist}
              onNavigate={handleOpenPlaylist}
              onRemoveSong={handleRemoveSong}
              songArtworkMap={playlistArtworkById}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
