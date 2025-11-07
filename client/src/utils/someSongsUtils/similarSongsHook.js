


import { SIMILAR_SONGS_TRENDINGS } from '../queries';

export const similarSongsUtil = async (client, songId) => {
  if (!songId) return { songs: [], context: "", expireAt: "" };

const contextFromClient = localStorage.getItem('mklExpiresAt');
console.log('available playback context:', contextFromClient);

  try {
    const { data } = await client.query({
      query: SIMILAR_SONGS_TRENDINGS,
      variables: { songId },
      fetchPolicy: "network-only",
    });

    console.log("how data looks like:", data);

    const pack = data?.similarSongs || { songs: [], context: "", expireAt: "" };
console.log('check context:', pack.context);
    if (pack.context) {
      localStorage.setItem("mkl", pack.context);
      if (pack.expireAt) localStorage.setItem("mklExpiresAt", pack.expireAt);
      console.log("🎵 Cached playback context:", pack.context);
    }

    return pack;
  } catch (e) {
    console.error("Error fetching similar songs:", e);
    return { songs: [], context: "", expireAt: "" };
  }
};
