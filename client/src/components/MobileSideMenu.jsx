import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuContent from './MenuContent';
import { useTheme, useMediaQuery } from '@mui/material';

const MobileDrawer = styled(MuiDrawer)(({ theme }) => ({
  width: '100%',
  maxWidth: 440,
  flexShrink: 0,
  [`& .MuiDrawer-paper`]: {
    width: '100%',
    maxWidth: 440,
    boxSizing: 'border-box',
    backgroundColor: 'var(--primary-background-color)',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
    },
  },
}));

export default function MobileSideMenu({
  openMobileMenu,
  handleShowMobileMenu,
  profileImage,
  artistProfile
}) {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down(400));

  return (
    <MobileDrawer
      anchor='right'
      variant="temporary"
      open={openMobileMenu}
      onClose={handleShowMobileMenu}
      sx={{
        display: { xs: 'block', md: 'none' },
        zIndex: theme.zIndex.drawer + 1
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: isSmallMobile ? 1 : 1.5,
        }}
      >
        <SitemarkIcon />
      </Box>

      <Divider sx={{ bgcolor: 'var(--secondary-background-color)' }} />
      
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          pb: 2
        }}
      >
        <MenuContent 
          handleShowMobileMenu={handleShowMobileMenu} 
          isMobile={true}
        />
      </Box>

      <Stack
        direction="row"
        sx={{
          p: isSmallMobile ? 1 : 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes="small"
          alt={artistProfile?.fullName || 'User'}
          src={profileImage}
          sx={{ 
            width: isSmallMobile ? 32 : 36, 
            height: isSmallMobile ? 32 : 36 
          }}
        />
        <Box sx={{ mr: 'auto', overflow: 'hidden' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500, 
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {artistProfile?.fullName || 'User'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'var(--primary-font-color)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {artistProfile?.email || ''}
          </Typography>
        </Box>
      </Stack>
    </MobileDrawer>
  );
}