import {
  Dialog,
  Box,
  Button,
  Typography,
  IconButton
} from "@mui/material";
import { Close } from '@mui/icons-material';
import { useOutletContext } from "react-router-dom";

export default function AuthModal({ open, onClose, currentSong, onSwitchToLogin, onSwitchToSignup }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(228, 196, 33, 0.2)',
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
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            background: 'radial-gradient(circle at center, rgba(228,196,33,0.3) 0%, transparent 60%)',
            zIndex: 0,
            pointerEvents: 'none'
          }
        }}>
          <img
            src={currentSong?.artworkUrl || currentSong?.cover || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%231a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="24" font-family="Arial">No Cover</text></svg>'}
            alt="Song cover"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 8px 32px rgba(228, 196, 33, 0.2)'
            }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%231a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="24" font-family="Arial">No Cover</text></svg>';
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          mb: 2,
          color: 'white',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Get the full experience
        </Typography>

        <Typography variant="body2" sx={{ 
          color: 'rgba(255,255,255,0.7)',
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
              background: 'linear-gradient(90deg, #E4C421, #B25035)',
              color: '#000',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: '8px',
              mb: 1.5,
              '&:hover': {
                background: 'linear-gradient(90deg, #F8D347, #C96146)',
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
              color: 'rgba(255,255,255,0.5)',
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
