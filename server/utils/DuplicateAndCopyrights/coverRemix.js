
import Song from '../../models/Artist/Song.js'; 

const FINGERPRINT_CONFIG = {
  sampleRate: 44100,
  bufferSize: 4096,
  mfccCoefficients: 5,
  chromaPeaks: 3,
  minCoverScore: 0.65,
  maxTempoVariance: 0.15
};


// New: Cover detection function
export default async function findPotentialCovers(fingerprint) {
  const tempoRange = [
    fingerprint.features.tempo * (1 - FINGERPRINT_CONFIG.maxTempoVariance),
    fingerprint.features.tempo * (1 + FINGERPRINT_CONFIG.maxTempoVariance)
  ];

  const [_, tempoCategory] = fingerprint.similarity.split(':');
  
  const candidates = await Song.find({
    similarityFingerprint: new RegExp(`^sim:${tempoCategory}`),
    tempo: { $gte: tempoRange[0], $lte: tempoRange[1] },
    audioHash: { $ne: fingerprint.exact }
  })
  .select('_id title artist tempo similarityFingerprint structureHash')
  .populate('artist', 'name allowCovers')
  .lean();

  const potentialMatches = candidates.map(candidate => {
    const score = calculateCoverSimilarity(fingerprint, candidate);
    return {
      ...candidate,
      score,
      tempoDiff: Math.abs(fingerprint.features.tempo - candidate.tempo)
    };
  }).filter(match => match.score >= FINGERPRINT_CONFIG.minCoverScore);

  return {
    bestMatch: potentialMatches.sort((a, b) => b.score - a.score)[0] || null,
    totalMatches: potentialMatches.length
  };
}

function calculateCoverSimilarity(userPrint, dbTrack) {
  // 1. Chroma peak matching (30% weight)
  const [_, __, ...userPeaks] = userPrint.similarity.split(':');
  const [___, ____, ...dbPeaks] = dbTrack.similarityFingerprint.split(':');
  const peakScore = userPeaks.filter(p => dbPeaks.includes(p)).length / 3;
  
  // 2. Structure similarity (50% weight)
  const structureScore = compareStructureHashes(
    userPrint.structure,
    dbTrack.structureHash
  );
  
  // 3. Tempo similarity (20% weight)
  const tempoScore = 1 - (Math.abs(userPrint.features.tempo - dbTrack.tempo) / 
    (userPrint.features.tempo * FINGERPRINT_CONFIG.maxTempoVariance));
  
  return (peakScore * 0.3) + (structureScore * 0.5) + (tempoScore * 0.2);
}

function compareStructureHashes(hash1, hash2) {
  if (!hash1 || !hash2) return 0;
  
  // Simple comparison - implement your own logic here
  const parts1 = hash1.split(':');
  const parts2 = hash2.split(':');
  
  // Compare stability scores
  const stabilityDiff = 1 - Math.abs(parseFloat(parts1[1]) - parseFloat(parts2[1]));
  
  // Compare primary patterns
  const primary1 = parts1[2].split(',');
  const primary2 = parts2[2].split(',');
  const primaryMatches = primary1.filter((v, i) => v === primary2[i]).length / primary1.length;
  
  return (stabilityDiff * 0.4) + (primaryMatches * 0.6);
}