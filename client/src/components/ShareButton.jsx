
import {  Typography,

  IconButton,
  } from "@mui/material";

  import {
  Share
} from '@mui/icons-material';


export const ShareButton = ({handleShare}) => {

return(
    <>
    
                {/* Share Button */}
                <IconButton
                onClick={handleShare}
                  aria-label="Share"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    p: { xs: 1.2, sm: 1.5 },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: { xs: 70, sm: 80 },
                  }}
                >
                  <Share sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Share
                  </Typography>
                </IconButton>
    
    
    </>
)
}