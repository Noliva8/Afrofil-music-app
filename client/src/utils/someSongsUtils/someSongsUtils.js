


    // Format duration from seconds to MM:SS
  export const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

const deriveArtworkKey = (artwork) => {
  if (!artwork) return null;
  if (!/^https?:\/\//i.test(String(artwork))) {
    return String(artwork).replace(/^\/+/, "");
  }
  try {
    const url = new URL(artwork);
    // Keep full path (no query), drop leading slash
    return decodeURIComponent((url.pathname || "").replace(/^\/+/, ""));
  } catch {
    return null;
  }
};

const deriveAudioStreamKey = (streamUrl) => {
  if (!streamUrl) return null;
  if (!/^https?:\/\//i.test(String(streamUrl))) {
    const cleaned = String(streamUrl).replace(/^\/+/, "");
    return cleaned.startsWith("for-streaming/") ? cleaned : `for-streaming/${cleaned}`;
  }
  try {
    const url = new URL(streamUrl);
    const filename = decodeURIComponent((url.pathname || "").split("/").pop() || "");
    return filename ? `for-streaming/${filename}` : null;
  } catch {
    return null;
  }
};



// Process songs data
export const processSongs = (songs) => {

  console.log('song from with artwork:', songs)
  return (songs || []).map((song) => {
      const artworkUrl =
        song.artworkUrl ||
        song.artworkPresignedUrl ||
        song.artwork ||
        song.cover ||
        song.image ||
        null;


    const audioUrl = song.audioUrl || song.streamAudioFileUrl;
    const streamAudioFileUrl = song.streamAudioFileUrl || null;
    const audioStreamKey = song.audioStreamKey || deriveAudioStreamKey(streamAudioFileUrl);
    const artworkKey = song.artworkKey || deriveArtworkKey(song.artwork || artworkUrl || song.cover || song.image);
    const profilePictureUrl = song.profilePictureUrl || song.artist?.profileImage || null;
    const coverImageUrl = song.coverImageUrl || song.artist?.coverImage || null;
    const albumCoverImageUrl = song.albumCoverImageUrl || song.album?.albumCoverImage || null;
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

      // artwork + related images (keep presigned/fallback from hook)
      artworkUrl,
      profilePictureUrl,
      coverImageUrl,
      albumCoverImageUrl,

      audioUrl: audioUrl || null,
      streamAudioFileUrl,
      audioStreamKey,
      artworkKey,
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
