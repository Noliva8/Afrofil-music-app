// middleware/auth.js
import { GraphQLError } from 'graphql';
import { tokenUtils } from './tokenUtils.js';
import { USER_TYPES } from './constant/systemRoles.js';
import {User} from '../../models/User/user_index.js';
import {Artist} from '../../models/Artist/index_artist.js';
import {Advertizer} from '../../models/Advertizer/index_advertizer.js'; 


export class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
  }
}
export class AuthorizationError extends GraphQLError {
  constructor(requiredRole) {
    super(`Requires ${requiredRole} role`, {
      extensions: { code: 'FORBIDDEN', requiredRole },
    });
  }
}

const enrichUser = (user) => {
  const now = new Date();
  const isPremium =
    user.role === 'premium' &&
    user.subscription?.status === 'active' &&
    (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > now);

  return {
    ...user.toObject?.() ?? user,
    isPremium,
    shouldSeeAds: !isPremium,
    canSkipAd: isPremium || (user.adLimits?.skipsAllowed > 0),
  };
};






export const combinedAuthMiddleware = async ({ req }) => {
  try {
    // Check all possible token sources
    const tokenSources = {
      'x-artist-authorization': req.headers['x-artist-authorization'],
      'x-user-authorization': req.headers['x-user-authorization'],
      'x-advertiser-authorization': req.headers['x-advertiser-authorization'],
      'authorization': req.headers.authorization, // Standard header used by advertisers
    };

    // Try ALL specific headers (not just first one)
    const validTokens = [];

    for (const [header, value] of Object.entries(tokenSources)) {
      if (value) {
        const extracted = tokenUtils.extractToken(value);
        if (extracted) {
          try {
console.log('auth header present', header);




            const decoded = tokenUtils.verifyByKind(extracted);

            console.log('decoded artist id', decoded.data._id);
            
            validTokens.push({
              token: extracted,
              source: header,
              decoded,
              kind: decoded.data?.userType
            });
          } catch (error) {
            // Token is invalid, continue to next
          }
        }
      }
    }

    // Process valid tokens
    for (const { token, source, decoded, kind } of validTokens) {
      const userData = decoded.data || decoded;
      const id = userData._id;

      if (!kind || !id) continue;

      let account = null;
      
      if (kind === USER_TYPES.USER && !req.user) {
        account = await User.findById(id)
          .select('_id username email role subscription adLimits')
          .lean();
        
        if (account) {
          account = enrichUser(account);
          req.user = account;
        }
      } 
      else if (kind === USER_TYPES.ARTIST && !req.artist) {
        account = await Artist.findById(id)
          .select('_id email fullName artistAka confirmed selectedPlan role')
          .lean();
        
        if (account) {
          req.artist = account;
        }
      }
      else if (kind === USER_TYPES.ADVERTISER && !req.advertiser) {
        account = await Advertizer.findById(id)
          .select('_id businessEmail email fullName companyName role isSuperAdmin permissions')
          .lean();
        
        if (account) {
          req.advertiser = account;
        }
      }

      // Set auth context with the first valid token found
      if (account && !req.auth) {
        req.auth = {
          kind,
          id,
          role: account?.role ?? userData.role,
          account,
          tokenIssuedAt: decoded.iat,
          tokenExpiresAt: decoded.exp,
          raw: userData,
          source: source,
        };
      }
    }

    return req;

  } catch (error) {
    return req; // continue unauthenticated
  }
};