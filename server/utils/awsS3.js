import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    const client = new S3Client({ region });
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
 */
const CreatePresignedUrlDownload = async ({ region, bucket, key }) => {
  try {
    const client = new S3Client({ region });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 18000 });
  } catch (error) {
    console.error('Error generating presigned URL for download:', error);
    throw new Error('Failed to generate presigned URL for download');
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
    const client = new S3Client({ region });
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
};
