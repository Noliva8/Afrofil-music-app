export default function ({ ampSpectrum }) {
  if (!(ampSpectrum instanceof Float32Array)) {
    throw new TypeError('ampSpectrum must be a Float32Array');
  }

  let numerator = 0;
  let denominator = 0;
  for (let k = 0; k < ampSpectrum.length; k++) {
    const amplitude = Math.abs(ampSpectrum[k]);
    numerator += k * amplitude;  // Linear weighting (optimized)
    denominator += amplitude;
  }
  return denominator > 1e-20 ? numerator / denominator : 0;
}