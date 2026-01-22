export const dedupeSongs = (songs) => {
  if (!Array.isArray(songs)) return [];
  const seen = new Set();
  const uniqueSongs = [];

  for (const song of songs) {
    const id = song?._id ?? song?.id ?? song?.songId ?? null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueSongs.push(song);
  }

  return uniqueSongs;
};
