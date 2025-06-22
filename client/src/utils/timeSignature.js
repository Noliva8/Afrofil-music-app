



export default function detectTimeSignature(beats, bpm) {
  if (beats.length < 8) return "4/4 (Insufficient data)";
console.log(beats)

  // --- Step 1: Normalize beat intervals ---
  const expectedBeatInterval = 60 / bpm; // Theoretical interval for the given BPM
  const intervals = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }

  // --- Step 2: Detect measure groupings ---
  const candidates = [3, 4, 6]; // Test for 3/4, 4/4, 6/8
  const scores = {};

  candidates.forEach((beatsPerMeasure) => {
    const measureDurations = [];
    for (let i = 0; i < intervals.length; i += beatsPerMeasure) {
      const measureIntervals = intervals.slice(i, i + beatsPerMeasure);
      if (measureIntervals.length === beatsPerMeasure) {
        const measureDuration = measureIntervals.reduce((a, b) => a + b, 0);
        measureDurations.push(measureDuration);
      }
    }

    // --- Step 3: Score consistency ---
    const avgMeasureDuration = measureDurations.reduce((a, b) => a + b, 0) / measureDurations.length;
    const expectedMeasureDuration = beatsPerMeasure * expectedBeatInterval;
    const deviation = Math.abs(avgMeasureDuration - expectedMeasureDuration) / expectedMeasureDuration;
    scores[beatsPerMeasure] = deviation; // Lower deviation = better fit
  });

  // --- Step 4: Pick the best candidate ---
  const [bestBeatsPerMeasure, lowestDeviation] = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];

  // --- Step 5: Determine note value ---
  const avgBeatDuration = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const isCompoundMeter = (bestBeatsPerMeasure % 3 === 0) && (avgBeatDuration < expectedBeatInterval * 1.2);
  const bottomNumber = isCompoundMeter ? "8" : "4"; // 6/8 vs 3/4 or 4/4

  return `${bestBeatsPerMeasure}/${bottomNumber}`;
}