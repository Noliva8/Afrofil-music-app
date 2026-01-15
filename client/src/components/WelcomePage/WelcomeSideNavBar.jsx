import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  alpha,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { SitemarkIcon } from '../themeCustomization/customIcon';

export const WelcomeSideNavbar = ({
  handleLoginFormDisplay,
  handleSignupFormDisplay,
}) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary?.main || theme.palette.primary.dark;
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMusicActive = location.pathname === '/loginSignin' || location.pathname === '/';
  const isExploreActive = location.pathname === '/explore';

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
        alignSelf: 'flex-start',
        px: 2.5,
        py: 3,
        borderRadius: 3,
        background: `linear-gradient(160deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
        border: `1px solid ${alpha(primary, 0.18)}`,
        boxShadow: theme.shadows[8],
        backdropFilter: 'blur(18px)',
        overflow: 'hidden'
      }}
    >
      <Stack spacing={2}>
        <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08) }} />

        <Stack spacing={2}>
          {[
            { label: 'Music', icon: '🎵', onClick: () => navigate('/loginSignin') },
            { label: 'Explore', icon: '🌍', onClick: () => navigate('/explore') },
            { label: 'Feed', icon: '📰' },
          ].map((item) => (
            <Box
              key={item.label}
              onClick={item.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                cursor: item.onClick ? 'pointer' : 'default',
                color:
                  (item.label === 'Music' && isMusicActive) ||
                  (item.label === 'Explore' && isExploreActive)
                    ? 'primary.main'
                    : 'text.primary',
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                backgroundColor:
                  (item.label === 'Music' && isMusicActive) ||
                  (item.label === 'Explore' && isExploreActive)
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
                    (item.label === 'Explore' && isExploreActive)
                      ? 'primary.main'
                      : 'text.primary',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08) }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setCollectionsOpen((prev) => !prev)}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.8, color: 'text.secondary' }}>
            COLLECTIONS
          </Typography>
          <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Toggle collections">
            <Box component="span" sx={{ fontSize: '0.9rem', transform: collectionsOpen ? 'rotate(180deg)' : 'none' }}>
              ▼
            </Box>
          </IconButton>
        </Box>
        <Collapse in={collectionsOpen} timeout="auto" unmountOnExit>
          <Stack spacing={0.9}>
            {[
              'Playlists',
              'Albums',
              'Artists',
              'Stations',
              'Short Videos',
              'Downloads',
            ].map((label) => (
              <Typography key={label} variant="body2" sx={{ color: 'text.primary', pl: 2 }}>
                • {label}
              </Typography>
            ))}
          </Stack>
        </Collapse>

        <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08) }} />

        <Stack spacing={2}>
          {[
            { label: 'Liked Songs', icon: '❤️' },
            { label: 'Recently Played', icon: '⏪' },
            { label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.text.primary, 0.08),
                },
              }}
            >
              <Box component="span" sx={{ fontSize: '1.15rem' }}>{item.icon}</Box>
              <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 'auto' }}>
        <Button
          variant="outlined"
          onClick={handleSignupFormDisplay}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderColor: alpha(theme.palette.text.primary, 0.2),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
            },
          }}
        >
          + Create Playlist
        </Button>
      </Stack>
    </Box>
  );
};
