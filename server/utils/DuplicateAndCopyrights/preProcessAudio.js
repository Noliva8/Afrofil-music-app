// import fs from 'fs';
// import wavDecoder from 'wav-decoder';
// import ffmpeg from 'fluent-ffmpeg';
// import Meyda from 'meyda';
// import { v4 as uuidv4 } from 'uuid';

// // Function to get the next power of 2, capped at 8192 (Meyda's limit)
// function getNextPowerOf2(n) {
//     if (n < 2) return 2;
//     let power = 1;
//     while (power * 2 <= n && power < 8192) { 
//         power *= 2;
//     }
//     return power;
// }

// // Convert audio to WAV format
// async function convertToWav(inputPath, outputPath) {
//     return new Promise((resolve, reject) => {
//         ffmpeg(inputPath)
//             .audioChannels(1)  
//             .audioFrequency(44100)  
//             .format('wav')  
//             .on('end', () => resolve(outputPath))
//             .on('error', (err) => reject(`FFmpeg error: ${err.message}`))
//             .save(outputPath);
//     });
// }

// // Main preprocessing function
// export default async function preProcessAudio(filePath) {
//     let tempPath;
//     try {
//         console.log("Processing file:", filePath);
//         tempPath = `temp-${uuidv4()}.wav`;

//         const wavPath = filePath.endsWith(".wav") ? filePath : await convertToWav(filePath, tempPath);

//         const buffer = fs.readFileSync(wavPath);
//         const audioData = await wavDecoder.decode(buffer);

//         if (!audioData.channelData || audioData.channelData.length === 0) {
//             throw new Error("Decoded audio data is empty.");
//         }

//         const sampleRate = audioData.sampleRate;
//         const sampleFrames = sampleRate * 30;
//         const channelData = audioData.channelData[0];

//         if (!channelData || channelData.length === 0) {
//             throw new Error("Channel data is empty.");
//         }

//         let trimmedData = channelData.slice(0, Math.min(sampleFrames, channelData.length));

//         // Ensure buffer size is a power of 2 and not too large
//         const adjustedBufferSize = getNextPowerOf2(trimmedData.length);
//         const adjustedData = trimmedData.slice(0, adjustedBufferSize);
        
//         console.log(`Adjusted Data Length (Power of 2): ${adjustedData.length}`);

//         // Meyda feature extraction
//         if (!Meyda) {
//             throw new Error("Meyda is not initialized.");
//         }

//         const windowedData = Meyda.windowing(adjustedData, "hanning");

//         console.log("Extracting features...");
//         const features = Meyda.extract(["rms", "spectralCentroid"], windowedData);
//         console.log("Extracted Features:", features);

//         return new Float32Array(windowedData);
//     } catch (error) {
//         console.error("Error preprocessing audio:", error);
//         throw error;
//     } finally {
//         if (tempPath && fs.existsSync(tempPath)) {
//             fs.unlinkSync(tempPath);
//         }
//     }
// }

// ------------------------------------------------

// import fs from 'fs/promises';
// import wavDecoder from 'wav-decoder';
// import ffmpeg from 'fluent-ffmpeg';
// import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
// import os from 'os';

// // Configuration
// const CONFIG = {
//   targetSampleRate: 44100,
//   targetLoudness: -16,
//   targetTruePeak: -1.5,
//   targetLRA: 11,
//   analysisWindowSec: 1,
//   flatWindowRatio: 0.2,
//   maxWorkers: Math.max(1, os.cpus().length - 1),
//   chunkSize: 44100 * 10 // 10-second chunks
// };

// // Worker thread functions
// if (!isMainThread) {
//   const { samples, start, end, method } = workerData;
  
//   const calculateEnergy = (samples, start, end) => {
//     let energy = 0;
//     for (let i = start; i < end; i++) {
//       energy += Math.abs(samples[i]);
//     }
//     return energy / (end - start);
//   };
  
//   parentPort.postMessage(calculateEnergy(samples, start, end));
//   process.exit(0);
// }

// // Optimized utility functions
// const getPowerOf2BufferSize = (n, max = 32768) => {
//   const log2 = Math.log2(n);
//   return Math.pow(2, Math.min(Math.floor(log2), Math.log2(max)));
// };

// const applyHybridWindow = (samples, flatRatio = CONFIG.flatWindowRatio) => {
//   const transitionSamples = Math.floor(samples.length * (1 - flatRatio) / 2);
//   const transitionEnd = samples.length - transitionSamples;
  
//   for (let i = 0; i < transitionSamples; i++) {
//     const window = 0.5 * (1 - Math.cos(Math.PI * i / transitionSamples));
//     samples[i] *= window;
//     samples[samples.length - 1 - i] *= window;
//   }
  
//   return samples;
// };

// // Parallel processing with worker threads
// async function parallelEnergyCalculation(samples, windowSize) {
//   const workerPromises = [];
//   const workerCount = Math.min(CONFIG.maxWorkers, Math.ceil(samples.length / windowSize));
  
//   for (let i = 0; i < samples.length - windowSize; i += Math.floor(samples.length / workerCount)) {
//     const end = Math.min(i + Math.floor(samples.length / workerCount) + windowSize, samples.length);
//     workerPromises.push(new Promise((resolve) => {
//       const worker = new Worker(new URL(import.meta.url), {
//         workerData: {
//           samples,
//           start: i,
//           end: end,
//           method: 'absolute'
//         }
//       });
//       worker.on('message', resolve);
//       worker.on('error', (err) => {
//         console.error('Worker error:', err);
//         resolve(0);
//       });
//     }));
//   }
  
//   const results = await Promise.all(workerPromises);
//   return results.reduce((max, energy, idx) => 
//     energy > max.energy ? { energy, index: idx * Math.floor(samples.length / workerCount) } : max, 
//     { energy: 0, index: 0 }
//   );
// }

// // Main preprocessing function
// export default async function preProcessAudio(filePath, { maxDurationSeconds = 30 } = {}) {
//   const startTime = process.hrtime.bigint();
//   let tempPath = null;
  
//   try {
//     console.log(`[1/6] Starting processing for: ${filePath}`);

//     // 1. File validation (parallel I/O)
//     const [stats] = await Promise.all([
//       fs.stat(filePath),
//       fs.access(filePath, fs.constants.R_OK)
//     ]);
    
//     const fileSizeMB = stats.size / (1024 * 1024);
//     console.log(`[2/6] File size: ${fileSizeMB.toFixed(2)}MB`);

//     // 2. Convert to WAV with parallel processing
//     tempPath = `./temp-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
//     const wavPath = filePath.endsWith('.wav') ? filePath : await new Promise((resolve, reject) => {
//       const command = ffmpeg(filePath)
//         .audioChannels(1)
//         .audioFrequency(CONFIG.targetSampleRate)
//         .audioFilters(`loudnorm=I=${CONFIG.targetLoudness}:TP=${CONFIG.targetTruePeak}:LRA=${CONFIG.targetLRA}`)
//         .on('error', reject);
      
//       if (maxDurationSeconds) {
//         command.duration(maxDurationSeconds);
//       }
      
//       command
//         .on('end', () => resolve(tempPath))
//         .save(tempPath);
//     });

//     // 3. Parallel decode and validate
//     console.log(`[3/6] Decoding audio...`);
//     const buffer = await fs.readFile(wavPath);
//     const audioData = await wavDecoder.decode(buffer);
    
//     if (!audioData.channelData?.[0]?.length) {
//       throw new Error("No audio channels detected");
//     }

//     const rawSamples = audioData.channelData[0];
//     console.log(`[4/6] Decoded ${rawSamples.length.toLocaleString()} samples (${(rawSamples.length/CONFIG.targetSampleRate).toFixed(2)}s)`);

//     // 4. Parallel energy analysis
//     console.log(`[5/6] Analyzing audio energy...`);
//     const analysisWindow = CONFIG.targetSampleRate * CONFIG.analysisWindowSec;
//     const { index: bestStart } = await parallelEnergyCalculation(rawSamples, analysisWindow);
    
//     console.log(`• Best audio segment starts at ${(bestStart/CONFIG.targetSampleRate).toFixed(2)}s`);

//     // 5. Optimized window processing
//     const bufferSize = getPowerOf2BufferSize(analysisWindow * 3);
//     const samples = new Float32Array(bufferSize);
    
//     // Pre-calculate window function
//     const window = new Float32Array(bufferSize);
//     const transitionSamples = Math.floor(bufferSize * (1 - CONFIG.flatWindowRatio) / 2);
//     for (let i = 0; i < transitionSamples; i++) {
//       const w = 0.5 * (1 - Math.cos(Math.PI * i / transitionSamples));
//       window[i] = w;
//       window[bufferSize - 1 - i] = w;
//     }
//     for (let i = transitionSamples; i < bufferSize - transitionSamples; i++) {
//       window[i] = 1.0;
//     }
    
//     // Apply window in single pass
//     for (let i = 0; i < bufferSize; i++) {
//       samples[i] = (rawSamples[bestStart + i] || 0) * window[i];
//     }

//     // 6. Fast validation stats
//     let max = -Infinity, min = Infinity, nonZero = 0;
//     for (let i = 0; i < samples.length; i++) {
//       const val = samples[i];
//       if (val > max) max = val;
//       if (val < min) min = val;
//       if (Math.abs(val) > 0.0001) nonZero++;
//     }
    
//     if (nonZero === 0) throw new Error("Silent output detected");
    
//     const processingTime = Number(process.hrtime.bigint() - startTime) / 1e9;
//     console.log(`[6/6] Processing completed in ${processingTime.toFixed(2)}s`);
//     console.log(`• Sample stats: max=${max.toExponential(2)}, min=${min.toExponential(2)}, nonZero=${nonZero}`);

//     return {
//       samples,
//       sampleRate: audioData.sampleRate,
//       processingTime
//     };

//   } catch (error) {
//     console.error(`❌ Processing failed: ${error.message}`);
//     throw error;
//   } finally {
//     if (tempPath) {
//       fs.unlink(tempPath).catch(() => {});
//     }
//   }
// }


import fs from 'fs/promises';
import wavDecoder from 'wav-decoder';
import ffmpeg from 'fluent-ffmpeg';

// Simplified Configuration
const CONFIG = {
  targetSampleRate: 44100,
  targetLoudness: -16,
  targetTruePeak: -1.5,
  targetLRA: 11,
  analysisWindowSec: 1,
  flatWindowRatio: 0.2,
  minEnergyThreshold: 0.05, // Ensure we don't process silent segments
  gainBoost: 2.5 // Boost samples if too quiet
};

export default async function preProcessAudio(filePath, { maxDurationSeconds = 30 } = {}) {
  let tempPath = `./temp-${Date.now()}.wav`;

  try {
    // 1. File validation
    const stats = await fs.stat(filePath);
    console.log(`Processing: ${filePath} (${(stats.size / (1024 * 1024)).toFixed(2)}MB)`);

    // 2. Convert to WAV
    await new Promise((resolve, reject) => {
      const command = ffmpeg(filePath)
        .audioChannels(1)
        .audioFrequency(CONFIG.targetSampleRate)
        .audioFilters([
          `loudnorm=I=${CONFIG.targetLoudness}:TP=${CONFIG.targetTruePeak}:LRA=${CONFIG.targetLRA}`,
          `volume=5` // 🔥 Boost volume to avoid low-energy issues
        ]);

      if (maxDurationSeconds) command.duration(maxDurationSeconds);

      command
        .on('end', async () => {
          try {
            await fs.access(tempPath);
            resolve();
          } catch {
            reject(new Error("WAV file conversion failed!"));
          }
        })
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .save(tempPath);
    });

    // 3. Decode audio
    const buffer = await fs.readFile(tempPath);
    const { channelData, sampleRate } = await wavDecoder.decode(buffer);

    if (!channelData || channelData.length === 0 || !channelData[0]?.length) {
      throw new Error("Decoded audio is empty or invalid!");
    }

    const rawSamples = channelData[0];
    console.log(`Decoded audio: ${rawSamples.length} samples at ${sampleRate}Hz`);

    // 4. Find optimal segment
    const windowSize = CONFIG.targetSampleRate * CONFIG.analysisWindowSec;
    let bestStart = 2;
    let maxEnergy = 0;

    for (let start = 0; start < rawSamples.length - windowSize; start += Math.floor(windowSize / 2)) {
      let energy = rawSamples.slice(start, start + windowSize).reduce((sum, val) => sum + Math.abs(val), 0) / windowSize;
      if (energy > maxEnergy) {
        maxEnergy = energy;
        bestStart = start;
      }
    }

    if (maxEnergy < CONFIG.minEnergyThreshold) {
      console.warn(`⚠️ Warning: Low audio energy (${maxEnergy.toFixed(6)}), applying gain boost!`);
      for (let i = 0; i < rawSamples.length; i++) {
        rawSamples[i] *= CONFIG.gainBoost; // Apply gain boost if needed
      }
    }

    console.log(`Best segment starts at sample index: ${bestStart}, max energy: ${maxEnergy.toFixed(6)}`);

    // 5. Apply window function
    const bufferSize = Math.min(32768, Math.pow(2, Math.ceil(Math.log2(windowSize * 3))));
    const samples = new Float32Array(bufferSize);
    const transitionSamples = Math.floor(bufferSize * (1 - CONFIG.flatWindowRatio) / 2);

    for (let i = 0; i < bufferSize; i++) {
      const sourceIdx = bestStart + i;
      let window = 1.0;
      
      if (i < transitionSamples) {
        window = 0.5 * (1 - Math.cos(Math.PI * i / transitionSamples));
      } else if (i > bufferSize - transitionSamples) {
        window = 0.5 * (1 - Math.cos(Math.PI * (bufferSize - i) / transitionSamples));
      }

      samples[i] = (sourceIdx < rawSamples.length ? rawSamples[sourceIdx] : 0) * window;
    }

    console.log("Sample preview:", samples.slice(0, 10));
    console.log(`Processed ${samples.length} samples at ${sampleRate}Hz`);

    return {
      samples,
      sampleRate,
      segmentStart: bestStart / sampleRate
    };

  } catch (error) {
    console.error(`Processing failed: ${error.message}`);
    throw error;
  } finally {
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch (err) {
        console.warn(`Failed to delete temp file: ${tempPath}`);
      }
    }
  }
}
