import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import Advertizer from '../models/Advertizer/Advertizer.js'; // add .js if using ES Modules
import dotenv from 'dotenv';

dotenv.config();



const secret = process.env.JWT_SECRET_ADVERTIZER;
const expiration = '2h';

if (!process.env.JWT_SECRET_ADVERTIZER) {
  throw new Error('JWT_SECRET_ADVERTIZER environment variable is not set');
}

// 🔐 Custom GraphQL Error



// 🔎 Verify token and fetch Advertizer from DB
export const getAdvertizerFromToken = async (token) => {
  try {
    if (!token) throw new AuthenticationError('No token provided');

    const cleanedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Verify token first
    const { data } = jwt.verify(cleanedToken, secret, { maxAge: expiration });
    
    if (!data?._id) {
      throw new AuthenticationError('Invalid token payload');
    }

    const advertizer = await Advertizer.findById(data._id)
      .select('_id companyName businessEmail role isConfirmed isPhoneVerified phoneNumber')
      .lean();

    if (!advertizer) {
      throw new AuthenticationError('Advertizer not found');
    }

    return advertizer;
  } catch (error) {
    console.error('🔴 Advertizer token verification failed:', error.message);
    
    // Convert specific JWT errors to AuthenticationError
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AuthenticationError(error.message);
    }
    
    throw error; // Re-throw other errors
  }
};



// 🛡️ Express Middleware for Apollo Server context
export const advertizer_authMiddleware = async ({ req }) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      console.log('⚠️ No authorization header');
      return { req };
    }

    const token = authHeader.startsWith('Bearer ') ? 
      authHeader.split(' ')[1] : 
      authHeader;

    if (!token) {
      console.log('⚠️ Empty token');
      return { req };
    }

    // Use our improved getAdvertizerFromToken
    const advertizer = await getAdvertizerFromToken(token);
    
    if (advertizer) {
      req.advertizer = advertizer;
      console.log(`✅ Authenticated advertizer: ${advertizer.businessEmail}`);
    }

    return { req };
  } catch (error) {
    console.error('🔴 Auth middleware error:', error.message);
    return { req };
  }
};


export const signAdvertizerToken = ({
  businessEmail,
  fullName,
  companyName,
  role,
  _id,
  isConfirmed,
  isPhoneConfirmed, 
  phoneNumber
}) => {

  const payload = {
    _id,
    businessEmail,
    fullName,
    companyName,
    role,
    isConfirmed,
    isPhoneConfirmed,
    phoneNumber
  };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};



export const signAdminToken = ({
  businessEmail,
  fullName,
  companyName,
  role,
  _id,
  isConfirmed,
  isPhoneConfirmed, 
  phoneNumber,
  isSuperAdmin,
  permissions

}) => {

  const payload = {
    _id,
    businessEmail,
    fullName,
    companyName,
    role: 'admin',
    isConfirmed,
    isPhoneConfirmed,
    phoneNumber,
    isSuperAdmin: !!isSuperAdmin, 
    permissions: Array.isArray(permissions) ? permissions : []

  };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};

// decide whether it is admin or advertiser
// =========================================

export function generateToken(userData) {
            if (userData.role === 'admin') {
                return signAdminToken(userData);
            } else {
                return signAdvertizerToken(userData);
            }
        }
