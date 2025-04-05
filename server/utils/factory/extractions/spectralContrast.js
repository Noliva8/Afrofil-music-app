export default function ({ ampSpectrum, numBands = 6 }) {
  const bandSize = Math.floor(ampSpectrum.length / numBands);
  const contrasts = new Array(numBands);
  
  for (let band = 0; band < numBands; band++) {
    const start = band * bandSize;
    const end = start + bandSize;
    let peak = -Infinity;
    let valley = Infinity;
    
    for (let i = start; i < end; i++) {
      peak = Math.max(peak, ampSpectrum[i]);
      valley = Math.min(valley, ampSpectrum[i]);
    }
    
    contrasts[band] = peak - valley;
  }
  
  return contrasts;
}
