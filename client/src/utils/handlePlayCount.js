import { INCREMENT_PLAY_COUNT } from "./mutations";
import { useMutation } from "@apollo/client";
import { useCallback } from "react";

const PLAY_DEDUPE_MS = 3000;
const lastPlayRequestBySong = new Map();

export const usePlayCount = () => {
  const [handlePlayCount, { loading, error }] = useMutation(INCREMENT_PLAY_COUNT);

  const incrementPlayCount = useCallback(async (songId) => {
    if (!songId) return false;
    const key = String(songId);
    const now = Date.now();
    const last = lastPlayRequestBySong.get(key);
    if (last && now - last < PLAY_DEDUPE_MS) {
      return false;
    }
    lastPlayRequestBySong.set(key, now);

    try {
      await handlePlayCount({
        variables: { songId: key }
      });
      console.log(`Play count incremented for song: ${songId}`);
      return true;
    } catch (err) {
      console.warn('Failed to increment play count:', err);
      lastPlayRequestBySong.delete(key);
      return false;
    }
  }, [handlePlayCount]);

  return { incrementPlayCount, loading, error };
};
