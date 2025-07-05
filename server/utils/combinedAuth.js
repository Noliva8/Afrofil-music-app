import jwt from 'jsonwebtoken';
import Artist from '../models/Artist/Artist.js';
import User from '../models/User/User.js';


const artistSecret = process.env.JWT_SECRET_ARTIST;
const userSecret = process.env.JWT_SECRET_USER;
const expiration = '2h';




export const combinedAuthMiddleware = async ({ req }) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  let context = {};

  // Try to verify artist token
  try {
    const { data: artistData } = jwt.verify(token, artistSecret, { maxAge: expiration });
    const artist = await Artist.findById(artistData._id).select('_id username email');
    if (artist) context.artist = artist;
  } catch (_) {
    // continue silently
  }

  // If not artist, try user token
  if (!context.artist) {
    try {
      const { data: userData } = jwt.verify(token, userSecret, { maxAge: expiration });
      const user = await User.findById(userData._id).select('_id username email');
      if (user) context.user = user;
    } catch (_) {
      // still invalid
    }
  }

  return context;
};
