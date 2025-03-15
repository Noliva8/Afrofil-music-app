import fs from 'fs';

/**
 * Deletes the temporary files if they exist.
 * @param {string} tempFilePath - Path to the temporary file.
 * @param {string} processedFilePath - Path to the processed file.
 */
async function cleanupTempFiles(tempFilePath, processedFilePath) {
  try {
    // Check if tempFilePath exists before attempting to delete
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
      console.log('Temporary file deleted:', tempFilePath);
    } else {
      console.log('Temporary file does not exist or already deleted:', tempFilePath);
    }

    // Check if processedFilePath exists before attempting to delete
    if (processedFilePath && fs.existsSync(processedFilePath)) {
      await fs.promises.unlink(processedFilePath);
      console.log('Processed file deleted:', processedFilePath);
    } else {
      console.log('Processed file does not exist or already deleted:', processedFilePath);
    }
  } catch (error) {
    console.error('Error deleting temporary files:', error);
  }
}

export default cleanupTempFiles;
