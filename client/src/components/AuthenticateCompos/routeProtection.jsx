import { Navigate } from 'react-router-dom';
import UserAuth from '../../utils/auth.js';
import ArtistAuth from '../../utils/artist_auth.js';

export const ProtectedRoute = ({ element }) => {
  const isLoggedIn = UserAuth.loggedIn();
  return isLoggedIn ? element : <Navigate to="/loginSignin?login=1" replace />
};

export const ArtistProtectedRoute = ({ element, redirectToVerification = false }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();

  if (!isArtistLoggedIn) {
    console.warn('Redirecting to /artist/login.');
    return <Navigate to="/artist/login" replace />;
  }

  if (redirectToVerification && profile?.data && !profile.data.confirmed) {
    console.warn('Redirecting to /artist/verification.');
    return <Navigate to="/artist/verification" replace />;
  }

  return element;
};
