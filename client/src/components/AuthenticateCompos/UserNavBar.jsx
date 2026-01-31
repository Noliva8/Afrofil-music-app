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
import UserAuth from '../../utils/auth.js';
import { SearchBar } from '../../pages/SearchBar.jsx';
import { usePWAInstall } from '../../PWAInstall/pwaInstall.js';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useMutation, useQuery } from '@apollo/client';
import { USER_NOTIFICATION_ON_BOOKINGS, USER_NOTIFICATIONS_ON_MESSAGES } from '../../utils/queries';
import { MARK_SEEN_USER_NOTIFICATION } from '../../utils/mutations';

export default function UserNavBar() {

  const profile = UserAuth.getProfile();
  console.log('check the profile:', profile)
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');
  const isCompactDesktop = useMediaQuery('(max-width:1000px)') && !isMobile;
  const isDesktop = !isMobile && !isCompactDesktop;
  const { isInstallable, triggerInstall } = usePWAInstall();




  const userName = profile?.data?.username || 'User';
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
  const handleBack = () => {
    if (!canGoBack) return;
    navigate(-1);
  };
  const handleForward = () => {
    if (!canGoForward) return;
    navigate(1);
  };

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




// user Notification
// -------------

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };


// 
  const handleNotificationSelect = async (notification) => {
    try {
      await markNotificationRead({ variables: { notificationId: notification._id } });
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
    if (notification.isChatEnabled) {
      navigate('/messages');
    }
    handleNotificationsClose();
  };




// Notification icon releted query
const {data: bookingNotificationData} = useQuery(USER_NOTIFICATION_ON_BOOKINGS, {
  variables: {bookingId: ''}
});


// Message icon releted query
const {data: messageNotificationData} = useQuery(USER_NOTIFICATIONS_ON_MESSAGES, {
  variables: {messageId:'' , bookingId: ''}
})


// Mark as seen notification user sees
const [MarkSeenUserNotification] = useMutation(MARK_SEEN_USER_NOTIFICATION, {
  variables: {notificationId: '', isNotificationSeen: true}
})














  const [notificationsAnchor, setNotificationsAnchor] = useState(null);



  



  const handleOpenMobileDrawer = () => setMobileDrawerOpen(true);
  const handleCloseMobileDrawer = () => setMobileDrawerOpen(false);
  
  const handleLogout = () => {
    UserAuth.logout();
    handleMenuClose();
    navigate('/');
  };

  const handleInstallApp = () => {
    triggerInstall();
  };

  const handleUpgradeClick = () => {
    if (!isPremiumUser) {
      navigate('/premium');
      handleMenuClose();
      handleCloseMobileDrawer();
    }
  };


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
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>My Profile</ListItemText>
      </MenuItem>
{isPremiumUser &&(
   <MenuItem onClick={handleMenuClose}>

        <ListItemIcon>
          <SitemarkIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText> Subscription</ListItemText>
      </MenuItem>

)}
   

    
      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>

    </Menu>
  );

  const notificationMenuId = 'primary-notification-menu';
  const renderNotificationMenu = (
    <Menu
      anchorEl={notificationsAnchor}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={notificationMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 240,
        }
      }}
    >
      {notificationsLoading ? (
        <MenuItem disabled>Loading responses…</MenuItem>
      ) : userNotifications.length ? (
        userNotifications.map((notification) => (
          <MenuItem
            key={notification._id}
            onClick={() => handleNotificationSelect(notification)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-start' }}
          >
            <Typography variant="subtitle2">
              {notification.type === 'accepted' ? 'Artist accepted your booking' : 'Artist declined your booking'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notification.booking?.eventType || 'Booking'} · {notification.booking?.location?.city || notification.booking?.location?.country || 'Location'}
            </Typography>
            {notification.message && (
              <Typography variant="caption" color="text.secondary">
                {notification.message}
              </Typography>
            )}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No new replies</MenuItem>
      )}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleBack}
                aria-disabled={!canGoBack}
                sx={{
                  color: theme.palette.text.primary,
                  opacity: canGoBack ? 1 : 0.4,
                  cursor: canGoBack ? 'pointer' : 'default',
                }}
                aria-label="Go back"
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleForward}
                aria-disabled={!canGoForward}
                sx={{
                  color: theme.palette.text.primary,
                  opacity: canGoForward ? 1 : 0.4,
                  cursor: canGoForward ? 'pointer' : 'default',
                }}
                aria-label="Go forward"
              >
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </IconButton>

             {!isMobile && (
               <Button onClick={() => navigate('/')}>

                <HomeRoundedIcon />
              </Button>
             )}
              
            </Box>
          </Box>

          {/* Search */}






          {!isMobile && (
            <Box sx={{ flex: 1, maxWidth: 560, mx: 3 }}>

              <SearchBar />
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {!isPremiumUser && isCompactDesktop && (
              <Button
                onClick={handleUpgradeClick}
                startIcon={<PlayArrowRoundedIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 1.5,
                  py: 0.7,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: theme.palette.primary.contrastText,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
                  },
                }}
              >
                Upgrade
              </Button>
            )}
            {!isPremiumUser && !isMobile && !isCompactDesktop && (
              <Button
                variant="contained"
                onClick={handleUpgradeClick}
                endIcon={<ArrowForwardIosRoundedIcon />}
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
                Upgrade to Premium
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




            {isMobile ? (
              <Tooltip title="Account">
                <IconButton
                  onClick={handleOpenMobileDrawer}
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
            ) : (
              <>


                <Tooltip title="Support">
                  <IconButton
                    size="large"
                    color="inherit"
                    onClick={() => navigate('/support')}
                    sx={{ position: 'relative' }}
                  >
                    <SupportAgentRoundedIcon />
                  </IconButton>
                </Tooltip>



                <Tooltip title="Messages">
                  <IconButton
                    size="large"
                    color="inherit"
                    sx={{ position: 'relative' }}
                    onClick={handleNotificationsOpen}
                  >
                    <Badge
                      badgeContent={unreadNotificationCount}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.65rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    >
                      <MailOutlineIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Notifications">
                  <IconButton
                    size="large"
                    color="inherit"
                    sx={{ position: 'relative' }}
                    onClick={handleNotificationsOpen}
                  >
                    <Badge
                      badgeContent={unreadNotificationCount}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.65rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                

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


              </>
            )}

          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={handleCloseMobileDrawer}
        PaperProps={{
          sx: {
            width: 300,
            background: alpha(theme.palette.background.paper, 0.98),
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            px: 2.5,
            py: 3,
          },
        }}
      >
        <Stack spacing={2}>
          <Box 
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
          >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                fontWeight: 700,
              }}
            >
              {profileInitials}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {isPremiumUser ? 'Premium member' : 'Regural member'}
              </Typography>
            </Box>
          </Box>


          <Button onClick={()=> handleCloseMobileDrawer()}>
            <CloseIcon />

          </Button>


          </Box>

          <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08) }} />

          <Stack spacing={1.2}>

            <Button
              variant="text"
              startIcon={<SupportAgentRoundedIcon />}
              onClick={() => {
                handleCloseMobileDrawer();
                navigate('/support');
              }}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                justifyContent: "flex-start",
                color: theme.palette.text.primary,
              }}
            >
              Support
            </Button>

            <Button
              variant="text"
              startIcon={<NotificationsIcon />}
              onClick={() => handleCloseMobileDrawer()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                justifyContent: "flex-start",
                color: theme.palette.text.primary,
              }}
            >
              Notifications
            </Button>


               {isPremiumUser && (
               <Button
              variant="text"
              startIcon={<SitemarkIcon />}
              onClick={() => handlePremiumNavigate()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                justifyContent: "flex-start",
                color: theme.palette.text.primary,
              }}
            >
              Subscription
            </Button>


            )}

            <Button
              variant="text"
              startIcon={<SettingsIcon />}
              onClick={() => handleCloseMobileDrawer()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                justifyContent: "flex-start",
                color: theme.palette.text.primary,
              }}
            >
              Settings
            </Button>

         

            <Button
              variant="text"
              startIcon={<LogoutIcon />}
              onClick={() => {
                handleCloseMobileDrawer();
                handleLogout();
              }}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                justifyContent: "flex-start",
                color: theme.palette.error.main,
              }}
            >
              Logout
            </Button>

          </Stack>
        </Stack>
      </Drawer>

      {renderNotificationMenu}
      {renderMenu}
    </>
  );
}
