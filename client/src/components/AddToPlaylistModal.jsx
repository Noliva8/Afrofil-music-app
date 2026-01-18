import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ADD_SONG_TO_PLAYLIST, CREATE_PLAYLIST } from '../utils/mutations';
import { QUERY_USER_PLAYLISTS } from '../utils/queries';
import UserAuth from '../utils/auth';

const pickSongId = (track) => track?._id || track?.id || null;

const AddToPlaylistModal = ({ open, onClose, track }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const songId = useMemo(() => pickSongId(track), [track]);
  const isLoggedIn = Boolean(UserAuth?.getProfile?.()?.data?._id);
  const userId = UserAuth?.getProfile?.()?.data?._id || null;

  const { data, loading } = useQuery(QUERY_USER_PLAYLISTS, {
    variables: { limit: 50 },
    skip: !open || !isLoggedIn,
    fetchPolicy: 'cache-and-network',
  });

  const playlists = data?.userPlaylists || [];

  const [addSongToPlaylist, { loading: saving }] = useMutation(ADD_SONG_TO_PLAYLIST, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
    ],
  });
  const [createPlaylist, { loading: creating }] = useMutation(CREATE_PLAYLIST, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
    ],
  });

  const handleSelectPlaylist = async (playlistId) => {
    if (!songId || !playlistId) return;
    await addSongToPlaylist({ variables: { playlistId, songId } });
    onClose?.();
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim() || !userId) return;
    await createPlaylist({
      variables: {
        title: newPlaylistTitle.trim(),
        createdBy: userId,
        songs: songId ? [songId] : [],
      },
    });
    setNewPlaylistTitle('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add to playlist</DialogTitle>
      <DialogContent dividers>
        {!isLoggedIn ? (
          <Box sx={{ py: 2 }}>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              Log in to add songs to your playlists.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/loginSignin?login=1')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Log in
            </Button>
          </Box>
        ) : (
          <>
            {loading ? (
              <Typography sx={{ color: theme.palette.text.secondary }}>
                Loading playlists...
              </Typography>
            ) : playlists.length === 0 ? (
              <Typography sx={{ color: theme.palette.text.secondary }}>
                No playlists yet. Create one to get started.
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {playlists.map((playlist) => {
                  const alreadyAdded = Boolean(
                    songId && playlist.songs?.some((song) => String(song._id || song.id) === String(songId))
                  );
                  return (
                  <ListItemButton
                    key={playlist._id}
                    onClick={() => handleSelectPlaylist(playlist._id)}
                    disabled={saving || !songId || alreadyAdded}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      '&:hover': { backgroundColor: 'rgba(228,196,33,0.12)' },
                    }}
                  >
                    <ListItemText
                      primary={playlist.title}
                      secondary={`${playlist.songs?.length || 0} songs`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                    />
                    {alreadyAdded && (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    )}
                  </ListItemButton>
                );
                })}
              </List>
            )}
          </>
        )}
        {isLoggedIn && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              Create a playlist
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Playlist name"
                value={newPlaylistTitle}
                onChange={(event) => setNewPlaylistTitle(event.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleCreatePlaylist}
                disabled={creating || !newPlaylistTitle.trim()}
                sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Create
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="text"
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToPlaylistModal;
