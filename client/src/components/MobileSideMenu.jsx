import { alpha, styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuContent from './MenuContent';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';

const MobileDrawer = styled(MuiDrawer)(({ theme }) => ({
  width: '100%',
  maxWidth: 440,
  flexShrink: 0,
  [`& .MuiDrawer-paper`]: {
    width: '100%',
    maxWidth: 440,
    boxSizing: 'border-box',
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
    borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
    boxShadow: `-18px 0 40px ${alpha(theme.palette.common.black, 0.24)}`,
    color: theme.palette.text.primary,
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
          justifyContent: 'flex-start',
          gap: 1.25,
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          px: isSmallMobile ? 1.25 : 2,
          py: isSmallMobile ? 1.25 : 1.75,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: alpha(theme.palette.common.white, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            flexShrink: 0,
          }}
        >
          <SitemarkIcon sx={{ width: 28, height: 28, mr: 0 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 900,
              lineHeight: 1.1,
              color: theme.palette.text.primary,
            }}
          >
            Flolup Studio
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: 'block',
              mt: 0.25,
              color: theme.palette.text.secondary,
              maxWidth: 280,
            }}
          >
            {artistProfile?.artistAka || 'Artist workspace'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08), mx: 2 }} />
      
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: 1,
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
          borderColor: alpha(theme.palette.text.primary, 0.08),
          backgroundColor: alpha(theme.palette.common.white, 0.03),
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
              color: theme.palette.text.secondary,
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
