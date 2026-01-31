import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ArtistLogin from './pages/ArtistLogin.jsx';
import App from './App.jsx';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlist from './pages/Playlist';
import Libraly from './pages/Libraly';
import More from './pages/More';
import Explore from './pages/Explore';
import ExploreDetail from './pages/ExploreDetail.jsx';
import ArtistRegister from './pages/ArtistRegister'; 
import ArtistStudio from './pages/ArtistStudio'; 
import ArtistVerificationPage from './components/ArtistVerficationPage.jsx';
import LoginSignin from './pages/LoginSignin';
import SharedTrack from './pages/SharedTrack.jsx';
import ErrorPage from './pages/ErrorPage';
import UserAuth from './utils/auth.js';
import ArtistAuth from './utils/artist_auth.js';
import PlanSelection from './pages/Plans.jsx';
import ArtistDashboardPremium from './pages/ArtistDashboardPremium.jsx';
import ArtistDashboardProPlan from './pages/ArtistDashboardProPlan.jsx';
import ContentFreePlan from './pages/freeDashboard/ContentFreePlan.jsx';
import DashboardFreePlan from './pages/freeDashboard/DashboardFreePlan.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import Terms from './pages/Terms.jsx';
import CollectionPage from './pages/CollectionPage.jsx';
import CollectionLanding from './pages/CollectionLanding.jsx';
import PremiumCheckoutPage from './components/userComponents/Home/Premium/PremiumCheckoutPage.jsx';
const PremiumCheckoutWrapper = lazy(() =>
  import('./components/userComponents/Home/Premium/PremiumCheckoutWrapper.jsx')
);
const PremiumPromo = lazy(() => import('./pages/PremiumPromo.jsx'));
import ArtistPage from './components/ArtistPage.jsx';
import { SongPage } from './components/SongPage.jsx';
import { AlbumPage } from './pages/freeDashboard/AlbumPage.jsx';
import { SingleSongPage } from './components/SingleSongPage.jsx';
import { RadioStationPage } from './components/RadioStationPage.jsx';
import Feed from './pages/Feed.jsx';
import PasswordReset from './pages/PasswordReset.jsx';

import HomeFreePlan from './pages/freeDashboard/HomeFreePlan.jsx';
import CompletePageWrapper from './components/userComponents/Home/Premium/CompletePageWrapper.jsx';
import { afrofeelTheme } from './pages/CSS/themeSettins.js';
import { Support } from './pages/Support.jsx';


// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = UserAuth.loggedIn(); // Check if the user is authenticated
  return isLoggedIn ? element : <Navigate to="/loginSignin?login=1" replace />;
};



const ArtistProtectedRoute = ({ element, redirectToVerification = false }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();

  const profile = ArtistAuth.getProfile();

  // Debug logs
  // console.log("Artist Logged In:", isArtistLoggedIn);
  // console.log("Artist Profile:", profile);

  // Redirect to login if the artist is not logged in
  if (!isArtistLoggedIn) {
    console.warn("Redirecting to /artist/login.");
    return <Navigate to="/artist/login" replace />;
  }

  // Redirect to verification if required and the artist's profile is not confirmed
  if (redirectToVerification && profile?.data && !profile.data.confirmed) {
    console.warn("Redirecting to /artist/verification.");
    return <Navigate to="/artist/verification" replace />;
  }

  // Render the protected route element if all checks pass
  return element;
};





const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <ProtectedRoute element={<Home />} />, // Protect home route
      },

      {
        path: "checkout",
        element: (
          <ProtectedRoute
            element={
              <Suspense fallback={<div />}>
                <PremiumCheckoutWrapper />
              </Suspense>
            }
          />
        ),
      },

    {
    path: "complete",
    element: <ProtectedRoute element={<CompletePageWrapper />} />,
  },

      {
        path: "search",
        element: <Search />, 
      },
      {
        path: "search/:query?",
        element: <Search />,
      },
      {
        path: "password-reset",
        element: <PasswordReset />,
      },
      {
        path: "createPlaylist",
        element: <ProtectedRoute element={<Playlist />} />, // Protect playlist route
      },
      {
        path: "collection/:section",
        element: <ProtectedRoute element={<CollectionPage />} />,
      },
      {
        path: "collection/playlist/:playlistId",
        element: <ProtectedRoute element={<CollectionPage />} />,
      },
      {
        path: "collection/:section/:subsection",
        element: <ProtectedRoute element={<CollectionPage />} />,
      },
      {
        path: "collection",
        element: <CollectionLanding />,
      },
      {
        path: "library",
        element: <ProtectedRoute element={<Libraly />} />, // Protect library route
      },
      {
        path: "more",
        element: <ProtectedRoute element={<More />} />, // Protect more route
      },
      {
        path: "explore",
        element: <Explore />,
      },
      {
        path: "feed",
        element: <Feed />,
      },
      {
        path: "explore/:type/:name",
        element: <ExploreDetail />,
      },
      {
        path: "loginSignin",
        element: <LoginSignin />, 
      },
      {
        path: "premium",
        element: (
          <Suspense fallback={<div />}>
            <PremiumPromo />
          </Suspense>
        ),
      },
      {
        path: "terms",
        element: <Terms />,
      },
      {path: "support",
        element: <Support />
      },
      {
        path: "track/:trackId",
        element: <SharedTrack />,
      },
      {
        path: "artist/:artistId",
        element: <ArtistPage />,
      },
      {path: "album/:albumId/:songId",
        element: <SongPage />
      },
      {
        path: "song/:songId",
        element: < SingleSongPage />
      },
      {
        path: "radio/:stationId",
        element: <RadioStationPage />
      },
      {
        path: "radio/:stationId/:songId",
        element: <RadioStationPage />
      },

      {

        path: "album/:albumId",
        element: <AlbumPage />
      },

     
      
      {
        path: "artist/register",
        element: <ArtistRegister />,
      },
      {
        path: "artist/verification",
        element: <ArtistVerificationPage />,
      },

      {
        path: "artist/plan",
        element: (
        <ArtistProtectedRoute 
        element={<PlanSelection />}
        redirectToVerification={true}
        />
        ),
      }, 



{
  path: "artist/studio",
  element: (
    <ArtistProtectedRoute
      element={<ArtistStudio />}
      redirectToVerification={true}
    />
  ),
  children: [
    {
      path: "content",
      element: (
        <ArtistProtectedRoute
          element={<ContentFreePlan />}
          redirectToVerification={true}
        />
      ),
    },


     {
      path: "home",
      element: (
        <ArtistProtectedRoute
          element={<HomeFreePlan />}
          redirectToVerification={true}
        />
      ),
    },


    {
      path: "dashboard",
      element: (
        <ArtistProtectedRoute
          element={<DashboardFreePlan />}
          redirectToVerification={true}
        />
      ),
    },
  ],
},




{
  path: "artist/dashboard/ProPlan",
  element: (
    <ArtistProtectedRoute
      element={<ArtistDashboardProPlan />}
      redirectToVerification={true}
    />
  ),
},

{
  path: "artist/dashboard/premium",
  element: (
    <ArtistProtectedRoute
      element={<ArtistDashboardPremium />}
      redirectToVerification={true}
    />
  ),
},

      {
        path: "artist/login",
        element: <ArtistLogin />
      }
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
const renderApp = () =>
  root.render(
    <ThemeProvider theme={afrofeelTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );

renderApp();

const removeSplash = () => {
  const splash = document.getElementById("preload-splash");
  if (!splash) return;
  splash.classList.add("hidden");
  setTimeout(() => {
    splash.remove();
  }, 350);
};

if (document.readyState === "complete") {
  removeSplash();
} else {
  window.addEventListener("load", removeSplash, { once: true });
}
