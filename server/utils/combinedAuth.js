import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Artist from '../models/Artist/Artist.js';
import User from '../models/User/User.js';
import Advertizer from '../models/Advertizer/Advertizer.js';

dotenv.config();

// Validate environment variables
if (!process.env.JWT_SECRET_ARTIST || !process.env.JWT_SECRET_USER || !process.env.JWT_SECRET_ADVERTIZER) {
  throw new Error('Missing required JWT secret environment variables');
}

const secrets = {
  artist: process.env.JWT_SECRET_ARTIST,
  user: process.env.JWT_SECRET_USER,
  advertizer: process.env.JWT_SECRET_ADVERTIZER
};

const expiration = '2h';

// Common fields to select for each model
const modelSelectFields = {
  artist: '_id username email role',
  user: '_id username email role',
  advertizer: '_id fullName businessEmail companyName role isConfirmed'
};

/**
 * Enhanced combined authentication middleware
 * Attempts to authenticate as artist, user, or advertizer
 * Attaches the authenticated entity to req if successful
 */
export const combinedAuthMiddleware = async ({ req }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return req;
  }

  // Try each authentication type sequentially
  try {
    // 1. Try Artist authentication first
    try {
      const { data } = jwt.verify(token, secrets.artist, { maxAge: expiration });
      const artist = await Artist.findById(data._id).select(modelSelectFields.artist);
      if (artist) {
        req.artist = artist;
        return req; // Return early if artist auth succeeds
      }
    } catch (artistError) {
      // Not an artist token, continue to next attempt
    }

    // 2. Try User authentication
    try {
      const { data } = jwt.verify(token, secrets.user, { maxAge: expiration });
      const user = await User.findById(data._id).select(modelSelectFields.user);
      if (user) {
        req.user = user;
        return req; // Return early if user auth succeeds
      }
    } catch (userError) {
      // Not a user token, continue to next attempt
    }

    // 3. Try Advertizer authentication
    try {
      const { data } = jwt.verify(token, secrets.advertizer, { maxAge: expiration });
      const advertizer = await Advertizer.findById(data._id).select(modelSelectFields.advertizer);
      if (advertizer) {
        req.advertizer = advertizer;
        return req; // Return early if advertizer auth succeeds
      }
    } catch (advertizerError) {
      // Not an advertizer token
    }

    // If we get here, no authentication succeeded
    console.debug('Authentication failed for all types with provided token');
    return req;

  } catch (error) {
    console.error('Unexpected error in combinedAuthMiddleware:', error);
    return req;
  }
};