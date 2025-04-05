
export default function ({ ampSpectrum, chromaFilterBank }) {
  // Input validation (unchanged)
  if (typeof ampSpectrum !== "object") {
    throw new TypeError("Valid ampSpectrum is required to generate chroma");
  }
  if (typeof chromaFilterBank !== "object") {
    throw new TypeError(
      "Valid chromaFilterBank is required to generate chroma"
    );
  }

  // 1. Base chroma calculation (original logic)
  let chromagram = chromaFilterBank.map((row, i) =>
    ampSpectrum.reduce((acc, v, j) => acc + v * row[j], 0)
  );

  // 2. Harmonic enhancement - adds octave awareness without changing structure
  const harmonicBoosted = [...chromagram];
  for (let note = 0; note < 12; note++) {
    // Boost octave relationships (3rd harmonic ≈ octave + fifth)
    harmonicBoosted[(note + 7) % 12] += chromagram[note] * 0.33; // Fifth
    harmonicBoosted[note] += chromagram[note] * 0.5; // Octave
  }

  // 3. Normalization (modified for better numerical stability)
  const maxVal = Math.max(...harmonicBoosted);
  const minVal = Math.min(...harmonicBoosted);
  const range = maxVal - minVal;

  return range > 0 
    ? harmonicBoosted.map(v => (v - minVal) / range) 
    : new Array(12).fill(0.5);
}
