import {
  NEW_UPLOADS_PUBLIC,
  TRENDING_SONGS_PUBLICV2,
  SUGGESTED_SONGS_PUBLIC,
  QUERY_RECENT_PLAYED,
  QUERY_LIKED_SONGS,
} from "../../utils/queries";
import {
  HORIZONTAL_LIMIT,
  COMPACT_LIMIT,
} from "../../CommonSettings/songsRowNumberControl";

import { gql } from "@apollo/client";

export const LIST_BASE_LIMIT = HORIZONTAL_LIMIT;
export const LIST_SHOW_ALL_LIMIT = COMPACT_LIMIT;



export const ROW_QUERY_CONFIG = {
  newUpload: {
    query: NEW_UPLOADS_PUBLIC,
    dataKey: "newUploads",
    variables: { limit: LIST_SHOW_ALL_LIMIT },
    fetchPolicy: "network-only",
  },

  trending: {
    query: TRENDING_SONGS_PUBLICV2,
    dataKey: "processedTrendingSongs",
    fetchPolicy: "network-only",
  },

  suggestedSongs: {
    query: SUGGESTED_SONGS_PUBLIC,
    dataKey: "suggestedSongs",
    fetchPolicy: "network-only",
  },
  recentlyPlayed: {
    query: QUERY_RECENT_PLAYED,
    dataKey: "recentPlayedSongs",
    variables: { limit: LIST_SHOW_ALL_LIMIT },
    fetchPolicy: "network-only",
  },
  songsYouLike: {
    query: QUERY_LIKED_SONGS,
    dataKey: "likedSongs",
    variables: { limit: LIST_SHOW_ALL_LIMIT },
    fetchPolicy: "network-only",
  },
};

export const SONG_LIST_PLACEHOLDER_QUERY = gql`
  query __SongListPlaceholder {
    __typename
  }
`;
