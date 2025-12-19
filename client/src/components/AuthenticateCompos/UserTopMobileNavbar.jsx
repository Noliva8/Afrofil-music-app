import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alpha,
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
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
        bgcolor: 'rgba(8,8,8,0.92)',
        backgroundImage: 'linear-gradient(180deg, rgba(228,196,33,0.08) 0%, rgba(8,8,8,0.92) 30%)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`
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
