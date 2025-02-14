import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuButton from './MenuButton';
import { SitemarkIcon } from './themeCustomization/customIcon';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuContentReduced from './MenuContentReduced';

const drawerWidth = 100;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenuReduced({ open, setOpenDrawer, profileImage, artistProfile}) {
  return (
    
    <Drawer
      variant="permanent"
      open={open}
      onClose={() => setOpenDrawer(true)} 
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'var(--primary-background-color)',
        },
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mt: 'calc(var(--template-frame-height, 0px) + 4px)',
        p: 1.5, ml: 3
      }}>
        
       < SitemarkIcon />
      </Box>
      <Divider sx={{ bgcolor: 'var(--secondary-background-color)' }} />
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
