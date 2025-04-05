// postProcessing.js

import crypto from 'crypto';

/**
 * Post-processes raw fingerprint data.
 * @param {Array} rawFingerprints - Array of { time, fingerprint } objects.
 * @param {number} limit - Max number of fingerprints to return.
 * @returns {Object} - Cleaned fingerprint array, hash, and Set of fingerprints.
 */
function postProcessFingerprints(rawFingerprints, limit = 128) {
  if (!Array.isArray(rawFingerprints)) return { fingerprints: [], hash: '', set: new Set() };

  const seen = new Set();
  const cleaned = [];

  // Remove duplicates and collect only unique fingerprints
  for (const entry of rawFingerprints) {
    const { fingerprint } = entry;

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      cleaned.push(fingerprint);
    }
  }

  // Sort fingerprints (optional but helpful)
  const sorted = cleaned.sort((a, b) => a - b);

  // Trim to a reasonable size
  const limited = sorted.slice(0, limit);

  // Generate a fingerprint hash (stable ID)
  const hash = generateFingerprintHash(limited);

  return {
    fingerprints: limited,
    hash,
    set: new Set(limited) // this will help in future comparison
  };
}

/**
 * Generate a hash for a set of fingerprints.
 * @param {Array<number>} fingerprints 
 * @returns {string} hash
 */
function generateFingerprintHash(fingerprints) {
  const str = fingerprints.join(',');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default postProcessFingerprints;
