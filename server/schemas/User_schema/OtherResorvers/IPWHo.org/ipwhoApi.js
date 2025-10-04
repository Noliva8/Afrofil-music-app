

// const BASE_URL_IPWHO = 'https://ipwho.is/'; // Note: Their endpoint is now ipwho.is



// function extractClientIp(context) {
//   const req = context.req;
// //   check the req
// console.log('see the req format to extract the ip from :', req);

//   if (!req) {
//     console.warn('No request object found in context for IP extraction.');
//     return null;
//   }

//   // Prefer headers for proxy-aware scenarios
//   const headers = req.headers;
//   const potentialHeaderKeys = [
//     'x-client-ip',           // Custom header
//     'x-forwarded-for',       // Standard proxy header (list of IPs)
//     'cf-connecting-ip',      // Cloudflare
//     'fastly-client-ip',      // Fastly
//     'x-real-ip',             // Nginx
//     'x-cluster-client-ip',
//     'x-forwarded',
//     'forwarded-for',
//     'forwarded'
//   ];

//   for (const key of potentialHeaderKeys) {
//     const value = headers[key];
//     if (value) {
//       // Handle comma-separated lists (e.g., X-Forwarded-For: client, proxy1, proxy2)
//       const firstIp = value.split(',')[0].trim();
//       console.log('check the structure of the returned ip:', firstIp);
//       if (firstIp && firstIp.length > 0) {
//         // Optional: Validate it's a rough IP format
//         if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(firstIp) || firstIp.includes(':')) {
//           return firstIp;
//         }
//       }
//     }
//   }

//   // Fallback to socket address (less reliable behind proxies)
//   if (req.socket?.remoteAddress) {
//       console.log('check the structure of the returned ip from socket:', req.socket?.remoteAddress);
//     return req.socket.remoteAddress;
//   }
//   if (req.connection?.remoteAddress) {
//     return req.connection.remoteAddress;
//   }

//   console.warn('Could not extract client IP from request.');
//   return null;
// }

// /**
//  * Fetches location data from ipwho.is based on the user's IP address.
//  * This is a primary fallback when GPS is not available.
//  */


// export const getLocationFromIpWho = async (context) => {
//   const ip = extractClientIp(context);

//   // If no IP can be determined, fail early and clearly.
//   if (!ip) {
//     throw new Error('Could not determine client IP address for geolocation.');
//   }

//   // For local development, you might get '127.0.0.1' or '::1'.
//   // ipwho.is will return an error for these. You might want a mock response.
//   if (ip === '127.0.0.1' || ip === '::1') {

//     // Return a mock development location or throw a specific error.
//     return {
//       ip: ip,
//       country: 'Development',
//       countryCode: 'DV',
//       region: 'Localhost',
//       city: '127.0.0.1',
//       latitude: null,
//       longitude: null,
//       vendor: 'ipwho-mock'
//     };
//   }

//   const url = `${BASE_URL_IPWHO}${encodeURIComponent(ip)}`;

//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

//   try {
//     const res = await fetch(url, {
//       signal: controller.signal,
//       headers: {
//         // Some APIs like a User-Agent header
//         'User-Agent': 'YourApp/1.0 (Server-Side Geolocation)'
//       }
//     });
//     clearTimeout(timeout);

//     if (!res.ok) {
//       throw new Error(`IPWho API HTTP Error: ${res.status} ${res.statusText}`);
//     }

//     const data = await res.json();

//     // ipwho.is uses a 'success' flag in its response
//     if (!data.success) {
//       throw new Error(`IPWho API Error: ${data.message || 'Unknown failure'}`);
//     }

//     // Map their response to our standard format
//     return {
//       ip: data.ip,
//       country: data.country,
//       countryCode: data.country_code,
//       region: data.region,
//       city: data.city,
//       latitude: data.latitude,
//       longitude: data.longitude,
//       vendor: 'ipwho' // Tag the data source
//     };

//   } catch (error) {
//     clearTimeout(timeout);
//     console.error(`[getLocationFromIpWho] Failed for IP ${ip}:`, error.message);

//     // Distinguish between a timeout and other errors
//     if (error.name === 'AbortError') {
//       throw new Error('IP location request timed out.');
//     }
//     // Re-throw the error to be handled by the caller
//     throw new Error(`IP-based location detection failed: ${error.message}`);
//   }
// };



const BASE_URL_IPWHO = 'https://ipwho.is/';

/**
 * Extracts the client's IP from headers or socket, with fallbacks.
 */
function extractClientIp(context) {
  const req = context.req;

  if (!req) {
    console.warn('No request object found in context for IP extraction.');
    return null;
  }

  const headers = req.headers || {};
  const potentialHeaderKeys = [
    'x-client-ip',
    'x-forwarded-for',
    'cf-connecting-ip',
    'fastly-client-ip',
    'x-real-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const key of potentialHeaderKeys) {
    const value = headers[key];
    if (value) {
      const firstIp = value.split(',')[0].trim();
      if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(firstIp) || firstIp.includes(':')) {
        return firstIp;
      }
    }
  }

  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  if (req.connection?.remoteAddress) return req.connection.remoteAddress;

  return null;
}

/**
 * Calls ipwho.is API using the client's IP to get location data.
 * Falls back to a dummy IP (8.8.8.8) in development if IP is localhost.
 */
export const getLocationFromIpWho = async (context) => {
  let ip = extractClientIp(context);

  // Fallback to dummy IP for development/testing
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    console.warn('⚠️ Development environment detected. Using dummy IP for testing.');
    ip = '8.8.8.8'; // Google DNS - safe public IP
  }

  const url = `${BASE_URL_IPWHO}${encodeURIComponent(ip)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YourApp/1.0 (Server-Side Geolocation)'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`IPWho API HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(`IPWho API Error: ${data.message || 'Unknown failure'}`);
    }

    return {
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      vendor: 'ipwho'
    };

  } catch (error) {
    clearTimeout(timeout);
    console.error(`[getLocationFromIpWho] Failed for IP ${ip}:`, error.message);

    if (error.name === 'AbortError') {
      throw new Error('IP location request timed out.');
    }

    throw new Error(`IP-based location detection failed: ${error.message}`);
  }
};
