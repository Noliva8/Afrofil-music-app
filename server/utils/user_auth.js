import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User/User.js';

// -----------------------------
// ES Module Compatibility
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// ENVIRONMENT DEBUGGING
// -----------------------------
// console.log('🔍 ENVIRONMENT DEBUGGING:');
// console.log('📁 Current working directory:', process.cwd());
// console.log('📁 __dirname:', __dirname);
// console.log('📁 __filename:', __filename);

// Load .env with explicit path
const envPath = path.resolve(process.cwd(), '.env');
console.log('📁 Loading .env from:', envPath);

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error('❌ Failed to load .env file:', envResult.error);
} else {
  // console.log('✅ .env file loaded successfully');
  // console.log('📋 Loaded environment variables:', Object.keys(envResult.parsed || {}));
}

// -----------------------------
// JWT SECRET DEBUGGING
// -----------------------------

const JWT_SECRET_USER = process.env.JWT_SECRET_USER;


// Check for common JWT secret issues
if (JWT_SECRET_USER) {
  if (JWT_SECRET_USER.length < 32) {
    console.warn('⚠️  JWT secret might be too short (recommended: at least 32 characters)');
  }
  if (JWT_SECRET_USER.includes(' ') || JWT_SECRET_USER.includes('\n')) {
    console.warn('⚠️  JWT secret may contain whitespace or newlines');
  }
}

// -----------------------------
// JWT Configuration with Validation
// -----------------------------
const JWT_CONFIG = {
  secret: JWT_SECRET_USER,
  expiration: process.env.JWT_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'Afrofeel',
  audience: process.env.JWT_AUDIENCE || 'African-music-app',
  algorithm: 'HS256'
};

// console.log('\n⚙️  JWT CONFIGURATION:');
// console.log('Secret length:', JWT_CONFIG.secret?.length);
// console.log('Expiration:', JWT_CONFIG.expiration);
// console.log('Issuer:', JWT_CONFIG.issuer);
// console.log('Audience:', JWT_CONFIG.audience);
// console.log('Algorithm:', JWT_CONFIG.algorithm);

// Validate configuration
if (!JWT_CONFIG.secret) {
  console.error('❌ CRITICAL: JWT_SECRET_USER is not defined!');
  console.log('💡 Check your .env file for JWT_SECRET_USER=your_secret_here');
  throw new Error('JWT_SECRET_USER environment variable is required');
}

// -----------------------------
// Custom GraphQL Errors
// -----------------------------
export class AuthenticationError extends GraphQLError {
  constructor(message, extensions = {}) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
        timestamp: new Date().toISOString(),
        ...extensions
      }
    });
  }
}

export class AuthorizationError extends GraphQLError {
  constructor(requiredRole) {
    super(`Requires ${requiredRole} role`, {
      extensions: {
        code: 'FORBIDDEN',
        requiredRole
      }
    });
  }
}

// -----------------------------
// Enhanced Token Utilities with Deep Debugging
// -----------------------------
const tokenUtils = {
  extractToken: (rawToken) => {
    console.log('\n🎯 EXTRACTING TOKEN:');
    console.log('Raw token input:', rawToken ? `"${rawToken.substring(0, 50)}..."` : 'NULL');
    
    if (!rawToken) {
      console.log('❌ No raw token provided');
      return null;
    }
    
    const token = rawToken.replace(/^Bearer\s+/i, '').trim();
    console.log('Cleaned token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    return token;
  },

  verifyToken: (token) => {
    // console.log('\n🔐 VERIFYING TOKEN:');
    // console.log('Token to verify length:', token.length);
    // console.log('Using JWT secret length:', JWT_CONFIG.secret.length);
    // console.log('Using JWT secret preview:', JWT_CONFIG.secret.substring(0, 10) + '...');

    try {
      // First, decode without verification to see the structure
      const unverified = jwt.decode(token, { complete: true });
      // console.log('📦 TOKEN STRUCTURE (UNVERIFIED):');
      // console.log('Header:', unverified?.header);
      // console.log('Payload:', unverified?.payload);
      
      if (unverified?.payload) {
        console.log('Payload contents:', {
          hasData: !!unverified.payload.data,
          keys: Object.keys(unverified.payload),
          iat: unverified.payload.iat,
          exp: unverified.payload.exp,
          iss: unverified.payload.iss,
          aud: unverified.payload.aud
        });
      }

      // Now verify with the secret
      // console.log('\n🔑 ATTEMPTING VERIFICATION...');

      const decoded = jwt.verify(token, JWT_CONFIG.secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
        algorithms: [JWT_CONFIG.algorithm]
      });
      
      // console.log('✅ TOKEN VERIFIED SUCCESSFULLY');
      // console.log('Decoded structure:', {
      //   hasData: !!decoded.data,
      //   directKeys: Object.keys(decoded).filter(key => key !== 'data'),
      //   dataKeys: decoded.data ? Object.keys(decoded.data) : 'No data property'
      // });
      
      return decoded;
    } catch (err) {
      console.error('❌ TOKEN VERIFICATION FAILED:');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      // Detailed error analysis
      if (err.name === 'JsonWebTokenError') {
        if (err.message === 'invalid signature') {
          console.error('💡 INVALID SIGNATURE ANALYSIS:');
          console.error('   - Token was signed with a DIFFERENT secret');
          console.error('   - Check for multiple .env files');
          console.error('   - Check if secret was changed recently');
          console.error('   - Verify all services use the same secret');
        } else if (err.message === 'jwt malformed') {
          console.error('💡 MALFORMED JWT: Token structure is invalid');
        }
      } else if (err.name === 'TokenExpiredError') {
        console.error('💡 TOKEN EXPIRED: Check expiration time');
      } else if (err.name === 'NotBeforeError') {
        console.error('💡 TOKEN NOT ACTIVE YET: Check nbf claim');
      }
      
      throw new AuthenticationError('Invalid token', {
        reason: err.name === 'TokenExpiredError' ? 'EXPIRED' : 'MALFORMED',
        details: err.message
      });
    }
  }
};

// -----------------------------
// Token Generation Debugging
// -----------------------------
export const signUserToken = (user) => {
  // console.log('\n🎫 SIGNING NEW TOKEN:');
  // console.log('User ID:', user._id);
  // console.log('User email:', user.email);
  // console.log('Using JWT secret length:', JWT_CONFIG.secret.length);

  const payload = {
    data: {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
       role: user.role || 'regular',
    },
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience,
    iat: Math.floor(Date.now() / 1000)
  };

  // console.log('📦 PAYLOAD STRUCTURE:');
  // console.log(JSON.stringify(payload, null, 2));

  const token = jwt.sign(
    payload,
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiration,
      algorithm: JWT_CONFIG.algorithm
    }
  );

  // console.log('✅ TOKEN GENERATED SUCCESSFULLY');
  // console.log('Token length:', token.length);
  // console.log('Token preview:', token.substring(0, 50) + '...');

  // Verify the token immediately to ensure it works
  try {
    const verified = jwt.verify(token, JWT_CONFIG.secret);
    // console.log('✅ SELF-VERIFICATION: Token can be verified with current secret');
  } catch (error) {
    console.error('❌ SELF-VERIFICATION FAILED: Generated token cannot be verified!');
    console.error('This indicates a serious configuration issue');
  }

  return token;
};

// -----------------------------
// Test Token Function
// -----------------------------
export const testTokenGeneration = async () => {
  // console.log('\n🧪 RUNNING TOKEN GENERATION TEST:');
  
  const testUser = {
    _id: '65d8a1b2c5e8a1b2c5e8a1b2',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  };

  try {
    const token = signUserToken(testUser);
    // console.log('✅ TEST COMPLETED: Token generation successful');
    return token;
  } catch (error) {
    console.error('❌ TEST FAILED: Token generation failed');
    console.error(error);
    return null;
  }
};

// -----------------------------
// User Enrichment
// -----------------------------
const enrichUser = (user) => {
  const now = new Date();
  const isPremium =
    user.role === 'premium' &&
    user.subscription?.status === 'active' &&
    (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > now);

  return {
    ...user,
    isPremium,
    shouldSeeAds: !isPremium,
    canSkipAd: isPremium || (user.adLimits?.skipsAllowed > 0)
  };
};

// -----------------------------
// Enhanced Middleware with Complete Debugging
// -----------------------------
export const user_authMiddleware = async ({ req }) => {
  // console.log('\n' + '='.repeat(60));
  // console.log('🔄 STARTING AUTHENTICATION MIDDLEWARE');
  // console.log('='.repeat(60));

  try {
    const rawToken = req.headers.authorization || req.body?.token || req.query?.token;
    console.log('📨 RAW TOKEN RECEIVED:', rawToken ? 'PRESENT' : 'MISSING');
    
    if (rawToken) {
      // console.log('Raw token preview:', rawToken.substring(0, 80) + '...');
    }

    const token = tokenUtils.extractToken(rawToken);

    if (!token) {
      // console.log('⚠️  No token provided - proceeding without authentication');
      return { req, user: null };
    }

    // console.log('\n🔍 ANALYZING TOKEN...');
    const decoded = tokenUtils.verifyToken(token);

    // Extract user data with flexible handling
    const userData = decoded.data || decoded;
    // console.log('👤 EXTRACTED USER DATA:', userData);

    if (!userData._id) {
      console.error('❌ NO _id FOUND IN TOKEN PAYLOAD');
      console.error('Available keys:', Object.keys(userData));
      throw new AuthenticationError('Invalid token payload - missing _id');
    }

    // console.log('🔎 LOOKING UP USER IN DATABASE...');
    // console.log('User ID from token:', userData._id);
    
    const user = await User.findById(userData._id)
      .select('_id username email role subscription adLimits')
      .lean();

    if (!user) {
      console.error('❌ USER NOT FOUND IN DATABASE');
      console.error('Database lookup failed for ID:', userData._id);
      throw new AuthenticationError('User not found', { status: 'INACTIVE' });
    }

    // console.log('✅ USER FOUND IN DATABASE:', user.email);
    
    const enrichedUser = enrichUser(user);
    console.log('🎯 ENRICHED USER:', {
      id: enrichedUser._id,
      email: enrichedUser.email,
      role: enrichedUser.role,
      isPremium: enrichedUser.isPremium
    });

    // console.log('✅ AUTHENTICATION SUCCESSFUL');
    return { 
      req, 
      user: enrichedUser,
      authToken: token 
    };

  } catch (error) {
    console.error('\n💥 AUTHENTICATION FAILED:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.extensions) {
      console.error('Error extensions:', error.extensions);
    }
    
    // Return null user instead of throwing to allow unauthenticated requests
    console.log('⚠️  Returning null user - request will continue without authentication');
    return { req, user: null };
  }
};

// -----------------------------
// Role-Based Access Control
// -----------------------------
export const requireRole = (requiredRole) => (next) => async (root, args, context, info) => {
  if (!context.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (context.user.role !== requiredRole && context.user.role !== 'admin') {
    throw new AuthorizationError(requiredRole);
  }

  return next(root, args, context, info);
};

// -----------------------------
// Get User from Token
// -----------------------------
export const getUserFromToken = async (token) => {
  try {
    const cleanedToken = tokenUtils.extractToken(token);
    if (!cleanedToken) throw new Error('No token provided');

    const { data } = tokenUtils.verifyToken(cleanedToken);

    const user = await User.findById(data._id)
      .select('_id username email role subscription adLimits')
      .lean();

    if (!user) throw new Error('User not found');

    return enrichUser(user);
  } catch (error) {
    console.error('getUserFromToken failed:', error.message);
    throw new AuthenticationError('Failed to retrieve user from token', {
      extensions: { reason: error.message }
    });
  }
};

// -----------------------------
// Environment Diagnostics
// -----------------------------
// console.log('\n📋 ENVIRONMENT DIAGNOSTICS:');
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('All JWT-related env vars:');
Object.keys(process.env).forEach(key => {
  if (key.includes('JWT') || key.includes('SECRET')) {
    // console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  }
});

// Run immediate test if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  // console.log('\n🧪 RUNNING IMMEDIATE SELF-TEST...');
  testTokenGeneration();
}

export { enrichUser };

// console.log('\n✅ AUTH MODULE LOADED WITH COMPREHENSIVE DEBUGGING');












// // auth/userAuth.js
// import { GraphQLError } from 'graphql';
// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// import User from '../models/User/User.js';

// dotenv.config();

// // ---- Minimal config ----
// const secret = process.env.JWT_SECRET_USER;
// const expiration = '2h'; // e.g., "2h", "30m", "7d"

// if (!secret) {
//   throw new Error('JWT_SECRET_USER is not set');
// }

// // Optional: exportable error (if you need to throw in resolvers)
// export const AuthenticationError = new GraphQLError('Could not authenticate user.', {
//   extensions: { code: 'UNAUTHENTICATED' },
// });

// // ---- Tiny helpers ----
// const extractToken = (req) => {
//   let tok =
//     req?.headers?.authorization ||
//     req?.body?.token ||
//     req?.query?.token ||
//     req?.cookies?.token;

//   if (!tok) return null;
//   // Strip "Bearer " if present
//   return String(tok).replace(/^Bearer\s+/i, '').trim();
// };

// const verifyUserToken = (token) => {
//   // Keep it simple: HS256 default, exp via maxAge
//   return jwt.verify(token, secret, { maxAge: expiration });
// };

// // ---- Apollo context-style middleware ----
// // Usage: context: async ({ req }) => user_authMiddleware({ req })
// export const user_authMiddleware = async ({ req }) => {
//   const token = extractToken(req);

//   // Debug (safe)
//   console.log('🔐 auth:', {
//     hasAuthHeader: !!req?.headers?.authorization,
//     tokenPrefix: token ? token.slice(0, 20) + '...' : null,
//   });

//   if (!token) return req;

//   try {
//     const decoded = verifyUserToken(token);
//     const data = decoded?.data || decoded;

//     // Optional DB fetch (recommended so roles are fresh)
//     if (data?._id) {
//       const user = await User.findById(data._id)
//         .select('_id username email role subscription adLimits')
//         .lean();

//       if (user) {
//         req.user = user; // attach the whole user doc
//       }
//     }
//   } catch (e) {
//     console.log('❌ Invalid token:', e.message);
//   }

//   return req;
// };

// // ---- Signer ----
// export const signUserToken = (user) => {
//   const payload = {
//     _id: user._id,
//     email: user.email,
//     username: user.username,
//     role: user.role,
//   };

//   return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
// };





// // Add this to auth/userAuth.js (same file as user_authMiddleware & signUserToken)

// const enrichUser = (user) => {
//   const now = new Date();
//   const isPremium =
//     user.role === 'premium' &&
//     user.subscription?.status === 'active' &&
//     (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > now);

//   return { ...user, isPremium, shouldSeeAds: !isPremium };
// };

// /**
//  * getUserFromToken
//  * @param {string|object} tokenOrReq - a raw token string (may include "Bearer ") OR a req object.
//  * @param {object} opts
//  * @param {boolean} opts.throwOnError - if true, throws GraphQLError on failure; otherwise returns null.
//  */
// export const getUserFromToken = async (tokenOrReq, { throwOnError = false } = {}) => {
//   try {
//     // Accept either a raw token string or an Express/Apollo req
//     const cleaned =
//       typeof tokenOrReq === 'string'
//         ? tokenOrReq.replace(/^Bearer\s+/i, '').trim()
//         : extractToken(tokenOrReq);

//     if (!cleaned) {
//       if (throwOnError) {
//         throw new GraphQLError('No token provided', { extensions: { code: 'UNAUTHENTICATED' } });
//       }
//       return null;
//     }

//     const decoded = verifyUserToken(cleaned); // may throw
//     const data = decoded?.data || decoded;

//     if (!data?._id) {
//       if (throwOnError) {
//         throw new GraphQLError('Invalid token payload', { extensions: { code: 'UNAUTHENTICATED' } });
//       }
//       return null;
//     }

//     const user = await User.findById(data._id)
//       .select('_id username email role subscription adLimits')
//       .lean();

//     if (!user) {
//       if (throwOnError) {
//         throw new GraphQLError('User not found', { extensions: { code: 'UNAUTHENTICATED' } });
//       }
//       return null;
//     }

//     return enrichUser(user);
//   } catch (err) {
//     console.error('getUserFromToken failed:', err.message);
//     if (throwOnError) {
//       throw new GraphQLError('Failed to retrieve user from token', {
//         extensions: { code: 'UNAUTHENTICATED', reason: err.name || 'INVALID' }
//       });
//     }
//     return null;
//   }
// };





















// // // -----------------------------
// // Get User from Token
// // -----------------------------
// // export const getUserFromToken = async (token) => {
// //   try {
// //     const cleanedToken = tokenUtils.extractToken(token);
// //     if (!cleanedToken) throw new Error('No token provided');

// //     const decoded = tokenUtils.verifyToken(cleanedToken);
// //     const data = decoded.data || decoded;

// //     const user = await User.findById(data._id)
// //       .select('_id username email role subscription adLimits')
// //       .lean();

// //     if (!user) throw new Error('User not found');

// //     return enrichUser(user);
// //   } catch (error) {
// //     console.error('getUserFromToken failed:', error.message);
// //     throw new AuthenticationError('Failed to retrieve user from token', {
// //       reason: error.message
// //     });
// //   }
// // };






// // // -----------------------------
// // // JWT Configuration
// // // -----------------------------
// // const JWT_CONFIG = {
// //   secret: process.env.JWT_SECRET_USER,
// //   expiration: process.env.JWT_EXPIRATION || '2h',         // e.g. "2h", "30m", "7d"
// //   issuer: process.env.JWT_ISSUER || 'Afrofeel',
// //   audience: process.env.JWT_AUDIENCE || 'African-music-app',
// //   algorithm: 'HS256',
// //   clockTolerance: Number(process.env.JWT_CLOCK_TOLERANCE_SEC || 5) // seconds
// // };

// // // Validate critical envs early
// // function assertJwtEnv() {
// //   const problems = [];
// //   if (!JWT_CONFIG.secret) problems.push('JWT_SECRET_USER is not set');
// //   // Optional: basic sanity check for expiration format
// //   if (typeof JWT_CONFIG.expiration !== 'string') {
// //     problems.push('JWT_EXPIRATION must be a string like "2h", "30m", "7d"');
// //   }
// //   if (problems.length) {
// //     // Fail fast in dev; log in prod
// //     const msg = `[JWT config] ${problems.join(' | ')}`;
// //     if (process.env.NODE_ENV !== 'production') throw new Error(msg);
// //     console.error(msg);
// //   }
// // }
// // assertJwtEnv();

// // // -----------------------------
// // // Custom GraphQL Errors
// // // -----------------------------
// // export class AuthenticationError extends GraphQLError {
// //   constructor(message, extensions = {}) {
// //     super(message, {
// //       extensions: { code: 'UNAUTHENTICATED', ...extensions }
// //     });
// //   }
// // }

// // export class AuthorizationError extends GraphQLError {
// //   constructor(requiredRole) {
// //     super(`Requires ${requiredRole} role`, {
// //       extensions: { code: 'FORBIDDEN', requiredRole }
// //     });
// //   }
// // }

// // // -----------------------------
// // // Token Utilities
// // // -----------------------------
// // const tokenUtils = {
// //   extractToken: (rawToken) => {
// //     if (!rawToken) return null;
// //     return rawToken.replace(/^Bearer\s+/i, '').trim();
// //   },

// //   verifyToken: (token) => {
// //     try {
// //       // Optional: decode for logging ONLY (never trust decode for validity)
// //       const preview = jwt.decode(token);
// //       if (preview) {
// //         const now = Math.floor(Date.now() / 1000);
// //         console.log('🔍 Token preview:', {
// //           sub: preview.sub,
// //           iat: preview.iat,
// //           exp: preview.exp,
// //           now,
// //           secondsUntilExpiry: preview.exp ? (preview.exp - now) : null
// //         });
// //       }

// //       // Single source of truth: let verify enforce exp/iss/aud/signature
// //       return jwt.verify(token, JWT_CONFIG.secret, {
// //         issuer: JWT_CONFIG.issuer,
// //         audience: JWT_CONFIG.audience,
// //         algorithms: [JWT_CONFIG.algorithm],
// //         clockTolerance: JWT_CONFIG.clockTolerance // leeway for minor skew
// //       });
// //     } catch (err) {
// //       console.error('🔴 JWT Verification Error:', {
// //         name: err.name,
// //         message: err.message,
// //         expiredAt: err.expiredAt
// //       });

// //       if (err.name === 'TokenExpiredError') {
// //         throw new AuthenticationError('Token expired', {
// //           reason: 'EXPIRED',
// //           expiredAt: err.expiredAt?.toISOString?.() || String(err.expiredAt || '')
// //         });
// //       }

// //       throw new AuthenticationError('Invalid token', {
// //         reason: 'MALFORMED'
// //       });
// //     }
// //   }
// // };

// // // -----------------------------
// // // User Enrichment for Monetization Flags
// // // -----------------------------
// // const enrichUser = (user) => {
// //   const now = new Date();
// //   const isPremium =
// //     user.role === 'premium' &&
// //     user.subscription?.status === 'active' &&
// //     (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > now);

// //   return {
// //     ...user,
// //     isPremium,
// //     shouldSeeAds: !isPremium,
// //     canSkipAd: isPremium || (user.adLimits?.skipsAllowed > 0)
// //   };
// // };

// // // -----------------------------
// // // Middleware (Apollo context integration)
// // // -----------------------------
// // export const user_authMiddleware = async ({ req }) => {
// //   try {
// //     const rawToken =
// //       req.headers.authorization ||
// //       req.body?.token ||
// //       req.query?.token ||
// //       req.cookies?.token; // handy if you store in cookie

// //     const token = tokenUtils.extractToken(rawToken);

// //     console.log('🔐 Authentication attempt:', {
// //       rawTokenPresent: !!rawToken,
// //       cleanedTokenPresent: !!token,
// //       tokenPrefix: token ? token.slice(0, 20) + '...' : null
// //     });

// //     if (!token) {
// //       console.log('ℹ️ No token provided, continuing without authentication');
// //       return req;
// //     }

// //     const decoded = tokenUtils.verifyToken(token);
// //     console.log('✅ Token verified');

// //     const data = decoded.data || decoded; // support wrapped or flat
// //     if (!data?._id) {
// //       throw new AuthenticationError('Invalid token payload', { reason: 'NO_USER_ID' });
// //     }

// //     const user = await User.findById(data._id)
// //       .select('_id username email role subscription adLimits')
// //       .lean();

// //     if (!user) {
// //       throw new AuthenticationError('User not found', { status: 'INACTIVE' });
// //     }

// //     req.user = enrichUser(user);
// //     console.log('✅ User authenticated:', {
// //       _id: user._id,
// //       email: user.email,
// //       role: user.role
// //     });

// //     return req;
// //   } catch (error) {
// //     console.error('🔴 Authentication Error:', error.message);
// //     console.log('ℹ️ Continuing without authenticated user');
// //     return req;
// //   }
// // };

// // // -----------------------------
// // // Role-Based Access Control
// // // -----------------------------
// // export const requireRole = (requiredRole) => (next) => async (root, args, context, info) => {
// //   if (!context.user) throw new AuthenticationError('Authentication required');
// //   if (context.user.role !== requiredRole && context.user.role !== 'admin') {
// //     throw new AuthorizationError(requiredRole);
// //   }
// //   return next(root, args, context, info);
// // };

// // // -----------------------------
// // // Token Generation (Sign JWT)
// // // -----------------------------
// // export const signUserToken = (user) => {
// //   const payload = {
// //     _id: user._id,
// //     email: user.email,
// //     username: user.username,
// //     role: user.role
// //     // do NOT put iss/aud here; set them in options below
// //   };

// //   console.log('🎫 Generating new token for user:', user.email);

// //   const token = jwt.sign(
// //     { data: payload },
// //     JWT_CONFIG.secret,
// //     {
// //       expiresIn: JWT_CONFIG.expiration,
// //       algorithm: JWT_CONFIG.algorithm,
// //       issuer: JWT_CONFIG.issuer,
// //       audience: JWT_CONFIG.audience
// //     }
// //   );

// //   console.log('✅ Token generated');
// //   return token;
// // };

// // // -----------------------------
// // // Get User from Token
// // // -----------------------------
// // export const getUserFromToken = async (token) => {
// //   try {
// //     const cleanedToken = tokenUtils.extractToken(token);
// //     if (!cleanedToken) throw new Error('No token provided');

// //     const decoded = tokenUtils.verifyToken(cleanedToken);
// //     const data = decoded.data || decoded;

// //     const user = await User.findById(data._id)
// //       .select('_id username email role subscription adLimits')
// //       .lean();

// //     if (!user) throw new Error('User not found');

// //     return enrichUser(user);
// //   } catch (error) {
// //     console.error('getUserFromToken failed:', error.message);
// //     throw new AuthenticationError('Failed to retrieve user from token', {
// //       reason: error.message
// //     });
// //   }
// // };

// // // -----------------------------
// // // Token Validation Utility
// // // -----------------------------
// // export const validateToken = (token) => {
// //   try {
// //     const cleanedToken = tokenUtils.extractToken(token);
// //     if (!cleanedToken) return { valid: false, reason: 'NO_TOKEN' };
// //     const decoded = tokenUtils.verifyToken(cleanedToken);
// //     return { valid: true, decoded };
// //   } catch (error) {
// //     return {
// //       valid: false,
// //       reason: error.extensions?.reason || 'INVALID',
// //       message: error.message
// //     };
// //   }
// // };

// // export { enrichUser };
