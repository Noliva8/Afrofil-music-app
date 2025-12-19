import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import {  Star } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import { Button,  Avatar } from "@mui/material";


export default function(){

      const topArtists = Array(10)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      name: `Artist ${i + 1}`,
      followers: Math.floor(Math.random() * 1000000),
      avatar: `https://source.unsplash.com/random/200x200/?portrait,artist,${i}`,
    }));


    <>
     <Grid2 size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" sx={{ 
            mb: 3,
            fontWeight: '600',
            color: '#E4C421'
          }}>
            🎤 Top Artists
          </Typography>
          
          {topArtists.map((artist) => (
            <Box key={artist.id} sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1.5,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <Avatar 
                src={artist.avatar}
                sx={{ width: 60, height: 60, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                  {artist.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {artist.followers.toLocaleString()} followers
                </Typography>
              </Box>
              <IconButton sx={{ ml: 'auto', color: '#E4C421' }}>
                <Star />
              </IconButton>
            </Box>
          ))}
        </Grid2>
    </>
}