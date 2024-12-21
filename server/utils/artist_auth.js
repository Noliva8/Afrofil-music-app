import { GraphQLError } from 'graphql';
import Artist from '../models/Artist/Artist.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET_ARTIST;
const expiration = '2h';

export const AuthenticationError = new GraphQLError('Could not authenticate artist.', {
  extensions: {
    code: 'UNAUTHENTICATED',
  },
});

export const artist_authMiddleware = ({ req }) => {
  let artistToken = req.body.artistToken || req.query.artistToken || req.headers.authorization;

  if (req.headers.authorization) {
    artistToken = artistToken.split(' ').pop().trim();
  }

  if (!artistToken) {
    return req;
  }

try {
    const { data } = jwt.verify(artistToken, secret, { maxAge: expiration });
    if (data.role !== 'artist') {
      throw new Error('Invalid role for artist authentication');
    }
    req.artist = data;
  } catch (err) {
    console.log('Invalid artist token:', err);
    throw new GraphQLError('Authentication error: Invalid artist token', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  return req;
};



export const signArtistToken = ({ email, fullName, artistAka, _id, confirmed }) => {
  
  const payload = { 
    email,        
    fullName,    
    role: 'artist', 
    artistAka,    
    confirmed,    
    _id            
  };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
