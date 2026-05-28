import { useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useMutation } from '@apollo/client';

  import {
  ContentCopy,
  IosShare,
  Share
} from '@mui/icons-material';
import { SHARE_SONG } from '../utils/queries';
import { buildSongShareUrl, shareSongLink } from '../utils/shareSong';




export const ShareButton = ({ handleShare, songId }) => {
const [shareSongMutation] = useMutation(SHARE_SONG);
const [drawerOpen, setDrawerOpen] = useState(false);
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const shareUrl = useMemo(() => {
  if (!songId || typeof window === 'undefined') return '';
  return buildSongShareUrl(songId);
}, [songId]);

const closeDrawer = () => setDrawerOpen(false);

const markShared = async () => {
  if (!songId) return;

  try {
    await shareSongMutation({ variables: { songId } });
  } catch (err) {
    console.warn('Share count update failed', err);
  }
};

const onShare = async () => {
  if (isMobile && songId) {
    setDrawerOpen(true);
    return;
  }

  if (songId) {
    await shareSongLink({
      songId,
      shareSongMutation,
    });
    return;
  }

  handleShare?.();
};

const handleNativeShare = async () => {
  closeDrawer();

  if (!songId) {
    handleShare?.();
    return;
  }

  await shareSongLink({
    songId,
    shareSongMutation,
  });
};

const handleCopyLink = async () => {
  closeDrawer();

  if (!shareUrl) {
    handleShare?.();
    return;
  }

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      await markShared();
      return;
    } catch (err) {
      console.warn('Clipboard share failed', err);
    }
  }

  await shareSongLink({
    songId,
    shareSongMutation,
  });
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

                <Drawer
                  anchor="bottom"
                  open={drawerOpen}
                  onClose={closeDrawer}
                  PaperProps={{
                    sx: {
                      bgcolor: '#111',
                      color: '#fff',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      px: 2,
                      pt: 1,
                      pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 4,
                      borderRadius: 999,
                      bgcolor: 'rgba(255,255,255,0.35)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  />
                  <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.5 }}>
                    Share song
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: 13,
                      mb: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shareUrl}
                  </Typography>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 1 }} />
                  <ButtonBase
                    onClick={handleNativeShare}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 1.5,
                      py: 1.5,
                      borderRadius: 2,
                      color: '#fff',
                    }}
                  >
                    <IosShare fontSize="small" />
                    <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Share</Typography>
                  </ButtonBase>
                  <ButtonBase
                    onClick={handleCopyLink}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 1.5,
                      py: 1.5,
                      borderRadius: 2,
                      color: '#fff',
                    }}
                  >
                    <ContentCopy fontSize="small" />
                    <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Copy link</Typography>
                  </ButtonBase>
                </Drawer>
    
    
    </>
)
}
