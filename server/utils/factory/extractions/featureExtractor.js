import chroma from './chroma.js';
import mfcc from './mfcc.js';
import zcr from './zcr.js';
import spectralCentroid from './spectralCentroid.js';
import spectralFlux from './spectralFlux.js';
import spectralContrast from './spectralContrast.js';
import spectralRolloff from './spectralRolloff.js';
import rms from './rms.js';
import findSpectrumPeaks from './peakDetection.js';


// Utility exports (required by Meyda core)
const utilities = {
  buffer: (args) => args.signal,
  amplitudeSpectrum: (args) => args.ampSpectrum
};
// Core feature exports
export default {
  utilities,
  chroma,
  mfcc,
  zcr,
  spectralCentroid,
  spectralFlux,
  spectralContrast,
  spectralRolloff,
  rms,
  findSpectrumPeaks
};
