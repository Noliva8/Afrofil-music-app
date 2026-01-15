// resolvers/Song.js
// import {
//   CreatePresignedUrlDownload,
//   CreatePresignedUrlDownloadAudio
// } from "../../utils/awsS3.js";



import { getPresignedUrlDownload } from "../../utils/cloudFrontUrl.js";


import { getFallbackArtworkUrl } from "./similarSongs/similasongResolver.js";


/** Safely derive an S3 object key from a URL or key string. */
function s3KeyFromUrl(urlOrKey) {
  if (!urlOrKey) return null;

  // Already looks like a key (no scheme)
  if (typeof urlOrKey === "string" && !urlOrKey.includes("://")) {
    // normalize leading slash
    return urlOrKey.startsWith("/") ? urlOrKey.slice(1) : urlOrKey;
  }

  // Try to parse as URL and strip query params
  try {
    const u = new URL(urlOrKey);
    const path = decodeURIComponent(u.pathname || "");
    return path.startsWith("/") ? path.slice(1) : path; // e.g. "for-streaming/file.mp3"
  } catch {
    return null;
  }
}

/** Build the streaming key, given either stream or original URLs. */
function buildStreamingKey(streamAudioFileUrl, audioFileUrl) {
  // Prefer the streaming file if present
  let key = s3KeyFromUrl(streamAudioFileUrl);

  // If we have an original only, map it to streaming bucket layout
  if (!key) {
    const raw = s3KeyFromUrl(audioFileUrl);
    if (raw) {
      const filename = raw.split("/").pop(); // keep only the filename
      key = filename ? `for-streaming/${filename}` : null;
    }
  }

  // Avoid double prefixing if caller passed "for-streaming/..." already
  if (key && !key.startsWith("for-streaming/") && key.includes("/")) {
    // If the path already includes for-streaming/ deeper, keep as-is
    // Otherwise, if it's just "something/file.mp3" coming from stream URL, keep it unchanged.
    // (Most S3 virtual-hosted URLs already yield "for-streaming/file.mp3" from s3KeyFromUrl.)
  }
  return key || null;
}

export const Song = {
  /** ARTWORK presign (always return something: real presign or fallback) */
  artworkPresignedUrl: async (song) => {
    // If the resolver (e.g. similarSongs) already attached it, reuse
    if (song?.artworkPresignedUrl) return song.artworkPresignedUrl;

    // Try to presign from provided artwork
    const key = song?.artworkKey || s3KeyFromUrl(song?.artwork);
    if (!key) {
      // No artwork → fallback image (presigned or public URL depending on your implementation)
      return await getFallbackArtworkUrl();
    }

    try {
      const { url } = await getPresignedUrlDownload(null, {
        bucket: "afrofeel-cover-images-for-songs",
        key,
        region: "us-east-2",
      });
      return url;
    } catch (err) {
      console.error(`🎨 Artwork presign failed for ${song?._id}:`, err);
      return await getFallbackArtworkUrl();
    }
  },

  /** AUDIO presign (return null if truly unavailable) */
  audioPresignedUrl: async (song) => {
    if (song?.audioPresignedUrl) return song.audioPresignedUrl;

    const keyFromStream = song?.audioStreamKey || buildStreamingKey(song?.streamAudioFileUrl, song?.audioFileUrl);
    const key = keyFromStream;
    if (!key) return null;

    try {
      const { url } = await getPresignedUrlDownload(null, {
        bucket: "afrofeel-songs-streaming",
        key,                // already normalized to "for-streaming/<filename>.mp3"
        region: "us-west-2",
      });
      return url;
    } catch (err) {
      console.error(`🎵 Audio presign failed for ${song?._id}:`, err);
      return null;
    }
  },
};
