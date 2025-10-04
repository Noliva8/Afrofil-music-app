

import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import Artist from "../models/Artist/Artist.js";
import dotenv from "dotenv";
dotenv.config();

const secret = process.env.JWT_SECRET_ARTIST;
const expiration = "2h";

if (!secret) {
  throw new Error("JWT_SECRET_ARTIST is not set");
}

export const AuthenticationError = new GraphQLError("Could not authenticate artist.", {
  extensions: { code: "UNAUTHENTICATED" },
});

/** Extract a raw token from common header shapes */
function extractBearerToken(maybeBearer = "") {
  if (!maybeBearer || typeof maybeBearer !== "string") return "";
  // Accept “Bearer <token>” or raw token
  return maybeBearer.startsWith("Bearer ") ? maybeBearer.slice(7) : maybeBearer;
}

/** Safely get _id from either { data: {_id} } or { _id } payload shapes */
function getIdFromPayload(payload) {
  return payload?.data?._id || payload?._id || null;
}

/**
 * Verify an artist token and return a lean artist document.
 * - Accepts either the full “Bearer <token>” string or the raw token
 * - Verifies with JWT_SECRET_ARTIST
 * - Supports both payload shapes
 */
// Update getArtistFromToken with detailed debugging
export const getArtistFromToken = async (token) => {
  try {
    console.log('🔐 [getArtistFromToken] Starting verification');
    console.log('📋 [getArtistFromToken] Raw token:', token ? `${token.substring(0, 50)}...` : 'NULL');
    
    if (!token) {
      console.log('❌ [getArtistFromToken] No token provided');
      throw new Error('No token provided');
    }
    
    // Handle Bearer prefix
    const cleanedToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    console.log('🧹 [getArtistFromToken] After Bearer removal:', cleanedToken ? `${cleanedToken.substring(0, 50)}...` : 'NULL');

    if (!cleanedToken) {
      console.log('❌ [getArtistFromToken] Empty token after cleaning');
      throw new Error('Invalid token format');
    }
    
    // Check if token has the artist prefix
    const hasArtistPrefix = cleanedToken.startsWith('artist_id_');
    console.log('🔍 [getArtistFromToken] Has artist_id_ prefix:', hasArtistPrefix);
    
    if (!hasArtistPrefix) {
      console.log('❌ [getArtistFromToken] Token missing artist prefix');
      throw new Error('Not an artist token');
    }
    
    // Extract the actual JWT token
    const actualToken = cleanedToken.replace('artist_id_', '');
    console.log('🎫 [getArtistFromToken] Actual JWT:', actualToken ? `${actualToken.substring(0, 30)}...` : 'NULL');

    if (!actualToken) {
      console.log('❌ [getArtistFromToken] Empty token after prefix removal');
      throw new Error('Invalid token format after prefix removal');
    }

    // Verify token
    console.log('🔐 [getArtistFromToken] Verifying with secret...');
    const { data } = jwt.verify(actualToken, secret, { maxAge: expiration });
    console.log('✅ [getArtistFromToken] Token verified. Data:', data);

    // Get artist from database
    console.log('👤 [getArtistFromToken] Fetching artist for ID:', data._id);
    const artist = await Artist.findById(data._id)
      .select('_id username email')
      .lean();

    if (!artist) {
      console.log('❌ [getArtistFromToken] Artist not found for ID:', data._id);
      throw new Error('Artist not found');
    }

    console.log('✅ [getArtistFromToken] Authentication successful');
    return artist;
  } catch (error) {
    console.error('❌ [getArtistFromToken] Verification failed:', error.message);
    console.error('❌ [getArtistFromToken] Error stack:', error.stack);
    throw error;
  }
};

/**
 * HTTP auth middleware for Express + Apollo
 * - Reads Authorization or X-Artist-Authorization headers
 * - Verifies & attaches `req.artist` when valid
 * - Does not throw (anonymous requests can still hit public resolvers)
 */
export const authMiddleware = async ({ req }) => {
  try {
    const header =
      req.headers?.authorization ||
      req.headers?.["x-artist-authorization"] ||
      "";

    const token = extractBearerToken(header);
    if (!token) return req;

    const artist = await getArtistFromToken(token);
    req.artist = artist;
  } catch (error) {
    // Don’t crash the request; leave anonymous if invalid/expired
    // console.warn("[auth] artist auth failed:", error.message);
  }
  return req;
};

/**
 * Sign a new artist token (keeps existing payload shape: { data: payload })
 * If you later want to move to a flat payload, update getArtistFromToken to support both.
 */
export const signArtistToken = ({
  email,
  fullName,
  artistAka,
  _id,
  confirmed,
  selectedPlan,
  role = "artist",
}) => {
  const payload = {
    _id,
    email,
    fullName,
    artistAka,
    confirmed,
    selectedPlan,
    role,
  };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
