

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import { PlayArrow, Pause } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';




export default function(){



   const recommendedSongs = Array(10)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      title: `Recommended ${i + 1}`,
      artist: `Artist ${i + 1}`,
      reason: "Based on your listening history",
    }));

    return(
        
        
        <>
           {/* Recommended Songs */}
      <Typography variant="h4" sx={{ 
        mb: 3,
        fontWeight: '700',
        color: '#FFFFFF'
      }}>
        🎧 Recommended For You
      </Typography>
      
      <Grid2 container spacing={2} sx={{ mb: 6 }}>
        {recommendedSongs.map((song) => (
          <Grid2 key={song.id} size={{ xs: 12, sm: 6 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(228, 196, 33, 0.1)'
              }
            }}>
              <Avatar 
                src={`https://source.unsplash.com/random/100x100/?music,${song.id}`}
                sx={{ width: 56, height: 56, mr: 2 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                  {song.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {song.artist} • {song.reason}
                </Typography>
              </Box>
              <IconButton sx={{ color: '#E4C421' }}>
                <PlayArrow />
              </IconButton>
            </Box>
          </Grid2>
        ))}
      </Grid2>

        </>
    )
}