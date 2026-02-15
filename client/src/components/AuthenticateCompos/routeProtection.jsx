import { Navigate } from 'react-router-dom';
import UserAuth from '../../utils/auth.js';
import ArtistAuth from '../../utils/artist_auth.js';
import { element } from 'prop-types';

export const ProtectedRoute = ({ element }) => {
  const isLoggedIn = UserAuth.loggedIn();
  return isLoggedIn ? element : <Navigate to="/loginSignin" replace />;
};



// 3 type of protections: 

// protect the verify route to only allow logged in artists who are not yet verified, we will do this by checking the token for the artist and if they are logged in but not verified, we will redirect them to the verification page. we will check if verified by using confirmed field saved in the token when the artist logs in.


// 2. protect plan route to only alloow verified artist without a plan,

// 3. protect studio route to only allow verified artists with a plan.

// 4. all others routes that should be acccessible to all users



export const VerifyGate = ({ element }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();
  const isVerified = profile?.data?.confirmed;
  
  if (!isArtistLoggedIn) {
    console.warn('Redirecting to /artist/login.');
    return <Navigate to="/artist/login" replace />;
  }

  if (!isVerified) {
    console.warn('Redirecting to /artist/verification.');
    return <Navigate to="/artist/verification" replace />;
  }

  return element;
}

export const PlanGate = ({ element }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();
  const isVerified = profile?.data?.confirmed;
  const hasPlan = Boolean(profile?.data?.selectedPlan);

  if (!isArtistLoggedIn) {
    console.warn('Redirecting to /artist/login.');
    return <Navigate to="/artist/login" replace />;
  }

  if (!isVerified) {
    console.warn('Redirecting to /artist/verification.');
    return <Navigate to="/artist/verification" replace />;
  }

  if (hasPlan) {
    console.warn('Redirecting to /artist/studio/content.');
    return <Navigate to="/artist/studio/content" replace />;
  }

  return element;
}

export const StudioGate = ({ element }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();
  const isVerified = profile?.data?.confirmed;
  const hasPlan = Boolean(profile?.data?.selectedPlan);

  if (!isArtistLoggedIn) {
    console.warn('Redirecting to /artist/login.');
    return <Navigate to="/artist/login" replace />;
  }

  if (!isVerified) {
    console.warn('Redirecting to /artist/verification.');
    return <Navigate to="/artist/verification" replace />;
  }

  if (!hasPlan) {
    console.warn('Redirecting to /artist/plan.');
    return <Navigate to="/artist/plan" replace />;
  }

  return element;
};
