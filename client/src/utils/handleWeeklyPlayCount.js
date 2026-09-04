import { useMutation } from "@apollo/client";
import { useCallback } from "react";

import { INCREMENT_WEEKLY_PLAY_COUNT } from "./mutations";

const VISITOR_ID_KEY = "flolup_visitor_id";

const getVisitorId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage?.getItem(VISITOR_ID_KEY) || null;
};

export const useWeeklyPlayCount = () => {
  const [handleWeeklyPlayCount, { loading, error }] = useMutation(INCREMENT_WEEKLY_PLAY_COUNT);

  const incrementWeeklyPlayCount = useCallback(
    async (songId, listenedSeconds) => {
      if (!songId) return false;

      try {
        console.log("CHECK listenedSeconds received:", listenedSeconds);
        console.log("[WeeklyPlay] sending mutation:", {
          songId: String(songId),
          visitorId: getVisitorId(),
          listenedSeconds: Math.floor(Number(listenedSeconds || 0)),
        });

        await handleWeeklyPlayCount({
          variables: {
            songId: String(songId),
            visitorId: getVisitorId(),
            listenedSeconds: Math.floor(Number(listenedSeconds || 0)),
          },
        });
        return true;
      } catch (err) {
        console.warn("Failed to increment weekly play count:", err);
        return false;
      }
    },
    [handleWeeklyPlayCount]
  );

  return { incrementWeeklyPlayCount, loading, error };
};
