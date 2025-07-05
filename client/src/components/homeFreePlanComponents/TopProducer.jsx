import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import { PlayArrow, Pause } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import { Button,  Avatar } from "@mui/material";


export default function(){

 const topProducers = Array(10)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      name: `Producer ${i + 1}`,
      hits: Math.floor(Math.random() * 50),
      avatar: `https://source.unsplash.com/random/200x200/?producer,studio,${i}`,
    }));

    return(
        <>

        <Grid2 xs={12} md={4}>
          <Typography variant="h5" sx={{ 
            mb: 3,
            fontWeight: '600',
            color: '#B25035'
          }}>
            🎛️ Top Producers
          </Typography>
          
          {topProducers.map((producer) => (
            <Box key={producer.id} sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1.5,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <Avatar 
                src={producer.avatar}
                sx={{ width: 60, height: 60, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                  {producer.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {producer.hits} chart hits
                </Typography>
              </Box>
            </Box>
          ))}
        </Grid2>
        </>
    )
}