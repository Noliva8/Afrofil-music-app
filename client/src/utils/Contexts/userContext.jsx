

import { createContext, useContext, useState, useEffect } from 'react';
import UserAuth from '../auth.js';


const UserContext = createContext();










// ---------- provider ----------
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 

  const normalizeUser = (userData) => {
    if (!userData) return null;
    const role = Object.hasOwnProperty.call(userData, 'role')
      ? userData.role?.toLowerCase()
      : 'user';
    return { ...userData, role };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (UserAuth.loggedIn()) {
          const profile = UserAuth.getProfile();
          setUser(normalizeUser(profile?.data));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = (userData) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    UserAuth.logout();
    setUser(null);
  };

  // ---------- location ----------






  // Run once after auth has initialized (login/app entry).
  // do not add other deps per your "don’t change settings" note

  // ---------- context value (unchanged shape) ----------
  const authState = {
    user,
    loading,
    isGuest: !user && !loading,
    isRegular: user?.role === 'regular',
    isPremium: user?.role === 'premium',
    isAdmin: user?.role === 'admin',
    hasRole: (role) => user?.role === role,
    login,
    logout
    // (Intentionally NOT adding geo/refreshGeo to keep provider API unchanged)
  };

  return (
    <UserContext.Provider value={authState}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};































// --------------------------------------------------------------

// import { createContext, useContext, useState, useEffect } from 'react';
// import UserAuth from '../auth.js';
// import { userLocation } from '../geoClient.js';
// import { useMutation } from '@apollo/client';
// import { USER_LOCATION_DETECT } from '../mutations.js';

// const UserContext = createContext();



// const GEO_KEY = 'af_geo_v3';
// const GEO_TTL_MS = 24 * 60 * 1000;


// // some helpers to use in geo services

// const loadGeoCache = () => {
//   try {
//     const raw = localStorage.getItem(GEO_KEY);
//     if (!raw) return null;
//     const v = JSON.parse(raw);
//     if (!v || v.version !== 3) return null;
//     if (Date.now() - (v.resolvedAt ?? 0) > GEO_TTL_MS) return null;
//     return v; // { country, countryCode, region, city, method, resolvedAt, version }
//   } catch {
//     return null;
//   }
// };


// const saveGeoCache = (geo) => {
//   try { localStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch {}
// };









// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [detectUserLocation] = useMutation(USER_LOCATION_DETECT);



//   // Safe role normalization - only falls back if role is missing/undefined

//   const normalizeUser = (userData) => {
//     if (!userData) return null;
    
//     // Explicit check for undefined or missing role property
//     const role = Object.hasOwnProperty.call(userData, 'role') 
//       ? userData.role?.toLowerCase() 
//       : 'user'; // Fallback ONLY if role property doesn't exist
    
//     return {
//       ...userData,
//       role 
//     };
//   };

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         if (UserAuth.loggedIn()) {
//           const profile = UserAuth.getProfile();
//           setUser(normalizeUser(profile?.data));
//         }
//       } catch (error) {
//         console.error("Auth initialization error:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     initializeAuth();
//   }, []);

//   const login = (userData) => {
//     const normalizedUser = normalizeUser(userData);
//     setUser(normalizedUser);
//     return normalizedUser;
//   };

//   const logout = () => {
//     UserAuth.logout();
//     setUser(null);
//   };












// // detect location
// const [geo, setGeo] = useState(loadGeoCache());

// const refreshGeo = async (force = false) => {
//   // 1) Use cache unless forced
//   if (!force) {
//     const cached = loadGeoCache();
//     if (cached) {
//       setGeo(cached);
//       return cached;
//     }
//   }

//   // 1) Try GPS (silent; won't reprompt if already granted)

// let lat = null;
// let lon = null;


//   try {
//     if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
//       const pos = await userLocation({
//         enableHighAccuracy: false,
//         timeoutMs: 4000,
//         maximumAge: 15 * 60 * 1000,
//       });
//       lat = Number(pos.latitude);
//       lon = Number(pos.longitude);
//     }
//   } catch {
//     // ignore — we'll fall back
//   }

//   // we send the lat and lon, if null the server will decider
//   try {
//     const result = await detectUserLocation({
//       variables: { lon, lat }, 
//     });

//     const payload = result?.data?.detectUserLocation;
//     if (payload) {
//       // payload shape: { country, state, city, province, region }
//       setGeo(payload);
//       saveGeoCache(payload);
//       return payload;
//     }
//   } catch (err) {
//     console.error('detectUserLocation failed:', err);
//     // fall back to cache if any
//     const cached = loadGeoCache();
//     if (cached) {
//       setGeo(cached);
//       return cached;
//     }
//   }

//   return null;
// };










// // -----------------------------------
//   // Auth state with explicit role handling
//   const authState = {
//     user,
//     loading,
//     isGuest: !user && !loading,
    
//     // Role checks (will respect null/empty roles if explicitly set)
//     isRegular: user?.role === 'regular',
//     isPremium: user?.role === 'premium',
//     isAdmin: user?.role === 'admin',
    
//     // Flexible role check that handles all cases
//     hasRole: (role) => user?.role === role,
    
//     // Auth methods
//     login,
//     logout
//   };


//   return (
//     <UserContext.Provider value={authState}>
//       {!loading && children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => {
//   const context = useContext(UserContext);
//   if (!context) {
//     throw new Error('useUser must be used within a UserProvider');
//   }
//   return context;
// };