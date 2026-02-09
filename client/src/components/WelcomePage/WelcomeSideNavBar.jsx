import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserAuth from '../../utils/auth.js';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';

export const WelcomeSideNavbar = ({
  handleLoginFormDisplay,
  handleSignupFormDisplay,
  handleArtistSignupFormDisplay,
  onNavigate,
}) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMusicActive = location.pathname === '/loginSignin' || location.pathname === '/';
  const isExploreActive = location.pathname === '/explore';
  const isFeedActive = location.pathname === '/feed';

  const handleProtectedNav = (label, path) => {
    if (!UserAuth.loggedIn()) {
      toast.info(`Please log in to access ${label}.`);
      handleLoginFormDisplay?.();
      return;
    }
    onNavigate?.();
    navigate(path);
  };
  const dividerSx = { borderColor: alpha(theme.palette.text.primary, 0.08), mx: -2.5 };

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/loginSignin', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Box
      sx={{
        width: 'var(--guest-sidebar-width)',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
        position: 'sticky',
        top: { xs: 0, md: 96 },
        minHeight: { xs: 'auto', md: 'calc(100vh - 96px)' },
        maxHeight: { xs: 'none', md: 'calc(100vh - 96px)' },
        alignSelf: 'flex-start',
        px: 2.5,
        py: 3,
        pb: 3,
        justifyContent: { xs: 'flex-start', md: 'space-between' },
        borderRadius: 3,
        background: `linear-gradient(160deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
        border: `1px solid ${alpha(primary, 0.18)}`,
        boxShadow: theme.shadows[8],
        backdropFilter: 'blur(18px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >




      
      <Stack spacing={2}>
        <Divider sx={dividerSx} />

        <Stack spacing={2}>
          {[
            { label: 'Music', icon: '🎵', onClick: () => navigate('/loginSignin') },
            { label: 'Explore', icon: '🌍', onClick: () => navigate('/explore') },
            { label: 'Feed', icon: '📰', onClick: () => navigate('/feed') },
          ].map((item) => (
            <Box
              key={item.label}
              onClick={() => {
                onNavigate?.();
                item.onClick?.();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                cursor: item.onClick ? 'pointer' : 'default',
                color:
                  (item.label === 'Music' && isMusicActive) ||
                  (item.label === 'Explore' && isExploreActive) ||
                  (item.label === 'Feed' && isFeedActive)
                    ? 'primary.main'
                    : 'text.primary',
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                backgroundColor:
                  (item.label === 'Music' && isMusicActive) ||
                  (item.label === 'Explore' && isExploreActive) ||
                  (item.label === 'Feed' && isFeedActive)
                    ? alpha(theme.palette.text.primary, 0.08)
                    : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.text.primary, 0.08),
                },
              }}
            >
              <Box component="span" sx={{ fontSize: '1.15rem' }}>{item.icon}</Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color:
                    (item.label === 'Music' && isMusicActive) ||
                    (item.label === 'Explore' && isExploreActive) ||
                    (item.label === 'Feed' && isFeedActive)
                      ? 'primary.main'
                      : 'text.primary',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Divider sx={dividerSx} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setCollectionsOpen((prev) => !prev)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box component="span" sx={{ fontSize: '1.15rem' }}>📚</Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: '1.3rem',
                color: collectionsOpen ? 'primary.main' : 'text.primary',
              }}
            >
              Collections
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: collectionsOpen ? 'primary.main' : 'text.secondary' }} aria-label="Toggle collections">
            <Box component="span" sx={{ fontSize: '0.9rem', transform: collectionsOpen ? 'rotate(180deg)' : 'none' }}>
              ▼
            </Box>
          </IconButton>
        </Box>

        <Collapse in={collectionsOpen} timeout="auto" unmountOnExit>
          <Stack spacing={0.9}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pl: 2,
                cursor: 'pointer',
              }}
              onClick={() => setPlaylistsOpen((prev) => !prev)}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  '&:hover': { color: 'primary.main' },
                }}
              >
                • Playlists
              </Typography>
              <Box
                component="span"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  transform: playlistsOpen ? 'rotate(180deg)' : 'none',
                }}
              >
                ▼
              </Box>
            </Box>
            <Collapse in={playlistsOpen} timeout="auto" unmountOnExit>
              <Stack spacing={0.6} sx={{ pl: 3.5 }}>
                {[
                  { label: 'Create Playlist', path: '/collection/playlist/create_playlist' },
                  { label: 'Recently Played', path: '/collection/playlist/recent_played' },
                ].map((item) => (
                  <Typography
                    key={item.label}
                    variant="body2"
                    onClick={() => {
                      handleProtectedNav(item.label, item.path);
                    }}
                    sx={{
                      color: 'text.primary',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    • {item.label}
                  </Typography>
                ))}
              </Stack>
            </Collapse>

            {[
              { label: 'Liked Songs', path: '/collection/liked_songs' },
              { label: 'Albums', path: '/collection/albums' },
              { label: 'Artists', path: '/collection/artists' },
              { label: 'Stations', path: '/collection/stations' },
              { label: 'Short Videos', path: '/collection/short_videos' },
              { label: 'Downloads', path: '/collection/downloads' },
            ].map((item) => (
              <Typography
                key={item.label}
                variant="body2"
                onClick={() => {
                  handleProtectedNav(item.label, item.path);
                }}
                sx={{
                  color: 'text.primary',
                  pl: 2,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                • {item.label}
              </Typography>
            ))}
          </Stack>
        </Collapse>

        <Divider sx={dividerSx} />

        <Stack spacing={2} />
      </Stack>



      <Box sx={{ px: 0 }}>
        <Divider sx={{ ...dividerSx, mb: 1 }} />
        <Button
          variant="text"
          onClick={() => {
            onNavigate?.();
            handleLoginFormDisplay?.();
          }}
          startIcon={<Box component="span" sx={{ fontSize: '1rem' }}>⚙️</Box>}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            justifyContent: 'flex-start',
            color: 'text.secondary',
            '&:hover': { color: 'primary.main', backgroundColor: alpha(theme.palette.text.primary, 0.06) },
          }}
        >
          Settings
        </Button>
      </Box>

      
    </Box>
  );
};
