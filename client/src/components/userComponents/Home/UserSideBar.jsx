import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { alpha } from '@mui/material/styles';
import useTheme from '@mui/material/styles/useTheme';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';

import {
  PlaylistPlayRounded,
  FavoriteRounded,
  HistoryRounded,
  AlbumRounded,
  PersonRounded,
  RadioRounded,
  VideoLibraryRounded,
  DownloadRounded,
  AddRounded,
  MusicNoteRounded,
  TrendingUpRounded,
  RemoveCircleOutline,
  OpenInNewRounded,
  Add
} from '@mui/icons-material';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QUERY_LIKED_SONGS, QUERY_RECENT_PLAYED, QUERY_USER_PLAYLISTS } from '../../../utils/queries';
import { DELETE_PLAYLIST, REMOVE_SONG_FROM_PLAYLIST, REORDER_PLAYLIST_SONGS } from '../../../utils/mutations';
import { useSongsWithPresignedUrls } from '../../../utils/someSongsUtils/songsWithPresignedUrlHook';
import AddToPlaylistModal from '../../AddToPlaylistModal.jsx';

// Sortable Playlist Item Component
const SortablePlaylistItem = ({ playlist, isOpen, onToggle, onDelete, navigate, artworkById, onSongsUpdated }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const previewSongs = playlist.songs || [];

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Paper
        elevation={0}
        onClick={() => onToggle(playlist._id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1,
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: alpha(useTheme().palette.background.paper, 0.6),
          border: `1px solid ${alpha(useTheme().palette.divider, 0.1)}`,
          '&:hover': {
            backgroundColor: alpha(useTheme().palette.primary.main, 0.08),
            borderColor: useTheme().palette.primary.main,
            transform: 'translateX(4px)',
          },
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            position: 'relative',
            background: `radial-gradient(circle at 35% 35%, ${alpha(
              useTheme().palette.primary.main,
              0.9
            )} 0%, ${alpha(useTheme().palette.primary.main, 0.35)} 45%, ${alpha(
              useTheme().palette.primary.dark,
              0.2
            )} 65%)`,
            border: `2px solid ${alpha(useTheme().palette.primary.main, 0.35)}`,
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: '30%',
              borderRadius: '50%',
              background: alpha(useTheme().palette.background.paper, 0.8),
              border: `1px solid ${alpha(useTheme().palette.text.primary, 0.4)}`,
            }}
          />
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playlist.title || playlist.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: useTheme().palette.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {`${playlist.songs?.length || 0} songs`}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(playlist);
            }}
            sx={{ color: useTheme().palette.text.secondary }}
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/collection/playlist/${playlist._id}`);
            }}
            sx={{ color: useTheme().palette.text.secondary }}
          >
            <OpenInNewRounded fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(playlist._id);
            }}
            sx={{ color: useTheme().palette.text.secondary }}
          >
            {isOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Paper>
      
      {isOpen && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <PlaylistSongList 
            playlist={playlist} 
            artworkById={artworkById}
            playlistId={playlist._id}
            onSongsReordered={(updatedSongs) => onSongsUpdated?.(playlist._id, updatedSongs)}
          />
        </Collapse>
      )}
    </Box>
  );
};

// Sortable Song Item Component for reordering songs within playlist
const SortableSongItem = ({ song, playlistId, artworkById, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const navigate = useNavigate();

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        backgroundColor: isDragging
          ? alpha(useTheme().palette.primary.main, 0.1)
          : 'transparent',
        borderRadius: 1,
        p: 0.5,
      }}
    >
      <Box
        component="img"
        src={
          artworkById.get(String(song._id)) ||
          song.artworkUrl ||
          song.albumCoverImageUrl ||
          song.artwork ||
          song.album?.albumCoverImage ||
          ''
        }
        alt={song.title}
        sx={{
          width: 26,
          height: 26,
          borderRadius: 1,
          objectFit: 'cover',
          backgroundColor: alpha(useTheme().palette.text.primary, 0.1),
        }}
        onClick={(event) => {
          event.stopPropagation();
          navigate(`/song/${song._id}`);
        }}
      />
      <Typography 
        variant="caption" 
        sx={{ 
          color: useTheme().palette.text.secondary,
          flex: 1,
        }}
        onClick={(event) => {
          event.stopPropagation();
          navigate(`/song/${song._id}`);
        }}
      >
        {song.title}
      </Typography>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(playlistId, song._id);
        }}
        sx={{ color: useTheme().palette.text.secondary }}
      >
        <RemoveCircleOutline fontSize="small" />
      </IconButton>
    </Box>
  );
};

// Playlist Song List Component
const PlaylistSongList = ({ playlist, artworkById, playlistId, onSongsReordered }) => {
  const [songs, setSongs] = useState(playlist.songs || []);
  const [removeSongFromPlaylist] = useMutation(REMOVE_SONG_FROM_PLAYLIST, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
    ],
  });
  const [reorderPlaylistSongs] = useMutation(REORDER_PLAYLIST_SONGS, {
    refetchQueries: [
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } },
      { query: QUERY_USER_PLAYLISTS, variables: { limit: 50 } },
    ],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = songs.findIndex((song) => song._id === active.id);
    const newIndex = songs.findIndex((song) => song._id === over.id);

    if (oldIndex !== newIndex) {
      const previousSongs = songs;
      const newSongs = arrayMove(songs, oldIndex, newIndex);
      setSongs(newSongs);

      // Update order in backend
      try {
        await reorderPlaylistSongs({
          variables: {
            playlistId: playlistId,
            songIds: newSongs.map(song => song._id),
          },
        });
        onSongsReordered?.(newSongs);
      } catch (error) {
        console.error('Error reordering songs:', error);
        // Revert on error
        setSongs(previousSongs);
      }
    }
  };

  const handleRemoveSong = async (playlistId, songId) => {
    try {
      await removeSongFromPlaylist({
        variables: { playlistId, songId },
      });
      setSongs((currentSongs) => {
        const updatedSongs = currentSongs.filter((song) => song._id !== songId);
        onSongsReordered?.(updatedSongs);
        return updatedSongs;
      });
    } catch (error) {
      console.error('Error removing song:', error);
    }
  };

  return (
    <Stack spacing={0.5} sx={{ mt: 1, pl: 6 }}>
      {songs.length === 0 ? (
        <Typography variant="caption" sx={{ color: useTheme().palette.text.secondary }}>
          No songs yet. Drag songs here to add them!
        </Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={songs.map(song => song._id)}
            strategy={verticalListSortingStrategy}
          >
            {songs.map((song) => (
              <SortableSongItem
                key={song._id}
                song={song}
                playlistId={playlistId}
                artworkById={artworkById}
                onRemove={handleRemoveSong}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
};

const UserSideBar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const [openPlaylistIds, setOpenPlaylistIds] = useState({});
  const [recentOpen, setRecentOpen] = useState(false);
  const [likedOpen, setLikedOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const { data: recentData, loading: recentLoading } = useQuery(QUERY_RECENT_PLAYED, { 
    variables: { limit: 4 },
    fetchPolicy: 'cache-and-network'
  });
  
  const { data: likedData, loading: likedLoading } = useQuery(QUERY_LIKED_SONGS, { 
    variables: { limit: 4 },
    fetchPolicy: 'cache-and-network'
  });
  
  const { data: playlistsData, loading: playlistsLoading, refetch: refetchPlaylists } = useQuery(QUERY_USER_PLAYLISTS, { 
    variables: { limit: 6 },
    fetchPolicy: 'cache-and-network'
  });

  const [deletePlaylist] = useMutation(DELETE_PLAYLIST, {
    refetchQueries: [{ query: QUERY_USER_PLAYLISTS, variables: { limit: 6 } }],
  });

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [playlists, setPlaylists] = useState([]);



// themes
 const primary = theme.palette.primary.main;


  // Initialize playlists state when data loads
  useEffect(() => {
    if (playlistsData?.userPlaylists) {
      setPlaylists(playlistsData.userPlaylists);
    }
  }, [playlistsData]);

  const handleOpenDeleteDialog = (playlist) => {
    setPlaylistToDelete(playlist);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlaylistToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!playlistToDelete?._id) return;
    await deletePlaylist({ variables: { playlistId: playlistToDelete._id } });
    handleCloseDeleteDialog();
  };

  const handleOpenCreatePlaylist = () => {
    setPlaylistDialogOpen(true);
  };

  const togglePlaylist = (playlistId) => {
    setOpenPlaylistIds((prev) => ({
      ...prev,
      [playlistId]: !prev[playlistId],
    }));
  };

  const handleUpdatePlaylistSongs = (playlistId, updatedSongs) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist._id === playlistId ? { ...playlist, songs: updatedSongs } : playlist
      )
    );
  };

  const recentSongs = recentData?.recentPlayedSongs || [];
  const likedSongs = likedData?.likedSongs || [];
  
  const previewSongs = useMemo(() => {
    const flattened = playlists.flatMap((playlist) => playlist.songs || []);
    const all = [...recentSongs, ...likedSongs, ...flattened].filter(Boolean);
    const seen = new Set();
    const unique = [];
    all.forEach((song) => {
      const id = song?._id || song?.id;
      if (!id || seen.has(String(id))) return;
      seen.add(String(id));
      unique.push(song);
    });
    return unique.slice(0, 30);
  }, [likedSongs, playlists, recentSongs]);
  
  const { songsWithArtwork: previewSongsWithArtwork } = useSongsWithPresignedUrls(previewSongs);
  
  const artworkById = useMemo(() => {
    const map = new Map();
    (previewSongsWithArtwork || []).forEach((song) => {
      if (song?._id) map.set(String(song._id), song.artworkUrl || song.albumCoverImageUrl || null);
    });
    return map;
  }, [previewSongsWithArtwork]);

  // Handle playlist reordering
  const handlePlaylistDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = playlists.findIndex((playlist) => playlist._id === active.id);
    const newIndex = playlists.findIndex((playlist) => playlist._id === over.id);

    if (oldIndex !== newIndex) {
      const newPlaylists = arrayMove(playlists, oldIndex, newIndex);
      setPlaylists(newPlaylists);

      // You might want to save the new order to backend
      // This would require a new mutation to reorder playlists
      console.log('Playlists reordered:', newPlaylists.map(p => p._id));
    }
  };

  const itemSx = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.2,
    px: 1.2,
    py: 0.8,
    borderRadius: 1.5,
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.background.paper, 0.55),
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
    },
  };

  // Enhanced section design with drag and drop
  const renderMusicSection = (title, items, icon, emptyText, type = 'song') => {
    if (type !== 'playlist') {
      // Return original non-dnd version for non-playlist sections
      return (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {icon}
            <Typography
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
              }}
            >
              {title} • {items.length}
            </Typography>
          </Box>

          <Stack spacing={1}>
            {items.length > 0 ? (
              <>
                {items.slice(0, 4).map((item, index) => (
                  <Paper
                    key={item._id || index}
                    elevation={0}
                    onClick={() => navigate(`/song/${item._id}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: theme.palette.primary.main,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        color: theme.palette.secondary.main,
                        fontSize: '0.9rem',
                      }}
                    >
                      <MusicNoteRounded fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title || item.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {item.artist?.artistAka || item.artistName || 'Unknown Artist'}
                      </Typography>
                    </Box>
                  </Paper>
                ))}

                {items.length > 4 && (
                  <Button
                    size="small"
                    onClick={() => navigate('/collection/liked_songs')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      justifyContent: 'flex-start',
                      pl: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                    endIcon={<ExpandMoreRoundedIcon fontSize="small" />}
                  >
                    View all {items.length}
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, px: 1 }}>
                {emptyText}
              </Typography>
            )}
          </Stack>
        </Box>
      );
    }

    // Playlist section with drag and drop
    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography
            sx={{
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
            }}
          >
            {title} • {items.length}
          </Typography>
        </Box>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handlePlaylistDragEnd}
        >
          <SortableContext
            items={items.map(playlist => playlist._id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {items.length > 0 ? (
                <>
                  {items.slice(0, 6).map((playlist) => (
                    <SortablePlaylistItem
                      key={playlist._id}
                      playlist={playlist}
                      isOpen={Boolean(openPlaylistIds[playlist._id])}
                      onToggle={togglePlaylist}
                      onDelete={handleOpenDeleteDialog}
                      navigate={navigate}
                      artworkById={artworkById}
                      onSongsUpdated={handleUpdatePlaylistSongs}
                    />
                  ))}

                  {items.length > 6 && (
                    <Button
                      size="small"
                      onClick={() => navigate('/collection/playlist')}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        justifyContent: 'flex-start',
                        pl: 1,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                      endIcon={<ExpandMoreRoundedIcon fontSize="small" />}
                    >
                      View all {items.length} playlists
                    </Button>
                  )}
                </>
              ) : (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, px: 1 }}>
                  {emptyText}
                </Typography>
              )}
            </Stack>
          </SortableContext>
        </DndContext>
      </Box>
    );
  };

  // Loading states
  const isLoading = recentLoading || likedLoading || playlistsLoading;

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2.5,
          py: 3,
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Loading your library...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 'var(--guest-sidebar-width)',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
        position: 'sticky',
        top: { xs: 0, md: 96 },
        height: { xs: 'auto', md: 'calc(100vh - 96px)' },
        maxHeight: { xs: 'none', md: 'calc(100vh - 96px)' },
        alignSelf: 'flex-start',
        px: 2.5,
        py: 3,
        pb: 3,
        justifyContent: { xs: 'flex-start', md: 'space-between' },
        borderRadius: 3,
        background: `linear-gradient(160deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
        border: `1px solid ${alpha(primary, 0.18)}`,
        boxShadow: theme.shadows[8],
        backdropFilter: 'blur(18px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.4),
          borderRadius: 3,
        },
      }}
    >



  

      {/* Library Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          Your Library
        </Typography>

    <Box >
        <Button
          
        
          startIcon={<AddRounded />}
          onClick={handleOpenCreatePlaylist}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            color: 'black',
            py: .3,
            borderRadius: 2,
            background: `linear-gradient(90deg, 
              ${alpha(theme.palette.primary.main, 0.9)} 0%, 
              ${alpha(theme.palette.secondary.main, 0.9)} 100%
            )`,
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
          }}
        >
         Playlist
        </Button>
      </Box>


    

      </Box>






      {/* Recent Activity */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => setRecentOpen((prev) => !prev)}
        >
          <HistoryRounded sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
          <Typography
            sx={{
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
            }}
          >
            Recently Played • {recentSongs.length}
          </Typography>
          <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
            {recentOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={recentOpen} timeout="auto" unmountOnExit>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {recentSongs.length > 0 ? (
              recentSongs.map((song) => (
                <Box
                  key={song._id}
                  sx={{ ...itemSx, flexDirection: 'row', alignItems: 'center', gap: 1.2 }}
                  onClick={() => navigate(`/song/${song._id}`)}
                >
                  <Box
                    component="img"
                    src={
                      artworkById.get(String(song._id)) ||
                      song.artworkUrl ||
                      song.albumCoverImageUrl ||
                      song.artwork ||
                      song.album?.albumCoverImage ||
                      ''
                    }
                    alt={song.title}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      objectFit: 'cover',
                      backgroundColor: alpha(theme.palette.text.primary, 0.1),
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {song.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {song.artist?.artistAka || 'Unknown Artist'}
                  </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, px: 1 }}>
                No recent plays yet.
              </Typography>
            )}
          </Stack>
        </Collapse>
      </Box>

      {/* Liked Songs */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => setLikedOpen((prev) => !prev)}
        >
          <FavoriteRounded sx={{ color: theme.palette.error.main, fontSize: 16 }} />
          <Typography
            sx={{
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
            }}
          >
            Liked Songs • {likedSongs.length}
          </Typography>
          <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
            {likedOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={likedOpen} timeout="auto" unmountOnExit>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {likedSongs.length > 0 ? (
              likedSongs.map((song) => (
                <Box
                  key={song._id}
                  sx={{ ...itemSx, flexDirection: 'row', alignItems: 'center', gap: 1.2 }}
                  onClick={() => navigate(`/song/${song._id}`)}
                >
                  <Box
                    component="img"
                    src={
                      artworkById.get(String(song._id)) ||
                      song.artworkUrl ||
                      song.albumCoverImageUrl ||
                      song.artwork ||
                      song.album?.albumCoverImage ||
                      ''
                    }
                    alt={song.title}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      objectFit: 'cover',
                      backgroundColor: alpha(theme.palette.text.primary, 0.1),
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {song.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {song.artist?.artistAka || 'Unknown Artist'}
                  </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, px: 1 }}>
                No liked songs yet.
              </Typography>
            )}
          </Stack>
        </Collapse>
      </Box>

      {/* Playlists with Drag and Drop */}
      {renderMusicSection(
        'Your Playlists',
        playlists,
        <PlaylistPlayRounded sx={{ color: theme.palette.success.main, fontSize: 16 }} />,
        'No playlists yet.',
        'playlist'
      )}

      <Divider sx={{ my: 3, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Collections Section */}
      <Box sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          onClick={() => setCollectionsOpen(!collectionsOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 2,
            cursor: 'pointer',
            backgroundColor: collectionsOpen 
              ? alpha(theme.palette.primary.main, 0.08) 
              : alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${collectionsOpen ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: collectionsOpen ? theme.palette.primary.main : theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TrendingUpRounded fontSize="small" />
            Browse Collections
          </Typography>
          <IconButton size="small" sx={{ color: collectionsOpen ? theme.palette.primary.main : theme.palette.text.secondary }}>
            {collectionsOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        </Paper>

        <Collapse in={collectionsOpen} timeout="auto" unmountOnExit>
          <Stack spacing={1} sx={{ mt: 2, pl: 0.5 }}>
            {/* Playlists Submenu */}
            <Box sx={{ mb: 1 }}>
              <Paper
                elevation={0}
                onClick={() => setPlaylistsOpen(!playlistsOpen)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  pl: 2,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  backgroundColor: playlistsOpen 
                    ? alpha(theme.palette.primary.main, 0.05) 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: playlistsOpen ? theme.palette.primary.main : theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <PlaylistPlayRounded fontSize="small" />
                  Playlists
                </Typography>
                <IconButton size="small" sx={{ color: playlistsOpen ? theme.palette.primary.main : theme.palette.text.secondary }}>
                  {playlistsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                </IconButton>
              </Paper>
              
              <Collapse in={playlistsOpen} timeout="auto" unmountOnExit>
                <Stack spacing={0.5} sx={{ pl: 4, mt: 1 }}>
                  <Button
                    startIcon={<HistoryRounded fontSize="small" />}
                    onClick={() => navigate('/collection/playlist/recent_played')}
                    sx={{
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Recently Played
                  </Button>
                </Stack>
              </Collapse>
            </Box>

            {/* Other Collections */}
            {[
              { label: 'Liked Songs', icon: <FavoriteRounded fontSize="small" />, path: '/collection/liked_songs' },
              { label: 'Albums', icon: <AlbumRounded fontSize="small" />, path: '/collection/albums' },
              { label: 'Artists', icon: <PersonRounded fontSize="small" />, path: '/collection/artists' },
              { label: 'Stations', icon: <RadioRounded fontSize="small" />, path: '/collection/stations' },
              { label: 'Short Videos', icon: <VideoLibraryRounded fontSize="small" />, path: '/collection/short_videos' },
              { label: 'Downloads', icon: <DownloadRounded fontSize="small" />, path: '/collection/downloads' },
            ].map((item) => (
              <Button
                key={item.label}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  pl: 2,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Collapse>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete playlist</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: theme.palette.text.secondary }}>
            This will permanently delete
            {' '}
            <Typography component="span" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              {playlistToDelete?.title || 'this playlist'}
            </Typography>
            .
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDeleteDialog} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AddToPlaylistModal
        open={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
        track={null}
      />
    </Box>
  );
};

export default UserSideBar;
