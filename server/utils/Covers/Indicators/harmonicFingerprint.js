




export default async function generateHarmonicFingerprint(chroma, beats) {
  // 1. Sum chroma energy per bin across all beats
  const chromaBins = new Array(12).fill(0);
  
  // 2. Align chroma frames to beats (avoid timing noise)
  let beatIndex = 0;
  chroma.forEach((frame, frameIndex) => {
    if (frameIndex >= beats[beatIndex]) beatIndex++;
    frame.forEach((energy, bin) => {
      chromaBins[bin] += energy;
    });
  });

  // 3. Normalize by beat count (remove duration bias)
  const normalized = chromaBins.map(bin => bin / beats.length);

  // 4. Round for storage efficiency (optional)
  return normalized.map(v => Math.round(v * 1000) / 1000);
}
