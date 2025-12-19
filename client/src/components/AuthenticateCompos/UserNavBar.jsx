import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { SitemarkIcon } from '../themeCustomization/customIcon';
import UserAuth from '../../utils/auth.js';




export default function UserNavBar() {
  const profile = UserAuth.getProfile();
  console.log('check the profile:', profile)
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');

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

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  
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
  
  const handleLogout = () => {
    UserAuth.logout();
    handleMenuClose();
    navigate('/');
  };

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
      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon>
          <LibraryMusicIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>My Library</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>
      <Divider />
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
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backgroundImage: `
            radial-gradient(circle at 12% 20%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 35%),
            radial-gradient(circle at 85% 0%, ${alpha(theme.palette.secondary.main, 0.15)}, transparent 32%)
          `,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.25, gap: 2, px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {!isPremiumUser && isMobile && (
              <Button
                onClick={() => navigate('/checkout')}
                startIcon={<PlayArrowRoundedIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 1.6,
                  py: 0.6,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: theme.palette.primary.contrastText,
                  boxShadow: theme.shadows[2],
                  minWidth: 0,
                  '&:hover': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`
                  }
                }}
              >
                Upgrade
              </Button>
            )}
            <Button
              sx={{
                p: 0,
                minWidth: 'auto',
                '&:hover': { bgcolor: 'transparent', transform: 'translateY(-1px)' },
                transition: 'transform 0.15s ease'
              }}
              onClick={() => navigate('/')}
            >
              <SitemarkIcon />
            </Button>
          </Box>

          {/* Search */}
          {!isMobile && (
            <Box
              sx={{
                flex: 1,
                maxWidth: 560,
                mx: 3,
                display: 'flex',
                alignItems: 'center',
                bgcolor: alpha(theme.palette.background.default, 0.85),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                borderRadius: 999,
                px: 1.6,
                py: 0.75,
                boxShadow: theme.shadows[2],
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <InputBase
                placeholder="Search artists, songs, or podcasts..."
                inputProps={{ 'aria-label': 'search' }}
                sx={{ flex: 1, color: theme.palette.text.primary, fontWeight: 700, letterSpacing: 0.1,
                  '& .MuiInputBase-input::placeholder': { color: alpha(theme.palette.text.primary, 0.65), opacity: 1 }
                }}
              />
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {!isPremiumUser && (
              <Button
                onClick={() => navigate('/checkout')}
                startIcon={<PlayArrowRoundedIcon />}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                px: 2.2,
                py: 1,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.primary.contrastText,
                boxShadow: theme.shadows[2],
                '&:hover': { background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})` }
              }}
            >
              Upgrade
            </Button>
          )}

            <Tooltip title="Notifications">
              <IconButton
                size="large"
                color="inherit"
                sx={{ position: 'relative' }}
              >
                <Badge
                  badgeContent={4}
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

          </Box>
        </Toolbar>
      </AppBar>

      {renderMenu}
    </>
  );
}
