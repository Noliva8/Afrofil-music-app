
import UserAuth from '../../utils/auth.js';
import ArtistAuth from '../../utils/artist_auth.js';
import { element } from 'prop-types';
import { useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

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









// export const PlanGate = ({ element }) => {
//   const isArtistLoggedIn = ArtistAuth.isArtist();
//   const profile = ArtistAuth.getProfile();
//   const isVerified = profile?.data?.confirmed;
//   const hasPlan = Boolean(profile?.data?.selectedPlan);

//   if (!isArtistLoggedIn) {
//     console.warn('Redirecting to /artist/login.');
//     return <Navigate to="/artist/login" replace />;
//   }

//   if (!isVerified) {
//     console.warn('Redirecting to /artist/verification.');
//     return <Navigate to="/artist/verification" replace />;
//   }

//   if (hasPlan) {
//     console.warn('Redirecting to /artist/studio/content.');
//     return <Navigate to="/artist/studio/content" replace />;
//   }

//   return element;
// }

const getStoredArtistConfirmed = () => {
  try {
    return localStorage.getItem('artist_confirmed') === 'true';
  } catch {
    return false;
  }
};

export const PlanGate = ({ element }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();
  const isVerified = profile?.data?.confirmed || getStoredArtistConfirmed();
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
    console.warn('Redirecting to /artist/studio/home.');
    return <Navigate to="/artist/studio/home" replace />;
  }

  return element;
};





// export const PlanGate = ({ element }) => {
//   const [searchParams] = useSearchParams();
//   const urlToken = searchParams.get('token');
  
//   useEffect(() => {
//     if (urlToken) {
//       console.log("Found token in URL, storing it...");
//       // Store the new token with updated confirmation status
//       localStorage.setItem('artistToken', urlToken);
//       // Clear old profile so it gets fetched fresh
//       localStorage.removeItem('artistProfile');
//       // Remove token from URL without reloading
//       window.history.replaceState({}, '', '/artist/plan');
//     }
//   }, [urlToken]);

//   const isArtistLoggedIn = ArtistAuth.isArtist();
//   const profile = ArtistAuth.getProfile();
//   const isVerified = profile?.data?.confirmed;
//   const hasPlan = Boolean(profile?.data?.selectedPlan);

//   console.log("PlanGate check:", {
//     isArtistLoggedIn,
//     isVerified,
//     hasPlan,
//     hasUrlToken: !!urlToken,
//     profile: profile?.data
//   });

//   if (!isArtistLoggedIn && !urlToken) {
//     console.warn('No token found, redirecting to login');
//     return <Navigate to="/artist/login" replace />;
//   }

//   if (isVerified === false) {
//     console.warn('Email not verified, redirecting to verification');
//     return <Navigate to="/artist/verification" replace />;
//   }

//   if (hasPlan) {
//     console.warn('User has plan, redirecting to studio');
//     return <Navigate to="/artist/studio/content" replace />;
//   }

//   console.log('Showing plan selection page');
//   return element;
// };







// export const StudioGate = ({ element }) => {
//   const isArtistLoggedIn = ArtistAuth.isArtist();
//   const profile = ArtistAuth.getProfile();
//   const isVerified = profile?.data?.confirmed;
//   const hasPlan = Boolean(profile?.data?.selectedPlan);

//   if (!isArtistLoggedIn) {
//     console.warn('Redirecting to /artist/login.');
//     return <Navigate to="/artist/login" replace />;
//   }

//   if (!isVerified) {
//     console.warn('Redirecting to /artist/verification.');
//     return <Navigate to="/artist/verification" replace />;
//   }

//   if (!hasPlan) {
//     console.warn('Redirecting to /artist/plan.');
//     return <Navigate to="/artist/plan" replace />;
//   }

//   return element;
// };


export const StudioGate = ({ element }) => {
  const isArtistLoggedIn = ArtistAuth.isArtist();
  const profile = ArtistAuth.getProfile();
  const isVerified = profile?.data?.confirmed || getStoredArtistConfirmed();

  // Check both sources for plan status
  const profileHasPlan = Boolean(profile?.data?.selectedPlan);
  
  // Check localStorage directly for the temporary plan data
  let tempHasPlan = false;
  try {
    const tempProfile = localStorage.getItem('artistProfile');
    if (tempProfile) {
      const parsed = JSON.parse(tempProfile);
      tempHasPlan = Boolean(parsed?.data?.selectedPlan);
    }
  } catch (error) {
    console.warn('Error checking temp profile:', error);
  }

  // hasPlan is true if EITHER source has it
  const hasPlan = profileHasPlan || tempHasPlan;

  // Add detailed logging
  console.log('========== STUDIO GATE ==========');
  console.log('Time:', new Date().toISOString());
  console.log('isArtistLoggedIn:', isArtistLoggedIn);
  console.log('isVerified:', isVerified);
  console.log('profileHasPlan:', profileHasPlan);
  console.log('tempHasPlan:', tempHasPlan);
  console.log('hasPlan (combined):', hasPlan);
  console.log('Profile data:', profile?.data);
  console.log('Raw selectedPlan value:', profile?.data?.selectedPlan);
  console.log('================================');

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

  console.log('✅ StudioGate passed, rendering element');
  return element;
};
