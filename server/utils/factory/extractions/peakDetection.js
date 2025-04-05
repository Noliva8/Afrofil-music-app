// In your feature extractor file
export default function(args) {
  const { ampSpectrum, sampleRate, bufferSize } = args;
  const peaks = [];
  const minMagnitude = 0.1;
  
  // Calculate time per bin (seconds per FFT bin)
  const timePerBin = bufferSize / sampleRate / ampSpectrum.length;

  for (let i = 1; i < ampSpectrum.length - 1; i++) {
    if (ampSpectrum[i] > minMagnitude &&
        ampSpectrum[i] > ampSpectrum[i-1] && 
        ampSpectrum[i] > ampSpectrum[i+1]) {
      
      peaks.push({
        freq: (i * sampleRate) / bufferSize,
        magnitude: ampSpectrum[i],
        time: i * timePerBin  // Relative time within window
      });
    }
  }

  return peaks
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10); // Return top 10 peaks
}