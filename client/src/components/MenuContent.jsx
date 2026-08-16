import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import { alpha } from '@mui/material/styles';

export default function MenuContent({handleShowMobileMenu}) {
  const linkSx = (isActive) => (theme) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: 1.5,
    py: 1.15,
    borderRadius: '8px',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    textDecoration: 'none',
    fontWeight: isActive ? 800 : 650,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.text.primary,
    },
    '& svg': {
      fontSize: 22,
    },
  });

  return (

    <Stack sx={{ flexGrow: 1, p: 1.25, mt: 3, justifyContent: 'space-between' }}>
      
<Box sx={{
  display: 'flex', 
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch', 
  gap: 1,
  width: '100%',
}}>
 

        <NavLink to="home" onClick={handleShowMobileMenu} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Box sx={linkSx(isActive)}>
              <HomeRoundedIcon />
              <span>Home</span>
            </Box>
          )}
        </NavLink>

        <NavLink to="content" onClick={handleShowMobileMenu} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Box sx={linkSx(isActive)}>
              <SourceIcon />
              <span>Content</span>
            </Box>
          )}
        </NavLink>

        <NavLink to="dashboard" onClick={handleShowMobileMenu} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Box sx={linkSx(isActive)}>
              <DashboardRounded />
              <span>Dashboard</span>
            </Box>
          )}
        </NavLink>

    
</Box>


    </Stack>
  );
}
