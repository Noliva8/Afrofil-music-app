// // Cache with expiration
// let geoCache = {
//   data: null,
//   timestamp: 0,
//   expiresIn: 15 * 60 * 1000 // 15 minutes
// };

// // Track permission state to avoid repeated prompts
// let permissionChecked = false;

// export async function getClientGeo(opts = {}) {
//   const { 
//     timeoutMs = 5000, 
//     enableHighAccuracy = false, 
//     maxAge = 15 * 60 * 1000,
//     forceRefresh = false
//   } = opts;

//   // Check cache with expiration
//   const now = Date.now();
//   if (!forceRefresh && geoCache.data && (now - geoCache.timestamp < geoCache.expiresIn)) {
//     return geoCache.data;
//   }

//   // Check browser support
//   if (typeof navigator === 'undefined' || !navigator.geolocation) {
//     console.warn('Geolocation API not available in this browser');
//     return null;
//   }

//   try {
//     // 1. Check permission status (non-blocking, doesn't trigger prompt)
//     if (!permissionChecked) {
//       try {
//         if (navigator.permissions) {
//           const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
//           if (permissionStatus.state === 'denied') {
//             console.log('Geolocation permission previously denied');
//             permissionChecked = true;
//             return null;
//           }
          
//           // Listen for permission changes
//           permissionStatus.onchange = () => {
//             console.log('Permission state changed to:', permissionStatus.state);
//             permissionChecked = false; // Reset to check again
//           };
//         }
//       } catch (permissionError) {
//         console.warn('Permission check failed:', permissionError);
//       }
//       permissionChecked = true;
//     }

//     // 2. GET CURRENT POSITION - THIS TRIGGERS THE PERMISSION PROMPT ✅
//     const position = await new Promise((resolvePosition, rejectPosition) => {
//       let timeoutId;
//       let positionWatchId;

//       // Cleanup function
//       const cleanup = () => {
//         if (timeoutId) clearTimeout(timeoutId);
//         if (positionWatchId) navigator.geolocation.clearWatch(positionWatchId);
//       };

//       // Timeout handler
//       timeoutId = setTimeout(() => {
//         cleanup();
//         rejectPosition(new Error('Geolocation timeout'));
//       }, timeoutMs + 1000); // Extra second for permission prompt

//       // Success handler
//       const success = (position) => {
//         cleanup();
//         resolvePosition(position);
//       };

//       // Error handler
//       const error = (error) => {
//         cleanup();
//         rejectPosition(error);
//       };

//       // ⭐⭐⭐ THIS CALL TRIGGERS THE PERMISSION PROMPT ⭐⭐⭐
//       try {
//         if (navigator.geolocation.getCurrentPosition) {
//           navigator.geolocation.getCurrentPosition(
//             success,
//             error,
//             {
//               enableHighAccuracy,
//               timeout: timeoutMs,
//               maximumAge: maxAge
//             }
//           );
//         } else {
//           // Fallback for older browsers
//           positionWatchId = navigator.geolocation.watchPosition(
//             success,
//             error,
//             {
//               enableHighAccuracy,
//               timeout: timeoutMs,
//               maximumAge: maxAge
//             }
//           );
//         }
//       } catch (apiError) {
//         cleanup();
//         rejectPosition(apiError);
//       }
//     });

//     // 3. Extract coordinates
//     const { latitude, longitude, accuracy } = position.coords;
    
//     console.log('Geolocation obtained:', { latitude, longitude, accuracy });

//     // 4. Reverse geocode to get country/city (optional)
//     let locationData = { 
//       latitude, 
//       longitude, 
//       accuracy,
//       timestamp: position.timestamp,
//       source: 'gps',
//       accuracy_level: accuracy < 100 ? 'high' : accuracy < 1000 ? 'medium' : 'low'
//     };
    
//     try {
//       const reverseGeocode = await reverseGeocodeCoordinates(latitude, longitude);
//       locationData = { ...locationData, ...reverseGeocode };
//     } catch (reverseError) {
//       console.warn('Reverse geocoding failed, using coordinates only:', reverseError);
//     }

//     // Update cache
//     geoCache = {
//       data: locationData,
//       timestamp: now,
//       expiresIn: maxAge
//     };

//     return locationData;

//   } catch (error) {
//     console.warn('Geolocation failed:', error.message);
    
//     // Specific error handling
//     if (error.code === error.PERMISSION_DENIED) {
//       console.log('User denied location permission');
//       // Cache denial for longer to avoid annoying user
//       geoCache = {
//         data: null,
//         timestamp: now,
//         expiresIn: 24 * 60 * 60 * 1000 // 24 hours for denials
//       };
//     } else if (error.code === error.TIMEOUT) {
//       console.log('Geolocation timeout');
//       geoCache = {
//         data: null,
//         timestamp: now,
//         expiresIn: 30000 // 30 seconds for timeouts
//       };
//     } else {
//       // Other errors
//       geoCache = {
//         data: null,
//         timestamp: now,
//         expiresIn: 60000 // 1 minute for other errors
//       };
//     }
    
//     return null;
//   }
// }

// // Reverse geocoding function with better error handling
// async function reverseGeocodeCoordinates(lat, lon) {
//   try {
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 5000);

//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`,
//       { 
//         signal: controller.signal,
//         headers: {
//           'Accept': 'application/json',
//           'User-Agent': 'YourApp/1.0 (your@email.com)' // Required by Nominatim
//         }
//       }
//     );
    
//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       throw new Error(`Reverse geocoding failed: ${response.status}`);
//     }
    
//     const data = await response.json();
    
//     return {
//       country: data.address?.country,
//       country_code: data.address?.country_code?.toUpperCase(),
//       state: data.address?.state,
//       city: data.address?.city || data.address?.town || data.address?.village,
//       postcode: data.address?.postcode,
//       display_name: data.display_name
//     };
//   } catch (error) {
//     if (error.name === 'AbortError') {
//       console.warn('Reverse geocoding timeout');
//     } else {
//       console.warn('Reverse geocoding error:', error.message);
//     }
//     throw error;
//   }
// }

// // IP-based fallback with multiple service redundancy
// async function getIPBasedLocation() {
//   const services = [
//     'https://ipapi.co/json/',
//     'https://ipinfo.io/json',
//     'https://geolocation-db.com/json/'
//   ];

//   for (const url of services) {
//     try {
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 3000);

//       const response = await fetch(url, { 
//         signal: controller.signal 
//       });
      
//       clearTimeout(timeoutId);

//       if (response.ok) {
//         const data = await response.json();
        
//         // Validate coordinates
//         const lat = parseFloat(data.latitude || data.lat);
//         const lon = parseFloat(data.longitude || data.lng || data.lon);
        
//         if (isNaN(lat) || isNaN(lon)) {
//           continue; // Skip invalid coordinates
//         }
        
//         return {
//           latitude: lat,
//           longitude: lon,
//           country: data.country_name || data.country,
//           country_code: (data.country_code || data.countryCode)?.toUpperCase(),
//           city: data.city,
//           region: data.region || data.regionName,
//           zipcode: data.postal || data.zip,
//           ip: data.ip,
//           source: 'ip',
//           accuracy: 'low',
//           timestamp: Date.now()
//         };
//       }
//     } catch (error) {
//       console.warn(`IP service ${url} failed:`, error.message);
//       continue;
//     }
//   }
  
//   return null;
// }

// // Comprehensive location function with proper error handling
// export async function getComprehensiveGeo(opts = {}) {
//   const startTime = Date.now();
  
//   try {
//     // 1. Try precise GPS location first
//     const preciseLocation = await getClientGeo({
//       ...opts,
//       forceRefresh: opts.forceRefresh || false
//     });
    
//     if (preciseLocation) {
//       return {
//         ...preciseLocation,
//         retrieval_time: Date.now() - startTime,
//         success: true
//       };
//     }

//     // 2. Fallback to IP-based location
//     const ipLocation = await getIPBasedLocation();
//     if (ipLocation) {
//       return {
//         ...ipLocation,
//         retrieval_time: Date.now() - startTime,
//         success: true
//       };
//     }

//     // 3. Final fallback
//     return {
//       error: 'Unable to determine location',
//       retrieval_time: Date.now() - startTime,
//       source: 'unknown',
//       success: false
//     };

//   } catch (error) {
//     console.error('Comprehensive geo location failed:', error);
    
//     return {
//       error: error.message,
//       retrieval_time: Date.now() - startTime,
//       source: 'error',
//       success: false
//     };
//   }
// }

// // Better permission request helper
// export async function requestGeoPermission() {
//   if (typeof navigator === 'undefined' || !navigator.geolocation) {
//     return { status: 'unsupported', success: false };
//   }

//   try {
//     // ⭐⭐⭐ DIRECTLY REQUEST PERMISSION ⭐⭐⭐
//     const position = await new Promise((resolve, reject) => {
//       navigator.geolocation.getCurrentPosition(
//         resolve,
//         reject,
//         { 
//           timeout: 5000,
//           maximumAge: 0,
//           enableHighAccuracy: false
//         }
//       );
//     });
    
//     return { 
//       status: 'granted', 
//       success: true,
//       position: position 
//     };
    
//   } catch (error) {
//     if (error.code === error.PERMISSION_DENIED) {
//       return { 
//         status: 'denied', 
//         success: false,
//         error: 'Permission denied by user' 
//       };
//     } else if (error.code === error.TIMEOUT) {
//       return { 
//         status: 'timeout', 
//         success: false,
//         error: 'Location request timed out' 
//       };
//     } else if (error.code === error.POSITION_UNAVAILABLE) {
//       return { 
//         status: 'unavailable', 
//         success: false,
//         error: 'Location information unavailable' 
//       };
//     }
    
//     return { 
//       status: 'error', 
//       success: false,
//       error: error.message 
//     };
//   }
// }

// // Cache management utilities
// export function clearGeoCache() {
//   geoCache = {
//     data: null,
//     timestamp: 0,
//     expiresIn: 15 * 60 * 1000
//   };
//   permissionChecked = false; // Reset permission state
// }

// export function getGeoCacheStatus() {
//   return {
//     hasData: !!geoCache.data,
//     age: Date.now() - geoCache.timestamp,
//     expiresIn: geoCache.expiresIn,
//     isExpired: Date.now() - geoCache.timestamp > geoCache.expiresIn,
//     permissionChecked: permissionChecked
//   };
// }

// // Utility to check if location services are available
// export function isGeolocationSupported() {
//   return typeof navigator !== 'undefined' && 
//          !!navigator.geolocation && 
//          typeof navigator.geolocation.getCurrentPosition === 'function';
// }

// // Quick location snapshot without prompts
// export async function getCachedOrIPLocation() {
//   // Return cached location if available
//   if (geoCache.data) {
//     return geoCache.data;
//   }
  
//   // Fallback to IP-based location
//   return await getIPBasedLocation();
// }






















// let geoOnce = null;

// export async function getClientGeo(opts = {}) {
//   const { timeoutMs = 5000, enableHighAccuracy = false, maxAge = 15 * 60 * 1000 } = opts;

//   // Return cached result if available
//   if (geoOnce) return geoOnce;

//   // Check browser support
//   if (typeof navigator === 'undefined' || !navigator.geolocation) {
//     console.warn('Geolocation API not available in this browser');
//     return Promise.resolve(null);
//   }

//   geoOnce = new Promise(async (resolve) => {
//     try {
//       // 1. First check permission status
//       const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      
//       if (permissionStatus?.state === 'denied') {
//         console.log('Geolocation permission previously denied');
//         return resolve(null);
//       }

//       if (permissionStatus?.state === 'prompt') {
//         console.log('Geolocation permission will be requested');
//       }

//       // 2. Get current position
//       const position = await new Promise((resolvePosition, rejectPosition) => {
//         navigator.geolocation.getCurrentPosition(
//           resolvePosition,
//           rejectPosition,
//           {
//             enableHighAccuracy,
//             timeout: timeoutMs,
//             maximumAge: maxAge
//           }
//         );
//       });

//       // 3. Extract coordinates
//       const { latitude, longitude, accuracy } = position.coords;
      
//       console.log('Geolocation obtained:', { latitude, longitude, accuracy });

//       // 4. Reverse geocode to get country/city (optional)
//       let locationData = { latitude, longitude, accuracy };
      
//       try {
//         // You can use a reverse geocoding service here
//         const reverseGeocode = await reverseGeocodeCoordinates(latitude, longitude);
//         locationData = { ...locationData, ...reverseGeocode };
//       } catch (reverseError) {
//         console.warn('Reverse geocoding failed, using coordinates only:', reverseError);
//       }

//       resolve(locationData);

//     } catch (error) {
//       console.warn('Geolocation failed:', error.message);
//       resolve(null);
//     }
//   });

//   return geoOnce;
// }

// // Reverse geocoding function (using OpenStreetMap Nominatim API)
// async function reverseGeocodeCoordinates(lat, lon) {
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
//     );
    
//     if (!response.ok) throw new Error('Reverse geocoding failed');
    
//     const data = await response.json();
    
//     return {
//       country: data.address?.country,
//       country_code: data.address?.country_code,
//       state: data.address?.state,
//       city: data.address?.city || data.address?.town || data.address?.village,
//       postcode: data.address?.postcode,
//       display_name: data.display_name
//     };
//   } catch (error) {
//     console.warn('Reverse geocoding error:', error);
//     throw error;
//   }
// }




// // Alternative: IP-based fallback
// async function getIPBasedLocation() {
//   try {
//     const response = await fetch('https://ipapi.co/json/');
//     const data = await response.json();
    
//     return {
//       country: data.country_name,
//       country_code: data.country_code,
//       city: data.city,
//       region: data.region,
//       lat: data.latitude,
//       lon: data.longitude,
//       ip_based: true
//     };
//   } catch (error) {
//     console.warn('IP-based location failed:', error);
//     return null;
//   }
// }

// // Comprehensive location function with fallbacks
// export async function getComprehensiveGeo(opts = {}) {
//   try {
//     // 1. Try precise GPS location first
//     const preciseLocation = await getClientGeo(opts);
    
//     if (preciseLocation && preciseLocation.country) {
//       return preciseLocation;
//     }

//     // 2. Fallback to IP-based location
//     const ipLocation = await getIPBasedLocation();
//     if (ipLocation) {
//       return ipLocation;
//     }

//     // 3. Final fallback: return null
//     return null;

//   } catch (error) {
//     console.error('Comprehensive geo location failed:', error);
//     return null;
//   }
// }

// // Permission request helper
// export async function requestGeoPermission() {
//   if (typeof navigator === 'undefined' || !navigator.geolocation) {
//     return 'unsupported';
//   }

//   try {
//     // Modern permission API
//     if (navigator.permissions) {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       return permissionStatus.state;
//     }

//     // Legacy: try to get position to trigger permission prompt
//     await new Promise((resolve, reject) => {
//       navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1000 });
//     });
//     return 'granted';

//   } catch (error) {
//     if (error.code === error.PERMISSION_DENIED) {
//       return 'denied';
//     }
//     return 'prompt';
//   }
// }





// ----------------------------------

// Simple in-memory cache so we don't prompt or call GPS too often

const _geoCache = {
  data: null,
  timestamp: 0,
  ttlMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Get user's geolocation via the Browser Geolocation API.
 * Returns a Promise that resolves to { latitude, longitude, accuracy, timestamp, permission }
 */
export async function userLocation(options = {}) {
  const {
    enableHighAccuracy = false,
    timeoutMs = 5000,        // overall timeout for this call
    maximumAge = 0,          // don't accept old cached positions from the browser itself
    forceRefresh = false,    // skip our in-memory cache
    cacheTtlMs = _geoCache.ttlMs,
  } = options;

  // Use cached value if fresh and not forcing refresh
  const now = Date.now();
  if (!forceRefresh && _geoCache.data && (now - _geoCache.timestamp) < cacheTtlMs) {
    return _geoCache.data;
  }

  // Basic feature checks and HTTPS requirement note
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  // (Optional) Check permission status to avoid unnecessary prompts
  let permissionState = 'prompt';
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      permissionState = status.state; // 'granted' | 'denied' | 'prompt'
    } catch {
      // ignore – not all browsers support this consistently
    }
  }

  // Wrap getCurrentPosition in a Promise and add our own timeout
  const positionPromise = new Promise((resolve, reject) => {
    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const result = {
        latitude,
        longitude,
        accuracy,
        timestamp: pos.timestamp,
        permission: permissionState,
      };

      // cache result
      _geoCache.data = result;
      _geoCache.timestamp = Date.now();
      _geoCache.ttlMs = cacheTtlMs;

      resolve(result);
    };

    const onError = (err) => {
      // Normalize errors
      let message = 'Unknown geolocation error.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'User denied the request for Geolocation.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          message = 'The request to get user location timed out.';
          break;
        default:
          message = 'An unknown error occurred while getting location.';
      }
      const error = new Error(message);
      error.name = 'GeolocationError';
      error.code = err.code;
      reject(error);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout: Math.max(0, Math.min(timeoutMs, 2147483647)), // clamp to max 32-bit int
      maximumAge,
    });
  });

  // Add an overall timeout guard (some browsers can hang)
  const timeoutGuard = new Promise((_, reject) => {
    const id = setTimeout(() => {
      const e = new Error('Geolocation request exceeded timeout.');
      e.name = 'GeolocationTimeout';
      reject(e);
    }, timeoutMs + 200); // small buffer beyond API timeout
    // Clean up if main promise resolves first
    positionPromise.finally(() => clearTimeout(id));
  });

  // Race the two: whichever settles first wins
  return Promise.race([positionPromise, timeoutGuard]);
}
