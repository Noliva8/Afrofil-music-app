import path from "path";
import { fileTypeFromFile } from "file-type";

const ALLOWED_FORMATS = ["mp3", "wav", "flac"];

/**
 * Validates the format of an uploaded audio file.
 * @param {string} filePath 
 * @returns {Promise<boolean>} 
 */
export async function validateAudioFormat(filePath) {
  const fileType = await fileTypeFromFile(filePath);
  
  if (!fileType) {
    throw new Error("Could not determine file type. Please upload a valid audio file.");
  }

  const fileExtension = fileType.ext.toLowerCase();

  if (!ALLOWED_FORMATS.includes(fileExtension)) {
    throw new Error(`Invalid song format. Allowed formats: ${ALLOWED_FORMATS.join(", ")}`);
  }

  return true;
}
