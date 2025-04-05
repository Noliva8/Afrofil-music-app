// // fingerprintGenerator.js

// import Meyda from "./audioFactory.js";

// export default class FingerprintGenerator {
//   constructor(config = {}) {
//     this.meyda = new Meyda({
//       bufferSize: config.bufferSize || 2048,
//       sampleRate: config.sampleRate || 44100,
//     });

//     this.sampleRate = config.sampleRate || 44100;
//     this.hopSize = config.hopSize || Math.floor(this.meyda.bufferSize / 2);

//     this.minPeakMagnitude = config.minPeakMagnitude || 0.005;
//     console.log("verifying sampleRate:", this.sampleRate);
//     console.log("verifying hopsize:", this.hopSize);
//     console.log("verifying minPeakMagnitude:", this.minPeakMagnitude);
//   }

//   generate(samples) {
//     const fingerprints = new Set();
//     const windowSize = this.meyda.bufferSize;
//     let currentTime = 0;
//     const timeIncrement = this.hopSize / this.sampleRate;

//     // To collect deltaTimes for analysis
//     let deltaTimes = [];

//     // Calculate song length in seconds
//     const songLengthInSeconds = samples.length / this.sampleRate;

//     // Dynamically determine the chunk size based on the song length
//     const chunkSize = this.calculateChunkSize(songLengthInSeconds);

//     console.log(`Song Length: ${songLengthInSeconds} seconds`);
//     console.log(`Using chunk size of: ${chunkSize} seconds`);

//     // Loop through samples with dynamic chunk size
//     for (let i = 0; i <= samples.length - windowSize; i += this.hopSize) {
//       const chunk = samples.slice(i, i + windowSize);
//       const features = this.meyda.extract(["findSpectrumPeaks"], chunk);

//       if (features?.findSpectrumPeaks?.length >= 2) {
//         const peaks = features.findSpectrumPeaks
//           .filter((peak) => peak.magnitude >= this.minPeakMagnitude)
//           .map((peak) => ({
//             freq: Math.round(peak.freq / 10) * 10, // Normalize frequency to the nearest 10Hz
//             time: currentTime + (peak.time || 0) / 1000, // Convert to seconds
//           }))
//           .sort((a, b) => a.freq - b.freq);

//         // Collect deltaTimes for analysis (between peak pairs)
//         for (let j = 0; j < peaks.length - 1; j++) {
//           for (let k = j + 1; k < Math.min(j + 6, peaks.length); k++) {
//             const deltaTime = (peaks[k].time - peaks[j].time) / 1000;
//             deltaTimes.push(deltaTime); // Collect valid deltaTimes for analysis
//           }
//         }
//       }

//       currentTime += timeIncrement;
//     }

//     // Calculate statistical metrics for deltaTimes
//     const meanDeltaTime = this.calculateMean(deltaTimes);
//     const stdDevDeltaTime = this.calculateStdDev(deltaTimes);
//     const dynamicThreshold = meanDeltaTime + 2 * stdDevDeltaTime; // Example: Mean + 2 * StdDev

//     console.log(`Dynamic Threshold for deltaTime: ${dynamicThreshold}`);

//     // Now filter and generate hashes based on the dynamic threshold
//     for (let i = 0; i <= samples.length - windowSize; i += this.hopSize) {
//       const chunk = samples.slice(i, i + windowSize);
//       const features = this.meyda.extract(["findSpectrumPeaks"], chunk);

//       if (features?.findSpectrumPeaks?.length >= 2) {
//         const peaks = features.findSpectrumPeaks
//           .filter((peak) => peak.magnitude >= this.minPeakMagnitude)
//           .map((peak) => ({
//             freq: Math.round(peak.freq / 10) * 10,
//             time: currentTime + (peak.time || 0) / 1000,
//           }))
//           .sort((a, b) => a.freq - b.freq);

//         // Generate hashes from peak pairs based on dynamic threshold
//         // Generate hashes from peak pairs based on dynamic threshold
//         for (let j = 0; j < peaks.length - 1; j++) {
//           for (let k = j + 1; k < Math.min(j + 6, peaks.length); k++) {
//             const deltaTime = (peaks[k].time - peaks[j].time) / 1000; // Ensure deltaTime is valid

//             if (!isNaN(deltaTime) && deltaTime >= dynamicThreshold) {
//               const hash = `${peaks[j].freq}|${
//                 peaks[k].freq
//               }|${deltaTime.toFixed(4)}`;
//               fingerprints.add(JSON.stringify({ hash, time: peaks[j].time }));
//             }
//           }
//         }
//       }

//       currentTime += timeIncrement;
//     }

//     // Return the list of fingerprints as an array
//     return Array.from(fingerprints).map((fp) => JSON.parse(fp));
//   }

//   // Helper function to calculate the chunk size based on song length
//   calculateChunkSize(songLengthInSeconds) {
//     if (songLengthInSeconds <= 30) {
//       return 10; // Minimum chunk size of 10 seconds for songs under 30 seconds
//     } else if (songLengthInSeconds <= 300) {
//       return 30; // Use 30-second chunks for songs <= 5 minutes
//     } else if (songLengthInSeconds <= 600) {
//       return 45; // Use 45-second chunks for songs between 5 and 10 minutes
//     } else {
//       return 60; // Use 60-second chunks for songs > 10 minutes
//     }
//   }

//   // Helper functions for calculating mean and standard deviation
//   calculateMean(array) {
//     const sum = array.reduce((acc, val) => acc + val, 0);
//     return sum / array.length;
//   }

//   calculateStdDev(array) {
//     const mean = this.calculateMean(array);
//     const squaredDiffs = array.map((val) => (val - mean) ** 2);
//     return Math.sqrt(this.calculateMean(squaredDiffs));
//   }

//   // Helper functions for calculating mean and standard deviation
//   calculateMean(values) {
//     const sum = values.reduce((a, b) => a + b, 0);
//     return sum / values.length;
//   }

//   calculateStdDev(values) {
//     const mean = this.calculateMean(values);
//     const variance =
//       values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
//     return Math.sqrt(variance);
//   }

//   /**
//    * Optimizes fingerprints by counting occurrences
//    * @param {Array} fingerprints - Array of fingerprint objects
//    * @returns {Array} Optimized fingerprint list
//    */
//   optimizeFingerprints(fingerprints) {
//     const uniqueHashes = new Map();

//     fingerprints.forEach((fp) => {
//       if (!uniqueHashes.has(fp.hash)) {
//         uniqueHashes.set(fp.hash, { ...fp, count: 1 });
//       } else {
//         uniqueHashes.get(fp.hash).count++;
//       }
//     });

//     return Array.from(uniqueHashes.values());
//   }
// }


import Codegen from 'stream-audio-fingerprint';
import { spawn } from 'child_process';

const createDecoder = () => {
  return spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-acodec', 'pcm_s16le',
    '-ar', 22050,
    '-ac', 1,
    '-f', 'wav',
    '-v', 'fatal',
    'pipe:1'
  ], { stdio: ['pipe', 'pipe', process.stderr] });
};

const FingerprintGenerator = async (inputStream) => {
  return new Promise((resolve, reject) => {
    const decoder = createDecoder();
    const fingerprinter = new Codegen();
    const fingerprints = [];

    decoder.stdout.pipe(fingerprinter);

    fingerprinter.on('data', (data) => {
      for (let i = 0; i < data.tcodes.length; i++) {
        fingerprints.push({
          time: data.tcodes[i],
          hash: data.hcodes[i],
        });
      }
    });

    fingerprinter.on('end', () => {
      resolve(fingerprints);
    });

    fingerprinter.on('error', reject);
    decoder.on('error', reject);

    inputStream.pipe(decoder.stdin);
  });
};


export default FingerprintGenerator;