// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// import Artist from '../models/Artist/Artist.js';
// import User from '../models/User/User.js';
// import Advertizer from '../models/Advertizer/Advertizer.js';

// dotenv.config();

// // Validate environment variables
// if (!process.env.JWT_SECRET_ARTIST || !process.env.JWT_SECRET_USER || !process.env.JWT_SECRET_ADVERTIZER) {
//   throw new Error('Missing required JWT secret environment variables');
// }

// const secrets = {
//   artist: process.env.JWT_SECRET_ARTIST,
//   user: process.env.JWT_SECRET_USER,
//   advertizer: process.env.JWT_SECRET_ADVERTIZER
// };

// const expiration = '2h';

// // Common fields to select for each model
// const modelSelectFields = {
//   artist: '_id username email role',
//   user: '_id username email role',
//   advertizer: '_id fullName businessEmail companyName role isConfirmed'
// };

/**
 * Enhanced combined authentication middleware
 * Attempts to authenticate as artist, user, or advertizer
 * Attaches the authenticated entity to req if successful
 */
// export const combinedAuthMiddleware = async ({ req }) => {
//   const authHeader = req.headers.authorization || '';
//   const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

//   console.log('Auth middleware called with token:', token ? 'present' : 'missing');
  
//   if (!token) {
//     console.log('No token provided');
//     return req;
//   }

//   // Try each authentication type sequentially
//   try {
//     // 1. Try Artist authentication first
//     console.log('Attempting artist authentication...');
//     try {
//       const { data } = jwt.verify(token, secrets.artist, { maxAge: expiration });
//       console.log('Artist token decoded:', data);
//       const artist = await Artist.findById(data._id).select(modelSelectFields.artist);
//       if (artist) {
//         console.log('Artist authenticated successfully:', artist._id);
//         req.artist = artist;
//         return req;
//       } else {
//         console.log('Artist not found in database');
//       }
//     } catch (artistError) {
//       console.log('Artist auth failed:', artistError.message);
//     }

//     // 2. Try User authentication
//     console.log('Attempting user authentication...');
//     try {
//       const { data } = jwt.verify(token, secrets.user, { maxAge: expiration });
//       console.log('User token decoded:', data);
//       const user = await User.findById(data._id).select(modelSelectFields.user);
//       if (user) {
//         console.log('User authenticated successfully:', user._id);
//         req.user = user;
//         return req;
//       } else {
//         console.log('User not found in database');
//       }
//     } catch (userError) {
//       console.log('User auth failed:', userError.message);
//     }

//     // 3. Try Advertizer authentication
//     console.log('Attempting advertiser authentication...');
//     try {
//       const { data } = jwt.verify(token, secrets.advertizer, { maxAge: expiration });
//       console.log('Advertiser token decoded:', data);
//       const advertizer = await Advertizer.findById(data._id).select(modelSelectFields.advertizer);
//       if (advertizer) {
//         console.log('Advertiser authenticated successfully:', advertizer._id);
//         req.advertizer = advertizer;
//         return req;
//       } else {
//         console.log('Advertiser not found in database');
//       }
//     } catch (advertizerError) {
//       console.log('Advertiser auth failed:', advertizerError.message);
//     }

//     console.log('All authentication attempts failed');
//     return req;

//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return req;
//   }
// };




// import { getArtistFromToken } from './artist_auth.js';
// import { user_authMiddleware } from './user_auth.js';
// import { getAdvertizerFromToken } from './advertizer_auth.js'

// export const combinedAuthMiddleware = async ({ req }) => {
//   const authHeader = req.headers.authorization || req.headers['x-artist-authorization'] || '';
//   if (!authHeader) {
//     console.log('No authorization header');
//     return req;
//   }

//   // Extract token from Bearer or custom prefix for artist tokens
//   let token = authHeader;
//   if (authHeader.startsWith('Bearer ')) {
//     token = authHeader.slice(7);
//   }

//   // Artist tokens may have artist_id_ prefix
//   if (token.startsWith('artist_id_')) {
//     try {
//       const artist = await getArtistFromToken(token);
//       if (artist) {
//         req.artist = artist;
//         console.log('Artist authenticated');
//         return req;
//       }
//     } catch (err) {
//       console.log('Artist auth failed:', err.message);
//     }
//   }

//   // Try User auth (you can call user_authMiddleware or inline the logic)
//   try {
//     // Note: user_authMiddleware expects full req with headers
//     await user_authMiddleware({ req });
//     if (req.user) {
//       console.log('User authenticated');
//       return req;
//     }
//   } catch (err) {
//     console.log('User auth failed:', err.message);
//   }

//   // Try Advertizer auth
//   try {
//     // getAdvertizerFromToken expects raw token (no prefixes)
//     const advertizer = await getAdvertizerFromToken(authHeader);
//     if (advertizer) {
//       req.advertizer = advertizer;
//       console.log('Advertizer authenticated');
//       return req;
//     }
//   } catch (err) {
//     console.log('Advertizer auth failed:', err.message);
//   }

//   console.log('All authentication attempts failed — no user attached');
//   return req;
// };



import { getArtistFromToken } from './artist_auth.js';
import { user_authMiddleware, getUserFromToken } from './user_auth.js';
import { getAdvertizerFromToken } from './advertizer_auth.js';

export const combinedAuthMiddleware = async ({ req }) => {
  const authHeader = req.headers.authorization || req.headers['x-artist-authorization'] || '';
  
  console.log('\n🔐 COMBINED AUTH STARTED');
  console.log('📨 Auth header present:', !!authHeader);
  console.log('🔍 Auth header preview:', authHeader.substring(0, 50) + '...');

  if (!authHeader) {
    console.log('❌ No authorization header');
    return { req, user: null, artist: null, advertizer: null };
  }

  // Extract token from Bearer prefix
  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
    console.log('🔑 Extracted Bearer token, length:', token.length);
  }

  // Try all authentication systems in parallel with better detection
  let user = null;
  let artist = null;
  let advertizer = null;

  // First, analyze the token to determine its type
  console.log('\n🔍 ANALYZING TOKEN TYPE...');
  try {
    const unverified = jwt.decode(token, { complete: true });
    const payload = unverified?.payload?.data || unverified?.payload;
    
    if (payload) {
      console.log('📦 Token payload analysis:', {
        role: payload.role,
        hasArtistAka: !!payload.artistAka,
        hasAdvertizerFields: !!payload.companyName, // adjust based on your advertizer fields
        keys: Object.keys(payload)
      });

      // Based on analysis, try the most likely auth first
      if (payload.role === 'artist' || payload.artistAka) {
        console.log('🎭 Token appears to be for artist - trying artist auth first');
        try {
          artist = await getArtistFromToken(token);
          if (artist) {
            console.log('✅ Artist authenticated successfully');
            return { req, artist, user: null, advertizer: null };
          }
        } catch (err) {
          console.log('❌ Artist auth failed:', err.message);
        }
      } else if (payload.role === 'advertizer' || payload.companyName) {
        console.log('📢 Token appears to be for advertizer - trying advertizer auth first');
        try {
          advertizer = await getAdvertizerFromToken(token);
          if (advertizer) {
            console.log('✅ Advertizer authenticated successfully');
            return { req, advertizer, user: null, artist: null };
          }
        } catch (err) {
          console.log('❌ Advertizer auth failed:', err.message);
        }
      } else {
        console.log('👤 Token appears to be for regular user - trying user auth first');
        try {
          user = await getUserFromToken(token);
          if (user) {
            console.log('✅ User authenticated successfully');
            return { req, user, artist: null, advertizer: null };
          }
        } catch (err) {
          console.log('❌ User auth failed:', err.message);
        }
      }
    }
  } catch (analysisErr) {
    console.log('⚠️ Could not analyze token structure, falling back to sequential auth');
  }

  // If analysis failed or no match, try all auth systems sequentially
  console.log('\n🔄 FALLBACK: Trying all auth systems sequentially...');

  // Try User Auth
  try {
    console.log('👤 Trying user auth...');
    const userContext = await user_authMiddleware({ req });
    if (userContext.user) {
      console.log('✅ User authenticated via middleware');
      return { req, user: userContext.user, artist: null, advertizer: null };
    }
  } catch (userErr) {
    console.log('❌ User auth middleware failed:', userErr.message);
  }

  // Try Artist Auth (handle both prefixed and regular tokens)
  try {
    console.log('🎭 Trying artist auth...');
    
    // Handle both prefixed and regular tokens for artists
    let artistToken = token;
    if (!token.startsWith('artist_id_')) {
      artistToken = `artist_id_${token}`;
    }
    
    artist = await getArtistFromToken(artistToken);
    if (artist) {
      console.log('✅ Artist authenticated successfully');
      return { req, artist, user: null, advertizer: null };
    }
  } catch (artistErr) {
    console.log('❌ Artist auth failed:', artistErr.message);
  }

  // Try Advertizer Auth
  try {
    console.log('📢 Trying advertizer auth...');
    advertizer = await getAdvertizerFromToken(token);
    if (advertizer) {
      console.log('✅ Advertizer authenticated successfully');
      return { req, advertizer, user: null, artist: null };
    }
  } catch (advertizerErr) {
    console.log('❌ Advertizer auth failed:', advertizerErr.message);
  }

  console.log('💥 All authentication attempts failed');
  return { req, user: null, artist: null, advertizer: null };
};