const timeProfiles = {
  morning: { label: 'Morning Energy', energy: 0.8, tempo: 'fast', mood: 'positive' },
  afternoon: { label: 'Afternoon Flow', energy: 0.65, tempo: 'medium', mood: 'balanced' },
  evening: { label: 'Evening Chill', energy: 0.45, tempo: 'slow', mood: 'calm' },
  night: { label: 'Night Wind Down', energy: 0.3, tempo: 'slow', mood: 'relaxed' },
};

const tempoScores = {
  fast: 1,
  medium: 0.6,
  varied: 0.7,
  slow: 0.3,
};

const moodScores = {
  positive: 1,
  balanced: 0.7,
  calm: 0.5,
  relaxed: 0.4,
};

const sampleTracks = [
  { title: 'Sunrise Motion', artist: 'Solara', energy: 0.82, tempo: 'fast', mood: 'positive' },
  { title: 'City Stream', artist: 'Kora Voyage', energy: 0.7, tempo: 'varied', mood: 'balanced' },
  { title: 'Sahara Haze', artist: 'Nocturne Boyz', energy: 0.45, tempo: 'slow', mood: 'calm' },
  { title: 'Midnight Bloom', artist: 'Rumi', energy: 0.33, tempo: 'slow', mood: 'relaxed' },
  { title: 'Afro Dawn', artist: 'Lisette', energy: 0.9, tempo: 'fast', mood: 'positive' },
  { title: 'Horizon Traffic', artist: 'Wavelength', energy: 0.66, tempo: 'medium', mood: 'balanced' },
  { title: 'Lagoon Pulse', artist: 'Lilou', energy: 0.58, tempo: 'medium', mood: 'balanced' },
  { title: 'Night Drift', artist: 'Mono Luna', energy: 0.38, tempo: 'slow', mood: 'calm' },
];

const buildFeatureVector = (energy, tempo, mood) => [
  energy,
  tempoScores[tempo] ?? 0.5,
  moodScores[mood] ?? 0.5,
];

const dotProduct = (a = [], b = []) =>
  a.reduce((sum, val, index) => sum + (val || 0) * (b[index] || 0), 0);

const scoreTrack = (track, profile) => {
  const trackVector = buildFeatureVector(track.energy, track.tempo, track.mood);
  const profileVector = buildFeatureVector(profile.energy, profile.tempo, profile.mood);
  const result = dotProduct(trackVector, profileVector);
  return Number(result.toFixed(3));
};

const determineTimeSlice = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

export const generateDailyMix = (options = {}) => {
  const profileKey = options.overrideTime || determineTimeSlice();
  const profile = timeProfiles[profileKey] || timeProfiles.morning;

  const scored = sampleTracks
    .map((track) => ({ ...track, score: scoreTrack(track, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    profileKey,
    profileLabel: profile.label,
    profile,
    tracks: scored,
  };
};
