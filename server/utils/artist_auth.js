import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import Artist from '../models/Artist/Artist.js';



import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET_ARTIST;
const expiration = '2h';

export const AuthenticationError = new GraphQLError('Could not authenticate artist.', {
  extensions: {
    code: 'UNAUTHENTICATED',
  },
});

// ================


// Function to extract and verify artist token
export const getArtistFromToken = async (token) => {
  try {
    if (!token) throw new Error('No token provided');
    
    // Handle case where full header might be passed
    const cleanedToken = token.startsWith('Bearer ') 
      ? token.slice(7) 
      : token;

    if (!cleanedToken) throw new Error('Invalid token format');

    // Verify token
    const { data } = jwt.verify(cleanedToken, secret, { 
      maxAge: expiration 
    });

    // Get artist with only necessary fields
    const artist = await Artist.findById(data._id)
      .select('_id username email')
      .lean();

    if (!artist) throw new Error('Artist not found');

    return artist;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error; // Re-throw for proper handling
  }
};









// ==========================================================


export const authMiddleware = ({ req }) => {

 const artistToken = req.headers['authorization']?.split(' ')[1];
  console.log("Extracted artistToken:", artistToken);



  if (!artistToken) {
    console.log("No artistToken provided.");
    return req; // If the token is missing, return the request object unchanged
  }

  try {
    // Verify and decode the token
    const { data } = jwt.verify(artistToken, process.env.JWT_SECRET_ARTIST, { maxAge: expiration });

    // Log the decoded data for debugging
    console.log("Decoded token data:", data);

    // Attach the decoded data to the req object
    req.artist = data;

  } catch (error) {
    // Log error if token verification fails
    console.log('Invalid token:', error.message);
  }

  // Return the request object, modified or unmodified
  return req;
};


// =================================================================



export const signArtistToken = ({ email, fullName, artistAka, _id, confirmed, selectedPlan }) => {
  
  const payload = { 
    email,        
    fullName,    
    role: 'artist', 
    artistAka,    
    confirmed,
    selectedPlan,
    _id            
  };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
