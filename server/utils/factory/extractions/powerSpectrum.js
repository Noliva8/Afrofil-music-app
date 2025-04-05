
export default function({ ampSpectrum }) {
  if (typeof ampSpectrum !== 'object') throw new TypeError();
  return Float32Array.from(ampSpectrum, v => v * v);
}
