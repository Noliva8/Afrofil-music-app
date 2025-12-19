import {
  Dialog,
  Box,
  Button,
  Typography,
  IconButton
} from "@mui/material";
import { Close } from '@mui/icons-material';

export default function AuthModal({ open, onClose, currentSong, onSwitchToLogin, onSwitchToSignup, theme }) {
  const palette = theme?.palette;

  const DEFAULT_COVER = 'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#0f0f0f" offset="0"/><stop stop-color="#1a1a1a" offset="1"/>
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#e4c421" font-size="20" font-family="Arial">AfroFeel</text>
      </svg>`
    );

  const rawCover = currentSong?.artworkUrl || currentSong?.cover || '';
  const cover =
    rawCover &&
    !/placehold\.co/i.test(rawCover) &&
    (/^data:/.test(rawCover) || /^https?:\/\//i.test(rawCover))
      ? rawCover
      : DEFAULT_COVER;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${palette ? palette.primary.main + '33' : 'rgba(228,196,33,0.2)'}`,
          maxWidth: '400px',
          width: '90vw',
          mx: 'auto',
          overflow: 'hidden',
          maxHeight: '80vh'
        }
      }}
    >
      <IconButton 
        onClick={onClose} 
        sx={{ 
          position: 'absolute', 
          top: 12, 
          right: 12,
          color: 'rgba(255,255,255,0.7)',
          zIndex: 1
        }}
      >
        <Close />
      </IconButton>

      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 4,
        textAlign: 'center'
      }}>
        <Box sx={{
          width: { xs: '180px', sm: '220px' },
          height: { xs: '180px', sm: '220px' },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '12px',
          background: cover
            ? 'transparent'
            : 'radial-gradient(circle at center, rgba(228,196,33,0.2) 0%, rgba(10,10,10,0.9) 65%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={cover}
            alt="Song cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 8px 32px rgba(228, 196, 33, 0.2)'
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_COVER;
            }}
          />
        </Box>

          <Typography variant="h6" sx={{ 
          fontWeight: 600,
          mb: 2,
          color: palette?.text.primary || 'white',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Get the full experience
        </Typography>

        <Typography variant="body2" sx={{ 
          color: palette?.text.secondary || 'rgba(255,255,255,0.7)',
          mb: 3,
          maxWidth: '300px'
        }}>
          Sign up for free to enjoy unlimited music
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '280px' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onClose();
              onSwitchToSignup();
            }}
            sx={{
              background: `linear-gradient(90deg, ${palette?.primary.main || '#E4C421'}, ${palette?.secondary?.main || '#B25035'})`,
              color: palette?.primary.contrastText || '#000',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: '8px',
              mb: 1.5,
              '&:hover': {
                background: `linear-gradient(90deg, ${palette?.primary.light || '#F8D347'}, ${palette?.secondary?.light || '#C96146'})`,
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Sign Up Free
          </Button>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mt: 1.5
          }}>
            <Typography variant="body2" sx={{ 
              color: palette?.text.secondary || 'rgba(255,255,255,0.5)',
              mr: 1
            }}>
              Already have an account?
            </Typography>
            <Button
              onClick={() => {
                onClose();
                onSwitchToLogin();
              }}
              sx={{
                color: '#E4C421',
                minWidth: 'auto',
                p: 0,
                '&:hover': {
                  textDecoration: 'underline',
                  background: 'none'
                }
              }}
            >
              Log In
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
