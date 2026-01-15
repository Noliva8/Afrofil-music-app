
export const songKey = (id) => `song#${id}`;

export const userLikesKey =(id) =>`users:likes#${id}`


export const trendIndexZSet = `trend:songs:zset`;
export const INITIAL_RECENCY_SCORE = 1000;
export const TRENDING_SLOTS = 20;
export const PLAY_COOLDOWN_SECONDS = 60;
export const SIMILAR_SONGS_PLAYBACK = (userId) => `sim:songs:${userId}`; 
export const PLAYBACK_SONGS = (userId) => `playback:${userId}`; // playback session storage
export const ARTIST_FOLLOWERS = (artistId) => `followere${artistId}`
export const ARTIST_DOWNLOADS = (artistId) => `downloads${artistId}`
export const ARTIST_SHARE = (artistId) => `shares${artistId}`
export const ARTIST_SONGS = (artistId) => `artistSongs${artistId}`
export const ARTIST_SONGS_EXPIRY = 24 * 60 * 60; 
export const CLOUDFRONT_EXPIRATION = 3600

export const TRENDING_WEIGHTS = {
  PLAY_WEIGHT: 1,      
  LIKE_WEIGHT: 3,
  DOWNLOAD_WEIGHT: 5
};

export const similarSongsMatches = (id) => `songs:exactSimilar#${id}`;




export const SIMILARITY_TIERS = {
  EXACT: 'similar#exact',
  HIGH: 'similar#high', 
  MEDIUM: 'similar#medium',
  BASIC: 'similar#basic',
  MINIMAL: 'similar#minimal'
};

export const AVAILABLE_ADS_KEY = (userId) => `ads:user#${userId}#available`;
export const CACHE_TTL_SECONDS = 24 * 60 * 60; 
// One year TTL for long-lived sets (e.g., artist followers)
export const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
