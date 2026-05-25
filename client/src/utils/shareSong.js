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

const buildSongSharePayload = (song, url) => {
  const title = song?.title || "Listen on FloLup";
  const artistName = song?.artist?.artistAka || song?.artistName || "";
  const albumName = song?.album?.title || song?.albumName || "";
  const genre = song?.genre || "";
  const details = [
    artistName && `by ${artistName}`,
    albumName && albumName !== "Single" && `from ${albumName}`,
    genre && `#${genre}`,
  ].filter(Boolean);

  return {
    title: artistName ? `${title} by ${artistName}` : title,
    text: `Listen to ${title}${details.length ? ` ${details.join(" ")}` : ""} on FloLup.`,
    url,
  };
};

export const shareSongLink = async ({
  songId,
  shareSongMutation,
}) => {
  if (!songId) return false;

  const url = buildSongShareUrl(songId);
  let sharedSong = null;

  if (shareSongMutation) {
    try {
      const response = await shareSongMutation({ variables: { songId } });
      sharedSong = response?.data?.shareSong || null;
    } catch (err) {
      console.warn("Share count update failed", err);
    }
  }

  const payload = buildSongSharePayload(sharedSong, url);

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
