import { createContext } from "react";

export const PREDEFINED_ACTIVITIES = {
  STARTING: "starting",
  LOGIN: "login",
  SIGNUP: "signup",
  BROWSING: "browsing",
  PLAYING: "playing",
  UPLOADING: "uploading",
  SEARCHING: "searching",
  IDLE: "idle",
};

export const createInitialUserActivity = (pathname = "/") => {
  const now = Date.now();

  return {
    activity: PREDEFINED_ACTIVITIES.STARTING,
    metadata: {},
    lastActivityAt: now,
    browsing: {
      activity: PREDEFINED_ACTIVITIES.BROWSING,
      pathname,
      fullPath: pathname,
      updatedAt: now,
    },
    isUserPlaying: false,
    playback: {
      isPlaying: false,
      updatedAt: now,
      trackId: null,
      title: null,
    },
  };
};

export const ActivityMonitorContext = createContext({
  userActivity: createInitialUserActivity(),
  activityUpdatedAt: null,
  updateActivity: () => {},
  updateBrowsingActivity: () => {},
  setIsUserPlaying: () => {},
});
