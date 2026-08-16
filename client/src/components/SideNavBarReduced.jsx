import { alpha, styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuContentReduced from './MenuContentReduced';

const drawerWidth = 100;

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: alpha(theme.palette.background.paper, 0.94),
    borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
    color: theme.palette.text.primary,
  },
}));

export default function SideMenuReduced({ open, setOpenDrawer, profileImage, artistProfile}) {
  return (
    
    <Drawer
      variant="permanent"
      open={open}
      onClose={() => setOpenDrawer(true)} 
      sx={{
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mt: 'calc(var(--template-frame-height, 0px) + 4px)',
        p: 1.5, ml: 3
      }}>
        
       < SitemarkIcon />
      </Box>
      <Divider sx={{ borderColor: (theme) => alpha(theme.palette.primary.main, 0.18) }} />
      <Box sx={{
        overflow: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <MenuContentReduced />
      </Box>
      <Stack direction="row" sx={{
        p: 2, gap: 1, alignItems: 'center',
        borderTop: '1px solid', borderColor: 'divider',
      }}>
        <Avatar src={profileImage} sizes="small" alt={artistProfile.fullName} sx={{ width: 36, height: 36 }} />

       
      </Stack>
    </Drawer>
  );
}
