// Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}

// Pearson Correlation
function pearsonCorrelation(vecA, vecB) {
  const meanA = vecA.reduce((sum, v) => sum + v, 0) / vecA.length;
  const meanB = vecB.reduce((sum, v) => sum + v, 0) / vecB.length;
  const num = vecA.reduce((sum, v, i) => sum + ((v - meanA) * (vecB[i] - meanB)), 0);
  const denA = Math.sqrt(vecA.reduce((sum, v) => sum + Math.pow(v - meanA, 2), 0));
  const denB = Math.sqrt(vecB.reduce((sum, v, i) => sum + Math.pow(vecB[i] - meanB, 2), 0));
  return denA === 0 || denB === 0 ? 0 : num / (denA * denB);
}

// Normalize vector to sum = 1
function normalizeVector(vec) {
  const sum = vec.reduce((a, b) => a + b, 0);
  return sum > 0 ? vec.map(v => v / sum) : vec;
}

// Rotate chroma/key profiles
function rotateProfile(profile, semitones) {
  return profile.slice(semitones).concat(profile.slice(0, semitones));
}

// Key Profiles
const RAW_C_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const RAW_A_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const MAJOR_PROFILE = normalizeVector(RAW_C_MAJOR);
const MINOR_PROFILE = normalizeVector(RAW_A_MINOR);

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getKeyProfile(key) {
  const isMinor = key.endsWith('m');
  const root = key.replace('m', '');
  const semitones = NOTES.indexOf(root);
  if (semitones === -1) return Array(12).fill(0);
  return isMinor
    ? rotateProfile(MINOR_PROFILE, semitones)
    : rotateProfile(MAJOR_PROFILE, semitones);
}

// Main key detection function
export default function detectKey(chromaFrames) {
  const chromaBins = new Array(12).fill(0);
  chromaFrames.forEach(frame => {
    frame.forEach((val, i) => {
      chromaBins[i] += val;
    });
  });

  const normalizedChroma = normalizeVector(chromaBins);

  const keys = [
    ...NOTES.map(n => n),       // Major
    ...NOTES.map(n => n + 'm')  // Minor
  ];

  const scores = keys.map(key => {
    const profile = getKeyProfile(key);
    return {
      key,
      cosine: cosineSimilarity(normalizedChroma, profile),
      correlation: pearsonCorrelation(normalizedChroma, profile)
    };
  });

  const sorted = scores.sort((a, b) => b.correlation - a.correlation);

  const best = sorted[0];
  const second = sorted[1];

  // Calculate confidence only if second best score is valid
  const confidence = second ? best.correlation / second.correlation : 1;
const mode = best.key.endsWith('m') ? 0 : 1; // 0 = minor, 1 = major

  return {
    key: best.key,
    mode,
    confidence: Math.min(1, confidence.toFixed(3)),  // Cap confidence at 1.0
    topMatches: sorted.slice(0, 5)
  };
}
