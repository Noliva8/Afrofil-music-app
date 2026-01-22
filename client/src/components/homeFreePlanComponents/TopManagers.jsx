import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import { PlayArrow, Pause } from "@mui/icons-material";
import Grid2 from "@mui/material/Grid2";
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';


export default function() {
  const topManagers = Array(10).fill().map((_, i) => ({
    id: i+1,
    name: `Manager ${i+1}`,
    clients: Math.floor(Math.random() * 20),
    avatar: `https://source.unsplash.com/random/200x200/?manager,suit,${i}`
  }));

    return(
        <>
          {/* Top Managers */}
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" sx={{ 
            mb: 3,
            fontWeight: '600',
            color: '#E4C421'
          }}>
            💼 Top Managers
          </Typography>
          
          {topManagers.map((manager) => (
            <Box key={manager.id} sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 1.5,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <Avatar 
                src={manager.avatar}
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mr: 2,
                  border: '2px solid #B25035'
                }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                  {manager.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {manager.clients} clients
                </Typography>
              </Box>
            </Box>
          ))}
        </Grid2>
        
        
        </>
    )
}