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
import ArtistAuth from './utils/artist_auth.js';
import PlanSelection from './pages/plans.jsx';


// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = UserAuth.loggedIn(); // Check if the user is authenticated
  return isLoggedIn ? element : <Navigate to="/loginSignin" replace />;
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
        element: <LoginSignin />, 
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
  path: "artist/dashboard",
  element: (
    <ArtistProtectedRoute
      element={<ArtistDashboard />}
      redirectToVerification={true}
    />
  ),
},


      // {
      //   path: "confirmation/:artist_id_token",
      //   element: <ArtistVerificationPageAfterClick />, 
      // },

      {
        path: "artist/login",
        element: <ArtistLogin />
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
