import React from 'react';
import { useAudioPlayer } from '../../utils/Contexts/AudioPlayerContext';
import { Box, Typography, Card, CardContent, IconButton, Button } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import Grid2 from '@mui/material/Grid2';

export default function TrendingSongs({ songsWithArtwork }) {
  const { currentTrack, isPlaying,playerState, load, play, handlePlaySong, pause } = useAudioPlayer();

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const processSongs = (songs) => {
    return songs?.map((song) => {
      const hasAudio = !!song.audioUrl;
      return {
        id: song._id,
        title: song.title,
        artistName: song.artist?.artistAka || "Unknown Artist",
        plays: song.playCount || 0,
        likesCount: song.likedByUsers?.length || 0,
        durationSeconds: song.duration || 0,
        duration: formatDuration(song.duration || 0),
        cover: song.artworkUrl || song.artwork || "https://placehold.co/300x300?text=No+Cover",
        audioUrl: hasAudio ? song.audioUrl : null,
        fullOriginal: song,
      };
    }) || [];
  };

  const trendingSongs = processSongs(songsWithArtwork)
    .filter((song) => song.audioUrl) // only show songs with playable audio
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 20);


const handleTrendingSongPlay = async (song) => {
  const songData = {
    id: song.id,
    title: song.title,
    artist: song.artistName,
    teaserUrl: song.audioUrl,
    fullUrl: song.audioUrl,
    artworkUrl: song.cover,
    duration: song.durationSeconds
  };

  const queue = trendingSongs
    .filter(s => s.id !== song.id)
    .map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artistName,
      teaserUrl: s.audioUrl,
      fullUrl: s.audioUrl,
      artworkUrl: s.cover,
      duration: s.durationSeconds
    }));

  const loaded = await handlePlaySong(songData, queue); // ✅ FROM CONTEXT
  if (!loaded) {
    console.error('Failed to load and play song.');
  }
};




  return (
    <>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 800,
          textAlign: "center",
          fontSize: { xs: "1.8rem", md: "2.5rem" },
          background: "linear-gradient(90deg, #E4C421, #B25035)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        🔥 Trending Now
      </Typography>

      <Grid2 container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 6, px: { xs: 1, sm: 2, md: 3 } }}>

        {trendingSongs.map((song) => {
          const isCurrent = currentTrack?.id === song.id;
          const isPlayingThisSong = isCurrent && isPlaying;

          return (
            <Grid2 
  key={song.id} 
  xs={6} sm={4} md={3} lg={2.4} 
  sx={{ 
    display: 'flex',
    justifyContent: 'center',
    minHeight: 380 // Ensure consistent height
  }}
>

              <Card
                sx={{
                  width: "100%",
                  height: "100%",
                   maxWidth: 300,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  transition: "transform 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 24px rgba(228, 196, 33, 0.3)",
                  },
                }}
              >
                <Box sx={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
                  <Box
                    component="img"
                    src={song.cover}
                    alt={song.title}
                    sx={{
                       position: 'relative',
      width: '100%',
      aspectRatio: '1/1',
      overflow: 'hidden',
      flexShrink: 0 
                    }}
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x300?text=No+Cover&font=roboto";
                    }}
                  />

                  {isPlayingThisSong && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 12,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "#E4C421",
                        fontWeight: 600,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: "0.7rem",
                      }}
                    >
                      Now Playing
                    </Typography>
                  )}

            <IconButton
  onClick={(e) => {
    e.stopPropagation();

    const isSameSong = currentTrack?.id === song.id;

    if (isSameSong) {
      // If already playing, pause; otherwise play
      isPlaying ? pause() : play(currentTrack);
    } else {
      // If it's a different song, load + play it
      handleTrendingSongPlay(song);
    }
  }}
  sx={{
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#E4C421',
    '&:hover': { backgroundColor: '#F8D347' },
    opacity: 0.9,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 1 }
  }}
>
  {isPlayingThisSong ? (
    <Pause sx={{ color: '#000' }} />
  ) : (
    <PlayArrow sx={{ color: '#000' }} />
  )}
</IconButton>


                </Box>

                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: "white",
                      mb: 0.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
                    }}
                  >
                    {song.artistName}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" sx={{ color: "#E4C421" }}>
                      {song.plays.toLocaleString()} plays
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                      {song.duration}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
          );
        })}
      </Grid2>
    </>
  );
}
