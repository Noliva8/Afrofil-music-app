import { createHash } from 'crypto';

export default async function generateSimilarityFingerprint(mfcc, chroma, tempo) {
  try {
    // 1. Validate inputs (fixed syntax error here)
    if (!Array.isArray(mfcc)) throw new Error('MFCC must be an array');
    if (!Array.isArray(chroma)) throw new Error('Chroma must be an array');
    if (typeof tempo !== 'number' || isNaN(tempo)) throw new Error('Tempo must be a number');

    // 2. Extract key features
    const mfccAverages = calculateMfccAverages(mfcc);
    const chromaPeaks = extractChromaPeaks(chroma);
    const quantizedTempo = Math.round(tempo / 5) * 5;

    // 3. Create a normalized feature vector
    const featureVector = [
      ...normalizeVector(mfccAverages),
      ...normalizeVector(chromaPeaks),
      quantizedTempo / 200 // Normalized tempo (0-1 range)
    ];

    // 4. Generate SHA-256 hash
    const hash = createHash('sha256')
      .update(featureVector.join(','))
      .digest('hex');

    return hash;
  } catch (error) {
    console.error('Failed to generate fingerprint:', error);
    throw new Error(`Fingerprint generation failed: ${error.message}`);
  }
}

// Helper functions
function calculateMfccAverages(mfcc) {
  if (!mfcc.length) return Array(13).fill(0);
  
  return Array.from({ length: 13 }, (_, i) => {
    const coeffs = mfcc.map(chunk => chunk[i] || 0);
    return coeffs.reduce((a, b) => a + b, 0) / mfcc.length;
  });
}

function extractChromaPeaks(chroma) {
  if (!chroma.length) return Array(12).fill(0);
  
  const peakCounts = Array(12).fill(0);
  chroma.forEach(frame => {
    const peakIndex = frame.indexOf(Math.max(...frame));
    if (peakIndex >= 0) peakCounts[peakIndex]++;
  });
  
  return peakCounts;
}

function normalizeVector(vec) {
  const clean = vec.map(v => isNaN(v) ? 0 : v);
  const norm = Math.sqrt(clean.reduce((sum, v) => sum + v * v, 0));
  return norm > 0.0001 ? clean.map(v => v / norm) : clean;
}