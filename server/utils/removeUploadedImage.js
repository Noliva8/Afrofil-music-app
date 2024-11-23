import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const deletePreviousImageUploaded = async (fileName) => {
  // Define parameters for the DeleteObjectCommand
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,  // Use the S3 key of the file to delete
  };

  // Delete from S3
  const command = new DeleteObjectCommand(params);
  try {
    const response = await client.send(command);
    console.log(`The file ${fileName} was deleted successfully.`);
    return `The file ${fileName} was deleted successfully.`;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete the file: ${error.message}`);
  }
};

export default deletePreviousImageUploaded;