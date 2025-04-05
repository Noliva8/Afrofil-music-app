// windowing.js

// Hann window (also called Hanning)
export function hann(size) {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return window;
}

// Hamming window
export function hamming(size) {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1));
  }
  return window;
}

// Blackman window
export function blackman(size) {
  const window = new Float32Array(size);
  const coeff1 = (2 * Math.PI) / (size - 1);
  const coeff2 = 2 * coeff1;
  for (let i = 0; i < size; i++) {
    window[i] = 0.42 - 0.5 * Math.cos(i * coeff1) + 0.08 * Math.cos(i * coeff2);
  }
  return window;
}

// Sine window
export function sine(size) {
  const window = new Float32Array(size);
  const coeff = Math.PI / (size - 1);
  for (let i = 0; i < size; i++) {
    window[i] = Math.sin(coeff * i);
  }
  return window;
}

// Add alias for hanning (same as hann)
export const hanning = hann;