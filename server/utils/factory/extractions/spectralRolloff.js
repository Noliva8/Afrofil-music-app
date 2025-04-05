export default function ({ ampSpectrum, sampleRate, threshold = 0.85 }) {
  if (!(ampSpectrum instanceof Float32Array)) {
    throw new TypeError('ampSpectrum must be a Float32Array');
  }
  if (typeof sampleRate !== 'number' || sampleRate <= 0) {
    throw new TypeError('sampleRate must be a positive number');
  }

  const nyqBin = sampleRate / (2 * ampSpectrum.length);
  let totalEnergy = 0;
  let cumulativeEnergy = 0;

  // Pre-calculate total energy
  for (let i = 0; i < ampSpectrum.length; i++) {
    totalEnergy += ampSpectrum[i] ** 2;
  }

  // Find rolloff point
  for (let i = 0; i < ampSpectrum.length; i++) {
    cumulativeEnergy += ampSpectrum[i] ** 2;
    if (cumulativeEnergy >= totalEnergy * threshold) {
      return i * nyqBin;
    }
  }

  return sampleRate / 2; // Fallback to Nyquist
}