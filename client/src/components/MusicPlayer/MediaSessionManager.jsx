import { useEffect, useRef } from "react";

const defaultActions = ["play", "pause", "previoustrack", "nexttrack", "seekto"];




export default function MediaSessionManager({ audioRef, metadata, onAction }) {
  const hasSetupRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !('mediaSession' in navigator)) return;

    if (!audioRef?.current) return;

    const { mediaSession } = navigator;

    if (metadata) {
      mediaSession.metadata = new window.MediaMetadata({
        title: metadata.title || metadata.songTitle || "",
        artist: metadata.artistName || metadata.artist || "",
        album: metadata.album || metadata.section || "",
        artwork: metadata.artwork ? [{ src: metadata.artwork, sizes: "512x512", type: "image/png" }] : [],
      });
    }

    const handleAction = (action) => {
      if (typeof onAction === "function") {
        onAction(action);
      }
    };

    defaultActions.forEach((action) => {
      try {
        mediaSession.setActionHandler(action, () => handleAction(action));
      } catch (error) {
        // Some browsers may not support all actions.
      }
    });

    const updatePlaybackState = () => {
      if (!audioRef.current) return;
      mediaSession.playbackState = audioRef.current.paused ? "paused" : "playing";
    };

    audioRef.current.addEventListener("play", updatePlaybackState);
    audioRef.current.addEventListener("pause", updatePlaybackState);

    hasSetupRef.current = true;

    return () => {
      defaultActions.forEach((action) => {
        try {
          mediaSession.setActionHandler(action, null);
        } catch (error) {
          // ignore
        }
      });
      audioRef.current?.removeEventListener("play", updatePlaybackState);
      audioRef.current?.removeEventListener("pause", updatePlaybackState);
      hasSetupRef.current = false;
    };
  }, [audioRef, metadata, onAction]);

  return null;
}
