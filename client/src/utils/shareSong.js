export const buildSongShareUrl = (songId, origin = window.location.origin) => {
  if (!songId) return "";
  return `${origin}/track/${songId}`;
};

export const getShareableSongId = (song) =>
  song?.id ||
  song?._id ||
  song?.songId ||
  song?.fullOriginal?.id ||
  song?.fullOriginal?._id ||
  "";

export const shareSongLink = async ({
  songId,
  title = "Song",
  text = "Listen to this track",
  shareSongMutation,
}) => {
  if (!songId) return false;

  const url = buildSongShareUrl(songId);

  if (shareSongMutation) {
    try {
      await shareSongMutation({ variables: { songId } });
    } catch (err) {
      console.warn("Share count update failed", err);
    }
  }

  const payload = { title, text, url };

  if (navigator?.share) {
    try {
      await navigator.share(payload);
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return false;
      console.warn("Native share failed", err);
    }
  }

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.warn("Clipboard share failed", err);
    }
  }

  return false;
};
