

// import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";

// // vendors
// import { reverseGeocode } from "./google/googleApi.js";
// import { getLocationFromIpWho } from "./IPWHo.org/ipwhoApi.js";
// import { getCachedLocation, cacheUserLocation, isSameLocation, incrementVendorUsage } from "./redis/userLocationRedis.js";





// let googleUsage = 9700; // Simulate being 1 call under the limit
// const GOOGLE_MONTHLY_LIMIT = 9800;

// let ipwhoUsage = 0;
// const IPWHO_MONTHLY_LIMIT = 10000;

// export const detectUserLocation = async (_parent, { lon, lat }, context) => {
//   const user = context?.user;
//   if (!user) throw new Error('Authentication required');

//   const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
//   const _lat = hasCoords ? +Number(lat).toFixed(6) : null;
//   const _lon = hasCoords ? +Number(lon).toFixed(6) : null;

//   console.log(`--- New Request ---`);
//   console.log(`Has Coords: ${hasCoords} (lat: ${_lat}, lon: ${_lon})`);
//   console.log(`Simulated Usage -> Google: ${googleUsage}/${GOOGLE_MONTHLY_LIMIT}, IPWho: ${ipwhoUsage}/${IPWHO_MONTHLY_LIMIT}`);

//   // SCENARIO 1: We have coordinates. Try Google first.
//   if (hasCoords) {
//     // Check our simulated Google limit
//     if (googleUsage < GOOGLE_MONTHLY_LIMIT) {
//       console.log('Attempting Google due to valid coords and available limit...');
//       try {
//         const googleResult = await reverseGeocode({ lat: _lat, lon: _lon });

//         googleUsage++;
// //  we will call the redis here to increase the counter
//         console.log('✅ Google succeeded. Returning result.');
//         return { ...googleResult, lat: _lat, lon: _lon };
//       } catch (error) {
//         // Check if the error is specifically the over-limit error
//         if (error.message.includes('OVER_QUERY_LIMIT')) {
//           console.log('❌ Google failed with OVER_QUERY_LIMIT. Falling back to IP...');
//           googleUsage = GOOGLE_MONTHLY_LIMIT + 1; // Simulate hitting the limit
//         } else {
//           console.log(`❌ Google failed with other error (${error.message}). Falling back to IP...`);
//         }
//         // Now we will fall through to the IP fallback logic
//       }
//     } else {
//       console.log('Skipping Google: Simulated monthly limit exceeded.');
//     }
//   } else {
//     console.log('Skipping Google: No coordinates provided.');
//   }

//   // SCENARIO 2: Fallback to IP (ipwho.is)
//   // This runs if: 1) No coords, 2) Google over limit, 3) Google had another error
//   console.log('Attempting IPWHO fallback...');
//   if (ipwhoUsage < IPWHO_MONTHLY_LIMIT) {
//     try {
//       const ipwhoResult = await getLocationFromIpWho(context);
//       console.log('check the result:', ipwhoResult)
//       ipwhoUsage++;
//     //   we will call redis here to increase the count of ipwho
//       console.log('✅ IPWho succeeded. Returning result.');
//       // Use the coordinates from IPWho if they provided them, or the original ones (which are likely null)
//       return {
//         ...ipwhoResult,
//         lat: ipwhoResult.latitude || _lat,
//         lon: ipwhoResult.longitude || _lon
//       };
//     } catch (error) {
//       console.error('❌ IPWho fallback also failed:', error.message);
//       // If even the fallback fails, throw the error
//       throw new Error(`All location providers failed: ${error.message}`);
//     }
//   } else {
//     const errorMsg = 'All location providers (Google and IPWho) are over their monthly limits.';
//     console.error(errorMsg);
//     throw new Error(errorMsg);
//   }
// };




// vendors
import { reverseGeocode } from "./google/googleApi.js";
import { getLocationFromIpWho } from "./IPWHo.org/ipwhoApi.js";
import {
  getCachedLocation,
  cacheUserLocation,
  isSameLocation,
  incrementVendorUsage,
  checkVendorLimit
} from "./redis/userLocationRedis.js";


export const detectUserLocation = async (_parent, { lat, lon }, context) => {
  const user = context?.user;
  if (!user) throw new Error('Authentication required');

  const userId = user._id;
  const _lat = +Number(lat).toFixed(6);
  const _lon = +Number(lon).toFixed(6);
  const inputLocation = { lat: _lat, lon: _lon };

  console.log(`--- New Location Request ---`);
  console.log(`User: ${userId} | lat: ${_lat}, lon: ${_lon}`);

  // Step 1: Return cache if location hasn't changed
  const cached = await getCachedLocation(userId);
  if (cached && isSameLocation(cached, inputLocation)) {
    console.log('✅ Returning cached location.');
    return cached;
  }

  // Step 2: Use Google if under quota
  const googleAllowed = await checkVendorLimit('google');
  if (googleAllowed) {
    try {
      console.log('🔍 Trying Google Reverse Geocoding...');
      const googleResult = await reverseGeocode({ lat: _lat, lon: _lon });
      await incrementVendorUsage('google');

      const fullGoogleData = {
        ...googleResult,
        lat: _lat,
        lon: _lon,
        vendor: 'google'
      };

      await cacheUserLocation(userId, fullGoogleData);

      console.log('✅ Google reverse geocode succeeded.');
      return fullGoogleData;

    } catch (error) {
      console.warn('⚠️ Google failed:', error.message);
    }
  } else {
    console.warn('⛔ Google quota exceeded. Skipping...');
  }

  // Step 3: Fallback to IPWho if under limit
  const ipwhoAllowed = await checkVendorLimit('ipwho');
  if (ipwhoAllowed) {
    try {
      console.log('🌐 Trying IPWho fallback...');
      const ipwhoResult = await getLocationFromIpWho(context);
      await incrementVendorUsage('ipwho');

      const fullIpData = {
        ...ipwhoResult,
        lat: ipwhoResult.latitude || _lat,
        lon: ipwhoResult.longitude || _lon,
        vendor: 'ipwho'
      };

      await cacheUserLocation(userId, fullIpData);

      console.log('✅ IPWho succeeded as fallback.');
      
      return fullIpData;

    } catch (error) {
      console.error('❌ IPWho also failed:', error.message);
    }
  } else {
    console.warn('⛔ IPWho quota exceeded. Cannot proceed.');
  }

  throw new Error('Location detection failed. All vendors unavailable.');
};


