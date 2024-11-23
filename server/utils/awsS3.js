import { S3Client } from '@aws-sdk/client-s3';

// Create the S3 client instance
const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export default client;