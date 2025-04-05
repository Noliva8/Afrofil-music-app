
import extractPowerSpectrum from './powerSpectrum.js';

export default function({ ampSpectrum, melFilterBank, bufferSize }) {
  if (typeof ampSpectrum !== 'object') throw new TypeError('Valid ampSpectrum required');
  if (typeof melFilterBank !== 'object') throw new TypeError('Valid melFilterBank required');

  const powSpec = extractPowerSpectrum({ ampSpectrum });
  const loggedMelBands = new Float32Array(melFilterBank.length);

  melFilterBank.forEach((filter, i) => {
    loggedMelBands[i] = Math.log1p(
      filter.reduce((sum, coeff, j) => sum + coeff * powSpec[j], 0)
    );
  });

  return Array.from(loggedMelBands);
}
