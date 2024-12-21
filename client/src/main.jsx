import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ArtistLogin from './pages/ArtistLogin.jsx';
import App from './App.jsx';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlist from './pages/Playlist';
import Libraly from './pages/Libraly';
import More from './pages/More';
import ArtistRegister from './pages/ArtistRegister'; 
import ArtistDashboard from './pages/ArtistDashboard'; 
import ArtistVerificationPage from './components/ArtistVerficationPage.jsx';
import LoginSignin from './pages/LoginSignin';
import ErrorPage from './pages/ErrorPage';
import UserAuth from './utils/auth.js';
import artist_auth from './utils/artist_auth.js';
import ArtistVerificationPageAfterClick from './pages/ArtistVerificationPageAfterClick .jsx';

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = UserAuth.loggedIn(); // Check if the user is authenticated
  return isLoggedIn ? element : <Navigate to="/loginSignin" replace />;
};

const ArtistProtectedRoute = ({ element, redirectToVerification = false }) => {
  const isArtistLoggedIn = artist_auth.isArtist();
  const profile = artist_auth.getProfile(); // Fetch profile from auth

  if (!isArtistLoggedIn) {
    return <Navigate to="/loginSignin" replace />;
  }

  // Log profile data for debugging
  console.log("Artist profile:", profile);

  // Redirect to verification if profile is not confirmed
  if (redirectToVerification && profile && !profile.confirmed) {
    console.log("Redirecting to verification page...");
    return <Navigate to="/artist/verification" replace />;
  }

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
        path: "search",
        element: <ProtectedRoute element={<Search />} />, // Protect search route
      },
      {
        path: "createPlaylist",
        element: <ProtectedRoute element={<Playlist />} />, // Protect playlist route
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
        path: "loginSignin",
        element: <LoginSignin />, // Public route for login/sign-in
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
        path: "artist/dashboard",
        element: <ArtistProtectedRoute 
          element={<ArtistDashboard />} 
          redirectToVerification={true} 
        />,
      },

      {
        path: "confirmation/:artist_id_token",
        element: <ArtistVerificationPageAfterClick />, 
      },

      {
        path: 'artist/login',
        element: <ArtistLogin />
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
