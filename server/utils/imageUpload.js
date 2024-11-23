import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const handleImageUpload = async (file) => {
  const { createReadStream, filename, mimetype } = await file;

  // Define allowed MIME types
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  if (!allowedMimeTypes.includes(mimetype)) {
    throw new Error("Invalid file type. Please upload a JPEG or PNG image.");
  }

  // Resize the image using Sharp
  const resizedImageBuffer = await sharp(createReadStream())
    .resize({ width: 600, height: 600 })
    .toBuffer();

  const fileName = `${uuidv4()}-${filename}`;
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: resizedImageBuffer,
    ContentType: mimetype,
    ACL: 'public-read', // Optional: make file public
  };

  // Upload to S3
  const command = new PutObjectCommand(params);
  await client.send(command);

  // Return the file URL
  return `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${fileName}`;
};

export default handleImageUpload;