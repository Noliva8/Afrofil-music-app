import React from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
} from '@mui/material';
import { Pause, PlayArrow } from '@mui/icons-material';
import { LikesComponent } from './like';
import UserAuth from '../../utils/auth.js'


export function SongCard({ song, isPlayingThisSong, onPlayPause }) {
  const profile = UserAuth.getProfile?.();
  const userId = profile?.data?._id || null;
//   console.log('check recieved song:', song)

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Card
        sx={{
          width: { xs: 160, sm: 180, md: 200, lg: 220 },
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          borderRadius: 3,
          overflow: "visible",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          display: "flex",
          flexDirection: "column",
          cursor: 'pointer',
          position: 'relative',
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
          },
        }}
      >
        {/* Image */}
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            onClick={onPlayPause}
            width="100%"
            height={{ xs: 160, sm: 180, md: 200, lg: 220 }}
            src={song.cover || "https://placehold.co/300x300?text=No+Cover"}
            alt={song.title}
            sx={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            onError={(e) => {
              e.target.src = "https://placehold.co/300x300?text=No+Cover";
            }}
          />

          {/* Now Playing Label */}
          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 6,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "#E4C421",
                fontWeight: 600,
                px: 0.75,
                py: 0.2,
                borderRadius: 1,
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
              }}
            >
              Now Playing
            </Typography>
          )}

          {/* Play/Pause Button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              backgroundColor: "#E4C421",
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              "&:hover": { backgroundColor: "#F8D347" },
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: "#000", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            ) : (
              <PlayArrow sx={{ color: "#000", fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            )}
          </IconButton>
        </Box>

        {/* Song Info */}
        <Box sx={{ p: { xs: 1, sm: 1.25 } }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: "white",
              mb: 0.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            {song.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.6)",
              mb: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            {song.artistName}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: "#E4C421", fontSize: '0.65rem' }}>
              {song.plays?.toLocaleString?.() || 0} plays
            </Typography>

            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: '0.65rem' }}>
              {song.duration || '0:00'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Likes Floating Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -8,
          right: -8,
          zIndex: 30,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: '50%',
          p: 0.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LikesComponent song={song} currentUserId={userId} />
      </Box>
    </Box>
  );
}


export function CompactSongCard({
  song,
  isPlayingThisSong = false,
  onPlayPause = () => {},
  currentUserId,
}) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Card Container */}
      <Card
        onClick={onPlayPause}
        sx={{
          width: { xs: 140, sm: 150, md: 160, lg: 170 },
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          borderRadius: 2,
          overflow: 'visible',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(228, 196, 33, 0.3)',
          },
        }}
      >
        {/* Image */}
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            width="100%"
            height={{ xs: 140, sm: 150, md: 160, lg: 170 }}
            src={song.cover || 'https://placehold.co/300x300?text=No+Cover'}
            alt={song.title}
            sx={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x300?text=No+Cover';
            }}
          />

          {/* Now Playing Tag */}
          {isPlayingThisSong && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: 4,
                left: 6,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#E4C421',
                fontWeight: 600,
                px: 0.5,
                py: 0.1,
                borderRadius: 0.75,
                fontSize: '0.6rem',
              }}
            >
              Now Playing
            </Typography>
          )}

          {/* Play / Pause Button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              backgroundColor: '#E4C421',
              width: { xs: 24, sm: 26 },
              height: { xs: 24, sm: 26 },
              '&:hover': { backgroundColor: '#F8D347' },
            }}
          >
            {isPlayingThisSong ? (
              <Pause sx={{ color: '#000', fontSize: '0.875rem' }} />
            ) : (
              <PlayArrow sx={{ color: '#000', fontSize: '0.875rem' }} />
            )}
          </IconButton>
        </Box>

        {/* Song Info */}
        <Box sx={{ p: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
            }}
          >
            {song.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
          >
            {song.artistName}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#E4C421', fontSize: '0.65rem' }}>
              {song.plays?.toLocaleString?.() || 0} plays
            </Typography>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
              {song.duration || '0:00'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Floating Like Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -6,
          right: -6,
          zIndex: 30,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: '50%',
          p: 0.25,
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LikesComponent song={song} currentUserId={currentUserId} />
      </Box>
    </Box>
  );
}
