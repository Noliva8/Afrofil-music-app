import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

/**
 * Generates a presigned URL for uploading objects to S3.
 * @param {Object} params - The input parameters.
 * @param {string} params.region - The AWS region.
 * @param {string} params.bucket - The S3 bucket name.
 * @param {string} params.key - The object key.
 * @returns {Promise<string>} - The generated presigned URL.
 */





// Guard to avoid silent bad creds
function assertCreds({ accessKeyId, secretAccessKey }, label) {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(`Missing AWS credentials for ${label}. Check env vars.`);
  }
}

function clampExpires(expiresIn) {
  const MAX = 604800; // 7 days
  const MIN = 60;
  const n = Number(expiresIn);
  return Math.max(MIN, Math.min(Number.isFinite(n) ? n : 18000, MAX));
}

/** Artwork (generic) */
export const CreatePresignedUrlDownloadServerSide = async ({
  region,
  bucket,
  key,
  expiresIn = 18000, // default 5h (backward compatible)
}) => {
  try {
    const cfUrl = shouldUseCloudFront(bucket) ? mapToCloudFront(bucket, key) : null;
    if (cfUrl) return cfUrl;

    const accessKeyId = process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM;
    const secretAccessKey = process.env.JWT_SECRET_KEY_SONGS_TO_STREAM;
    assertCreds({ accessKeyId, secretAccessKey }, `bucket ${bucket} (artwork)`);

    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: clampExpires(expiresIn) });
  } catch (error) {
    console.error("Error generating presigned URL for artwork download:", error);
    throw new Error("Failed to generate presigned URL for artwork download");
  }
};

/** Audio (with ResponseContentType) */
export const CreatePresignedUrlDownloadAudioServerSide = async ({
  region,
  bucket,
  key,
  expiresIn = 18000, // default 5h
}) => {
  try {
    const cfUrl = shouldUseCloudFront(bucket) ? mapToCloudFront(bucket, key) : null;
    if (cfUrl) return cfUrl;

    const accessKeyId = process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM;
    const secretAccessKey = process.env.JWT_SECRET_KEY_SONGS_TO_STREAM;
    assertCreds({ accessKeyId, secretAccessKey }, `bucket ${bucket} (audio)`);

    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: "audio/mpeg",
    });

    return await getSignedUrl(client, command, { expiresIn: clampExpires(expiresIn) });
  } catch (error) {
    console.error("Error generating presigned URL for audio download:", error);
    throw new Error("Failed to generate presigned URL for audio download");
  }
};










export const CreatePresignedUrl = async ({ region, bucket, key }) => {
  try {
    const client = new S3Client({ region,

    credentials: {
    accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
    secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
  } });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating presigned URL for upload:', error);
    throw new Error('Failed to generate presigned URL for upload');
  }
};

/**
 * Generates a presigned URL for downloading objects from S3.
 * @param {Object} params - The input parameters.
 * @param {string} params.region - The AWS region.
 * @param {string} params.bucket - The S3 bucket name.
 * @param {string} params.key - The object key.
 * @returns {Promise<string>} - The generated presigned URL.
 * 
 */

// deprecated

// export const CreatePresignedUrlDownload = async ({ region, bucket, key }) => {
//   try {
//     const client = new S3Client({ region,
//       credentials: {
//     accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
//     secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
//   } });
//     const command = new GetObjectCommand({ Bucket: bucket, Key: key });
//     return await getSignedUrl(client, command, { expiresIn: 18000 });
//   } catch (error) {
//     console.error('Error generating presigned URL for download:', error);
//     throw new Error('Failed to generate presigned URL for download');
//   }
// };


// migration from streaming to s3 to cloudFront
// -------------------------------------------


// CloudFront mapping: keep client contract unchanged; server maps S3 key → CF URL when possible
const CF_DIST = process.env.CLOUDFRONT_DIST || 'https://d1is1eedem5lyc.cloudfront.net';
const bucketMap = {
  'afrofeel-songs-streaming': { strip: 'for-streaming/', path: 'for-streaming' },
  'audio-ad-streaming': { strip: 'ads/', path: 'ads' },
  'audio-ad-artwork': { strip: 'artwork/', path: 'artwork' },
  'afrofeel-original-songs': { strip: 'original_songs/', path: 'original-songs' }
};

function mapToCloudFront(bucket, key) {
  const mapping = bucketMap[bucket];
  if (!mapping) return null;

  const cleanKey = key.startsWith(mapping.strip)
    ? key.slice(mapping.strip.length)
    : key;

  const encodedKey = encodeURIComponent(cleanKey).replace(/%2F/g, '/');
  return `${CF_DIST.replace(/\/$/, '')}/${mapping.path}/${encodedKey}`;
}

// Allow opting out of CF for artwork if behavior isn’t matching; set FORCE_CF_ARTWORK=1 to force
function shouldUseCloudFront(bucket) {
  if (bucket === 'audio-ad-artwork') {
    return process.env.FORCE_CF_ARTWORK === '1';
  }
  return true;
}

export const CreatePresignedUrlDownload = async ({ region, bucket, key }) => {
  try {
    const cfUrl = shouldUseCloudFront(bucket) ? mapToCloudFront(bucket, key) : null;
    if (cfUrl) return cfUrl;

    // fallback to S3 presign (unmapped buckets like artwork)
    const client = new S3Client({ 
      region,
      credentials: {
        accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
        secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
      }
    });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 18000 });
  } catch (error) {
    console.error('Error generating CloudFront/S3 URL:', error);
    throw new Error('Failed to generate download URL');
  }
};







// deprecated
// ---------

// export const CreatePresignedUrlDownloadAudio = async ({ region, bucket, key }) => {
//   // Audio-specific with content type set to audio/mpeg
//   try {
//     const client = new S3Client({
//       region,
//       credentials: {
//         accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
//         secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
//       },
//     });
//     const command = new GetObjectCommand({
//       Bucket: bucket,
//       Key: key,
//       ResponseContentType: 'audio/mpeg',
//     });

//     // console.log("🔑 Audio key used for presigned URL:", key);

//     return await getSignedUrl(client, command, { expiresIn: 18000 });
//   } catch (error) {
//     console.error('Error generating presigned URL for audio download:', error);
//     throw new Error('Failed to generate presigned URL for audio download');
//   }
// };




// migration
// ---------
export const CreatePresignedUrlDownloadAudio = async ({ region, bucket, key }) => {
  console.log('🔍 AUDIO DEBUG - Received:', { bucket, key });
  
  // Map ALL audio buckets to CloudFront
  const bucketToPath = {
    // Music
    'afrofeel-songs-streaming': 'for-streaming',
    
    // Ads
    'audio-ad-streaming': 'ads',
    'audio-ad-streaming-fallback': 'ads',
    'audio-ad-original': 'ads',
    
    // Other audio buckets
    'afrofeel-original-songs': 'original-songs',
    'audio-ad-artwork': 'artwork',
  };
  
  const cloudfrontPath = bucketToPath[bucket];
  
  if (cloudfrontPath) {
    // Clean up key if it already contains the path
    let cleanKey = key;
    
    // Remove path prefix if it matches the CloudFront path
    if (key.startsWith(`${cloudfrontPath}/`)) {
      cleanKey = key.replace(new RegExp(`^${cloudfrontPath}/`), '');
      console.log(`🔄 Cleaned ${bucket} key: ${key} → ${cleanKey}`);
    }
    // Special case for music bucket
    else if (bucket === 'afrofeel-songs-streaming' && key.startsWith('for-streaming/')) {
      cleanKey = key.replace(/^for-streaming\//, '');
      console.log(`🔄 Cleaned music key: ${key} → ${cleanKey}`);
    }
    // Special case for ad buckets
    else if (bucket.includes('audio-ad') && key.startsWith('ads/')) {
      cleanKey = key.replace(/^ads\//, '');
      console.log(`🔄 Cleaned ad key: ${key} → ${cleanKey}`);
    }
    
    const encodedKey = encodeURIComponent(cleanKey).replace(/%2F/g, '/');
    const cloudfrontUrl = `https://d1is1eedem5lyc.cloudfront.net/${cloudfrontPath}/${encodedKey}`;
    
    console.log(`✅ Generated CloudFront URL for ${bucket}:`, cloudfrontUrl);
    return cloudfrontUrl;
  }
  
  // Fallback for unmapped buckets
  console.log(`⚠️ Using pre-signed for unmapped bucket: ${bucket}`);
  const client = new S3Client({ 
    region,
    credentials: {
      accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
      secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
    }
  });
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: 'audio/mpeg'
  });
  
  return await getSignedUrl(client, command, { expiresIn: 18000 });
};






/**
 * Generates a presigned URL for deleting objects from S3.
 * @param {Object} params - The input parameters.
 * @param {string} params.region - The AWS region.
 * @param {string} params.bucket - The S3 bucket name.
 * @param {string} params.key - The object key.
 * @returns {Promise<string>} - The generated presigned URL.
 */
export const CreatePresignedUrlDelete = async ({ region, bucket, key }) => {
  try {
    const client = new S3Client({ region,
      credentials: {
    accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
    secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
  } });
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating presigned URL for delete:', error);
    throw new Error('Failed to generate presigned URL for delete');
  }
};

// export default {
//   CreatePresignedUrl,
//   CreatePresignedUrlDownload,
//   CreatePresignedUrlDelete,
//   CreatePresignedUrlDownloadAudio
// };
