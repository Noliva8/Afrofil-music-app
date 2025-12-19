import "./entry.css";
import { useState, useEffect } from "react";
import NavTabs from "./components/NavTabs";
import ProfileDropdown from "./components/ProfileDropdown";
import { useCallback } from "react";
import MobileNav from "./components/MobileNav"; // New component for mobile
import BottomNav from "./components/BottomNav";
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

import UserAuth from "./utils/auth";
import ArtistAuth from "./utils/artist_auth";

import WelcomeAppNavBar from "./components/WelcomePage/WelcomAppNavBar";
import Footer from "./pages/Footer";
import ForArtistOnly from "./components/ForArtistOnly";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LoginSignin from "./pages/LoginSignin";
import { useNavigate, useLocation } from 'react-router-dom'; 
import { UserProvider } from "./utils/Contexts/userContext.jsx";
import { LocationProvider  } from "./utils/Contexts/useLocationContext.jsx";

import LocationGate from "./utils/Contexts/LocationGate.jsx";
import { AudioPlayerProvider, useAudioPlayer } from "./utils/Contexts/AudioPlayerContext.jsx";
import { AdAudioProvider } from "./utils/Contexts/adPlayer/adPlayerProvider.jsx";
import Orchestrator from "./utils/Contexts/adPlayer/orchestrator.jsx";

import AuthModal from "./components/WelcomePage/AuthModal.jsx";
import MediaPlayerContainer from "./components/MusicPlayer/MediaPlayerContainer.jsx";
import { Modal, Paper, Typography, Button, Stack } from "@mui/material";
import { eventBus } from "./utils/Contexts/playerAdapters.js";


import PauseOnLogin from "./utils/Contexts/pauseOnLogin.js";

import UserTopMobileNavbar from "./components/AuthenticateCompos/UserTopMobileNavbar.jsx";

// Apollo Client setup remains the same...
const httpLink = createUploadLink({ uri: "/graphql" });

import UserNavBar from "./components/AuthenticateCompos/UserNavBar.jsx";

import { UserButtonMobileNavBar } from "./components/AuthenticateCompos/UserButtonMobileNavBar.jsx";


const authLink = setContext((_, { headers }) => {
  const userToken = localStorage.getItem("user_id_token");
  const artistToken = localStorage.getItem("artist_id_token");
  
  const headersWithAuth = { ...headers };
  
  // Set both headers, backend will use the valid one
  if (artistToken) {
    headersWithAuth['x-artist-authorization'] = `Bearer ${artistToken}`;
  }
  if (userToken) {
    headersWithAuth['x-user-authorization'] = `Bearer ${userToken}`;
  }
  
  return { headers: headersWithAuth };
});




const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:3001/graphql",
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
    shouldRetry: (err) => !err.message.includes("Authentication failed"),
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




 const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});


function AppBody() {
  const theme = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('login');
  const [authIntent, setAuthIntent] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

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
    const handleAdBlockNotice = (payload) => {
      setAdNoticeMessage(payload?.message || 'Playback will resume after the advertisement finishes.');
      setAdNoticeOpen(true);
    };
    eventBus.on("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
    return () => eventBus.off("AD_BLOCK_PLAY_ATTEMPT", handleAdBlockNotice);
  }, []);

  const isPublicArtistPage =
    pathname.startsWith('/artist/register') ||
    pathname.startsWith('/artist/login') ||
    pathname.startsWith('/artist/verification');

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

  return (
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
          
         
        
        />
      </AudioPlayerProvider>
    </AdAudioProvider>
  );
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
  setAdNoticeOpen
}) {
  const { currentTrack } = useAudioPlayer();

  const lastLogin = localStorage.getItem('lastLogin');
  const showArtist = isArtistLoggedIn && lastLogin === 'artist';
  const showUser = isUserLoggedIn && lastLogin === 'user';

  return (
    <div
      className="app-container"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(228, 196, 33, 0.03) 0%, transparent 25%),
          linear-gradient(to bottom, #0F0F0F, #1A1A1A)
        `,
        '--safe-top': 'env(safe-area-inset-top, 0px)',
        '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        '--player-height': '68px',
        '--bottom-nav-height': `${bottomNavHeight}px`,
        paddingBottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Guest NavBar */}
      {!isUserLoggedIn && !isArtistLoggedIn && !isPublicArtistPage && formDisplay === '' && (
        <WelcomeAppNavBar
          handleLoginFormDisplay={handleLoginFormDisplay}
          handleSignupFormDisplay={handleSignupFormDisplay}
          handleArtistSignupFormDisplay={handleArtistSignupFormDisplay}
          onSwitchToLogin={() => setFormDisplay('login')}
          onSwitchToSignup={() => setFormDisplay('signup')}
        />
      )}

      {/* Header when user is logged in */}
      {isUserLoggedIn && !isPublicArtistPage && !isNotMediaPlayerAllowed && !isMobile && (
        <UserNavBar/>
      )}
      {isUserLoggedIn && !isPublicArtistPage && !isNotMediaPlayerAllowed &&  isMobile && (
        <UserTopMobileNavbar
          title={mobileTop.title}
          showSearch={mobileTop.showSearch}
        />
      )}

      {/* Main content with flex: 1 to push everything down */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <main className="main-content">
          {formDisplay === '' && (
            <Outlet
              context={{
                isUserLoggedIn,
                onSwitchToLogin: () => setFormDisplay('login'),
                onSwitchToSignup: () => setFormDisplay('signup')
              }}
            />
          )}

          {formDisplay === 'login' && (
            <LoginSignin
              display="login"
              onSwitchToLogin={() => setFormDisplay('login')}
              onSwitchToSignup={() => setFormDisplay('signup')}
              onClose={() => setFormDisplay('')}
              isUserLoggedIn={isUserLoggedIn}
            />
          )}

          {formDisplay === 'signup' && (
            <LoginSignin
              display="signup"
              onSwitchToLogin={() => setFormDisplay('login')}
              onSwitchToSignup={() => setFormDisplay('signup')}
              onClose={() => setFormDisplay('')}
              isUserLoggedIn={isUserLoggedIn}
            />
          )}
        </main>

        {/* Guest Footer */}
        {!isUserLoggedIn && !isArtistLoggedIn && !isPublicArtistPage && formDisplay === '' && (
          <Footer
            handleLoginFormDisplay={handleLoginFormDisplay}
            handleSignupFormDisplay={handleSignupFormDisplay}
          />
        )}
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
          />
        </Box>
      )}
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <UserProvider>
        <LocationProvider>
          <LocationGate>
            <AppBody />
          </LocationGate>
        </LocationProvider>
      </UserProvider>
    </ApolloProvider>
  );
}

export default App;

// Player slot that hides when no track is loaded
function PlayerSlot({ isPublicArtistPage, isNotMediaPlayerAllowed, formDisplay, isUserLoggedIn, isMobile, theme }) {
  const { currentTrack, playerState } = useAudioPlayer();
  const isAdPlaying = playerState?.isAdPlaying;
  if (!currentTrack && !isAdPlaying) return null;
  if (isPublicArtistPage || isNotMediaPlayerAllowed || formDisplay !== '') return null;

  return (
    <Box 
      sx={{
        position: 'fixed',
        bottom: {
          xs: isUserLoggedIn && isMobile ? 'var(--bottom-nav-height, 72px)' : 0,
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
