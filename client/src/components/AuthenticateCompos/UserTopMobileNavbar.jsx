import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import UserAuth from '../../utils/auth.js';

export default function UserTopMobileNavbar({ title = 'Home' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');
  const navigate = useNavigate();
  const profile = useMemo(() => UserAuth.getProfile?.() || {}, []);
  const isPremium = (profile?.data?.role || '').toLowerCase() === 'premium';

  if (!isMobile) return null;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.default, 0.92),
        backgroundImage: 'none',
        backdropFilter: 'blur(14px)',
        borderBottom: 'none'
      }}
    >
      <Toolbar sx={{ px: 2, py: 1 }}>
        <IconButton edge="start" color="inherit" aria-label="home" onClick={() => navigate('/')}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, px: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            {title}
          </Typography>
        </Box>

        {!isPremium && (
          <Button
            size="small"
            onClick={() => navigate('/checkout')}
            startIcon={<PlayArrowRoundedIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 1.8,
              py: 0.6,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #E4C421, #B25035)',
              color: '#0f0f0f',
              boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
              '&:hover': { background: 'linear-gradient(90deg, #F8D347, #C96146)' }
            }}
          >
            Upgrade
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
