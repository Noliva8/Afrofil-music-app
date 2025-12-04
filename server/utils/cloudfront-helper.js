// cloudfront-helper.js
export const CLOUDFRONT_DOMAIN = 'https://d1is1eedem5lyc.cloudfront.net';

/**
 * Generate CloudFront URL for public content (replaces pre-signed S3 downloads)
 */
export const getCloudFrontUrl = ({ key, type = 'audio' }) => {
  // Clean and encode the key
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
  
  // Map content types to CloudFront paths
  const pathMap = {
    audio: 'for-streaming',
    image: 'images',
    audio_ad_original: 'ads',
    original_songs: 'original_songs/',
    artwork: 'artwork'
  };
  
  const prefix = pathMap[type] || '';
  const path = prefix ? `${prefix}/${encodedKey}` : encodedKey;
  
  return `${CLOUDFRONT_DOMAIN}/${path}`;
};