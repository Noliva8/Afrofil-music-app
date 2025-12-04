import { useMutation } from '@apollo/client';
import { GET_PRESIGNED_URL_DOWNLOAD, GET_PRESIGNED_URL_DOWNLOAD_AUDIO } from '../mutations';
import { useState, useEffect } from 'react';



export const useSongsWithPresignedUrls = (songsData) => {
  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);
  const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO);
  const [songsWithArtwork, setSongsWithArtwork] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Always call the hook, but handle the logic inside
    const fetchArtworksAndAudio = async () => {
      // Check if we have valid data to process
      if (!songsData || !Array.isArray(songsData)) {
        console.log('No songs data available or not an array:', songsData);
        setSongsWithArtwork([]);
        return;
      }

      setLoading(true);
      
      try {
        const updatedSongs = await Promise.all(
          songsData.map(async (song) => {
            let artworkUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%231a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="24" font-family="Arial">No Cover</text></svg>';
            let audioUrl = null;

            // Fetch artwork URL
            if (song.artwork) {
              try {
                const artworkKey = new URL(song.artwork).pathname.split('/').pop();
                const { data: artworkData } = await getPresignedUrlDownload({
                  variables: {
                    bucket: 'afrofeel-cover-images-for-songs',
                    key: decodeURIComponent(artworkKey),
                    region: 'us-east-2',
                    expiresIn: 604800,
                  },
                });
                artworkUrl = artworkData.getPresignedUrlDownload.urlToDownload;
              } catch (err) {
                console.error('Error fetching artwork for', song.title, err);
              }
            }

            // Fetch audio URL
            if (song.streamAudioFileUrl) {
              try {
                const audioKey = new URL(song.streamAudioFileUrl).pathname.split('/').pop();
                const { data: audioData } = await getPresignedUrlDownloadAudio({
                  variables: {
                    bucket: 'afrofeel-songs-streaming',
                    key: `for-streaming/${decodeURIComponent(audioKey)}`,
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
            };
          })
        );

        setSongsWithArtwork(updatedSongs);
      } catch (error) {
        console.error('Error in useSongsWithPresignedUrls:', error);
        setSongsWithArtwork([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworksAndAudio();
  }, [songsData, getPresignedUrlDownload, getPresignedUrlDownloadAudio]);

  return {
    songsWithArtwork,
    loading
  };
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



// Extract the URL fetching logic into a reusable function
export const fetchPresignedUrls = async (songs, getPresignedUrlDownload, getPresignedUrlDownloadAudio) => {
  if (!songs || !Array.isArray(songs)) return [];

  const updatedSongs = await Promise.all(
    songs.map(async (song) => {
      let artworkUrl = await getFallbackArtworkUrl(getPresignedUrlDownload);
      let audioUrl = null;

      // Fetch artwork URL
      if (song.artwork) {
        try {
          const artworkKey = new URL(song.artwork).pathname.split('/').pop();
          const { data: artworkData } = await getPresignedUrlDownload({
            variables: {
              bucket: 'afrofeel-cover-images-for-songs',
              key: decodeURIComponent(artworkKey),
              region: 'us-east-2',
              expiresIn: 604800,
            },
          });
          artworkUrl = artworkData.getPresignedUrlDownload.urlToDownload;
        } catch (err) {
          console.error('Error fetching artwork for', song.title, err);
          // Falls back to the fallback URL
        }
      }

      // Fetch audio URL
      if (song.streamAudioFileUrl) {
        try {
          const audioKey = new URL(song.streamAudioFileUrl).pathname.split('/').pop();
          const { data: audioData } = await getPresignedUrlDownloadAudio({
            variables: {
              bucket: 'afrofeel-songs-streaming',
              key: `for-streaming/${decodeURIComponent(audioKey)}`,
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
      };
    })
  );

  return updatedSongs;
};

// Fallback artwork function for your new bucket
const getFallbackArtworkUrl = async (getPresignedUrlDownload) => {
  const fallbackImages = [
    'Icon1.jpg',
    'Singing.jpg',
  ];
  
  const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  
  try {
    const { data } = await getPresignedUrlDownload({
      variables: {
        bucket: 'fallback-imagess', // Your new bucket
        key: randomImage,
        region: 'us-west-2', // Oregon region
        expiresIn: 604800, // 1 week
      },
    });
    return data.getPresignedUrlDownload.urlToDownload;
  } catch (error) {
    console.error('Error fetching fallback artwork:', error);
    // Ultimate fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imYAgQWZyb2ZlZWw8L3RleHQ+PC9zdmc+';
  }
};
