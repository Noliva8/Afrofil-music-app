


// Format duration from seconds to MM:SS
export const formatDuration = (seconds) => {
    const safeSeconds = Number(seconds) || 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

const parseDurationSeconds = (duration) => {
  if (typeof duration === "number") {
    return Number.isFinite(duration) ? duration : 0;
  }

  if (typeof duration === "string") {
    const trimmed = duration.trim();
    if (!trimmed) return 0;

    if (trimmed.includes(":")) {
      const parts = trimmed.split(":").map((part) => Number(part));
      if (parts.some((part) => !Number.isFinite(part))) return 0;
      return parts.reduce((total, part) => total * 60 + part, 0);
    }

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
};

const getDurationLabel = (duration, fallbackSeconds) => {
  if (typeof duration === "string" && duration.includes(":")) {
    return duration;
  }

  return formatDuration(fallbackSeconds);
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

    const playCount = Number(
      song.playCount ??
      song.plays ??
      song.fullOriginal?.playCount ??
      song.fullOriginal?.plays ??
      0
    ) || 0;
    const durationSource =
      song.durationSeconds ??
      song.duration ??
      song.fullOriginal?.durationSeconds ??
      song.fullOriginal?.duration ??
      0;
    const durationSeconds = parseDurationSeconds(durationSource);

    return {
      id: String(song._id ?? song.id ?? song.songId),
      title: song.title,
      artistName: song.artist?.artistAka || song.artistName || "Unknown Artist",
      artistId: String(song.artist?._id ?? song.artistId ?? song.artist ?? ""),
      albumId: String(song.album?._id ?? song.albumId ?? song.album ?? ""),
      albumName: song.album?.title || song.albumTitle || "Single",
      releaseYear,
      genre: song.genre || "",
      mood: Array.isArray(song.mood) && song.mood.length > 0
        ? song.mood.join(", ")
        : "Unknown Mood",
      subMood: Array.isArray(song.subMoods) && song.subMoods.length > 0
        ? song.subMoods.join(", ")
        : "Unknown Sub Mood",

      plays: playCount,
      downloadCount: Number(song.downloadCount) || 0,
      artistFollowers: Number(song.artistFollowers ?? song.fullOriginal?.artistFollowers ?? (song.artist?.followers?.length || 0)) || 0,
      artistDownloadCounts: Number(
        song.artistDownloadCounts ??
        song.fullOriginal?.artistDownloadCounts ??
        song.artist?.artistDownloadCounts ??
        0
      ),
      playCount,
      shareCount: Number(song.shareCount) || 0,
      weekStartDate: song.weekStartDate ?? song.fullOriginal?.weekStartDate ?? null,
      weekEndDate: song.weekEndDate ?? song.fullOriginal?.weekEndDate ?? null,
      weeklyPlayCount: Number(song.weeklyPlayCount ?? song.fullOriginal?.weeklyPlayCount ?? 0) || 0,
      weeklyLikeCount: Number(song.weeklyLikeCount ?? song.fullOriginal?.weeklyLikeCount ?? 0) || 0,
      weeklyShareCount: Number(song.weeklyShareCount ?? song.fullOriginal?.weeklyShareCount ?? 0) || 0,
      weeklyDownloadCount: Number(song.weeklyDownloadCount ?? song.fullOriginal?.weeklyDownloadCount ?? 0) || 0,
      hasWonSongOfTheWeek: Boolean(song.hasWonSongOfTheWeek ?? song.fullOriginal?.hasWonSongOfTheWeek ?? false),
      lastSongOfTheWeekWonAt: song.lastSongOfTheWeekWonAt ?? song.fullOriginal?.lastSongOfTheWeekWonAt ?? null,
      songOfTheWeekWinnerWeekStartDate: song.songOfTheWeekWinnerWeekStartDate ?? song.fullOriginal?.songOfTheWeekWinnerWeekStartDate ?? null,

      // ✅ use server scalars; do NOT derive from likedByUsers
      likesCount:
  song.likesCount ??
  song.fullOriginal?.likesCount ??
  (song.fullOriginal?.likedByUsers?.length || 0),

      likedByMe: Boolean(song.likedByMe ?? false),

      durationSeconds,
      duration: getDurationLabel(durationSource, durationSeconds),

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
      artist: song.artist || null,
      artistBookingAvailability:
        song.artist?.bookingAvailability ??
        song.fullOriginal?.artist?.bookingAvailability ??
        true,
    };
  });
};
