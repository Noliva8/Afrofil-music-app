import { INCREMENT_PLAY_COUNT, INCREMENT_WEEKLY_PLAY_COUNT } from "./mutations";
import { useMutation } from "@apollo/client";
import { useCallback } from "react";

const PLAY_DEDUPE_MS = 3000;
const lastPlayRequestBySong = new Map();
const VISITOR_ID_KEY = "flolup_visitor_id";

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const WEEKLY_PLAY_MIN_LISTEN_SECONDS = numberFromEnv(
  import.meta.env.VITE_SEC_NEEDED_TO_WIN_MAXIMUM_PRIZE,
  30
);

const getVisitorId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage?.getItem(VISITOR_ID_KEY) || null;
};

export const usePlayCount = () => {
  const [handlePlayCount, { loading, error }] = useMutation(INCREMENT_PLAY_COUNT, {
    update(cache, { data }) {
      const updatedSong = data?.handlePlayCount;
      if (!updatedSong?._id) return;

      cache.modify({
        id: cache.identify({ __typename: "Song", _id: updatedSong._id }),
        fields: {
          playCount: () => updatedSong.playCount,
          plays: () => updatedSong.playCount,
        },
      });
    },
  });
  const [handleWeeklyPlayCount] = useMutation(INCREMENT_WEEKLY_PLAY_COUNT);

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
        variables: {
          songId: key,
          visitorId: getVisitorId(),
        },
      });

      if (WEEKLY_PLAY_MIN_LISTEN_SECONDS <= 0) {
        handleWeeklyPlayCount({
          variables: {
            songId: key,
            visitorId: getVisitorId(),
            listenedSeconds: 0,
          },
        }).catch((err) => {
          console.warn("Failed to probe weekly play count:", err);
        });
      }

      return true;
    } catch (err) {
      console.warn('Failed to increment play count:', err);
      lastPlayRequestBySong.delete(key);
      return false;
    }
  }, [handlePlayCount, handleWeeklyPlayCount]);

  return { incrementPlayCount, loading, error };
};
