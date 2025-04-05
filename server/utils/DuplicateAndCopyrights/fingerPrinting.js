// // fingerPrinting.js
// import Meyda from 'meyda';

// // Function to extract features
// const VALID_FEATURES = [
//     "rms", "spectralCentroid", "spectralFlatness", "spectralRolloff",
//     "spectralSpread", "spectralKurtosis", "spectralSkewness",
//     "loudness", "chroma", "mfcc", "zcr"
// ];

// function extractFeatures(audioBuffer) {
//     if (!Meyda) {
//         throw new Error("Meyda library not initialized.");
//     }
//     if (!audioBuffer || audioBuffer.length === 0) {
//         throw new Error("Audio buffer is empty or undefined.");
//     }

//     // Ensure the buffer is properly formatted as Float32Array
//     const processedBuffer = new Float32Array(audioBuffer);

//     console.log("Extracting features with valid names...");

//     try {
//         const features = Meyda.extract(VALID_FEATURES, processedBuffer);
//         console.log("Extracted Features:", features);
//         return features;
//     } catch (error) {
//         console.error("Meyda extraction error:", error);
//         throw error;
//     }
// }

// // Function to create the fingerprint by concatenating features
// function createFingerprint(features) {
//     if (!features || typeof features !== "object") {
//         throw new Error("Invalid features object.");
//     }

//     console.log("Creating fingerprint from features:", features);

//     // Ensure all features are numbers and handle missing features
//     const fingerprint = {
//         rms: typeof features.rms === "number" ? features.rms : 0,
//         spectralCentroid: typeof features.spectralCentroid === "number" ? features.spectralCentroid : 0,
//         spectralFlatness: typeof features.spectralFlatness === "number" ? features.spectralFlatness : 0,
//         spectralRolloff: typeof features.spectralRolloff === "number" ? features.spectralRolloff : 0,
//         spectralSpread: typeof features.spectralSpread === "number" ? features.spectralSpread : 0,
//         spectralKurtosis: typeof features.spectralKurtosis === "number" ? features.spectralKurtosis : 0,
//         spectralSkewness: typeof features.spectralSkewness === "number" ? features.spectralSkewness : 0,
//         loudness: typeof features.loudness === "number" ? features.loudness : 0,
//         chroma: Array.isArray(features.chroma) ? features.chroma : [],
//         mfcc: Array.isArray(features.mfcc) ? features.mfcc : [],
//         zcr: typeof features.zcr === "number" ? features.zcr : 0
//     };

//     return fingerprint;
// }

// export default { extractFeatures, createFingerprint };



// --------------------------------------------


// import Meyda from 'meyda';

// export default function generateFingerprint(samples, sampleRate) {
//   console.log('[Fingerprint] Starting with samples:', samples.length);

//   // 1. Validate input
//   if (!samples || samples.length < 1024) {
//     throw new Error(`Insufficient samples (${samples.length})`);
//   }

//   // 2. Extract features with proper bufferSize
//   const bufferSize = Math.min(2048, samples.length); // Smaller window for stable features
//   const features = Meyda.extract(
//     ['chroma', 'mfcc', 'spectralCentroid', 'zcr'],
//     samples.slice(0, bufferSize), // Use first segment only
//     { sampleRate }
//   );

//   console.log('[Fingerprint] Raw features:', {
//     zcr: features.zcr,
//     chromaRange: `${Math.min(...features.chroma)}-${Math.max(...features.chroma)}`,
//     mfcc: features.mfcc.slice(0, 3)
//   });

//   // 3. Fixed tempo calculation
//   const safeZCR = Math.min(features.zcr, 0.5); // Cap unrealistic values
//   const tempo = Math.round((safeZCR * sampleRate / 2) * 60);
//   const normalizedTempo = Math.min(tempo, 300); // Cap at 300 BPM

//   // 4. Improved chroma processing
//   const chroma = normalizeChroma(features.chroma);
//   const mfcc = features.mfcc.slice(0, 5).map(v => parseFloat(v.toFixed(2)));

//   // 5. More distinctive hash
//   const hash = generateStableHash(chroma, mfcc);

//   return { chroma, mfcc, tempo: normalizedTempo, hash };
// }

// // --- Helper Functions ---

// function normalizeChroma(chroma) {
//   const max = Math.max(...chroma);
//   const min = Math.min(...chroma);
//   // Spread values between 0.1-1.0 for better differentiation
//   return chroma.map(v => 0.1 + 0.9 * ((v - min) / (max - min || 1)));
// }

// function generateStableHash(chroma, mfcc) {
//   // Use first 3 chroma peaks and 2 MFCC coefficients
//   const chromaPart = chroma
//     .map((v, i) => v > 0.8 ? i : -1)
//     .filter(i => i >= 0)
//     .slice(0, 3)
//     .join('');

//   const mfccPart = mfcc
//     .slice(0, 2)
//     .map(v => Math.abs(Math.round(v * 10)))
//     .join('');

//   return `${chromaPart.padStart(3, 'x')}:${mfccPart}`;
// }


// --------------
import Meyda from 'meyda';

const FINGERPRINT_CONFIG = {
  sampleRate: 44100,
  bufferSize: 2048,
  hopSize: 1024,
  mfccCoefficients: 5,
  chromaPeaks: 3,
  maxDuration: 30,
  skipSegments: 1,
  windowingFunction: 'hann',
  harmonicRelations: [
    { interval: 7, weight: 0.3 },
    { interval: 5, weight: 0.2 },
    { interval: 4, weight: 0.1 }
  ]
};

export default async function generateFingerprint(samples, sampleRate) {
  validateInput(samples, sampleRate);

  try {
    console.log('[Fingerprint] Generating optimized fingerprint...');
    
    // 1. Reduce analysis window
    const maxSamples = Math.min(
      samples.length,
      FINGERPRINT_CONFIG.maxDuration * sampleRate
    );
    const analysisSamples = samples.subarray(0, maxSamples);

    // 2. Extract features directly without AudioContext
    const features = extractFeaturesDirect(analysisSamples);

    // 3. Generate fingerprints
    const tempo = estimateTempo(features);
    const chroma = enhanceChroma(features.chroma);
    const mfcc = features.mfcc.map(v => parseFloat(v.toFixed(3)));

    return {
      exact: generateStableExactHash(chroma, mfcc),
      similarity: generateSimilarityHash(chroma, tempo),
      features: {
        chroma,
        mfcc,
        tempo,
        zcr: parseFloat(features.zcr.toFixed(4))
      }
    };
  } catch (error) {
    console.error('[Fingerprint] Generation failed:', {
      message: error.message,
      stack: error.stack,
      samplesLength: samples?.length,
      sampleRate: sampleRate
    });
    throw new Error(`Fingerprint generation failed: ${error.message}`);
  }
}

// Direct feature extraction without Meyda analyzer
function extractFeaturesDirect(samples) {
  const segmentSize = FINGERPRINT_CONFIG.bufferSize;
  const hopSize = FINGERPRINT_CONFIG.hopSize;
  const segmentCount = Math.floor((samples.length - segmentSize) / hopSize) + 1;
  
  const features = {
    chroma: new Array(12).fill(0),
    mfcc: new Array(FINGERPRINT_CONFIG.mfccCoefficients).fill(0),
    zcr: 0,
    spectralCentroid: 0
  };

  let processedSegments = 0;

  for (let i = 0; i < segmentCount; i += FINGERPRINT_CONFIG.skipSegments + 1) {
    const start = i * hopSize;
    const segment = samples.subarray(start, start + segmentSize);
    
    const segmentFeatures = extractSegmentFeaturesDirect(segment);

    features.chroma.forEach((_, idx) => features.chroma[idx] += segmentFeatures.chroma[idx]);
    features.mfcc.forEach((_, idx) => features.mfcc[idx] += segmentFeatures.mfcc[idx]);
    features.zcr += segmentFeatures.zcr;
    features.spectralCentroid += segmentFeatures.spectralCentroid;
    
    processedSegments++;
  }

  // Normalize features
  features.chroma = features.chroma.map(v => v / processedSegments);
  features.mfcc = features.mfcc.map(v => v / processedSegments);
  features.zcr /= processedSegments;
  features.spectralCentroid /= processedSegments;

  return features;
}

function extractSegmentFeaturesDirect(segment) {
  // Convert Float32Array to regular array
  const segmentArray = Array.from(segment);
  
  try {
    return Meyda.extract([
      'chroma',
      'mfcc',
      'zcr',
      'spectralCentroid'
    ], segmentArray, {
      bufferSize: FINGERPRINT_CONFIG.bufferSize,
      sampleRate: FINGERPRINT_CONFIG.sampleRate,
      windowingFunction: FINGERPRINT_CONFIG.windowingFunction
    });
  } catch (error) {
    console.warn('Feature extraction error:', error.message);
    return {
      chroma: new Array(12).fill(0),
      mfcc: new Array(FINGERPRINT_CONFIG.mfccCoefficients).fill(0),
      zcr: 0,
      spectralCentroid: 0
    };
  }
}




// Helper Functions
function estimateTempo(features) {
  return Math.min(200, Math.max(60, Math.round(80 + (features.spectralCentroid / 5000) * 120)));
}

function enhanceChroma(chroma) {
  const boosted = [...chroma];
  for (let i = 0; i < chroma.length; i++) {
    FINGERPRINT_CONFIG.harmonicRelations.forEach(({interval, weight}) => {
      boosted[(i + interval) % 12] += chroma[i] * weight;
    });
  }
  const max = Math.max(...boosted);
  return boosted.map(v => Math.pow(v / max, 1.5));
}

function generateStableExactHash(chroma, mfcc) {
  const normalizedChroma = normalizeVector(chroma);
  const stableMFCC = mfcc.slice(0, 3);
  
  const chromaPart = normalizedChroma.map(v => Math.round(v * 15).toString(16)).join('');
  const mfccPart = stableMFCC.map(v => Math.round(v * 100)).join('x');
    
  return `exact:${chromaPart}:${mfccPart}`;
}

function generateSimilarityHash(chroma, tempo) {
  const peaks = chroma
    .map((v, i) => ({v, i}))
    .sort((a, b) => b.v - a.v)
    .slice(0, FINGERPRINT_CONFIG.chromaPeaks);
  const tempoCat = tempo < 100 ? 'L' : tempo < 160 ? 'M' : 'H';
  return `sim:${tempoCat}:${peaks.map(p => p.i).join(':')}`;
}

function normalizeVector(vector) {
  const max = Math.max(...vector);
  const min = Math.min(...vector);
  const range = max - min;
  return range > 0 ? vector.map(v => (v - min) / range) : vector.map(() => 0.5);
}

function validateInput(samples, sampleRate) {
  if (!(samples instanceof Float32Array)) {
    throw new Error('Audio samples must be Float32Array');
  }
  if (sampleRate !== FINGERPRINT_CONFIG.sampleRate) {
    throw new Error(`Sample rate must be ${FINGERPRINT_CONFIG.sampleRate}`);
  }
  const duration = samples.length / sampleRate;
  if (duration < 0.5) {
    throw new Error(`Audio too short (${duration.toFixed(2)}s)`);
  }
}