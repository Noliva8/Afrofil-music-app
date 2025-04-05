

import extractMelBands from './melBands.js';
import dct from 'dct';

export default function({ 
  ampSpectrum, 
  melFilterBank, 
  numberOfMFCCCoefficients, 
  bufferSize 
}) {
  const _numberOfMFCCCoefficients = Math.min(40, Math.max(1, numberOfMFCCCoefficients || 13));
  
  // Noise-protected processing
  const safeSpectrum = new Float32Array(ampSpectrum.map(v => Math.max(v, 1e-10)));

  const loggedMelBands = extractMelBands({
    ampSpectrum: safeSpectrum,
    melFilterBank,
    bufferSize
  });

  // Apply liftering to coefficients
  const mfccs = dct(loggedMelBands).slice(0, _numberOfMFCCCoefficients);
  return mfccs.map((val, i) => 
    val * (1 + 0.5 * Math.sin(Math.PI * i / _numberOfMFCCCoefficients))
  );
}