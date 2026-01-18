
import { useMutation } from '@apollo/client';
import { GET_PRESIGNED_URL_DOWNLOAD } from '../mutations';
import { useState, useEffect, useRef } from 'react';

const FALLBACK_IMAGES = [
  'fallback-images/Icon1.jpg',
  'fallback-images/Singing.jpg',
];

const getRandomFallbackImage = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
  return FALLBACK_IMAGES[randomIndex];
};

// ✅ Return FULL key (keeps folder path if present)
export const getFullKeyFromUrlOrKey = (value) => {
  if (!value || typeof value !== 'string') return null;

  // already a key like "fallback-images/Icon1.jpg" or "Icon1.jpg"
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return decodeURIComponent(value.replace(/^\/+/, ''));
  }

  // URL => use full pathname as key (minus leading "/")
  try {
    const u = new URL(value);
    return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
};

export const useSongsWithPresignedUrls = (songsData) => {
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);

  const [songsWithArtwork, setSongsWithArtwork] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastSignatureRef = useRef('');

  useEffect(() => {
    const fetchArtworksAndAudio = async () => {
      if (!songsData || !Array.isArray(songsData)) {
        console.log('No songs data available or not an array:', songsData);
        setSongsWithArtwork([]);
        setLoading(false);
        lastSignatureRef.current = '';
        return;
      }

      const signature = songsData
        .map((song) => song?._id ?? song?.id ?? song?.songId ?? '')
        .join('|');

      if (signature === lastSignatureRef.current) {
        return;
      }

      lastSignatureRef.current = signature;
      setLoading(true);

      try {
        const updatedSongs = await Promise.all(
          songsData.map(async (song) => {
            // Default “No Cover” SVG
            let artworkUrl =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%231a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="24" font-family="Arial">No Cover</text></svg>';

            let profilePictureUrl = null;
            let coverImageUrl = null;
            let albumCoverImageUrl = null;
            // Preserve any audio locator coming from the API (key or URL) without presigning here.
            const audioUrl = song?.audioUrl || song?.streamAudioFileUrl || null;

            // -----------------------------
            // 1) Song artwork (full key)
            // -----------------------------
            const songArtworkKey = song?.artwork ? getFullKeyFromUrlOrKey(song.artwork) : null;

            if (songArtworkKey) {
              try {
                const { data } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-cover-images-for-songs',
                    key: songArtworkKey, // ✅ keep folders
                    region: 'us-east-2',
                    expiresIn: 604800,
                  },
                });

                artworkUrl = data?.getPresignedUrlDownload?.url || artworkUrl;
              } catch (error) {
                console.error('Error fetching artwork for', song?.title, error);
              }
            } else {
              // -----------------------------
              // 1b) Fallback artwork (full key)
              // -----------------------------
              try {
                const fallbackKey = getRandomFallbackImage(); // e.g. fallback-images/Icon1.jpg
                const { data } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-cover-images-for-songs',
                    key: fallbackKey, // ✅ keep folders
                    region: 'us-east-2',
                    expiresIn: 604800,
                  },
                });

                artworkUrl = data?.getPresignedUrlDownload?.url || artworkUrl;
              } catch (error) {
                console.error('Error fetching fallback artwork for', song?.title, error);
              }
            }

            // -----------------------------
            // 3) Artist profile image (full key)
            // -----------------------------
            const rawProfileImage = song?.artist?.profileImage || null;
            const artistProfileKey = rawProfileImage
              ? getFullKeyFromUrlOrKey(rawProfileImage)
              : null;

            if (artistProfileKey) {
              try {
                const { data } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-profile-picture',
                    key: artistProfileKey, // ✅ keep folders
                    region: 'us-west-2',
                    expiresIn: 604800,
                  },
                });

                profilePictureUrl = data?.getPresignedUrlDownload?.url || null;
              } catch (error) {
                console.error('Error fetching artist profile image for', song?.title, error);
              }
            }

            // -----------------------------
            // 4) Artist cover image (full key)
            // -----------------------------
            const artistCoverKey = song?.artist?.coverImage
              ? getFullKeyFromUrlOrKey(song.artist.coverImage)
              : null;

            if (artistCoverKey) {
              try {
                const { data } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-cover-images-for-songs',
                    key: artistCoverKey, // ✅ keep folders
                    region: 'us-east-2',
                    expiresIn: 604800,
                  },
                });

                coverImageUrl = data?.getPresignedUrlDownload?.url || null;
              } catch (error) {
                console.error('Error fetching artist cover image for', song?.title, error);
              }
            }

            // -----------------------------
            // 5) Album cover image (full key)
            // -----------------------------
            const albumCoverKey = song?.album?.albumCoverImage
              ? getFullKeyFromUrlOrKey(song.album.albumCoverImage)
              : null;

            if (albumCoverKey) {
              try {
                const { data } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-cover-images-for-songs',
                    key: albumCoverKey, // ✅ keep folders
                    region: 'us-east-2',
                    expiresIn: 604800,
                  },
                });

                albumCoverImageUrl = data?.getPresignedUrlDownload?.url || null;
              } catch (error) {
                console.error('Error fetching album cover image for', song?.title, error);
              }
            }

            return {
              ...song,
              artworkUrl,
              audioUrl,
              profilePictureUrl,
              coverImageUrl,
              albumCoverImageUrl,
            };
          })
        );

        setSongsWithArtwork(updatedSongs);
      } catch (error) {
        console.error('Error in useSongsWithPresignedUrls:', error);
        setSongsWithArtwork([]);
        lastSignatureRef.current = '';
      } finally {
        setLoading(false);
      }
    };

    fetchArtworksAndAudio();
  }, [songsData]);

  return { songsWithArtwork, loading };
};







// // Extract the URL fetching logic into a reusable function
// export const fetchPresignedUrls = async (songs, getPresignedUrlDownload, getPresignedUrlDownloadAudio) => {
//   if (!songs || !Array.isArray(songs)) return [];

//   const updatedSongs = await Promise.all(
//     songs.map(async (song) => {
//       let artworkUrl = 'https://via.placeholder.com/300x300?text=No+Cover';
//       let audioUrl = null;

//       // Fetch artwork URL
//       if (song.artwork) {
//         try {
//           const artworkKey = new URL(song.artwork).pathname.split('/').pop();
//           const { data: artworkData } = await getPresignedUrlDownload({
//             variables: {
//               bucket: 'afrofeel-cover-images-for-songs',
//               key: decodeURIComponent(artworkKey),
//               region: 'us-east-2',
//               expiresIn: 604800,
//             },
//           });
//           artworkUrl = artworkData.getPresignedUrlDownload.urlToDownload;
//         } catch (err) {
//           console.error('Error fetching artwork for', song.title, err);
//         }
//       }

//       // Fetch audio URL
//       if (song.streamAudioFileUrl) {
//         try {
//           const audioKey = new URL(song.streamAudioFileUrl).pathname.split('/').pop();
//           const { data: audioData } = await getPresignedUrlDownloadAudio({
//             variables: {
//               bucket: 'afrofeel-songs-streaming',
//               key: `for-streaming/${decodeURIComponent(audioKey)}`,
//               region: 'us-west-2',
//             },
//           });
//           audioUrl = audioData.getPresignedUrlDownloadAudio.url;
//         } catch (err) {
//           console.error('Error fetching audio for', song.title, err);
//         }
//       }

//       return {
//         ...song,
//         artworkUrl,
//         audioUrl,
//       };
//     })
//   );

//   return updatedSongs;
// };



const deriveArtworkKey = (artwork) => {
  if (!artwork) return null;
  if (!/^https?:\/\//i.test(String(artwork))) {
    return String(artwork).replace(/^\/+/, '');
  }
  try {
    const url = new URL(artwork);
    // Keep full path, drop query/leading slash
    return decodeURIComponent((url.pathname || '').replace(/^\/+/, ''));
  } catch (err) {
    return null;
  }
};

const deriveAudioStreamKey = (streamUrl) => {
  if (!streamUrl) return null;
  if (!/^https?:\/\//i.test(String(streamUrl))) {
    const cleaned = String(streamUrl).replace(/^\/+/, '');
    return cleaned.startsWith('for-streaming/') ? cleaned : `for-streaming/${cleaned}`;
  }
  try {
    const url = new URL(streamUrl);
    const filename = decodeURIComponent((url.pathname || '').split('/').pop() || '');
    return filename ? `for-streaming/${filename}` : null;
  } catch (err) {
    return null;
  }
};

// Extract the URL fetching logic into a reusable function
export const fetchPresignedUrls = async (songs, getPresignedUrlDownload, getPresignedUrlDownloadAudio) => {
  if (!songs || !Array.isArray(songs)) return [];

  const updatedSongs = await Promise.all(
    songs.map(async (song) => {
      const fallbackArtwork = await getFallbackArtworkUrl(getPresignedUrlDownload);

      const artworkKey = song.artworkKey || deriveArtworkKey(song.artwork) || fallbackArtwork.key;
      const audioStreamKey = song.audioStreamKey || deriveAudioStreamKey(song.streamAudioFileUrl);

      let artworkUrl = fallbackArtwork.url;
      let audioUrl = null;

      // Fetch artwork URL
      if (song.artwork) {
        try {
          const { data: artworkData } = await getPresignedUrlDownload({
            variables: {
              bucket: 'afrofeel-cover-images-for-songs',
              key: artworkKey || deriveArtworkKey(song.artwork),
              region: 'us-east-2',
             
            },
          });
          artworkUrl = artworkData.getPresignedUrlDownload.url;
        } catch (err) {
          console.error('Error fetching artwork for', song.title, err);
          // Falls back to the fallback URL
        }
      }

      // Fetch audio URL
      if (song.streamAudioFileUrl) {
        try {
          const { data: audioData } = await getPresignedUrlDownloadAudio({
            variables: {
              bucket: 'afrofeel-songs-streaming',
              key: audioStreamKey || `for-streaming/${decodeURIComponent(new URL(song.streamAudioFileUrl).pathname.split('/').pop())}`,
              region: 'us-west-2',
            },
          });
          audioUrl = audioData.getPresignedUrlDownloadAudio.url;
        } catch (err) {
          console.error('Error fetching audio for', song.title, err);
        }
      }

      return {
        ...song,
        artworkUrl,
        audioUrl,
        artworkKey,
        audioStreamKey,
      };
    })
  );

  return updatedSongs;
};

// Fallback artwork function for your new bucket
const getFallbackArtworkUrl = async (getPresignedUrlDownload) => {
  const fallbackImages = [
    'fallback-images/Icon1.jpg',
    'fallback-images/Singing.jpg',
  ];
  
  const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  
  try {
    const { data } = await getPresignedUrlDownload({
      variables: {
        bucket: 'afrofeel-cover-images-for-songs', // Use primary cover bucket so resume presign works
        key: randomImage,
        region: 'us-east-2',
        expiresIn: 604800, // 1 week
      },
    });
    return {
      url: data.getPresignedUrlDownload.urlToDownload,
      key: randomImage,
    };
  } catch (error) {
    console.error('Error fetching fallback artwork:', error);
    // Ultimate fallback
    return {
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imYAgQWZyb2ZlZWw8L3RleHQ+PC9zdmc+',
      key: randomImage, // still return a stable key so downstream presign can reuse it
    };
  }
};
