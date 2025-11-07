

// const JWT_CONFIG = {
//   secret: process.env.JWT_SECRET,
//   expiration: process.env.JWT_EXPIRATION || '24h',
//   issuer: process.env.JWT_ISSUER || 'Afrofeel',
//   audience: process.env.JWT_AUDIENCE || 'African-music-app',
//   algorithm: 'HS256'
// };

// // Validate
// if (!JWT_CONFIG.secret) {
//   throw new Error('JWT_SECRET environment variable is required');
// }

// export default JWT_CONFIG;


const JWT_CONFIG = {
  secretUser: process.env.JWT_SECRET_USER,
  secretArtist: process.env.JWT_SECRET_ARTIST,
  secretAdvertiser: process.env.JWT_SECRET_ADVERTIZER,

  expiration: process.env.JWT_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'Afrofeel',

  audience: {
    user: 'afrofeel:user',
    artist: 'afrofeel:artist',
    advertiser: 'afrofeel:advertiser',
  },

  algorithm: 'HS256',
  clockToleranceSec: Number(process.env.JWT_CLOCK_TOLERANCE_SEC || 5),
};

if (!JWT_CONFIG.secretUser) throw new Error('JWT_SECRET_USER is required');
if (!JWT_CONFIG.secretArtist) throw new Error('JWT_SECRET_ARTIST is required');
if (!JWT_CONFIG.secretAdvertiser) throw new Error('JWT_SECRET_ADVERTIZER is required');

export default JWT_CONFIG;