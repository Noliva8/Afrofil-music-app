import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET; 
const expiration = '2h';

// Error for unauthenticated users
export const AuthenticationError = new GraphQLError('Could not authenticate user.', {
  extensions: {
    code: 'UNAUTHENTICATED',
  },
});

// Middleware for verifying user tokens
export const user_authMiddleware = ({ req }) => {
  let  userToken = req.body. userToken || req.query.token || req.headers.authorization;

  // Extract token from "Bearer <token>" format if present in authorization header
  if (req.headers.authorization) {
     userToken =  userToken.split(' ').pop().trim();
  }

  if (!userToken) {
    return req; 
  }

  try {
    const { data } = jwt.verify( userToken, secret, { maxAge: expiration });

    // Verify the role is "user" to ensure the token is valid for users
    if (data.role !== 'user') {
      throw new Error('Invalid role for user authentication');
    }

    // Attach the user data to the request object
    req.user = data;
  } catch (err) {
    console.log('Invalid user token:', err.message);
    throw new GraphQLError('Authentication error: Invalid user token', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  return req;
};

// Function to generate a token for users
export const signUserToken = ({ email, username, _id }) => {
  const payload = { email, username, role: 'user', _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
