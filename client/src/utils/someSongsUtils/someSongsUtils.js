


    // Format duration from seconds to MM:SS
  export const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };



// Process songs data
export const processSongs = (songs) => {
  return (songs || []).map((song) => {
      const artworkUrl =
        song.artworkPresignedUrl ||
        song.artworkUrl ||
        song.artwork ||
        song.cover ||
        song.image ||
        null;
    const audioUrl = song.audioPresignedUrl || song.audioUrl || song.streamAudioFileUrl;
    const releaseYear = song.album?.releaseDate
      ? new Date(song.album.releaseDate).getFullYear()
      : (song.releaseYear || null);

    const credits = [];
    if (Array.isArray(song.composer)) {
      song.composer.forEach((c) => {
        if (c?.name) credits.push({ role: c.contribution || 'Composer', name: c.name });
      });
    }
    if (Array.isArray(song.producer)) {
      song.producer.forEach((p) => {
        if (p?.name) credits.push({ role: p.role || 'Producer', name: p.name });
      });
    }

    return {
      id: String(song._id ?? song.id ?? song.songId),
      title: song.title,
      artistName: song.artist?.artistAka || "Unknown Artist",
      artistId: String(song.artist?._id ?? song.artist ?? ""),
      albumId: String(song.album?._id ?? song.album ?? ""),
      albumName: song.album?.title || song.albumTitle || "Single",
      releaseYear,
      genre: song.genre || "",
      mood: Array.isArray(song.mood) && song.mood.length > 0
        ? song.mood.join(", ")
        : "Unknown Mood",
      subMood: Array.isArray(song.subMoods) && song.subMoods.length > 0
        ? song.subMoods.join(", ")
        : "Unknown Sub Mood",
      tempo: Number(song.tempo) || 120, // default to 120 BPM
      plays: Number(song.playCount) || 0,
      downloadCount: Number(song.downloadCount) || 0,
      artistFollowers: Number(song.artistFollowers ?? song.fullOriginal?.artistFollowers ?? (song.artist?.followers?.length || 0)) || 0,
      artistDownloadCounts: Number(
        song.artistDownloadCounts ??
        song.fullOriginal?.artistDownloadCounts ??
        song.artist?.artistDownloadCounts ??
        0
      ),
      playCount: Number(song.playCount) || 0,
      shareCount: Number(song.shareCount) || 0,

      // ✅ use server scalars; do NOT derive from likedByUsers
      likesCount:
  song.likesCount ??
  song.fullOriginal?.likesCount ??
  (song.fullOriginal?.likedByUsers?.length || 0),

      likedByMe: Boolean(song.likedByMe ?? false),

      durationSeconds: Number(song.duration) || 0,
      duration: formatDuration(Number(song.duration) || 0),

      // artworkUrl (do not inject placeholder; let UI handle fallback)
      cover: artworkUrl || null,
      artworkUrl: artworkUrl || null,
      artworkPresignedUrl: song.artworkPresignedUrl || null,
      audioUrl: audioUrl || null,
      lyrics: song.lyrics || song.fullOriginal?.lyrics || "",
      credits,
      label: song.label || song.fullOriginal?.label || '',
      featuringArtist: Array.isArray(song.featuringArtist) ? song.featuringArtist : [],
      composer: Array.isArray(song.composer) ? song.composer : [],
      producer: Array.isArray(song.producer) ? song.producer : [],
      artistBio: song.artist?.bio || "",

      fullOriginal: song,
      country: song.artist?.country || "",
      album: song.album,
    };
  });
};
