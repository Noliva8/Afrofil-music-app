// LocationContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { userLocation as getBrowserLocation } from '../geoClient'; 
import { useMutation } from '@apollo/client';
import { USER_LOCATION_DETECT } from '../mutations';

// -----------------------------
// Config
// -----------------------------
const GEO_KEY = 'af_geo_v3';
const GEO_TTL_MS = 30 * 24 * 60 * 60 * 1000; // ~30 days
const MOVE_KM_THRESHOLD = 130; // ~80 miles

// -----------------------------
// Helpers
// -----------------------------
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}


function clearGeoCache() {
  try { localStorage.removeItem(GEO_KEY); } catch {}
}


function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Strict TTL cache load
function loadGeoCache() {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || v.version !== 3) return null;
    if (Date.now() - (v.resolvedAt ?? 0) > GEO_TTL_MS) return null;
    return v; // {country,countryCode,region,city,state?,province?,lat?,lon?,acc?,monthKey?,resolvedAt,version}
  } catch {
    return null;
  }
}



// Lenient cache load (ignores TTL; used for movement/month decisions)
function loadGeoCacheLenient() {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v?.version === 3 ? v : null;
  } catch {
    return null;
  }
}

function saveGeoCache(geo) {
  try { localStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch {}
}

// Silent quick GPS; won't prompt if not granted
async function getQuickGpsOrNull() {
  if (!('geolocation' in navigator)) return null;
  try {
    if (navigator.permissions?.query) {
      const s = await navigator.permissions.query({ name: 'geolocation' });
      if (s.state !== 'granted') return null; // avoid prompting
    }
  } catch {}
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({
        lat: +p.coords.latitude.toFixed(6),
        lon: +p.coords.longitude.toFixed(6),
        acc: (typeof p.coords.accuracy === 'number' ? p.coords.accuracy : 0)
      }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 15 * 60 * 1000 }
    );
  });
}



// Accuracy-aware movement check
function movedBeyondThreshold(cached, next) {
  if (!cached || cached.lat == null || cached.lon == null || !next) return false;
  const distKm = haversineKm({ lat: cached.lat, lon: cached.lon }, next);
  const accKm = Math.max(cached.acc || 0, next.acc || 0) / 1000;
  const dynamic = Math.max(MOVE_KM_THRESHOLD, 3 * accKm); // widen by error bars
  return distKm >= dynamic;
}

// -----------------------------
// Context
// -----------------------------
const LocationContext = createContext(null);

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within a LocationProvider');
  return ctx;
}

// -----------------------------
// Provider
// -----------------------------
// export function LocationProvider({ children }) {
//   // Read cache ONCE for initial state to avoid double-localStorage hits
//   const initialGeo = (() => {
//     try { return loadGeoCache(); } catch { return null; }
//   })();

//   const [detectUserLocation] = useMutation(USER_LOCATION_DETECT);
//   const [geo, setGeo] = useState(initialGeo);
//   // If we already have cache, don't show a spinner on mount; we'll do a silent check
//   const [loadingGeo, setLoadingGeo] = useState(!initialGeo);
//   const [errorGeo, setErrorGeo] = useState(null);

//   // Decide whether to call server or reuse cache
//   const refreshGeo = async (withSpinner = true) => {
//     setErrorGeo(null);
//     if (withSpinner) setLoadingGeo(true);

//     try {
//       const cachedAny = loadGeoCacheLenient(); // ignore TTL for decision logic
//       const nowMonth = monthKey();

//       // New quick fix for comparison (no prompt)
//       const quick = await getQuickGpsOrNull();

//       let needServer = false;

//       if (!cachedAny) {
//         // No cache → resolve once
//         needServer = true;
//       } else if (quick && cachedAny.lat != null && cachedAny.lon != null) {
//         // Cache exists: only call if moved far; otherwise monthly refresh
//         needServer = movedBeyondThreshold(cachedAny, quick);
//         if (!needServer && cachedAny.monthKey !== nowMonth) needServer = true;
//       } else {
//         // No GPS now: monthly refresh if month changed
//         needServer = (cachedAny.monthKey !== nowMonth);
//       }

//       if (!needServer && cachedAny) {
//         setGeo(cachedAny); // reuse cached even if strict TTL expired
//         return cachedAny;
//       }

//       // Need server call: try a full GPS fix (may prompt the very first time)
//       let lat = null, lon = null, acc = 0;
//       try {
//         if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
//           const pos = await getBrowserLocation({
//             enableHighAccuracy: false,
//             timeoutMs: 4000,
//             maximumAge: 15 * 60 * 1000,
//           });
//           const _lat = Number(pos.latitude);
//           const _lon = Number(pos.longitude);
//           if (Number.isFinite(_lat) && Number.isFinite(_lon)) {
//             lat = +_lat.toFixed(6);
//             lon = +_lon.toFixed(6);
//             acc = typeof pos.accuracy === 'number' ? pos.accuracy : 0;
//           }
//         }
//       } catch {
//         // ignore; server will IP-fallback if coords are null
//       }



// const { data, error } = await detectUserLocation({ 
//   variables: { lat, lon } 
// });

// console.log('Mutation response:', { data, error });

// if (error) {
//   console.error('Mutation error:', error);
//   throw error;
// }

// const payload = data?.detectUserLocation;
// if (!payload) {
//   console.error('No payload received from mutation');
//   throw new Error('Location detection failed: no data returned');
// }



//       if (payload) {
//         const snapshot = {
//           ...payload,                   // { country, countryCode, region, city, state, province }
//           lat: lat ?? cachedAny?.lat ?? null,
//           lon: lon ?? cachedAny?.lon ?? null,
//           acc: acc ?? cachedAny?.acc ?? 0,
//           resolvedAt: Date.now(),
//           monthKey: nowMonth,
//           version: 3,
//         };
//         saveGeoCache(snapshot);
//         setGeo(snapshot);
//         return snapshot;
//       }
//     } catch (err) {
//       console.error('detectUserLocation failed:', err);
//       setErrorGeo(err);
//       const cachedAny = loadGeoCacheLenient();
//       if (cachedAny) {
//         setGeo(cachedAny);
//         return cachedAny;
//       }
//       throw err;
//     } finally {
//       if (withSpinner) setLoadingGeo(false);
//     }

//     return null;
//   };

//   // On mount:
//   // - If no cache, do a full refresh WITH spinner.
//   // - If cache exists, do a SILENT refresh (no spinner) to run the movement/month check.



//   useEffect(() => {
//     const checkAndRefresh = async () => {
//       const currentCache = loadGeoCache(); // Check localStorage directly
      
//       if (!currentCache) {
//         // No valid cache exists, do a full refresh with spinner
//         await refreshGeo(true);
//       } else {
//         // Cache exists, set it immediately and do silent refresh
//         setGeo(currentCache);
//         setLoadingGeo(false);
//         // Do silent background check for movement/month changes
//         refreshGeo(false);
//       }
//     };

//     checkAndRefresh();
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps



//   const value = {
//     geo,            // latest resolved snapshot or null
//     loadingGeo,     // true during initial resolve (only if no cache)
//     errorGeo,       // last error (if any)
//     refreshGeo,     // allow manual refresh if needed
//   };

//   return (
//     <LocationContext.Provider value={value}>
//       {children}
//     </LocationContext.Provider>
//   );
// }





export function LocationProvider({ children }) {
  const [detectUserLocation] = useMutation(USER_LOCATION_DETECT);
  const [geo, setGeo] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [errorGeo, setErrorGeo] = useState(null);

  /**
   * refreshGeo(options)
   * - withSpinner: show loading spinner
   * - forceServer: bypass cache checks and always call the mutation
   */
  const refreshGeo = async ({ withSpinner = true, forceServer = false } = {}) => {
    console.log('refreshGeo called', { withSpinner, forceServer });
    setErrorGeo(null);
    if (withSpinner) setLoadingGeo(true);

    try {
      const cachedAny = loadGeoCacheLenient();
      const nowMonth = monthKey();
      const quick = await getQuickGpsOrNull();

      let needServer = false;

      if (!cachedAny) {
        needServer = true;
        console.log('Need server: no cache');
      } else if (forceServer) {
        needServer = true;
        console.log('Need server: forceServer=true');
      } else if (quick && cachedAny.lat != null && cachedAny.lon != null) {
        needServer = movedBeyondThreshold(cachedAny, quick);
        if (!needServer && cachedAny.monthKey !== nowMonth) needServer = true;
        console.log('Need server based on movement/month:', needServer);
      } else {
        needServer = (cachedAny.monthKey !== nowMonth);
        console.log('Need server based on month change:', needServer);
      }

      if (!needServer && cachedAny) {
        console.log('Using cached data, no server call needed');
        setGeo(cachedAny);
        return cachedAny;
      }

      console.log('Making server call for location data');

      // Try browser coords first (non-blocking; server can fallback to IP)
      let lat = null, lon = null, acc = 0;
      try {
        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          const pos = await getBrowserLocation({
            enableHighAccuracy: false,
            timeoutMs: 4000,
            maximumAge: 15 * 60 * 1000,
          });
          const _lat = Number(pos.latitude);
          const _lon = Number(pos.longitude);
          if (Number.isFinite(_lat) && Number.isFinite(_lon)) {
            lat = +_lat.toFixed(6);
            lon = +_lon.toFixed(6);
            acc = typeof pos.accuracy === 'number' ? pos.accuracy : 0;
            console.log('Got browser location:', { lat, lon, acc });
          }
        }
      } catch (error) {
        console.warn('Browser location failed, using IP fallback:', error);
      }

      // 🚀 Always call the mutation here
      const { data, error } = await detectUserLocation({ variables: { lat, lon } });
      console.log('Mutation response:', { data, error });

      if (error) {
        console.error('Mutation error:', error);
        throw error;
      }
      const payload = data?.detectUserLocation;
      if (!payload) {
        console.error('No payload received from mutation');
        throw new Error('Location detection failed: no data returned');
      }

      const snapshot = {
        ...payload,
        lat: lat ?? cachedAny?.lat ?? null,
        lon: lon ?? cachedAny?.lon ?? null,
        acc: acc ?? cachedAny?.acc ?? 0,
        resolvedAt: Date.now(),
        monthKey: nowMonth,
        version: 3,
      };

      saveGeoCache(snapshot);
      setGeo(snapshot);
      return snapshot;

    } catch (err) {
      console.error('detectUserLocation failed:', err);
      setErrorGeo(err);
      const cachedAny = loadGeoCacheLenient();
      if (cachedAny) {
        console.log('Falling back to cached data after error');
        setGeo(cachedAny);
        return cachedAny;
      }
      throw err;
    } finally {
      if (withSpinner) setLoadingGeo(false);
    }
  };

  // 🔧 Public helpers: clear cache & force refetch
  const clearAndRefetch = async () => {
    clearGeoCache();
    return refreshGeo({ withSpinner: true, forceServer: true });
  };

  // Keep your mount effect, but call refreshGeo with the new signature
  useEffect(() => {
    (async () => {
      console.log('LocationProvider mounted, checking cache...');
      try {
        const currentCache = loadGeoCache();
        console.log('Current cache from localStorage:', currentCache);

        if (!currentCache) {
          console.log('No valid cache, doing full refresh');
          await refreshGeo({ withSpinner: true, forceServer: true }); // ensures server hit on cold start
        } else {
          console.log('Cache exists, setting state and doing background refresh');
          setGeo(currentCache);
          setLoadingGeo(false);
          refreshGeo({ withSpinner: false }).catch(err =>
            console.warn('Background refresh failed:', err)
          );
        }
      } catch (error) {
        console.error('Initial location check failed:', error);
        setLoadingGeo(false);
        setErrorGeo(error);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    geo,
    loadingGeo,
    errorGeo,
    refreshGeo,      // call refreshGeo({ forceServer: true }) to force mutation
    clearAndRefetch, // call this after “clearing cache”
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}