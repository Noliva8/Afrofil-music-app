import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Drawer,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  InputBase,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { SitemarkIcon } from '../themeCustomization/customIcon';





const WelcomeAppNavBar = ({
  handleSignupFormDisplay,
  handleLoginFormDisplay,
  handleArtistSignupFormDisplay,
  showSearch = false,
  sidebarOffset = 0,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== '/';
  const historyState = window.history.state;
  const hasHistoryIndex = typeof historyState?.idx === 'number';
  const historyIndex = hasHistoryIndex ? historyState.idx : 0;
  const [maxHistoryIndex, setMaxHistoryIndex] = useState(historyIndex);
  const historyLength = typeof window !== 'undefined' ? window.history.length : 0;
  const sidebarGap = sidebarOffset
    ? `calc(${sidebarOffset} * 0.08)`
    : theme.spacing(2);

  useEffect(() => {
    if (!hasHistoryIndex) return;
    setMaxHistoryIndex((prev) => (historyIndex > prev ? historyIndex : prev));
  }, [hasHistoryIndex, historyIndex]);

  const canGoBack = showBack && (historyIndex > 0 || historyLength > 1);
  const canGoForward = showBack && hasHistoryIndex && historyIndex < maxHistoryIndex;
  const handleBack = () => {
    if (!canGoBack) return;
    navigate(-1);
  };
  const handleForward = () => {
    if (!canGoForward) return;
    navigate(1);
  };

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
        <SitemarkIcon sx={{ color: theme.palette.primary.main, width: 20, height: 20 }} />
                <SitemarkIcon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                    mr: 1,
                    width: 32,
                    height: 32,
                  }}
                />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
            transition: 'all 0.3s ease',
            fontSize: '0.95rem',
            lineHeight: 1.1,
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
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backdropFilter: 'blur(12px)',
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          borderBottom: 'none',
          height: { xs: 72, sm: 80, md: 80 },
          minHeight: { xs: 72, sm: 80, md: 80 },
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          position: 'fixed',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, md: sidebarGap },
            flexWrap: 'nowrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, md: 2 },
              minWidth: 0,
              width: { xs: 'auto', md: sidebarOffset ? sidebarOffset : 'auto' },
              minWidth: { md: sidebarOffset ? sidebarOffset : 'auto' },
              maxWidth: { md: sidebarOffset ? sidebarOffset : 'auto' },
              justifyContent: { xs: 'flex-start', md: 'space-between' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
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
                <SitemarkIcon sx={{ color: theme.palette.primary.main, width: 40, height: 40 }} />
                <Typography
                  variant="h6"
                  className="logo-text"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    color: theme.palette.text.primary,
                    transition: 'all 0.3s ease',
                    fontFamily: theme.typography.fontFamily,
                    fontSize: '1.2rem',
                    lineHeight: 1.2,
                    display: { xs: 'none', md: 'block', lg: 'block' },
                    '@media (max-width:990px)': {
                      display: 'none',
                    },
                  }}
                >
                  AfroFeel
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                onClick={handleBack}
                aria-disabled={!canGoBack}
                sx={{
                  color: theme.palette.text.primary,
                  opacity: canGoBack ? 1 : 0.4,
                  cursor: canGoBack ? 'pointer' : 'default',
                }}
                aria-label="Go back"
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleForward}
                aria-disabled={!canGoForward}
                sx={{
                  color: theme.palette.text.primary,
                  opacity: canGoForward ? 1 : 0.4,
                  cursor: canGoForward ? 'pointer' : 'default',
                }}
                aria-label="Go forward"
              >
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              minWidth: 0,
              flex: 1,
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
            }}
          >
            {showSearch && !isMobile && (
              <Box
                onClick={() => navigate('/search')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.16)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.6),
                  minWidth: 220,
                  maxWidth: 520,
                  width: '100%',
                  flex: '1 1 320px',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <SearchRoundedIcon sx={{ color: alpha(theme.palette.text.primary, 0.7) }} />
                <InputBase
                  placeholder="Search artists, albums, songs"
                  readOnly
                  sx={{
                    flex: 1,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                  }}
                />
              </Box>
            )}

            {isMobile && showSearch && (
              <IconButton
                onClick={() => navigate('/search')}
                sx={{ color: theme.palette.text.primary }}
                aria-label="Search"
              >
                <SearchRoundedIcon />
              </IconButton>
            )}

            <Button
              size="small"
              onClick={handleArtistSignupFormDisplay}
              sx={{
                display: { xs: 'none', sm: 'none', md: 'inline-flex' },
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' },
                fontWeight: 600,
                color: theme.palette.text.primary,
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: { xs: 0.6, sm: 0.8, md: 1.1 },
                minWidth: 0,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              Artist
            </Button>
            <Button
              size="small"
              onClick={handleLoginFormDisplay}
              sx={{
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' },
                fontWeight: 600,
                color: theme.palette.text.primary,
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: { xs: 0.6, sm: 0.8, md: 1.1 },
                minWidth: 0,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              Login
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSignupFormDisplay}
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                fontWeight: 'bold',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' },
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: { xs: 0.6, sm: 0.8, md: 1.1 },
                minWidth: 0,
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
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

      <Box sx={{ height: { xs: 72, sm: 80, md: 80 } }} />
    </>
  );
};

export default WelcomeAppNavBar;
