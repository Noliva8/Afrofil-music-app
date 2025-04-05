


// Check if Song is Duplicate
export async function isDuplicateSong(newSongHash, dbHashes) {
  const hashSet = new Set(dbHashes);
  return hashSet.has(newSongHash);
}
