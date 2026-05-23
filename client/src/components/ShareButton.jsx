
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useMutation } from '@apollo/client';

  import {
  Share
} from '@mui/icons-material';
import { SHARE_SONG } from '../utils/queries';
import { shareSongLink } from '../utils/shareSong';


export const ShareButton = ({ handleShare, songId, title, text }) => {
const [shareSongMutation] = useMutation(SHARE_SONG);

const onShare = async () => {
  if (songId) {
    await shareSongLink({
      songId,
      title,
      text,
      shareSongMutation,
    });
    return;
  }

  handleShare?.();
};

return(
    <>
    
                {/* Share Button */}
                <IconButton
                onClick={onShare}
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
