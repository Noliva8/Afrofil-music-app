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
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LockIcon from '@mui/icons-material/Lock';
import { SitemarkIcon } from '../themeCustomization/customIcon';





const WelcomeAppNavBar = ({handleSignupFormDisplay, handleLoginFormDisplay, handleArtistSignupFormDisplay }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:960px)');
  const theme = useTheme();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  const drawerToggle = isMobile && (
    <IconButton
      onClick={toggleDrawer(true)}
      sx={{ mr: 2, color: theme.palette.text.primary }}
      aria-label="Open menu"
    >
      <MenuIcon />
    </IconButton>
  );

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        color: theme.palette.text.primary,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 0,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* Logo in Drawer Header */}
      <Box
        sx={{
          height: { xs: 72, sm: 80, md: 96 },
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
        }}
      >
        <SitemarkIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 1 }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
            transition: 'all 0.3s ease',
          }}
        >
          AfroFeel
        </Typography>
      </Box>

      {/* Trending Section */}
      <Box sx={{ px: 3, pt: 3, pb: 3, borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}` }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
            transition: 'background 0.2s',
          }}
        >
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
              <MusicNoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={playlist} primaryTypographyProps={{ fontSize: '0.95rem' }} />
            <LockIcon fontSize="small" sx={{ color: alpha(theme.palette.text.primary, 0.3) }} />
          </ListItem>
        ))}
      </Box>

      {/* CTA Section */}
      <Box sx={{ p: 3, mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Unlock full access to millions of songs
        </Typography>
        <Button
          fullWidth
          size="large"
          onClick={handleSignupFormDisplay}
          variant="contained"
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
            py: 1.5,
            fontSize: '1rem',
            fontFamily: theme.typography.fontFamily,
            '&:hover': {
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
            },
          }}
        >
          Sign Up Free
        </Button>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={handleLoginFormDisplay}
          sx={{
            borderColor: alpha(theme.palette.text.primary, 0.2),
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontFamily: theme.typography.fontFamily,
            textTransform: 'none',
          }}
        >
          Login
        </Button>
        <Button
          fullWidth
          size="large"
          variant="text"
          onClick={handleArtistSignupFormDisplay}
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            textTransform: 'none',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Artist
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
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
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
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              },
            }}
          >
            <SitemarkIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 1 }} />
            <Typography
              variant="h5"
              className="logo-text"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: theme.palette.text.primary,
                transition: 'all 0.3s ease',
                fontFamily: theme.typography.fontFamily,
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
                color: theme.palette.text.primary,
                px: 3,
                py: 1.5,
                '&:hover': {
                  color: theme.palette.primary.main,
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
                color: theme.palette.text.primary,
                px: 3,
                py: 1.5,
                '&:hover': {
                  color: theme.palette.primary.main,
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
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                fontWeight: 'bold',
                fontSize: '1rem',
                px: 3,
                py: 1.5,
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
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
