import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  Avatar,
  Drawer,
  Stack,
  Divider,
  Button,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { SitemarkIcon } from '../themeCustomization/customIcon';
import { SearchBar } from '../../pages/SearchBar.jsx';




const WelcomeAppNavBar = ({
  handleSignupFormDisplay,
  handleLoginFormDisplay,
  handleArtistSignupFormDisplay,
  showSearch = false,
  sidebarOffset = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== '/';
  const historyState = window.history.state;
  const hasHistoryIndex = typeof historyState?.idx === 'number';
  const historyIndex = hasHistoryIndex ? historyState.idx : 0;
  const [maxHistoryIndex, setMaxHistoryIndex] = useState(historyIndex);
  const historyLength = typeof window !== 'undefined' ? window.history.length : 0;
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const sidebarGap = sidebarOffset
    ? `calc(${sidebarOffset} * 0.08)`
    : theme.spacing(2);

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
  const handleOpenAuthDrawer = () => setAuthDrawerOpen(true);
  const handleCloseAuthDrawer = () => setAuthDrawerOpen(false);

  const searchParams = new URLSearchParams(location.search);
  const showMobileSearchBar =
    showSearch &&
    isMobile &&
    (location.pathname.startsWith('/search') || searchParams.get('search') === '1');

  return (
    <>
      <Box
        sx={{
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backdropFilter: 'blur(12px)',
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          borderBottom: 'none',
          height: { xs: 72, sm: 80, md: 80 },
          minHeight: { xs: 72, sm: 80, md: 80 },
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          position: 'fixed',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, md: sidebarGap },
            flexWrap: 'nowrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, md: 2 },
              minWidth: 0,
              width: { xs: 'auto', md: sidebarOffset ? sidebarOffset : 'auto' },
              minWidth: { md: sidebarOffset ? sidebarOffset : 'auto' },
              maxWidth: { md: sidebarOffset ? sidebarOffset : 'auto' },
              justifyContent: { xs: 'flex-start', md: 'space-between' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
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
                <SitemarkIcon sx={{ color: theme.palette.primary.main, width: 40, height: 40 }} />
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
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              minWidth: 0,
              flex: 1,
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
            }}
          >

            

            {showSearch && !isMobile && <SearchBar />}

            {isMobile ? (
              <IconButton
                onClick={handleOpenAuthDrawer}
                sx={{
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                  p: 0.4,
                }}
                aria-label="Open account drawer"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  AF
                </Avatar>
              </IconButton>
            ) : (
              <>
                <Button
                  size="small"
                  onClick={handleArtistSignupFormDisplay}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.85rem', lg: '0.95rem' },
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    px: { xs: 1.25, sm: 2, md: 2, lg: 3 },
                    py: { xs: 0.55, sm: 0.7, md: 0.7, lg: 1.1 },
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  Artist
                </Button>
                <Button
                  size="small"
                  onClick={handleLoginFormDisplay}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.85rem', lg: '0.95rem' },
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    px: { xs: 1.25, sm: 2, md: 2, lg: 3 },
                    py: { xs: 0.55, sm: 0.7, md: 0.7, lg: 1.1 },
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSignupFormDisplay}
                  sx={{
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 'bold',
                    fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.85rem', lg: '0.95rem' },
                    px: { xs: 1.25, sm: 2, md: 2, lg: 3 },
                    py: { xs: 0.55, sm: 0.7, md: 0.7, lg: 1.1 },
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light || theme.palette.secondary.main})`,
                    },
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}

            <Drawer
              anchor="right"
              open={authDrawerOpen}
              onClose={handleCloseAuthDrawer}
              PaperProps={{
                sx: {
                  width: 280,
                  background: alpha(theme.palette.background.paper, 0.98),
                  borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  px: 2.5,
                  py: 3,
                },
              }}
            >
              <Stack spacing={2}>
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
                    AF
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Afrofeel
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Guest access
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.08) }} />

                <Stack spacing={1.2}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleCloseAuthDrawer();
                      handleLoginFormDisplay?.();
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleCloseAuthDrawer();
                      handleSignupFormDisplay?.();
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: alpha(theme.palette.text.primary, 0.2),
                      color: theme.palette.text.primary,
                    }}
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => {
                      handleCloseAuthDrawer();
                      handleArtistSignupFormDisplay?.();
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                    }}
                  >
                    Artist
                  </Button>
                </Stack>
              </Stack>
            </Drawer>

          </Box>
        </Box>
      </Box>

      {showMobileSearchBar && (
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 2,
            pt: 1,
            background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
            position: 'sticky',
            top: { xs: 72, sm: 80, md: 80 },
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <SearchBar autoFocus variant="full" />
          </Box>
        </Box>
      )}

      <Box sx={{ height: { xs: 72, sm: 80, md: 80 } }} />
    </>
  );
};

export default WelcomeAppNavBar;
