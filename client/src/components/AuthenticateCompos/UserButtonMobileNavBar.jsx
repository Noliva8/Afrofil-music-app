

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import { SitemarkIcon } from '../themeCustomization/customIcon';
import { Search } from '@mui/icons-material';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';


export function UserButtonMobileNavBar({
  onTabChange,
  showPlayer = false,
  playerHeight = 72,
  onCreatePlaylist,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // More granular breakpoints for very small screens
  const isVerySmall = useMediaQuery('(max-width: 480px)'); // < 481px
  const isSmall = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px
  const isMediumUp = useMediaQuery(theme.breakpoints.up('md')); // ≥ 900px
  
  const [value, setValue] = useState(0);

  // Responsive tab configurations with very small screen handling
  const tabs = useMemo(() => {
    const baseTabs = [
      { label: 'Home', icon: <HomeRoundedIcon />, path: '/', showLabel: !isVerySmall },
      {
        label: 'Search',
        icon: <Search />,
        path: '/explore',
        showLabel: true,
        searchParams: 'search=1',
      },
      { label: 'Your library', icon: <LibraryMusicIcon />, path: '/library', showLabel: true },
      {
        label: 'Create',
        icon: <AddRoundedIcon />,
        path: '/library',
        showLabel: true,
        triggerCreateModal: true,
      },
      { label: 'Premium', icon: <SitemarkIcon />, path: '/premium', showLabel: true },
    ];

    if (isVerySmall) {
      return baseTabs.map((tab) =>
        tab.label === 'Home' ? { ...tab, showLabel: false } : tab
      );
    }

    if (isSmall) {
      return baseTabs.map((tab) => ({ ...tab, showLabel: true }));
    }

    return [];
  }, [isVerySmall, isSmall, isMediumUp]);

  // Sync with current route
  useEffect(() => {
    const currentIndex = tabs.findIndex((tab) => {
      if (!tab.path) return false;
      if (tab.searchParams) {
        return (
          tab.path === location.pathname &&
          location.search.replace(/^\?/, "") === tab.searchParams
        );
      }
      return tab.path === location.pathname && !tab.triggerCreateModal;
    });
    if (currentIndex >= 0) {
      setValue(currentIndex);
    }
  }, [location.pathname, location.search, tabs]);


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

    if (tab.triggerCreateModal) {
      navigate('/library');
      onCreatePlaylist?.();
      if (onTabChange) onTabChange(tab);
      return;
    }

    if (tab.searchParams) {
      navigate(`${tab.path}?${tab.searchParams}`);
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
        <BottomNavigation
          showLabels={!isVerySmall}
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
              }}
            />
          ))}
        </BottomNavigation>
      </Box>
    </>
  );
}
