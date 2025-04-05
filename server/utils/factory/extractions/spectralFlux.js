
export default function ({
  signal,
  previousSignal,
  bufferSize,
}) {
  // Input validation
  if (!(signal instanceof Float32Array) || !(previousSignal instanceof Float32Array)) {
    throw new TypeError('Both current and previous signals must be Float32Arrays');
  }

  let flux = 0;
  const THRESHOLD = 0.01; // Noise gate threshold (adjust based on your audio levels)
  const HALF_BUFFER = bufferSize / 2;

  // Only calculate flux for positive increases in energy
  for (let i = 0; i < HALF_BUFFER; i++) {
    const delta = signal[i] - previousSignal[i];
    if (delta > THRESHOLD) {
      flux += delta * delta; // Square for energy calculation
    }
  }

  return Math.sqrt(flux / HALF_BUFFER); // Normalized RMS flux
}