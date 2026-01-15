


// import { SIMILAR_SONGS_TRENDINGS } from '../queries';

// export const similarSongsUtil = async (client, songId) => {
//   if (!songId) return { songs: [], context: "", expireAt: "" };
// // console.log('playing song id ...:', songId);

// const contextFromClient = localStorage.getItem('mklExpiresAt');
// // console.log('available playback context:', contextFromClient);

//   try {
//     const { data } = await client.query({
//       query: SIMILAR_SONGS_TRENDINGS,
//       variables: { songId },
//       fetchPolicy: "network-only",
//     });

//     console.log("how data looks like:", data);

//     const pack = data?.similarSongs || { songs: [], context: "", expireAt: "" };
// console.log('check context:', pack.context);
//     if (pack.context) {
//       localStorage.setItem("mkl", pack.context);
//       if (pack.expireAt) localStorage.setItem("mklExpiresAt", pack.expireAt);
//       console.log("🎵 Cached playback context:", pack.context);
//     }

//     return pack;
//   } catch (e) {
//     console.error("Error fetching similar songs:", e);
//     return { songs: [], context: "", expireAt: "" };
//   }
// };




// new hook


import { SIMILAR_SONGS_TRENDINGS } from '../queries';

const normalizeAudioKey = (key) => {
  if (!key) return null;
  const k = String(key).replace(/^\/+/, '');
  if (k.startsWith('for-streaming/')) return k;
  const filename = k.split('/').pop();
  return filename ? `for-streaming/${filename}` : null;
};



const toKeyFromUrlOrKey = (v) => {
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return String(v).replace(/^\/+/, '');
  try {
    const u = new URL(v);
    // keep full path, drop query/leading slash
    return decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
  } catch {
    return null;
  }
};

const deriveArtworkKey = (s = {}) => {
  const cands = [
    s.artworkKey,
    s.artwork,
    s.artworkUrl,
    s.artworkPresignedUrl,
    s.cover,
  ];
  for (const c of cands) {
    const key = toKeyFromUrlOrKey(c);
    if (key) return key;
  }
  return null;
};

const pickId = (s) => s?.id ?? s?._id ?? null;

export const similarSongsUtil = async (client, songId) => {
  if (!songId) return { songs: [], context: "", expireAt: "" };

  try {
    const { data } = await client.query({
      query: SIMILAR_SONGS_TRENDINGS,
      variables: { songId },
      fetchPolicy: "network-only",
    });

    const pack = data?.similarSongs || { songs: [], context: "", expireAt: "" };

    // Persist only the context metadata (not the songs)
    if (pack.context) {
      localStorage.setItem("mkl", pack.context);
      if (pack.expireAt) localStorage.setItem("mklExpiresAt", pack.expireAt);
    }

    // Defensive normalization for migration periods
    const songs = Array.isArray(pack.songs) ? pack.songs : [];
    const normalizedSongs = songs
      .map((s) => {
        if (!s) return null;
        const id = pickId(s);
        if (!id) return null;

        const artworkKey = deriveArtworkKey(s);

        const audioStreamKey =
          normalizeAudioKey(
            s.audioStreamKey ||
              toKeyFromUrlOrKey(s.streamAudioFileUrl) ||
              toKeyFromUrlOrKey(s.audioUrl) ||
              toKeyFromUrlOrKey(s.url)
          );

          

        return {
          ...s,
          artworkUrl: s.artworkPresignedUrl || s.artworkUrl || s.artwork || s.cover || null,
          id: String(id),
          _id: s._id ? String(s._id) : String(id),
          artworkKey: artworkKey ? String(artworkKey) : null,
          audioStreamKey: audioStreamKey ? String(audioStreamKey) : null,
        };
      })
      .filter(Boolean);

    return {
      context: pack.context || "",
      expireAt: pack.expireAt || "",
      songs: normalizedSongs,
    };
  } catch (e) {
    console.error("Error fetching similar songs:", e);
    return { songs: [], context: "", expireAt: "" };
  }
};
