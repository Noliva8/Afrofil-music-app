export default function ({ ampSpectrum }) {
  if (!(ampSpectrum instanceof Float32Array)) {
    throw new TypeError('ampSpectrum must be a Float32Array');
  }

  // Single-pass calculation
  let sumX = 0, sumX2 = 0, sumAmp = 0;
  for (let i = 0; i < ampSpectrum.length; i++) {
    const amp = Math.abs(ampSpectrum[i]);
    sumX += i * amp;
    sumX2 += i * i * amp;
    sumAmp += amp;
  }

  if (sumAmp <= 0) return 0;
  
  const mean = sumX / sumAmp;
  const variance = (sumX2 / sumAmp) - (mean * mean);
  return Math.sqrt(Math.max(0, variance)); // Ensure non-negative
}