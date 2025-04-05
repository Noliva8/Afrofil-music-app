export default function ({ signal }) {
  if (!(signal instanceof Float32Array)) {
    throw new TypeError('Signal must be a Float32Array');
  }

  let crossings = 0;
  const { length } = signal;
  
  // Add noise immunity with deadzone threshold
  const DEADZONE = 0.01; // Adjust based on your audio levels
  
  for (let i = 1; i < length; i++) {
    const prev = signal[i-1];
    const curr = signal[i];
    
    // Optimized crossing check with deadzone
    if (
      (prev >= DEADZONE && curr <= -DEADZONE) || 
      (prev <= -DEADZONE && curr >= DEADZONE)
    ) {
      crossings++;
    }
  }

  // Normalize by signal length
  return crossings / (length - 1);
}