// auth/tokenUtils.js
import jwt from 'jsonwebtoken';
import JWT_CONFIG from './config/authConfig.js';
import { USER_TYPES } from './constant/systemRoles.js';

// Readable map
const SECRET_BY_KIND = {
  [USER_TYPES.USER]: JWT_CONFIG.secretUser,
  [USER_TYPES.ARTIST]: JWT_CONFIG.secretArtist,
  [USER_TYPES.ADVERTISER]: JWT_CONFIG.secretAdvertiser,
};

const AUD_BY_KIND = JWT_CONFIG.audience;



// extract info from token
// ---------------------

export const tokenUtils = {
  extractToken: (raw) => {
    if (!raw) return null;
    const token = String(raw).replace(/^Bearer\s+/i, '').trim();
    // legacy prefix support if you truly need it; otherwise remove
    return token.replace(/^artist_id_/, '');
  },

  /**
   * Verify with the correct secret + audience based on a quick peek.
   * We only trust the token AFTER verify succeeds.
   */
  verifyByKind: (token) => {
    // peek (untrusted) to decide which lock to use
    const preview = jwt.decode(token) || {};
    const data = preview.data || preview;
    const kind = data?.userType || data?.tk; // support both names

    if (!kind || !SECRET_BY_KIND[kind]) {
      const err = new Error('Unknown or missing token kind');
      err.name = 'TokenKindError';
      throw err;
    }

    return jwt.verify(token, SECRET_BY_KIND[kind], {
      issuer: JWT_CONFIG.issuer,
      audience: AUD_BY_KIND[kind],
      algorithms: [JWT_CONFIG.algorithm],
      clockTolerance: JWT_CONFIG.clockToleranceSec,
    });
  },

  decodeUnsafe: (token) => jwt.decode(token),
};




// token generation
// ----------------



export const generateToken = (entity, userType) => {
  if (!Object.values(USER_TYPES).includes(userType)) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  const base = {
    _id: String(entity._id),
    email: entity.email || entity.businessEmail,
    userType, // explicit kind
  };

  let typeSpecific = {};
  switch (userType) {
    case USER_TYPES.USER:
      typeSpecific = {
        username: entity.username,
        role: entity.role ?? 'regular',
        isPremium: Boolean(entity.isPremium),
      };
      break;

    case USER_TYPES.ARTIST:
      typeSpecific = {
        artistAka: entity.artistAka,
        fullName: entity.fullName,
        confirmed: Boolean(entity.confirmed),
        selectedPlan: Boolean(entity.selectedPlan),
        role: 'artist',
      };
      break;

    case USER_TYPES.ADVERTISER:
      typeSpecific = {
        businessEmail: entity.businessEmail,
        fullName: entity.fullName,
        companyName: entity.companyName,
        phoneNumber: entity.phoneNumber,
        isConfirmed: Boolean(entity.isConfirmed),
        isPhoneConfirmed: Boolean(entity.isPhoneConfirmed),
        role: entity.role ?? 'advertiser',
        isSuperAdmin: Boolean(entity.isSuperAdmin),
        permissions: Array.isArray(entity.permissions) ? entity.permissions : [],
      };
      break;
  }

  const data = { ...base, ...typeSpecific };

  const token = jwt.sign({ data }, SECRET_BY_KIND[userType], {
    expiresIn: JWT_CONFIG.expiration,
    issuer: JWT_CONFIG.issuer,
    audience: AUD_BY_KIND[userType],
    algorithm: JWT_CONFIG.algorithm,
  });

  return token;
};

// Backward-compatible helpers
export const signUserToken = (u) => generateToken(u, USER_TYPES.USER);
export const signArtistToken = (a) => generateToken(a, USER_TYPES.ARTIST);
export const signAdvertiserToken = (adv) => generateToken(adv, USER_TYPES.ADVERTISER);
