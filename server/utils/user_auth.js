import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User/User.js';
dotenv.config();

const secret = process.env.JWT_SECRET; 
const expiration = '2h';

// Error for unauthenticated users
export const AuthenticationError = new GraphQLError('Could not authenticate user.', {
  extensions: {
    code: 'UNAUTHENTICATED',
  },
});


// Function to extract and verify user token

export const getUserFromToken = async (token) => {
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

    // Get user with only necessary fields
    const user = await User.findById(data._id)
      .select('_id username email')
      .lean();

    if (!user) throw new Error('User not found');

    return user;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error; // Re-throw for proper handling
  }
};









// User authentication middleware

export const user_authMiddleware = ({ req }) => {
  let userToken = req.body.userToken || req.query.token || req.headers.authorization;

  // If it's in the "Bearer <token>" format in the authorization header, extract the token
  if (req.headers.authorization) {
    userToken = userToken.split(' ').pop().trim();
  }

  // If no token is found, return the request without attaching user data
  if (!userToken) {
    return req;
  }

  try {
    // Decode and verify the user token
    const { data } = jwt.verify(userToken, process.env.JWT_SECRET_USER, { maxAge: process.env.JWT_EXPIRATION });

    // Ensure the role is 'user'
    if (data.role !== 'user') {
      throw new AuthenticationError('Invalid role for user authentication', {
        extensions: {
          code: 'INVALID_ROLE',  // Custom error code for invalid role
          role: data.role,       // Attach role information to the error
        },
      });
    }

    // Attach user data to the request object
    req.user = data;

  } catch (err) {
    console.log('Invalid user token:', err.message);

    // Use the custom AuthenticationError for invalid token
    throw new AuthenticationError('Authentication error: Invalid user token', {
      extensions: {
        code: 'INVALID_TOKEN',  // Custom error code for invalid token
        message: err.message,   // Include the original error message
        originalError: err,     // Attach the original error object (optional for debugging)
      },
    });
  }

  return req;
};







// Function to generate a token for users
export const signUserToken = ({ email, username, _id }) => {
  const payload = { email, username, role: 'user', _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
