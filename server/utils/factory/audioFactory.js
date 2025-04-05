import utilities from './utilities.js'; 
import extractors from './extractions/featureExtractor.js'; 
import FFT from 'fft.js';

// Default configuration for Meyda
const DEFAULT_CONFIG = {
  bufferSize: 2048,
  sampleRate: 44100,
  melBands: 26,
  chromaBands: 12,
  windowingFunction: 'hann',
  numberOfMFCCCoefficients: 13,
  numberOfBarkBands: 24
};

class Meyda {
  constructor(config = {}) {
    Object.assign(this, DEFAULT_CONFIG, config); 
    this.featureExtractor = extractors; 
    this.fft = new FFT(this.bufferSize); // Initialize FFT with buffer size
    this._initFilterBanks(); 
  }

  // Initializes filter banks for Bark, Mel, and Chroma
  _initFilterBanks() {
    this.barkScale = utilities.createBarkScale(
      this.bufferSize,
      this.sampleRate,
      this.bufferSize
    );

    this.melFilterBank = utilities.createMelFilterBank(
      Math.max(this.melBands, this.numberOfMFCCCoefficients),
      this.sampleRate,
      this.bufferSize
    );

    this.chromaFilterBank = utilities.createChromaFilterBank(
      this.chromaBands,
      this.sampleRate,
      this.bufferSize
    );
  }

  // Extract specified features from the signal
  extract(features, signal, previousSignal) {
    this._validateInput(signal, features);
    const prepared = this._prepareSignal(signal);
    const featuresToExtract = Array.isArray(features) ? features : [features];

    return featuresToExtract.reduce((result, feature) => {
      result[feature] = this._extractFeature(feature, prepared);
      return result;
    }, {});
  }

  // Validate the input signal and features
  _validateInput(signal, features) {
    if (!signal || typeof signal !== 'object') {
      throw new Error('Invalid audio input');
    }
    if (!features) {
      throw new Error('No features specified');
    }
    if (!utilities.isPowerOfTwo(signal.length)) {
      throw new Error('Buffer size must be a power of 2');
    }
  }

  // Prepare the signal by applying windowing and calculating the FFT
  _prepareSignal(signal) {
    const prepared = {
      signal: signal.buffer ? signal : utilities.arrayToTyped(signal),
      windowedSignal: null,
      complexSpectrum: null,
      ampSpectrum: null
    };

    // Apply window function
    prepared.windowedSignal = utilities.applyWindow(
      prepared.signal,
      this.windowingFunction
    );

    // Calculate FFT
    const out = this.fft.createComplexArray();
    this.fft.realTransform(out, prepared.windowedSignal);
    
    // Convert to split complex format
    prepared.complexSpectrum = {
      real: new Float32Array(this.bufferSize / 2),
      imag: new Float32Array(this.bufferSize / 2)
    };
    
    for (let i = 0; i < this.bufferSize / 2; i++) {
      prepared.complexSpectrum.real[i] = out[2 * i];
      prepared.complexSpectrum.imag[i] = out[2 * i + 1];
    }

    // Calculate amplitude spectrum
    prepared.ampSpectrum = new Float32Array(this.bufferSize / 2);
    for (let i = 0; i < this.bufferSize / 2; i++) {
      prepared.ampSpectrum[i] = Math.sqrt(
        prepared.complexSpectrum.real[i] ** 2 +
        prepared.complexSpectrum.imag[i] ** 2
      );
    }

    return prepared;
  }

  // Extract a specific feature
  _extractFeature(feature, { ampSpectrum, windowedSignal }) {
    return this.featureExtractor[feature]({
      ampSpectrum,
      chromaFilterBank: this.chromaFilterBank,
      signal: windowedSignal,
      bufferSize: this.bufferSize,
      sampleRate: this.sampleRate,
      melFilterBank: this.melFilterBank,
      numberOfMFCCCoefficients: this.numberOfMFCCCoefficients
    });
  }

  // List available features
  listAvailableFeatures() {
    return Object.keys(this.featureExtractor); 
  }
}

export default Meyda;