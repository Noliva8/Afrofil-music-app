

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  alpha,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Fab,
  Zoom,
  Badge,
  IconButton,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import UserAuth from '../../utils/auth';

export function UserButtonMobileNavBar({ 
  onTabChange,
  showPlayer = false,
  playerHeight = 72,
  notifications = { favorites: 0, library: 0 }
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // More granular breakpoints for very small screens
  const isVerySmall = useMediaQuery('(max-width: 480px)'); // < 481px
  const isSmall = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px
  const isMediumUp = useMediaQuery(theme.breakpoints.up('md')); // ≥ 900px
  
  const [value, setValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showFab, setShowFab] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const profile = useMemo(() => UserAuth.getProfile?.() || {}, []);
  const userName = profile?.data?.username || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Responsive tab configurations with very small screen handling
  const tabs = useMemo(() => {
    if (isVerySmall) {
      // VERY SMALL SCREENS (< 481px): Compact with "More" menu
      return [
        { 
          label: 'Home', 
          icon: <HomeRoundedIcon />, 
          path: '/',
          showLabel: false
        },
        { 
          label: 'Search', 
          icon: <SearchRoundedIcon />, 
          path: '/search',
          showLabel: false
        },
        { 
          label: 'Library', 
          icon: (
            <Badge 
              badgeContent={notifications.library} 
              color="secondary" 
              max={9} // Smaller max on very small screens
              sx={{ 
                '& .MuiBadge-badge': { 
                  fontSize: '0.5rem', 
                  height: 14, 
                  minWidth: 14,
                  transform: 'scale(0.8) translate(50%, -50%)' // Smaller badge
                } 
              }}
            >
              <QueueMusicRoundedIcon />
            </Badge>
          ), 
          path: '/library',
          showLabel: false
        },
        { 
          label: 'More', 
          icon: <MoreVertIcon />, 
          path: '#',
          showLabel: false,
          isMenu: true
        },
      ];
    } else if (isSmall) {
      // SMALL/TABLET (481px - 900px): Full tabs with profile
      return [
        { 
          label: 'Home', 
          icon: <HomeRoundedIcon />, 
          path: '/',
          showLabel: true
        },
        { 
          label: 'Search', 
          icon: <SearchRoundedIcon />, 
          path: '/search',
          showLabel: true
        },

        { 
          label: 'Library', 
          icon: (
            <Badge 
              badgeContent={notifications.library} 
              color="secondary" 
              max={99}
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
            >
              <QueueMusicRoundedIcon />
            </Badge>
          ), 
          path: '/library',
          showLabel: true
        },
        { 
          label: 'Favorites', 
          icon: (
            <Badge 
              badgeContent={notifications.favorites} 
              color="secondary" 
              max={99}
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
            >
              <FavoriteRoundedIcon />
            </Badge>
          ), 
          path: '/favorites',
          showLabel: true
        },
        {
          label: 'Profile',
          icon: <Avatar sx={{ 
            bgcolor: '#E4C421', 
            width: 24, 
            height: 24, 
            fontSize: '0.75rem',
            fontWeight: 600
          }}>{initials}</Avatar>,
          path: '/profile',
          showLabel: false
        }
      ];
    } else {
      // MEDIUM+ (≥ 900px): Not shown (use sidebar)
      return [];
    }
  }, [isVerySmall, isSmall, isMediumUp, initials, notifications]);

  // Sync with current route
  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.path === location.pathname);
    if (currentIndex >= 0) {
      setValue(currentIndex);
    }
  }, [location.pathname, tabs]);

  // Hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowFab(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or near top
        setShowFab(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Calculate bottom position based on player
  const calculateBottomPosition = useCallback(() => {
    if (!showPlayer) return 0;
    
    // Different offsets for different screen sizes
    if (isVerySmall) return playerHeight;
    if (isSmall) return playerHeight + 8;
    return playerHeight + 12;
  }, [showPlayer, playerHeight, isVerySmall, isSmall]);

  // Responsive dimensions
  const getNavDimensions = useCallback(() => {
    if (isVerySmall) return { 
      height: 56, // Smaller on very small screens
      padding: '6px 2px', // Less padding
      iconSize: '1.3rem', // Smaller icons
      itemPadding: '4px 6px' // Less padding per item
    };
    if (isSmall) return { 
      height: 64, 
      padding: '8px 12px', 
      iconSize: '1.6rem',
      itemPadding: '8px 12px'
    };
    return { 
      height: 68, 
      padding: '8px 16px', 
      iconSize: '1.7rem',
      itemPadding: '8px 16px'
    };
  }, [isVerySmall, isSmall]);

  const handleNavigation = useCallback((event, newValue) => {
    setValue(newValue);
    const tab = tabs[newValue];
    
    if (tab.label === 'Profile' || tab.label === 'More' || tab.isMenu || tab.isOverflow) {
      setMenuAnchor(event.currentTarget);
    } else if (tab.path) {
      navigate(tab.path);
    }
    
    if (onTabChange) onTabChange(tab);
  }, [tabs, navigate, onTabChange]);

  const dimensions = getNavDimensions();
  const bottomPosition = calculateBottomPosition();

  // Don't show on desktop
  if (isMediumUp) return null;

  return (
    <>
      {/* Main Navigation Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: bottomPosition,
          left: 0,
          right: 0,
          height: dimensions.height,
          bgcolor: 'rgba(17, 17, 25, 0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
          zIndex: theme.zIndex.appBar - 100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: dimensions.padding,
          paddingBottom: `calc(${dimensions.padding} + env(safe-area-inset-bottom, 0px))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {isVerySmall ? (
          tabs.map((tab, index) => (
            <IconButton
              key={tab.label}
              onClick={(e) => {
                if (tab.isMenu) {
                  setMenuAnchor(e.currentTarget);
                } else {
                  navigate(tab.path);
                }
                setValue(index);
              }}
              sx={{
                color: value === index ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7),
                padding: dimensions.itemPadding,
                minWidth: 'auto',
                flex: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 8,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: dimensions.iconSize,
                },
              }}
            >
              {tab.icon}
            </IconButton>
          ))
        ) : (
          <BottomNavigation
            showLabels
            value={value}
            onChange={handleNavigation}
            sx={{
              background: 'transparent',
              width: '100%',
              '.MuiBottomNavigationAction-root': { minWidth: 0, flex: 1 },
            }}
          >
            {tabs.map((tab, index) => (
              <BottomNavigationAction
                key={tab.label}
                label={tab.showLabel ? tab.label : undefined}
                icon={tab.icon}
                value={index}
                sx={{
                  color: alpha(theme.palette.text.primary, 0.7),
                  minWidth: 0,
                  padding: '6px 0',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiBottomNavigationAction-wrapper': {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    lineHeight: 1.1,
                    padding: 0,
                    height: '100%'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: dimensions.iconSize,
                    display: 'block',
                    margin: '0 auto',
                  },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 8,
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 8,
                  },
                  '& .MuiAvatar-root': {
                    transition: 'all 0.2s ease',
                    width: isVerySmall ? 20 : 24,
                    height: isVerySmall ? 20 : 24,
                    fontSize: isVerySmall ? '0.65rem' : '0.75rem',
                    '&.Mui-selected': {
                      border: `2px solid ${theme.palette.primary.main}`,
                      transform: 'scale(1.1)',
                    }
                  }
                }}
              />
            ))}
          </BottomNavigation>
        )}
      </Box>

      {/* Floating Action Button (Upload/Add) */}
      {/* Upload FAB removed to avoid duplicate Add entry; Add is handled via nav tab */}

      {/* Profile/Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{ 
          zIndex: (theme.zIndex.modal ?? 1300) + 500,
          '& .MuiPaper-root': {
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 2,
            minWidth: 180,
            mt: -2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }
            }
          }
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {/* Show different menu items based on screen size */}
        {isVerySmall ? (
          // Very small screens: Show all options in menu
          <>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              navigate('/favorites'); 
            }}>
              <ListItemIcon>
                <FavoriteRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Favorites" />
              {notifications.favorites > 0 && (
                <Badge 
                  badgeContent={notifications.favorites} 
                  color="secondary" 
                  max={99}
                  sx={{ ml: 1 }}
                />
              )}
            </MenuItem>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              navigate('/profile'); 
            }}>
              <ListItemIcon>
                <PersonRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              navigate('/settings'); 
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              UserAuth.logout(); 
              navigate('/loginSignin'); 
            }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </>
        ) : (
          // Regular small screens: Just profile options
          <>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              navigate('/profile'); 
            }}>
              <ListItemIcon>
                <PersonRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              navigate('/settings'); 
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem onClick={() => { 
              setMenuAnchor(null); 
              UserAuth.logout(); 
              navigate('/loginSignin'); 
            }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
