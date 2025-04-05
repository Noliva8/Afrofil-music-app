export default function ({ signal }) {
  if (!(signal instanceof Float32Array)) {
    throw new TypeError('signal must be a Float32Array');
  }

  // Vectorized calculation for better precision
  let sum = 0;
  for (let i = 0; i < signal.length; i++) {
    sum += signal[i] * signal[i];
  }

  return Math.sqrt(sum / signal.length);
}
