
export const songKey = (id) => `song#${id}`;

export const userLikesKey =(id) =>`users:likes#${id}`


export const trendIndexZSet = `trend:songs:zset`;
export const INITIAL_RECENCY_SCORE = 1000;
export const TRENDING_SLOTS = 20;
export const PLAY_COOLDOWN_SECONDS = 60;
export const SIMILAR_SONGS_PLAYBACK=(userId)=>`s:cmve${userId}`
// keys.js
export const PLAYBACK_SONGS = (userId) => `s:cmve${userId}`;



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
export const CACHE_TTL_SECONDS = 24 * 60* 60; 

