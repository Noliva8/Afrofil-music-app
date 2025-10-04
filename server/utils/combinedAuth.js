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

  console.log('Auth middleware called with token:', token ? 'present' : 'missing');
  
  if (!token) {
    console.log('No token provided');
    return req;
  }

  // Try each authentication type sequentially
  try {
    // 1. Try Artist authentication first
    console.log('Attempting artist authentication...');
    try {
      const { data } = jwt.verify(token, secrets.artist, { maxAge: expiration });
      console.log('Artist token decoded:', data);
      const artist = await Artist.findById(data._id).select(modelSelectFields.artist);
      if (artist) {
        console.log('Artist authenticated successfully:', artist._id);
        req.artist = artist;
        return req;
      } else {
        console.log('Artist not found in database');
      }
    } catch (artistError) {
      console.log('Artist auth failed:', artistError.message);
    }

    // 2. Try User authentication
    console.log('Attempting user authentication...');
    try {
      const { data } = jwt.verify(token, secrets.user, { maxAge: expiration });
      console.log('User token decoded:', data);
      const user = await User.findById(data._id).select(modelSelectFields.user);
      if (user) {
        console.log('User authenticated successfully:', user._id);
        req.user = user;
        return req;
      } else {
        console.log('User not found in database');
      }
    } catch (userError) {
      console.log('User auth failed:', userError.message);
    }

    // 3. Try Advertizer authentication
    console.log('Attempting advertiser authentication...');
    try {
      const { data } = jwt.verify(token, secrets.advertizer, { maxAge: expiration });
      console.log('Advertiser token decoded:', data);
      const advertizer = await Advertizer.findById(data._id).select(modelSelectFields.advertizer);
      if (advertizer) {
        console.log('Advertiser authenticated successfully:', advertizer._id);
        req.advertizer = advertizer;
        return req;
      } else {
        console.log('Advertiser not found in database');
      }
    } catch (advertizerError) {
      console.log('Advertiser auth failed:', advertizerError.message);
    }

    console.log('All authentication attempts failed');
    return req;

  } catch (error) {
    console.error('Unexpected error:', error);
    return req;
  }
};