import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  Link
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Shuffle,
  PlaylistAdd,
  Share,
  Close,
  Search,
  MoreVert,
  Favorite,
  Add
} from '@mui/icons-material';
import Footer from '../pages/Footer';

const ArtistSongPage = ({
  artist,
  initialSong,
  onClose,
 
}) => {
  const songs = artist.topSongs || [];
  const [selectedSong, setSelectedSong] = useState(initialSong || songs[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  

  const waveHeights = useMemo(
    () => Array.from({ length: 40 }, () => Math.random() * 60 + 10),
    []
  );

  return (
    <div className="app-container" style={{
      background: `radial-gradient(circle at 20% 30%, rgba(228, 196, 33, 0.03) 0%, transparent 25%), linear-gradient(to bottom, #0F0F0F, #1A1A1A)`
    }}>
      <Box sx={{
        height: '100vh',
        overflowY: 'auto',
        pt: '5rem',
        backgroundColor: 'rgba(0,0,0,0.96)',
        backdropFilter: 'blur(8px)',
        color: 'white'
      }}>
        {/* 🎤 Hero Section */}
        <Box sx={{
          position: 'relative',
          height: { xs: '240px', md: '280px' },
          p: { xs: 3, md: 4 },
          backgroundColor: 'rgba(15,15,15,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            paddingX: '10%',
            zIndex: 1
          }}>
            {waveHeights.map((height, i) => (
              <Box key={i} sx={{
                flex: 1,
                height: `${height}%`,
                backgroundColor: nowPlaying?.isPlaying ? '#E4C421' : 'rgba(228,196,33,0.3)',
                opacity: nowPlaying?.isPlaying ? 0.8 : 0.4,
                transition: 'all 0.3s ease',
                borderRadius: '2px 2px 0 0'
              }} />
            ))}
          </Box>

          <Box sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            gap: { xs: 2, md: 3 },
            width: '100%',
            alignItems: 'flex-end'
          }}>
            <Box sx={{
              width: { xs: 120, md: 160 },
              height: { xs: 120, md: 160 },
              flexShrink: 0,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                borderRadius: '50%',
                border: '2px solid rgba(228,196,33,0.3)',
                animation: nowPlaying?.isPlaying ? 'spin 20s linear infinite' : 'none',
                zIndex: -1
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}>
              <Avatar
                src={artist.image}
                alt={artist.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '3px solid #E4C421',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  transform: nowPlaying?.isPlaying ? 'scale(1.02)' : 'scale(1)',
                  transition: 'transform 0.3s ease'
                }}
              />
            </Box>

            <Box sx={{ flex: 1, color: 'white', pb: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <Typography variant="overline" sx={{ display: 'block', color: '#E4C421', fontWeight: 600, letterSpacing: 1, mb: 0.5 }}>
                {nowPlaying?.isPlaying ? 'NOW PLAYING' : 'FEATURED ARTIST'}
              </Typography>

              <Typography variant="h4" sx={{
                fontWeight: 800,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
                lineHeight: 1.2,
                mb: 1,
                background: 'linear-gradient(to right, #E4C421, #FFFFFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                {artist.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                {artist.genre && (
                  <Chip label={artist.genre} size="small" sx={{
                    backgroundColor: 'rgba(228,196,33,0.15)',
                    color: '#E4C421',
                    fontWeight: 500
                  }} />
                )}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {artist.topSongs?.length || 0} tracks
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

     <IconButton
  onClick={() => {
    const currentSong = artist.topSongs?.[0];
    if (!currentSong) return;

    if (nowPlaying?.isPlaying && nowPlaying?.songId === currentSong._id) {
      // 👇 correctly trigger parent to pause
      onPlayPause(false);
    } else {
      // 👇 trigger parent to play
      onSongPlay(currentSong);
    }
  }}
  sx={{
    backgroundColor: '#E4C421',
    color: 'black',
    width: 48,
    height: 48,
    '&:hover': {
      backgroundColor: '#F8D347',
      transform: 'scale(1.1)'
    },
    transition: 'all 0.2s ease'
  }}
>
  {nowPlaying?.isPlaying && nowPlaying?.songId === artist.topSongs?.[0]?._id ? (
    <Pause />
  ) : (
    <PlayArrow />
  )}
</IconButton>




                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  {nowPlaying?.isPlaying ? nowPlaying.songTitle : artist.topSongs?.[0]?.title}
                </Typography>
              </Box>
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: '#E4C421',
              '&:hover': { backgroundColor: 'rgba(228,196,33,0.2)' },
              zIndex: 3
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* 🔍 Search & Song List */}
        <Box sx={{ p: { xs: 3, md: 6 }, maxWidth: 1200, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Search in artist songs..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 4
          }}>
            {filteredSongs.map((song, index) => (
              <Box key={song._id} sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}>
                <Typography sx={{ width: 40, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>{index + 1}</Typography>

              <IconButton
  onClick={() => {
    if (isPlayingSong(song._id)) {
      onPlayPause(false);
    } else {
      setSelectedSong(song);
      onSongPlay(song);
    }
  }}
  sx={{ color: '#E4C421', mx: 1 }}
>
  {isPlayingSong(song._id) ? <Pause /> : <PlayArrow />}
</IconButton>

                
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Typography
                    sx={{ fontWeight: 600, color: 'white', cursor: 'pointer' }}
                    onClick={() => { setSelectedSong(song); onSongPlay(song); }}
                  >
                    {song.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Link component="button" variant="body2" onClick={() => onNavigateToArtist(song.artist)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {song.artistName}
                    </Link>
                    {song.album && (
                      <>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>•</Typography>
                        <Link component="button" variant="body2" onClick={() => onNavigateToAlbum(song.album)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {song.album}
                        </Link>
                      </>
                    )}
                  </Box>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', width: 80, textAlign: 'right' }}>{song.duration}</Typography>
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}><Favorite fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}><PlaylistAdd fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}><MoreVert fontSize="small" /></IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Footer />
      </Box>
    </div>
  );
};

export default ArtistSongPage;
