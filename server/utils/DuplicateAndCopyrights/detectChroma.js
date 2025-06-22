


import fs from 'fs';
import audioDecode from 'audio-decode';
import Meyda from 'meyda';

/**
 * Normalize the audio chunk to values between -1 and 1.
 */
function normalizeAudioChunk(chunk) {
  let max = -Infinity;
  let min = Infinity;

  // Iterate through the chunk to find the max and min values
  for (let i = 0; i < chunk.length; i++) {
    const sample = chunk[i];
    if (sample > max) max = sample;
    if (sample < min) min = sample;
  }

  const range = max - min;
  if (range === 0) return chunk;  // If all values are the same, return the chunk as is

  const normalizedChunk = new Float32Array(chunk.length);
  for (let i = 0; i < chunk.length; i++) {
    normalizedChunk[i] = ((chunk[i] - min) / range) * 2 - 1;
  }

  return normalizedChunk;
}

/**
 * Extracts features (e.g., MFCC) from an audio file.
 * 
 * @param {string} tempPath - Path to the audio file (temporary path).
 * @returns {Promise<object>} - A promise that resolves to the extracted features.
 */


export default async function extractFeatures(tempPath) {
  try {
    // Ensure the file exists
    if (!fs.existsSync(tempPath)) {
      throw new Error('Audio file does not exist at the provided path');
    }

    // Read the audio file
    const buffer = await fs.promises.readFile(tempPath);

    // Decode the audio data using audio-decode
    const audioData = await audioDecode(buffer);
    
    // Extract sample rate and audio buffer (assuming mono channel)
    const sampleRate = audioData.sampleRate;
    const audioBuffer = audioData.getChannelData(0);  // Use the left channel (mono)

    // Debug: Check the audio buffer length and the first few samples
    // console.log('Audio buffer length:', audioBuffer.length);
    // console.log('First 10 samples of audio buffer:', audioBuffer.slice(0, 10));

    // Normalize the audio buffer to avoid very small values
    const normalizedAudioBuffer = normalizeAudioChunk(audioBuffer);

    // Set initial chunk size and hop size
    const initialBufferSize = 1024;  // Default buffer size
    const hopSize = initialBufferSize / 2;  // Hop size for FFT window

    // Prepare to process the audio buffer in chunks
    const features = [];
   

    // Loop through the audio buffer with a sliding window
    let chunkStart = 0;
    const chunkStep = hopSize; // Move step-by-step
    while (chunkStart + initialBufferSize <= normalizedAudioBuffer.length) {
      const chunkEnd = chunkStart + initialBufferSize;
      let chunk = normalizedAudioBuffer.slice(chunkStart, chunkEnd);

      // Debug: Log chunk and check chunk size
      // console.log(`Processing chunk from ${chunkStart} to ${chunkEnd}`);
      // console.log('Chunk data (first 10 samples):', chunk.slice(0, 10));

      // Ensure the chunk size is a power of 2
      const chunkSizePowerOf2 = nextPowerOf2(chunk.length);
      if (chunk.length !== chunkSizePowerOf2) {
        // If the chunk size is not a power of 2, pad the chunk to the next power of 2
        const paddedChunk = new Float32Array(chunkSizePowerOf2);
        paddedChunk.set(chunk);  // Copy the original chunk to the padded array
        chunk = paddedChunk;
      }

      // Extract MFCC features for this chunk
      const mfccFeatures = Meyda.extract('mfcc', chunk, {
        sampleRate,
        bufferSize: chunkSizePowerOf2,  // Buffer size should be power of 2
        hopSize: hopSize,
        numberOfMFCCCoefficients: 13,  // Number of MFCC coefficients
      });



       const chromaFeatures = Meyda.extract('chroma', chunk, {
        sampleRate,
        bufferSize: chunkSizePowerOf2,  // Buffer size should be power of 2
        hopSize: hopSize,
        numberOfMFCCCoefficients: 13,  // Number of MFCC coefficients
      });


      


      // Log the extracted MFCC features for debugging
      // console.log(`Extracted MFCC Features for Chunk ${chunkStart / initialBufferSize + 1}:`);
      // console.log('Extracted MFCC :', mfccFeatures);

      // Store the features (you can process them further or return them)
     features.push({ mfcc: mfccFeatures, chroma: chromaFeatures });
      

      // Move the start of the chunk forward by the hopSize (sliding window)
      chunkStart += chunkStep;
    }

    // Return the extracted features from all chunks
    return features;
    
  } catch (error) {
    console.error('Error extracting features:', error);
    throw error; 
  }
}

/**
 * Returns the next power of 2 greater than or equal to the input size.
 * 
 * @param {number} size - The input size.
 * @returns {number} - The next power of 2 greater than or equal to size.
 */
function nextPowerOf2(size) {
  return Math.pow(2, Math.ceil(Math.log2(size)));
}







