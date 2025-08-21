import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User/User.js';

dotenv.config();

// -----------------------------
// JWT Configuration
// -----------------------------
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET_USER,
  expiration: process.env.JWT_EXPIRATION || '2h',
  issuer: process.env.JWT_ISSUER || 'Afrofeel',
  audience: process.env.JWT_AUDIENCE || 'African-music-app',
  algorithm: 'HS256'
};


// -----------------------------
// Custom GraphQL Errors
// -----------------------------
export class AuthenticationError extends GraphQLError {
  constructor(message, extensions = {}) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
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
// Token Utilities
// -----------------------------
const tokenUtils = {
  extractToken: (rawToken) => {
    if (!rawToken) return null;
    return rawToken.replace(/^Bearer\s+/i, '').trim();
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_CONFIG.secret, {
        maxAge: JWT_CONFIG.expiration,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
        algorithms: [JWT_CONFIG.algorithm]
      });
    } catch (err) {
      throw new AuthenticationError('Invalid token', {
        reason: err.name === 'TokenExpiredError' ? 'EXPIRED' : 'MALFORMED'
      });
    }
  }
};

// -----------------------------
// User Enrichment for Monetization Flags
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
// Middleware (Apollo context integration)
// -----------------------------
export const user_authMiddleware = async ({ req }) => {
  try {
    const rawToken = req.headers.authorization || req.body.token || req.query.token;
    const token = tokenUtils.extractToken(rawToken);

    if (!token) return req;

    const { data } = tokenUtils.verifyToken(token);

    const user = await User.findById(data._id)
      .select('_id username email role subscription adLimits')
      .lean();

    if (!user) {
      throw new AuthenticationError('User not found', { status: 'INACTIVE' });
    }

    req.user = enrichUser(user);
    return req;

  } catch (error) {
    console.error('Authentication Error:', error.message);
    throw error;
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
// Token Generation (Sign JWT)
// -----------------------------
export const signUserToken = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience
  };

  return jwt.sign(
    { data: payload },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiration,
      algorithm: JWT_CONFIG.algorithm
    }
  );
};

// -----------------------------
// Get User from Token (standalone utility)
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



export { enrichUser };