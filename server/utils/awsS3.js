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






const CreatePresignedUrl = async ({ region, bucket, key }) => {
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
const CreatePresignedUrlDownload = async ({ region, bucket, key }) => {
  try {
    const client = new S3Client({ region,
      credentials: {
    accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
    secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM
  } });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 18000 });
  } catch (error) {
    console.error('Error generating presigned URL for download:', error);
    throw new Error('Failed to generate presigned URL for download');
  }
};



const CreatePresignedUrlDownloadAudio = async ({ region, bucket, key }) => {
  // Audio-specific with content type set to audio/mpeg
  try {
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.JWT_ACCESS_KEY_SONGS_TO_STREAM,
        secretAccessKey: process.env.JWT_SECRET_KEY_SONGS_TO_STREAM,
      },
    });
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: 'audio/mpeg',
    });

    console.log("🔑 Audio key used for presigned URL:", key);

    return await getSignedUrl(client, command, { expiresIn: 18000 });
  } catch (error) {
    console.error('Error generating presigned URL for audio download:', error);
    throw new Error('Failed to generate presigned URL for audio download');
  }
};








/**
 * Generates a presigned URL for deleting objects from S3.
 * @param {Object} params - The input parameters.
 * @param {string} params.region - The AWS region.
 * @param {string} params.bucket - The S3 bucket name.
 * @param {string} params.key - The object key.
 * @returns {Promise<string>} - The generated presigned URL.
 */
const CreatePresignedUrlDelete = async ({ region, bucket, key }) => {
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

export default {
  CreatePresignedUrl,
  CreatePresignedUrlDownload,
  CreatePresignedUrlDelete,
  CreatePresignedUrlDownloadAudio
};
