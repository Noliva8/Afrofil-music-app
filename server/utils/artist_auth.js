import { GraphQLError } from 'graphql';
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






// export const authMiddleware = ({ req }) => {
//   // Log headers to debug
//   console.log('Headers coming from client:', req.headers);

//   // Extract the userToken from headers, body, or query
//   let userToken = req.headers.Authorization || req.body.userToken || req.query.token;

//   // Extract the artistToken specifically from the Authorization header
//   const artistToken = req.headers['Authorization']?.split(' ')[1];
//   console.log("Extracted artistToken:", artistToken);

//   if (!artistToken) {
//     console.log("No artistToken provided.");
//     return req; // If the token is missing, return the request object unchanged
//   }

//   try {
//     // Verify and decode the token
//     const { data } = jwt.verify(artistToken, process.env.JWT_SECRET_ARTIST, { maxAge: expiration });

//     // Log the decoded data for debugging
//     console.log("Decoded token data:", data);

//     // Attach the decoded data to the req object
//     req.artist = data;

//   } catch (error) {
//     // Log error if token verification fails
//     console.log('Invalid token:', error.message);
//   }

//   // Return the request object, modified or unmodified
//   return req;
// };






// ==========================================================

// export const artist_authMiddleware = ({ req }) => {
//   // Extract token from different sources
//   let artistToken = req.body.artistToken || req.query.token || req.headers.artistAuthorization;

//   // If it's in the "Bearer <token>" format in the authorization header, extract the token
//   if (req.headers.artistAuthorization) {
//     artistToken = artistToken.split(' ').pop().trim();
//   }

//   // If no token is found, return the request without attaching artist data
//   if (!artistToken) {
//     return req;
//   }

//   try {
//     // Decode and verify the artist token
//     const { data } = jwt.verify(artistToken, process.env.JWT_SECRET_ARTIST, { maxAge: process.env.JWT_EXPIRATION });

//     // Ensure the role is 'artist'
//     if (data.role !== 'artist') {
//       throw new Error('Invalid role for artist authentication');
//     }

//     // Attach artist data to the request object
//     req.artist = data;
//   } catch (err) {
//      console.log('Invalid token');
//     };
  

//   return req;
// };








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
