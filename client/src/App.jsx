
import { useState, useEffect } from "react";
import { useCallback } from "react";
// New component for mobile
import GuestBottomNav from "./components/GuestBottomNav.jsx";
import { Outlet } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

import UserAuth from "./utils/auth";
import ArtistAuth from "./utils/artist_auth";

import WelcomeAppNavBar from "./components/WelcomePage/WelcomAppNavBar";
import { WelcomeSideNavbar } from "./components/WelcomePage/WelcomeSideNavBar.jsx";
import Footer from "./pages/Footer";
import Box from '@mui/material/Box';
import { useTheme, alpha } from "@mui/material/styles";
import { lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { UserProvider } from "./utils/Contexts/userContext.jsx";
import { LocationProvider  } from "./utils/Contexts/useLocationContext.jsx";

import LocationGate from "./utils/Contexts/LocationGate.jsx";
import { AudioPlayerProvider, useAudioPlayer } from "./utils/Contexts/AudioPlayerContext.jsx";
import { AdAudioProvider } from "./utils/Contexts/adPlayer/adPlayerProvider.jsx";
import Orchestrator from "./utils/Contexts/adPlayer/orchestrator.jsx";
import { BookingIdProvider } from "./utils/contexts/bookingIdContext";

import AuthModal from "./components/WelcomePage/AuthModal.jsx";
import MediaPlayerContainer from "./components/MusicPlayer/MediaPlayerContainer.jsx";
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { eventBus } from "./utils/Contexts/playerAdapters.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ArtistGuestViewAppBar from "./components/AuthenticateCompos/ArtistGuestViewAppBar.jsx";

import PauseOnLogin from "./utils/Contexts/pauseOnLogin.js";

// Apollo Client setup remains the same...
// const httpLink = createUploadLink({ uri: "/graphql" });

const httpLink = createUploadLink({
  uri: import.meta.env.VITE_HTTP_URL,
  
});


import UserNavBar from "./components/AuthenticateCompos/UserNavBar.jsx";
import UserSideBar from "./components/userComponents/Home/UserSideBar.jsx";

import AddToPlaylistModal from "./components/AddToPlaylistModal.jsx";
import { UserButtonMobileNavBar } from "./components/AuthenticateCompos/UserButtonMobileNavBar.jsx";







const wsUrl = import.meta.env.VITE_WS_UR




// const authLink = setContext((_, { headers }) => {
//   const userToken = localStorage.getItem("user_id_token");
//   const artistToken = localStorage.getItem("artist_id_token");
  
//   const headersWithAuth = { ...headers };
  
//   // Set both headers, backend will use the valid one
//   if (artistToken) {
//     headersWithAuth['x-artist-authorization'] = `Bearer ${artistToken}`;
//   }
//   if (userToken) {
//     headersWithAuth['x-user-authorization'] = `Bearer ${userToken}`;
//   }
  
//   return { headers: headersWithAuth };
// });


const authLink = setContext((_, { headers }) => {
  const userToken = localStorage.getItem("user_id_token");
  const artistToken = localStorage.getItem("artist_id_token");

  const headersWithAuth = { ...headers };

  // ✅ Apollo CSRF prevention bypass: force preflight / mark as safe
  headersWithAuth["apollo-require-preflight"] = "true";
  // Optional (but valid) additional header Apollo accepts:
  // headersWithAuth["x-apollo-operation-name"] = "afrofeel-client";

  // Set both headers, backend will use the valid one
  if (artistToken) {
    headersWithAuth["x-artist-authorization"] = `Bearer ${artistToken}`;
  }
  if (userToken) {
    headersWithAuth["x-user-authorization"] = `Bearer ${userToken}`;
  }

  return { headers: headersWithAuth };
});



const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: async () => {
      const artistToken = localStorage.getItem("artist_id_token");
      const userToken = localStorage.getItem("user_id_token");
      return {
        authorization: artistToken
          ? `Bearer ${artistToken}`
          : `Bearer ${userToken}`,
      };
    },
    connectionAckWaitTimeout: 10000,
    shouldRetry: (err) => {
  if (!err || typeof err.message !== 'string') return true;
  return !err.message.includes('Authentication failed');
},

  })
);







const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors && graphQLErrors.length) {
    console.error(
      `[GraphQL error]`,
      operation?.operationName || "unknown",
      graphQLErrors
    );
  }
  if (networkError) {
    console.error(`[Network error]`, networkError);
  }
});





const client = new ApolloClient({
  link: errorLink.concat(splitLink),
  cache: new InMemoryCache(),
});

// const LazyLoginSignin = lazy(() =>
//   import("./pages/LoginSignin").then((module) => ({ default: module.LoginSignin }))
// );

const LazyUserLoginPage = lazy(() =>
  import("./pages/LoginSignin").then((module) => ({ default: module.UserLoginPage }))
);
const LazyUserSignupPage = lazy(() =>
  import("./pages/LoginSignin").then((module) => ({ default: module.UserSignupPage }))
);


// function AppBody({ onCreatePlaylist }) {
//   const theme = useTheme();
//   const [isHydrated, setIsHydrated] = useState(false);
//   const [authModalOpen, setAuthModalOpen] = useState(false);
//   const [authAction, setAuthAction] = useState('login');
//   const [authIntent, setAuthIntent] = useState(null);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const pathname = location.pathname;

//   const [isPlayerActive, setIsPlayerActive] = useState(false);
//   const [playerHeight, setPlayerHeight] = useState(0);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//   const [formDisplay, setFormDisplay] = useState('');
//   const [mobileTop, setMobileTop] = useState({ title: 'Home', showSearch: false });
//   const [adNoticeOpen, setAdNoticeOpen] = useState(false);
//   const [adNoticeMessage, setAdNoticeMessage] = useState('Playback will resume after the advertisement finishes.');

//   const isUserLoggedIn = UserAuth.loggedIn();
//   const isArtistLoggedIn = ArtistAuth.isArtist();

//   const tabMetaFromPath = useCallback((path) => {
//     switch (true) {
//       case path.startsWith('/search'):
//         return { title: 'Explore', showSearch: true };
//       case path.startsWith('/library') || path.startsWith('/playlists'):
//         return { title: 'Library', showSearch: false };
//       case path.startsWith('/favorites'):
//         return { title: 'Favorites', showSearch: false };
//       case path.startsWith('/profile'):
//         return { title: 'Profile', showSearch: false };
//       default:
//         return { title: 'Home', showSearch: false };
//     }
//   }, []);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     setMobileTop(tabMetaFromPath(pathname));
//   }, [pathname, tabMetaFromPath]);

//   useEffect(() => {
//     if (!pathname.startsWith('/loginSignin')) return;
//     const params = new URLSearchParams(location.search);
//     if (params.get('login') === '1' && formDisplay !== 'login') {
//       setFormDisplay('login');
//       return;
//     }
//     if (params.get('signup') === '1' && formDisplay !== 'signup') {
//       setFormDisplay('signup');
//     }
//   }, [formDisplay, location.search, pathname]);

//   useEffect(() => {
//     const handleAdBlockNotice = (payload) => {
//       setAdNoticeMessage(payload?.message || 'Playback will resume after the advertisement finishes.');
//       setAdNoticeOpen(true);
//     };
//     eventBus.on("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
//     return () => eventBus.off("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
//   }, []);

//   useEffect(() => {
//     setIsHydrated(true);
//   }, []);

//   if (!isHydrated) {
//     return null;
//   }

//   const isPublicArtistPage =
//     pathname.startsWith('/artist/register') ||
//     pathname.startsWith('/artist/login') ||
//     pathname.startsWith('/artist/verification') ||
//     pathname.startsWith('/artist/plan') ||
//     pathname.startsWith('/terms');

//   const shouldHideGuestChrome =
//     pathname.startsWith('/terms') || isPublicArtistPage;

//   const isNotMediaPlayerAllowed =
//     pathname.startsWith('/artist/studio') ||
//     pathname.startsWith('/artist/dashboard') ||
//     pathname.startsWith('/checkout');

//   const handleArtistSignupFormDisplay = () => {
//     navigate('/artist/login');
//   };

//   const handleRequireAuth = (intent = 'play') => {
//     setTimeout(() => {
//       setAuthModalOpen(true);
//       setAuthIntent(intent);
//     }, 0);
//   };

//   const handleLoginFormDisplay = () => setFormDisplay('login');
//   const handleSignupFormDisplay = () => setFormDisplay('signup');

//   const lastLogin = localStorage.getItem('lastLogin');
//   const showArtist = isArtistLoggedIn && lastLogin === 'artist';
//   const showUser = isUserLoggedIn && lastLogin === 'user';
  
//   const bottomNavHeight = isUserLoggedIn && isMobile && !isNotMediaPlayerAllowed ? 82 : 0;

//   return (
//     <BookingIdProvider>
//       <AdAudioProvider>
//         <AudioPlayerProvider onRequireAuth={handleRequireAuth}>
//           <Orchestrator />
//           <AppUI
//             theme={theme}
//             isUserLoggedIn={isUserLoggedIn}
//             isArtistLoggedIn={isArtistLoggedIn}
//             isPublicArtistPage={isPublicArtistPage}
//             isNotMediaPlayerAllowed={isNotMediaPlayerAllowed}
//             isMobile={isMobile}
//             mobileTop={mobileTop}
//             setMobileTop={setMobileTop}
//             formDisplay={formDisplay}
//             setFormDisplay={setFormDisplay}
//             handleArtistSignupFormDisplay={handleArtistSignupFormDisplay}
//             handleLoginFormDisplay={handleLoginFormDisplay}
//             handleSignupFormDisplay={handleSignupFormDisplay}
//             authModalOpen={authModalOpen}
//             setAuthModalOpen={setAuthModalOpen}
//             authAction={authAction}
//             setAuthAction={setAuthAction}
//             authIntent={authIntent}
//             setIsPlayerActive={setIsPlayerActive}
//             setPlayerHeight={setPlayerHeight}
//             bottomNavHeight={bottomNavHeight}
//             adNoticeOpen={adNoticeOpen}
//             adNoticeMessage={adNoticeMessage}
//             setAdNoticeOpen={setAdNoticeOpen}
//             onCreatePlaylist={onCreatePlaylist}
//           />
//         </AudioPlayerProvider>
//       </AdAudioProvider>
//     </BookingIdProvider>
//   );
// }

function AppBody({ onCreatePlaylist }) {
  try {
    console.log('🟢 AppBody starting');
    
    const theme = useTheme();
    const [isHydrated, setIsHydrated] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authAction, setAuthAction] = useState('login');
    const [authIntent, setAuthIntent] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    console.log('🟢 AppBody hooks initialized');

    const [isPlayerActive, setIsPlayerActive] = useState(false);
    const [playerHeight, setPlayerHeight] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [formDisplay, setFormDisplay] = useState('');
    const [mobileTop, setMobileTop] = useState({ title: 'Home', showSearch: false });
    const [adNoticeOpen, setAdNoticeOpen] = useState(false);
    const [adNoticeMessage, setAdNoticeMessage] = useState('Playback will resume after the advertisement finishes.');

    const isUserLoggedIn = UserAuth.loggedIn();
    const isArtistLoggedIn = ArtistAuth.isArtist();

    const tabMetaFromPath = useCallback((path) => {
      switch (true) {
        case path.startsWith('/search'):
          return { title: 'Explore', showSearch: true };
        case path.startsWith('/library') || path.startsWith('/playlists'):
          return { title: 'Library', showSearch: false };
        case path.startsWith('/favorites'):
          return { title: 'Favorites', showSearch: false };
        case path.startsWith('/profile'):
          return { title: 'Profile', showSearch: false };
        default:
          return { title: 'Home', showSearch: false };
      }
    }, []);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
      setMobileTop(tabMetaFromPath(pathname));
    }, [pathname, tabMetaFromPath]);

    useEffect(() => {
      if (!pathname.startsWith('/welcome')) return;
      const params = new URLSearchParams(location.search);
      if (params.get('login') === '1' && formDisplay !== 'login') {
        setFormDisplay('login');
        return;
      }
      if (params.get('signup') === '1' && formDisplay !== 'signup') {
        setFormDisplay('signup');
      }
    }, [formDisplay, location.search, pathname]);

    useEffect(() => {
      const handleAdBlockNotice = (payload) => {
        setAdNoticeMessage(payload?.message || 'Playback will resume after the advertisement finishes.');
        setAdNoticeOpen(true);
      };
      eventBus.on("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
      return () => eventBus.off("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
    }, []);

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    if (!isHydrated) {
      return null;
    }

    const isPublicArtistPage =
      pathname.startsWith('/artist/register') ||
      pathname.startsWith('/artist/login') ||
      pathname.startsWith('/artist/verification') ||
      pathname.startsWith('/artist/plan') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/user/login') ||
      pathname.startsWith('/user/signup');

    const shouldHideGuestChrome =
      pathname.startsWith('/terms') || isPublicArtistPage;

    const isNotMediaPlayerAllowed =
      pathname.startsWith('/artist/studio') ||
      pathname.startsWith('/artist/dashboard') ||
      pathname.startsWith('/checkout');

    const handleArtistSignupFormDisplay = () => {
      navigate('/artist/login');
    };

    const handleRequireAuth = (intent = 'play') => {
      setTimeout(() => {
        setAuthModalOpen(true);
        setAuthIntent(intent);
      }, 0);
    };

    const handleLoginFormDisplay = () => setFormDisplay('login');
    const handleSignupFormDisplay = () => setFormDisplay('signup');

    const lastLogin = localStorage.getItem('lastLogin');
    const showArtist = isArtistLoggedIn && lastLogin === 'artist';
    const showUser = isUserLoggedIn && lastLogin === 'user';
    
    const bottomNavHeight = isUserLoggedIn && isMobile && !isNotMediaPlayerAllowed ? 82 : 0;

    console.log('🟢 AppBody returning JSX');
    
    return (
      <BookingIdProvider>
        <AdAudioProvider>
          <AudioPlayerProvider onRequireAuth={handleRequireAuth}>
            <Orchestrator />
            <AppUI
              theme={theme}
              isUserLoggedIn={isUserLoggedIn}
              isArtistLoggedIn={isArtistLoggedIn}
              isPublicArtistPage={isPublicArtistPage}
              isNotMediaPlayerAllowed={isNotMediaPlayerAllowed}
              isMobile={isMobile}
              mobileTop={mobileTop}
              setMobileTop={setMobileTop}
              formDisplay={formDisplay}
              setFormDisplay={setFormDisplay}
              handleArtistSignupFormDisplay={handleArtistSignupFormDisplay}
              handleLoginFormDisplay={handleLoginFormDisplay}
              handleSignupFormDisplay={handleSignupFormDisplay}
              authModalOpen={authModalOpen}
              setAuthModalOpen={setAuthModalOpen}
              authAction={authAction}
              setAuthAction={setAuthAction}
              authIntent={authIntent}
              setIsPlayerActive={setIsPlayerActive}
              setPlayerHeight={setPlayerHeight}
              bottomNavHeight={bottomNavHeight}
              adNoticeOpen={adNoticeOpen}
              adNoticeMessage={adNoticeMessage}
              setAdNoticeOpen={setAdNoticeOpen}
              onCreatePlaylist={onCreatePlaylist}
            />
          </AudioPlayerProvider>
        </AdAudioProvider>
      </BookingIdProvider>
    );
  } catch (error) {
    console.error('❌ AppBody crashed:', error);
    console.error('Stack:', error.stack);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>AppBody Error</h2>
        <pre>{error.message}</pre>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
      </div>
    );
  }
}


function AppUI({
  theme,
  isUserLoggedIn,
  isArtistLoggedIn,
  isPublicArtistPage,
  isNotMediaPlayerAllowed,
  isMobile,
  mobileTop,
  setMobileTop,
  formDisplay,
  setFormDisplay,
  handleArtistSignupFormDisplay,
  handleLoginFormDisplay,
  handleSignupFormDisplay,
  authModalOpen,
  setAuthModalOpen,
  authAction,
  setAuthAction,
  authIntent,
  setIsPlayerActive,
  setPlayerHeight,
  bottomNavHeight,
  adNoticeOpen,
  adNoticeMessage,
  setAdNoticeOpen,
  onCreatePlaylist
}) {
  const { currentTrack } = useAudioPlayer();
  const location = useLocation();
  const pathname = location.pathname;

  const lastLogin = localStorage.getItem('lastLogin');
  const showArtist = isArtistLoggedIn && lastLogin === 'artist';
  const showUser = isUserLoggedIn && lastLogin === 'user';
  const shouldHideGuestChrome =
    pathname.startsWith('/terms') ||
    pathname.startsWith('/password-reset') ||
    pathname.startsWith('/artist/login') ||
    formDisplay !== '';
  const guestChromeVisible =
    !isUserLoggedIn && !isArtistLoggedIn && !shouldHideGuestChrome;
  const isGuestView = guestChromeVisible;
  const showGuestNav = guestChromeVisible;
  const showGuestSearch = showGuestNav && !pathname.startsWith('/artist/');
  const showUserSidebar =
    isUserLoggedIn && !isMobile && !isPublicArtistPage && !isNotMediaPlayerAllowed;

  const guestBottomNavHeight = guestChromeVisible && isMobile ? 72 : 0;
  const effectiveBottomNavHeight = bottomNavHeight + guestBottomNavHeight;
  const showPanel = showGuestNav || showUserSidebar;
  const panelOffset = showGuestNav
    ? 'calc(var(--guest-sidebar-width) + var(--guest-sidebar-gap) + 2px)'
    : showUserSidebar
      ? 'calc(var(--user-sidebar-width) + var(--user-sidebar-gap) + 2px)'
      : 0;
  const mainMarginTop = !isUserLoggedIn ? { xs: 0, md: 0 } : { xs: 0, md: 0 };

  const isStandaloneArtistPage =
    isPublicArtistPage && !isUserLoggedIn && !isArtistLoggedIn;

  if (isStandaloneArtistPage) {
    return (
      <div
        className="app-container public-artist-shell"
        style={{
          minHeight: '100dvh',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div
      className={`app-container${showGuestNav ? ' guest-view' : ''}`}
      style={{
        backgroundColor: theme.palette.background.paper,
        '--safe-top': 'env(safe-area-inset-top, 0px)',
        '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        '--player-height': '68px',
        '--bottom-nav-height': `${effectiveBottomNavHeight}px`,
        '--guest-sidebar-width': 'clamp(280px, 30vw, 400px)',
        '--guest-sidebar-gap': theme.spacing(3),
        '--user-sidebar-width': 'clamp(280px, 30vw, 400px)',
        '--user-sidebar-gap': theme.spacing(3),
        paddingBottom: `calc(${effectiveBottomNavHeight}px + env(safe-area-inset-bottom, 0px))`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
      }}
    >


      {/* Guest NavBar */}
      {showGuestNav && (
        <WelcomeAppNavBar
          handleLoginFormDisplay={handleLoginFormDisplay}
          handleSignupFormDisplay={handleSignupFormDisplay}
          handleArtistSignupFormDisplay={handleArtistSignupFormDisplay}
          showSearch={showGuestSearch}
          sidebarOffset={isGuestView ? 'var(--guest-sidebar-width)' : 0}
        />
      )}



      {isArtistLoggedIn && !isPublicArtistPage  && !isNotMediaPlayerAllowed && (
<ArtistGuestViewAppBar />
      )}

      {/* Header when user is logged in */}
      {isUserLoggedIn && !isPublicArtistPage && !isNotMediaPlayerAllowed && (
        <UserNavBar />
      )}

      {/* Main content with flex: 1 to push everything down */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
        }}
      >
        {showGuestNav && (
          <Box
            sx={{
              position: 'fixed',
              top: { xs: 72, md: 101 }, // header height
              left: 0,
              ml: { xs: 0, md: 2 },
              width: { xs: 'var(--guest-sidebar-width)', md: 'calc(var(--guest-sidebar-width) - 16px)' },
              height: { xs: 'calc(100vh - 72px)', md: 'calc(100vh - 96px)' },
              zIndex: 10,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <WelcomeSideNavbar
              handleLoginFormDisplay={handleLoginFormDisplay}
              handleSignupFormDisplay={handleSignupFormDisplay}
            />
          </Box>
        )}


        {showUserSidebar && (
          <Box
            sx={{
              position: 'fixed',
              top: { xs: 72, md: 104 },
              left: 0,
              ml: { xs: 0, md: 2 },
              width: { xs: 'var(--user-sidebar-width)', md: 'calc(var(--user-sidebar-width) - 16px)' },
              height: { xs: 'calc(100vh - 72px)', md: 'calc(100vh - 96px)' },
              zIndex: 10,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <UserSideBar />
          </Box>
        )}






{/* Main start */}
        <Box
          sx={(theme) => ({
            flex: 1,
            minWidth: 0,
            ml: showPanel ? { xs: 0, md: panelOffset } : 0,
            border: showPanel ? `1px solid ${theme.palette.divider}` : 'none',
            borderRadius: showPanel ? 3 : 0,
            mt: isUserLoggedIn ? { xs: 0, md: 0 } : { xs: 0, md: 2.5 },
            mr: 0,
            pl: showPanel ? { xs: 0, md: 2.5 } : 0,
            pr: 0,
            py: showPanel ? { xs: 0, md: 2 } : 0,
            backgroundColor: showPanel ? alpha(theme.palette.background.paper, 0.6) : 'transparent',
          })}
        >


          
          <main className="main-content">
          {formDisplay === '' && (
            <Outlet
              context={{
                isUserLoggedIn,
                onSwitchToLogin: () => setFormDisplay('login'),
                onSwitchToSignup: () => setFormDisplay('signup'),
                onCreatePlaylist,
              }}
            />
          )}

          <Suspense fallback={null}>
            {formDisplay === 'login' && (
              <LazyUserLoginPage
                onSwitchToSignup={() => setFormDisplay('signup')}
                onClose={() => setFormDisplay('')}
              />
            )}
            {formDisplay === 'signup' && (
              <LazyUserSignupPage
                onSwitchToLogin={() => setFormDisplay('login')}
                onClose={() => setFormDisplay('')}
              />
            )}
          </Suspense>
          </main>

          {/* Guest Footer */}
          {showGuestNav && (
            <Footer
              handleLoginFormDisplay={handleLoginFormDisplay}
              handleSignupFormDisplay={handleSignupFormDisplay}
            />
          )}
        </Box>

      </Box>


      

      {/* Global Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSwitchToLogin={() => {
          setAuthAction('login');
          setFormDisplay('login');
          setAuthModalOpen(false);
        }}
        onSwitchToSignup={() => {
          setAuthAction('signup');
          setFormDisplay('signup');
          setAuthModalOpen(false);
        }}
        currentSong={currentTrack}
        theme={theme}
      />

      <PlayerSlot
        isPublicArtistPage={isPublicArtistPage}
        isNotMediaPlayerAllowed={isNotMediaPlayerAllowed}
        formDisplay={formDisplay}
        isUserLoggedIn={isUserLoggedIn}
        isMobile={isMobile}
        theme={theme}
        bottomOffset={effectiveBottomNavHeight}
        onPlayerStateChange={(isActive, height) => {
          setIsPlayerActive(isActive);
          setPlayerHeight(height);
        }}
      />

      
      <PauseOnLogin formDisplay={formDisplay} />

      {/* Ad-blocking notice modal */}
      <Modal
        open={adNoticeOpen}
        onClose={() => setAdNoticeOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            maxWidth: 420,
            width: '100%',
            bgcolor: 'rgba(5,5,9,0.95)',
            border: '1px solid',
            borderColor: 'rgba(228,196,33,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            borderRadius: 3,
            p: 3,
            textAlign: 'center',
            color: '#fff',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
              Advertisement in Progress
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {adNoticeMessage}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setAdNoticeOpen(false)}
              sx={{
                bgcolor: '#E4C421',
                color: '#0f0f0f',
                px: 3,
                '&:hover': { bgcolor: '#f3d23a' }
              }}
            >
              Got it
            </Button>
          </Stack>
        </Paper>
      </Modal>

      {/* ✅ Fixed Bottom Navbar - At the very bottom */}
      {guestChromeVisible && isMobile && <GuestBottomNav />}

      {isUserLoggedIn && isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--bottom-nav-height, 72px)',
            zIndex: 1200,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            transition: 'bottom 0.3s ease', // Smooth transition
          }}
        >
          <UserButtonMobileNavBar
            onTabChange={(tab) => {
              if (!tab) return;
              setMobileTop({
                title: tab.display || tab.label,
                showSearch: tab.label === 'Search'
              });
            }}
            onCreatePlaylist={onCreatePlaylist}
          />
        </Box>
      )}
    </div>
  );
}


function App() {
  const [createPlaylistModalOpen, setCreatePlaylistModalOpen] = useState(false);

  return (
    <ApolloProvider client={client}>
      <UserProvider>
        <LocationProvider>
          <LocationGate>
            <ToastContainer position="top-right" autoClose={3000} />
            <AppBody
              onCreatePlaylist={() => setCreatePlaylistModalOpen(true)}
            />
            <AddToPlaylistModal
              open={createPlaylistModalOpen}
              onClose={() => setCreatePlaylistModalOpen(false)}
              track={null}
            />
          </LocationGate>
        </LocationProvider>
      </UserProvider>
    </ApolloProvider>
  );
}


export default App;

// Player slot that hides when no track is loaded
function PlayerSlot({ isPublicArtistPage, isNotMediaPlayerAllowed, formDisplay, isUserLoggedIn, isMobile, theme, bottomOffset }) {
  const { currentTrack, playerState } = useAudioPlayer();
  const isAdPlaying = playerState?.isAdPlaying;
  if (!currentTrack && !isAdPlaying) return null;
  if (isPublicArtistPage || isNotMediaPlayerAllowed || formDisplay !== '') return null;

  return (
    <Box 
      sx={{
        position: 'fixed',
        bottom: {
          xs: isMobile ? `${bottomOffset || 0}px` : 0,
          md: 0
        },
        left: 0,
        right: 0,
        height: 'var(--player-height, 68px)',
        // Keep player beneath drawers so sidebar buttons stay clickable
        zIndex: theme?.zIndex?.appBar ?? 1100,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        transform: 'translateY(0)', // Ensure no gap
      }}
    >
      <MediaPlayerContainer />
    </Box>
  );
}
