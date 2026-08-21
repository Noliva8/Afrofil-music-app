import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import SourceIcon from "@mui/icons-material/Source";
import { alpha } from '@mui/material/styles';

export default function MenuContent({handleShowMobileMenu, isMobile = false}) {
  const linkSx = (isActive) => (theme) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? 1.5 : 1.35,
    px: isMobile ? 1.5 : 1.25,
    py: isMobile ? 1.35 : 1.2,
    borderRadius: '8px',
    color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
    textDecoration: 'none',
    fontSize: isMobile ? 15 : 14,
    fontWeight: isActive ? 800 : 650,
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
    border: `1px solid ${isActive ? alpha(theme.palette.primary.main, 0.24) : 'transparent'}`,
    boxShadow: isActive ? `0 10px 24px ${alpha(theme.palette.common.black, 0.18)}` : 'none',
    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
    '&:hover': {
      backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.common.white, 0.06),
      borderColor: isActive ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.text.primary, 0.08),
      color: theme.palette.text.primary,
      transform: 'translateX(2px)',
    },
    '& svg': {
      fontSize: isMobile ? 23 : 21,
      color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.62),
      transition: 'color 0.2s ease',
    },
  });

  return (

    <Stack sx={{ flexGrow: 1, p: 1, mt: isMobile ? 1.25 : 2, justifyContent: 'space-between' }}>
      
<Box sx={{
  display: 'flex', 
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch', 
  gap: 0.75,
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
