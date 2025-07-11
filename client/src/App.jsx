import "./entry.css";
import { useState, useEffect } from "react";
import NavTabs from "./components/NavTabs";
import ProfileDropdown from "./components/ProfileDropdown";
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
import LoginSignin from "./pages/LoginSignin";
import { useNavigate, useLocation } from 'react-router-dom'; 
import { UserProvider } from "./utils/Contexts/userContext.jsx";
import { AudioPlayerProvider } from "./utils/Contexts/AudioPlayerContext.jsx";
import AuthModal from "./components/WelcomePage/AuthModal.jsx";
import MediaPlayerContainer from "./components/MusicPlayer/MediaPlayerContainer.jsx";
import { useAudioPlayer } from "./utils/Contexts/AudioPlayerContext.jsx";
import PauseOnLogin from "./utils/Contexts/pauseOnLogin.js";

// Apollo Client setup remains the same...
const httpLink = createUploadLink({ uri: "/graphql" });

const authLink = setContext((_, { headers }) => {
  const userToken = localStorage.getItem("user_id_token");
  const artistToken = localStorage.getItem("artist_id_token");
  return {
    headers: {
      ...headers,
      authorization: artistToken
        ? `Bearer ${artistToken}`
        : userToken
          ? `Bearer ${userToken}`
          : "",
    },
  };
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


function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('login');
  const [authIntent, setAuthIntent] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
 

  const isUserLoggedIn = UserAuth.loggedIn();
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [formDisplay, setFormDisplay] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPublicArtistPage =
    pathname.startsWith('/artist/register') ||
    pathname.startsWith('/artist/login') ||
    pathname.startsWith('/artist/verification');

  const handleArtistSignupFormDisplay = () => {
    navigate('/artist/register');
  };

  const handleRequireAuth = (intent = 'play') => {
    setTimeout(() => {
      setAuthModalOpen(true);
      setAuthIntent(intent);
    }, 0);
  };

  function handleLoginFormDisplay() {
    setFormDisplay('login');
  }

  function handleSignupFormDisplay() {
    setFormDisplay('signup');
  }

  const lastLogin = localStorage.getItem('lastLogin');
  const showArtist = isArtistLoggedIn && lastLogin === 'artist';
  const showUser = isUserLoggedIn && lastLogin === 'user';

  

 return (
  <ApolloProvider client={client}>
    <UserProvider>
      <AudioPlayerProvider onRequireAuth={handleRequireAuth}>
        <div
          className="app-container"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(228, 196, 33, 0.03) 0%, transparent 25%),
              linear-gradient(to bottom, #0F0F0F, #1A1A1A)
            `,
            '--safe-top': 'env(safe-area-inset-top, 0px)',
            '--safe-bottom': 'env(safe-area-inset-bottom, 0px)'
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

          <Box>
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

            {/* Bottom Navigation for mobile users */}
            {isUserLoggedIn && isMobile && <BottomNav />}
          </Box>

          {/* Global Auth Modal */}
          <AuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onSwitchToLogin={() => setAuthAction('login')}
            onSwitchToSignup={() => setAuthAction('signup')}
          />

          {/* ✅ Player and pause logic (must be inside the provider div) */}
          {formDisplay === '' && <MediaPlayerContainer />}
          <PauseOnLogin formDisplay={formDisplay} />
        </div>
      </AudioPlayerProvider>
    </UserProvider>
  </ApolloProvider>
);

}

export default App;
