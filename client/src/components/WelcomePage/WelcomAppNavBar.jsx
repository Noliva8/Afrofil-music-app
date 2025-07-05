import { useState } from 'react';
import {
  Box,
  IconButton,
  Drawer,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LockIcon from '@mui/icons-material/Lock';
import { SitemarkIcon } from '../themeCustomization/customIcon';





const WelcomeAppNavBar = ({handleSignupFormDisplay, handleLoginFormDisplay, handleArtistSignupFormDisplay }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:960px)');

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  const drawerToggle = isMobile && (
    <IconButton
      onClick={toggleDrawer(true)}
      sx={{ mr: 2, color: 'white' }}
      aria-label="Open menu"
    >
      <MenuIcon />
    </IconButton>
  );

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
        color: 'white',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 0,
      }}
    >
      {/* Logo in Drawer Header */}
      <Box
        sx={{
          height: { xs: 72, sm: 80, md: 96 },
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <SitemarkIcon sx={{ fontSize: 32, color: '#E4C421', mr: 1 }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'white',
            transition: 'all 0.3s ease',
          }}
        >
          AfroFeel
        </Typography>
      </Box>

      {/* Trending Section */}
      <Box sx={{ px: 3, pt: 3, pb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            background: 'linear-gradient(90deg, #E4C421, #B25035)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Trending Now
        </Typography>
        {['Afrobeat Essentials', 'Global Vibes', 'New Releases'].map((playlist) => (
          <ListItem
            button
            key={playlist}
            sx={{
              px: 0,
              '&:hover': { backgroundColor: 'rgba(228, 196, 33, 0.08)' },
              transition: 'background 0.2s',
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#E4C421' }}>
              <MusicNoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={playlist} primaryTypographyProps={{ fontSize: '0.95rem' }} />
            <LockIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.3)' }} />
          </ListItem>
        ))}
      </Box>

      {/* CTA Section */}
      <Box sx={{ p: 3, mt: 'auto' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
          Unlock full access to millions of songs
        </Typography>
        <Button
          fullWidth
          size="large"
          onClick={handleSignupFormDisplay}
          variant="contained"

          sx={{
            background: 'linear-gradient(90deg, #E4C421, #B25035)',
            color: '#000',
            fontWeight: 'bold',
            py: 1.5,
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(90deg, #F8D347, #C96146)',
            },
          }}
        >
          Sign Up Free
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(15, 15, 15, 0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          height: { xs: 72, sm: 80, md: 96 },
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {drawerToggle}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              '&:hover .logo-text': {
                background: 'linear-gradient(90deg, #E4C421, #B25035)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              },
            }}
          >
            <SitemarkIcon sx={{ fontSize: 32, color: '#E4C421', mr: 1 }} />
            <Typography
              variant="h5"
              className="logo-text"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: 'white',
                transition: 'all 0.3s ease',
              }}
            >
              AfroFeel
            </Typography>
          </Box>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 3 }, alignItems: 'center' }}>

            <Button
              size="large"
              onClick={handleArtistSignupFormDisplay}
              sx={{
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#fff',
                px: 3,
                py: 1.5,
                '&:hover': {
                  color: '#E4C421',
                },
              }}
            >
              Artist
            </Button>
            <Button
              size="large"
                onClick={handleLoginFormDisplay}
              sx={{
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#fff',
                px: 3,
                py: 1.5,
                '&:hover': {
                  color: '#E4C421',
                },
              }}
            >
              Login
            </Button>
            <Button
              size="large"
              variant="contained"
              onClick={handleSignupFormDisplay}
              sx={{
                background: 'linear-gradient(90deg, #E4C421, #B25035)',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1rem',
                px: 3,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(90deg, #F8D347, #C96146)',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ height: { xs: 72, sm: 80, md: 96 } }} />
    </>
  );
};

export default WelcomeAppNavBar;
