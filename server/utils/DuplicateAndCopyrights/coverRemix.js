import Song from '../../models/Artist/Song.js';
import Artist from '../../models/Artist/Artist.js';

export default async function isCoverOrRemix(newSong, databaseSongs) {
  // 1. Pre-filter candidates (fast)
  const candidates = databaseSongs.filter(song => {
    return (
      Math.abs(song.tempo - newSong.tempo) < 10 && // ±10 BPM tolerance
      song.key === newSong.key &&                  // Same musical key
      song.mode === newSong.mode                   // Major/minor match
    );
  });

  // 2. Feature comparison pipeline
  const comparisons = await Promise.all(
    candidates.map(original => compareFeatures(newSong, original))
  );

  // 3. Weighted scoring
  const results = comparisons.map((comp, i) => ({
    songId: candidates[i]._id,
    title: candidates[i].title,
    artist: candidates[i].artist,
    score: calculateCompositeScore(comp),
    details: comp
  }));

  // 4. Threshold-based classification
  return results.filter(r => {
    if (r.score > 0.85) return { ...r, type: 'cover' };
    if (r.score > 0.65) return { ...r, type: 'remix' };
    return null;
  }).sort((a, b) => b.score - a.score);
}


// Feature comparison engine
async function compareFeatures(newSong, original) {
  return {
    structure: compareStructureHashes(newSong.structureHash, original.structureHash),
    fingerprint: compareFingerprints(newSong.similarityFingerprint, original.similarityFingerprint),
    harmonic: compareHarmonic(newSong.harmonicFingerprint, original.harmonicFingerprint),
    chroma: compareChromaPeaks(newSong.chromaPeaks, original.chromaPeaks),
    rhythmic: compareRhythm(newSong.beats, original.beats)
  };
}

// Weighted scoring
function calculateCompositeScore(comparison) {
  const weights = {
    structure: 0.3,   // Overall song architecture
    fingerprint: 0.25, // Melodic contours
    harmonic: 0.2,    // Chord progressions
    chroma: 0.15,     // Harmonic content
    rhythmic: 0.1     // Timing patterns
  };

  return Object.entries(weights).reduce(
    (score, [feature, weight]) => score + comparison[feature] * weight,
    0
  );
}

// HELPERS

function compareStructureHashes(hashA, hashB) {
  // Use locality-sensitive hashing or edit distance
  const distance = levenshteinDistance(hashA, hashB);
  return 1 - (distance / Math.max(hashA.length, hashB.length));
}

function compareFingerprints(fpA, fpB) {
  // Assuming these are 2D arrays [time][features]
  const similarityMatrix = matrixSimilarity(fpA, fpB);
  return dynamicTimeWarping(similarityMatrix);
}

function compareHarmonic(harmA, harmB) {
  // Compare chord transition probabilities
  const klDivergence = calculateKLDivergence(harmA.chordTransitions, harmB.chordTransitions);
  return Math.exp(-klDivergence); // Convert to similarity score
}

function compareChromaPeaks(peaksA, peaksB) {
  // Bin-to-bin cosine similarity
  const dotProduct = peaksA.reduce((sum, a, i) => sum + a * peaksB[i], 0);
  const normA = Math.sqrt(peaksA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(peaksB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

function compareRhythm(beatsA, beatsB) {
  // Compare beat intervals
  const intervalsA = calculateIntervals(beatsA);
  const intervalsB = calculateIntervals(beatsB);
  return pearsonCorrelation(intervalsA, intervalsB);
}