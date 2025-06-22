import zlib from 'zlib';  // For compression
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);  

/**
 * Compress the MFCC features using gzip compression.
 * This utility will serialize the MFCC features and compress them.
 * 
 * @param {Array} mfccFeatures - The extracted MFCC features.
 * @returns {Promise<string>} - A promise that resolves to the compressed MFCC data as a base64 string.
 */
async function compressMFCCFeatures(mfccFeatures) {
  try {
    // Step 1: Serialize MFCC features into JSON
    const serializedMFCC = JSON.stringify(mfccFeatures);

    // Step 2: Compress the serialized MFCC features using gzip
    const compressedMFCC = await gzip(serializedMFCC);

    // Step 3: Return the compressed features as a base64 encoded string
    return compressedMFCC.toString('base64');
    
  } catch (error) {
    console.error('Error compressing MFCC features:', error);
    throw error;  // Re-throw to allow caller to handle the error
  }
}

/**
 * Decompress the compressed MFCC data.
 * This utility will decompress the compressed MFCC data and parse it back into its original form.
 * 
 * @param {string} compressedMFCC - The compressed MFCC data as a base64 string.
 * @returns {Promise<object>} - A promise that resolves to the decompressed MFCC features.
 */
async function decompressMFCCFeatures(compressedMFCC) {
  try {
    // Step 1: Decode the base64 compressed MFCC data
    const compressedBuffer = Buffer.from(compressedMFCC, 'base64');

    // Step 2: Decompress the data using gzip
    const decompressedBuffer = await promisify(zlib.gunzip)(compressedBuffer);

    // Step 3: Parse the decompressed data back into its original form (JSON)
    const decompressedMFCC = JSON.parse(decompressedBuffer.toString());

    return decompressedMFCC;

  } catch (error) {
    console.error('Error decompressing MFCC features:', error);
    throw error;  // Re-throw to allow caller to handle the error
  }
}


export default { compressMFCCFeatures, decompressMFCCFeatures}