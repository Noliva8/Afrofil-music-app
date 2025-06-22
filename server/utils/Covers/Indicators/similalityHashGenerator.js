// utils/songStructureHasher.js
import crypto from 'crypto';

/**
 * Generates a consistent hash from audio features
 * @param {object} features - Audio features object
 * @param {number[][]} features.allMfcc - Array of MFCC frames
 * @param {number[][]} features.allChroma - Array of Chroma frames
 * @param {number} features.tempo - Tempo in BPM
 * @param {number[]} features.beats - Array of beat timings
 * @returns {string} Hexadecimal hash string
 */
export default function generateStructureHash({ allMfcc, allChroma, tempo, beats }) {
  // Configuration
  const config = {
    hashSize: 64,        // 64-bit output (16 hex chars)
    maxMfccFrames: 20,   // Use first 20 MFCC frames
    maxChromaFrames: 20, // Use first 20 Chroma frames
    maxBeats: 10         // Use first 10 beats
  };

  // 1. Validate and sanitize inputs
  const safeFeatures = {
    mfcc: validate2DArray(allMfcc, config.maxMfccFrames, 13, 0),
    chroma: validate2DArray(allChroma, config.maxChromaFrames, 12, 0.01),
    tempo: typeof tempo === 'number' ? Math.max(20, Math.min(300, tempo)) : 120,
    beats: Array.isArray(beats) ? 
           beats.slice(0, config.maxBeats).map(b => Math.max(0, Number(b) || 0)) : 
           Array(config.maxBeats).fill(0.5)
  };

  // 2. Extract feature vector
  const featureVector = extractFeatures(safeFeatures);

  // 3. Generate and return hash
  return createHash(featureVector, config.hashSize);
}

// Helper Functions

function validate2DArray(arr, maxFrames, frameSize, defaultValue) {
  if (!Array.isArray(arr)) {
    return Array(maxFrames).fill().map(() => Array(frameSize).fill(defaultValue));
  }

  return arr.slice(0, maxFrames).map(frame => {
    if (!Array.isArray(frame)) {
      return Array(frameSize).fill(defaultValue);
    }
    return frame.slice(0, frameSize).map(val => Number(val) || defaultValue);
  });
}

function extractFeatures({ mfcc, chroma, tempo, beats }) {
  const vector = [];
  
  // MFCC Features (with delta coefficients)
  for (let i = 0; i < mfcc.length; i++) {
    vector.push(...mfcc[i]);
    if (i > 0) {
      vector.push(...mfcc[i].map((v, j) => v - mfcc[i-1][j]));
    }
  }

  // Chroma Features (normalized per frame)
  for (let i = 0; i < chroma.length; i++) {
    const frame = chroma[i];
    const maxVal = Math.max(...frame, 0.01);
    vector.push(...frame.map(v => v / maxVal));
    
    if (i > 0) {
      vector.push(...frame.map((v, j) => v - chroma[i-1][j]));
    }
  }

  // Beat Intervals
  if (beats.length > 1) {
    for (let i = 1; i < beats.length; i++) {
      vector.push(beats[i] - beats[i-1]);
    }
  } else {
    vector.push(0.5);
  }

  // Global Features
  vector.push(
    tempo / 200,                     // Normalized tempo
    Math.log1p(beats.length) / 3     // Normalized beat count
  );

  return normalizeVector(vector);
}

function normalizeVector(vector) {
  const clean = vector.map(v => isNaN(v) ? 0 : v);
  const norm = Math.sqrt(clean.reduce((sum, v) => sum + v * v, 0));
  return norm > 0.0001 ? clean.map(v => v / norm) : clean;
}

function createHash(vector, hashSize) {
  const vectorString = vector.map(v => v.toFixed(6)).join(',');
  return crypto.createHash('sha256')
    .update(vectorString)
    .digest('hex')
    .substring(0, hashSize / 4); // 4 bits per hex char
}