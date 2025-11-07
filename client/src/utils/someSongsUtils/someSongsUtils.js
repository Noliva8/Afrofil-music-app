


    // Format duration from seconds to MM:SS
  export const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };



// Process songs data
export const processSongs = (songs) => {
  return (songs || []).map((song) => {
      const artworkUrl = song.artworkPresignedUrl || song.artworkUrl || song.artwork;
    const audioUrl = song.audioPresignedUrl || song.audioUrl || song.streamAudioFileUrl;

    return {
      id: String(song._id ?? song.id ?? song.songId),
      title: song.title,
      artistName: song.artist?.artistAka || "Unknown Artist",
      artistId: String(song.artist?._id ?? song.artist ?? ""),
      albumId: String(song.album?._id ?? song.album ?? ""),
      genre: song.genre || "",
      mood: Array.isArray(song.mood) && song.mood.length > 0
        ? song.mood.join(", ")
        : "Unknown Mood",
      subMood: Array.isArray(song.subMoods) && song.subMoods.length > 0
        ? song.subMoods.join(", ")
        : "Unknown Sub Mood",
      tempo: Number(song.tempo) || 120, // default to 120 BPM
      plays: Number(song.playCount) || 0,

      // ✅ use server scalars; do NOT derive from likedByUsers
      likesCount:
  song.likesCount ??
  song.fullOriginal?.likesCount ??
  (song.fullOriginal?.likedByUsers?.length || 0),

      likedByMe: Boolean(song.likedByMe ?? false),

      durationSeconds: Number(song.duration) || 0,
      duration: formatDuration(Number(song.duration) || 0),

      // artworkUrl fallback + safe placeholder
      cover: artworkUrl || "https://placehold.co/300x300?text=No+Cover",
      audioUrl: audioUrl || null,

      fullOriginal: song,
      country: song.artist?.country || "",
      album: song.album,
    };
  });
};







