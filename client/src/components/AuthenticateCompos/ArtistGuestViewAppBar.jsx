import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import { alpha } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import GetAppRoundedIcon from '@mui/icons-material/GetAppRounded';
import { SitemarkIcon } from '../themeCustomization/customIcon';
import ArtistAuth from '../../utils/artist_auth.js'
import Person2Icon from '@mui/icons-material/Person2';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';


import UserAuth from '../../utils/auth.js';
import { SearchBar } from '../../pages/SearchBar.jsx';
import { usePWAInstall } from '../../PWAInstall/pwaInstall.js';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';


export default function ArtistGuestViewAppBar() {

  const profile = UserAuth.getProfile();
const artistProfile = ArtistAuth.getProfile();
const isArtistLoggedIn = ArtistAuth.isArtist();




  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');
  const isCompactDesktop = useMediaQuery('(max-width:1000px)') && !isMobile;
  const isDesktop = !isMobile && !isCompactDesktop;
  const { isInstallable, triggerInstall } = usePWAInstall();




  const userName = profile?.data?.artistAka || 'Artist';

  const isPremiumUser = (profile?.data?.role || '').toLowerCase() === 'premium';


  // Get first two letters for profile picture
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const profileInitials = getInitials(userName);

  const showBack = location.pathname !== '/';
  const historyState = window.history.state;
  const hasHistoryIndex = typeof historyState?.idx === 'number';
  const historyIndex = hasHistoryIndex ? historyState.idx : 0;
  const [maxHistoryIndex, setMaxHistoryIndex] = useState(historyIndex);
  const historyLength = typeof window !== 'undefined' ? window.history.length : 0;

  useEffect(() => {
    if (!hasHistoryIndex) return;
    setMaxHistoryIndex((prev) => (historyIndex > prev ? historyIndex : prev));
  }, [hasHistoryIndex, historyIndex]);




  const canGoBack = showBack && (historyIndex > 0 || historyLength > 1);
  const canGoForward = showBack && hasHistoryIndex && historyIndex < maxHistoryIndex;
 


  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  
  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };



  



  const handleOpenMobileDrawer = () => setMobileDrawerOpen(true);
  const handleCloseMobileDrawer = () => setMobileDrawerOpen(false);
  
  const handleLogout = () => {
    ArtistAuth.logout();
    handleMenuClose();
    navigate('/');
  };

  const handleInstallApp = () => {
    triggerInstall();
  };



  const switchToUserAccount = () => {
    if (isArtistLoggedIn) {
        ArtistAuth.logout();
      navigate('/loginSignin');
      handleMenuClose();
      
    }
  };

const handleBackToStudio =() =>{
     if (isArtistLoggedIn){
         navigate('/artist/studio/home');
     }
}



const handlePremiumNavigate = () => {
  if(isPremiumUser){
    navigate('/premium');
     handleCloseMobileDrawer();
  }
}



  const menuId = 'primary-search-account-menu';

  
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 200,
        }
      }}
    >
      <MenuItem onClick={handleMenuClose}>

       <Button
                variant="contained"
                onClick={switchToUserAccount}
                endIcon={<Person2Icon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 3,
                  py: 0.9,
                  background: `linear-gradient(125deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: theme.palette.primary.contrastText,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[3],
                  },
                }}
              >
               Switch to user 
              </Button>

      </MenuItem>


   

    
    

      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>



    </Menu>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.default, 0.92),
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          borderBottom: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.25, gap: 2, px: { xs: 2, md: 3 } }}>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                '&:hover .logo-text': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                },
              }}
            >
              <Button
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: 'transparent', transform: 'translateY(-1px)' },
                  transition: 'transform 0.15s ease'
                }}
                onClick={() => navigate('/')}
              >
                <SitemarkIcon sx={{ width: 40, height: 40 }} />
                {!isMobile && (
                  <Typography
                    variant="h6"
                    className="logo-text"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                      color: theme.palette.text.primary,
                      transition: 'all 0.3s ease',
                      fontFamily: theme.typography.fontFamily,
                      fontSize: '1.2rem',
                      lineHeight: 1.2,
                      display: { xs: 'none', md: 'block', lg: 'block' },
                      '@media (max-width:990px)': {
                        display: 'none',
                      },
                    }}
                  >
                    AfroFeel
                  </Typography>
                )}
              </Button>


            </Box>

       


          </Box>

          {/* Search */}


<Button
  onClick={handleBackToStudio}
  sx={{
    textTransform: "none",
    borderRadius: 2,
    border: '1px solid white',
    color: 'white',
    bgcolor: "transparent",
    px: 2,
    py: 0.75,
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.1),
    },
  }}
>
  <Typography sx={{ fontWeight: 600 }}>Studio</Typography>
  <ArrowForwardIosIcon sx={{ fontSize: 16, ml: 0.5 }} />
</Button>





          {!isMobile && (
            <Box sx={{ flex: 1, maxWidth: 560, mx: 3 }}>

              <SearchBar />
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>




           

            {isArtistLoggedIn && !isMobile && !isCompactDesktop && (
              <Button
                variant="contained"
                onClick={switchToUserAccount}
                endIcon={<Person2Icon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 3,
                  py: 0.9,
                  background: `linear-gradient(125deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: theme.palette.primary.contrastText,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[3],
                  },
                }}
              >
               Switch to user account
              </Button>
            )}

             



            {isInstallable &&  (
              <Button
                variant="outlined"
                 onClick={triggerInstall}
                startIcon={<GetAppRoundedIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 3,
                  py: 0.9,
                  borderColor: alpha(theme.palette.primary.main, 0.6),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: theme.shadows[1],
                  },
                }}
              >
                Install App
              </Button>
            )}




       
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    size="small"
                    sx={{
                      ml: 0.5,
                      boxShadow: theme.shadows[1],
                      border: `2px solid ${alpha(theme.palette.common.white, 0.12)}`
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 38,
                        height: 38,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: theme.palette.primary.contrastText,
                      }}
                    >
                      {profileInitials}
                    </Avatar>
                  </IconButton>
                </Tooltip>


              <>





          

                

              </>
            

          </Box>
        </Toolbar>
      </AppBar>




      {renderMenu}
    </>
  );
}
