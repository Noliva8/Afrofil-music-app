// // imports
// import { processSongs } from "../someSongsUtils/someSongsUtils";
// import { buildTrendingContext, RepeatModes, } from "./playbackSources";
// import { buildTrendingQueue } from "./trendingAlg/buildTrendingQueue";

// import { similarSongsUtil } from "../someSongsUtils/similarSongsHook";



// // helper

//  const pickId = (obj) => obj?.id ?? obj?._id ?? obj?.songId ?? null;



// export const handleTrendingSongPlay = async ({song, incrementPlayCount, handlePlaySong,  trendingSongs = [] ,client}) => {
   


//   const rawId = pickId(song);
//   if (!rawId) return;
//   const id = String(rawId); 

//   incrementPlayCount(id);

//   const track = {
//     id,
//     title: song.title,
//     artist: song.artistName,
//     artistId: String(song.artistId ?? song.artist ?? ''),
//     albumId: String(song.albumId ?? song.album ?? ''),
//     genre: song.genre ?? null,
//     mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
//     subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
//     tempo: Number(song.tempo) || null,
//     audioUrl: song.audioPresignedUrl || song.audioUrl || song.streamAudioFileUrl || null,
//     artworkUrl: song.artworkPresignedUrl || song.cover || song.artwork || null,
//     duration: Number(song.durationSeconds ?? song.duration) || 0,
//     country: song.artist?.country || song.country || '',
//     album: song.album,
//   };

//   // Get similar songs from server (with presigned URLs)
//   const similarData = await similarSongsUtil(client, track.id);
//   const similarSongs = similarData.songs || [];
  
//   console.log(`🎵 Server similar songs: ${similarSongs.length}`);

//   // Process both similar songs and trending songs
//   const processedSimilarSongs = processSongs(similarSongs);
//   const processedTrendingSongs = processSongs(trendingSongs || []);
  
//   console.log(`🎵 Component trending songs: ${processedTrendingSongs.length}`);

//   // COMBINE BOTH SOURCES for a longer queue
//   const combinedSongs = [
//     ...processedSimilarSongs,
//     ...processedTrendingSongs.filter(trendingSong => 
//       // Remove duplicates - don't include trending songs that are already in similar songs
//       !processedSimilarSongs.some(similarSong => 
//         String(similarSong.id) === String(trendingSong.id)
//       )
//     )
//   ];

//   // console.log(`🎵 Combined queue: ${combinedSongs.length} total songs`);

//   // Build the queue from COMBINED sources
//   const { queue: builtQueue, queueIds } = buildTrendingQueue(
//     track,
//     combinedSongs, // Use combined songs as source
//     {
//       maxQueueSize: 50,
//       capSameArtistFirstK: { cap: 2, window: 10 },
//       capSameAlbumFirstK: { cap: 1, window: 8 },
//       w1: 10, w2: 15, w3: 20, w4: 25
//     }
//   );

//   console.log(`🎵 Built queue: ${builtQueue.length} songs after filtering`);

//   // Final queue - no need for supplement since we already combined sources
//   const finalQueue = builtQueue;

//   // Map queue items to player format
//   const queue = finalQueue.map(s => ({
//     id: String(s.id ?? s._id),
//     title: s.title,
//     artist: s.artistName,
//     artistId: String(s.artistId ?? s.artist ?? ''),
//     albumId: String(s.albumId ?? s.album ?? ''),
//     genre: s.genre ?? null,
//     mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
//     subMood: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
//     tempo: Number(s.tempo) || null,
//     // Unified URL handling - works for both server and component songs
//     audioUrl: s.audioPresignedUrl || s.audioUrl || s.streamAudioFileUrl || null,
//     artworkUrl: s.artworkPresignedUrl || s.cover || s.artwork || null,
//     duration: Number(s.durationSeconds ?? s.duration) || 0,
//     country: s.country || s.artist?.country || '',
//   }));

//   // Locate current index
//   const currentIndex = queue.findIndex(t => t.id === track.id);
//   if (currentIndex < 0) {
//     console.error('[Trending] Clicked track not found in built queue');
//     return;
//   }

//   // Build playback context
//   const context = buildTrendingContext(
//     currentIndex,
//     queue.length,
//     false,
//     RepeatModes.OFF
//   );

//   // Prepare payload for the player
//   const prepared = {
//     track,
//     context,
//     queue,
//     queueIds,
//     currentIndex
//   };

//   // Remaining queue must be items AFTER current
//   const restQueue = queue.slice(currentIndex + 1);

//   // Hand off to player
//   const loaded = await handlePlaySong(track, restQueue, context, { prepared });
//   if (!loaded) console.error('[Trending] Failed to load and play song.');
// };



// refactored

// imports
import { processSongs } from "../someSongsUtils/someSongsUtils";
import { buildTrendingContext, RepeatModes } from "./playbackSources";
import { buildTrendingQueue } from "./trendingAlg/buildTrendingQueue";
import { similarSongsUtil } from "../someSongsUtils/similarSongsHook";

// helper
const pickId = (obj) => obj?.id ?? obj?._id ?? obj?.songId ?? null;

// NEW: tiny normalizers (no rename of existing fields)
const pickPlayableUrl = (x = {}) =>
  x.url || x.audioPresignedUrl || x.fullUrl || x.audioUrl || x.fullUrlWithAds || x.streamAudioFileUrl || null;

const pickArtwork = (x = {}) =>
  x.artworkPresignedUrl || x.artworkUrl || x.cover || x.artwork || null;

export const handleTrendingSongPlay = async ({
  song,
  incrementPlayCount,
  handlePlaySong,
  trendingSongs = [],
  client
}) => {
  const rawId = pickId(song);
  if (!rawId) return;
  const id = String(rawId);

  incrementPlayCount(id);

  const track = {
    id,
    title: song.title,
    artist: song.artistName,
    artistId: String(song.artistId ?? song.artist ?? ''),
    albumId: String(song.albumId ?? song.album ?? ''),
    genre: song.genre ?? null,
    mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
    subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
    tempo: Number(song.tempo) || null,
    audioUrl: song.audioPresignedUrl || song.audioUrl || song.streamAudioFileUrl || null,
    artworkUrl: song.artworkPresignedUrl || song.cover || song.artwork || null,
    duration: Number(song.durationSeconds ?? song.duration) || 0,
    country: song.artist?.country || song.country || '',
    album: song.album,

    // ⬅️ added: single definitive URL + mirrored artwork so resume/UI never “loses” it
    url: pickPlayableUrl(song),
    artworkPresignedUrl: pickArtwork(song),
  };

  // Get similar songs from server (with presigned URLs)
  const similarData = await similarSongsUtil(client, track.id);
  const similarSongs = similarData.songs || [];
  console.log(`🎵 Server similar songs: ${similarSongs.length}`);

  // Process both similar songs and trending songs
  const processedSimilarSongs = processSongs(similarSongs);
  const processedTrendingSongs = processSongs(trendingSongs || []);
  console.log(`🎵 Component trending songs: ${processedTrendingSongs.length}`);

  // COMBINE BOTH SOURCES for a longer queue (dedupe by id)
  const similarIds = new Set(processedSimilarSongs.map(s => String(pickId(s))));
  const combinedSongs = [
    ...processedSimilarSongs,
    ...processedTrendingSongs.filter(t => !similarIds.has(String(pickId(t))))
  ];

  // Build the queue from COMBINED sources
  const { queue: builtQueue, queueIds } = buildTrendingQueue(
    track,
    combinedSongs,
    {
      maxQueueSize: 50,
      capSameArtistFirstK: { cap: 2, window: 10 },
      capSameAlbumFirstK: { cap: 1, window: 8 },
      w1: 10, w2: 15, w3: 20, w4: 25
    }
  );
  console.log(`🎵 Built queue: ${builtQueue.length} songs after filtering`);

  // Final queue - no need for supplement since we already combined sources
  const finalQueue = builtQueue;

  // Map queue items to player format (keep your old fields + add url/artwork mirror)
  const queue = finalQueue.map(s => ({
    id: String(s.id ?? s._id),
    title: s.title,
    artist: s.artistName,
    artistId: String(s.artistId ?? s.artist ?? ''),
    albumId: String(s.albumId ?? s.album ?? ''),
    genre: s.genre ?? null,
    mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
    subMood: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
    tempo: Number(s.tempo) || null,
    audioUrl: s.audioPresignedUrl || s.audioUrl || s.streamAudioFileUrl || null,
    artworkUrl: s.artworkPresignedUrl || s.cover || s.artwork || null,
    duration: Number(s.durationSeconds ?? s.duration) || 0,
    country: s.country || s.artist?.country || '',

    // ⬅️ added for each queue item
    url: pickPlayableUrl(s),
    artworkPresignedUrl: pickArtwork(s),
  }));

  // Locate current index
  const currentIndex = queue.findIndex(t => t.id === track.id);
  if (currentIndex < 0) {
    console.error('[Trending] Clicked track not found in built queue');
    return;
  }

  // Build playback context
  const context = buildTrendingContext(
    currentIndex,
    queue.length,
    false,
    RepeatModes.OFF
  );

  // Prepare payload for the player
  const prepared = {
    track,
    context,
    queue,
    queueIds,
    currentIndex
  };

  // Remaining queue must be items AFTER current
  const restQueue = queue.slice(currentIndex + 1);

  // Hand off to player
  const loaded = await handlePlaySong(track, restQueue, context, { prepared });
  if (!loaded) console.error('[Trending] Failed to load and play song.');
};
