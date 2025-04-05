import { hann, hanning, hamming } from './windowing.js';

const windows = new Map();

const utilities = {
  // Faster power-of-two check using bitwise
  isPowerOfTwo(num) {
    return num > 0 && (num & (num - 1)) === 0;
  },

  error(message) {
    throw new Error(`Meyda: ${message}`);
  },

  // Vectorized buffer multiplication
  pointwiseBufferMult(a, b) {
    const result = new Float32Array(Math.min(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
      result[i] = a[i] * b[i];
    }
    return result;
  },

  // Memoized window application
  applyWindow(signal, windowname = 'hann') {
    if (windowname === 'rect') return signal;
    
    const windowKey = `${windowname}_${signal.length}`;
    
    if (!windows.has(windowKey)) {
      // Define all available window functions
      const windowFunctions = {
        hann,
        hanning,
        hamming
        // Add other window functions here as needed
      };
      
      const windowFunc = windowFunctions[windowname];
      
      if (!windowFunc) {
        const available = Object.keys(windowFunctions).join(', ');
        throw new Error(`Invalid windowing function: ${windowname}. Available: ${available}`);
      }
      
      windows.set(windowKey, windowFunc(signal.length));
    }
    
    return this.pointwiseBufferMult(signal, windows.get(windowKey));
  },

  // Optimized Bark scale creation
  createBarkScale(length, sampleRate, bufferSize) {
    return Float32Array.from({ length }, (_, i) => {
      const freq = (i * sampleRate) / bufferSize;
      return 13 * Math.atan(freq / 1315.8) + 3.5 * Math.atan((freq / 7518) ** 2);
    });
  },

  // Type conversion
  typedToArray(t) {
    return Array.from(t);
  },

  // Normalization
  _normalize(num, range) {
    return num / range;
  },

  normalize(a, range) {
    return a.map(n => this._normalize(n, range));
  },

  normalizeToOne(a) {
    const max = Math.max(...a);
    return a.map(n => n / max);
  },

  // Statistics
  mean(a) {
    return a.reduce((sum, v) => sum + v, 0) / a.length;
  },

  // Mel conversions
  melToFreq(mel) {
    return 700 * (Math.exp(mel / 1125) - 1);
  },

  freqToMel(freq) {
    return 1125 * Math.log(1 + freq / 700);
  },

  // Optimized Mel filter bank
  createMelFilterBank(numFilters, sampleRate, bufferSize) {
    const nyquist = sampleRate / 2;
    const melPoints = Float32Array.from({ length: numFilters + 2 }, (_, i) =>
      this.melToFreq((i * this.freqToMel(nyquist)) / (numFilters + 1))
    );

    const fftBins = melPoints.map(f => Math.floor((bufferSize + 1) * f / sampleRate));
    const filterBank = Array.from({ length: numFilters }, () => new Float32Array(bufferSize / 2 + 1));

    filterBank.forEach((filter, j) => {
      const [start, peak, end] = [fftBins[j], fftBins[j + 1], fftBins[j + 2]];
      
      // Rising slope
      for (let i = start; i < peak; i++) {
        filter[i] = (i - start) / (peak - start);
      }
      
      // Falling slope
      for (let i = peak; i < end; i++) {
        filter[i] = (end - i) / (end - peak);
      }
    });

    return filterBank;
  },

  // Chroma utilities
  hzToOctaves(freq, A440 = 440) {
    return Math.log2(freq / (A440 / 16));
  },

  normalizeByColumn(matrix) {
    const norms = matrix[0].map((_, j) =>
      Math.sqrt(matrix.reduce((sum, row) => sum + row[j] ** 2, 0))
    );
    return matrix.map(row => row.map((v, j) => v / (norms[j] || 1)));
  },

  createChromaFilterBank(
    numFilters,
    sampleRate,
    bufferSize,
    centerOctave = 5,
    octaveWidth = 2,
    baseC = true,
    A440 = 440
  ) {
    const numBins = Math.floor(bufferSize / 2) + 1;
    const freqs = Array.from({ length: bufferSize }, (_, i) =>
      numFilters * this.hzToOctaves((sampleRate * i) / bufferSize, A440)
    );
    freqs[0] = freqs[1] - 1.5 * numFilters; // Special case for 0Hz

    const weights = Array.from({ length: numFilters }, (_, i) => {
      const octWeights = freqs.map(f =>
        Math.exp(-0.5 * (((10 * numFilters + Math.round(numFilters / 2) + f - i) % numFilters) - Math.round(numFilters / 2)) ** 2)
      );
      return octaveWidth
        ? octWeights.map((w, j) => w * Math.exp(-0.5 * ((freqs[j] / numFilters - centerOctave) / octaveWidth) ** 2))
        : octWeights;
    });

    const normalized = this.normalizeByColumn(weights);
    return baseC
      ? [...normalized.slice(3), ...normalized.slice(0, 3)].map(row => row.slice(0, numBins))
      : normalized.map(row => row.slice(0, numBins));
  },

  // Frame generation
  frame(buffer, frameLength, hopLength) {
    if (buffer.length < frameLength) throw new Error('Buffer too short');
    if (hopLength < 1 || frameLength < 1) throw new Error('Invalid length');

    const numFrames = 1 + Math.floor((buffer.length - frameLength) / hopLength);
    return Array.from({ length: numFrames }, (_, i) =>
      buffer.slice(i * hopLength, i * hopLength + frameLength)
    );
  }
};

export default utilities;