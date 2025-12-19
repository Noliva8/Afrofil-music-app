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
import { GET_PRESIGNED_URL_DOWNLOAD_AUDIO, GET_PRESIGNED_URL_DOWNLOAD } from "../mutations";

// helper
const pickId = (obj) => obj?.id ?? obj?._id ?? obj?.songId ?? null;

// NEW: tiny normalizers (no rename of existing fields)
const pickPlayableUrl = (x = {}) =>
  x.url || x.audioPresignedUrl || x.fullUrl || x.audioUrl || x.fullUrlWithAds || null;

const pickArtwork = (x = {}) => {
  const url =
    x.artworkPresignedUrl ||
    x.artworkUrl ||
    x.cover ||
    x.image ||
    x.artwork ||
    null;
  if (!url) return null;
  if (/placehold\.co/i.test(url)) return null;
  return url;
};

const deriveStreamKey = (item = {}) => {
  if (item.audioStreamKey) return item.audioStreamKey;
  const raw = item.streamAudioFileUrl || item.audioUrl || item.url;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    if (path.includes('for-streaming/')) return path.slice(path.indexOf('for-streaming/'));
    const filename = path.split('/').pop();
    return filename ? `for-streaming/${filename}` : null;
  } catch {
    return null;
  }
};

const ensureAudioPresigned = async (items, client) => {
  if (!client || !items?.length) return;
  const tasks = items.map(async (item) => {
    if (!item || item.audioUrl) return;
    const key = deriveStreamKey(item);
    if (!key) return;
    try {
      const { data } = await client.mutate({
        mutation: GET_PRESIGNED_URL_DOWNLOAD_AUDIO,
        variables: {
          bucket: "afrofeel-songs-streaming",
          key,
          region: "us-west-2",
        },
      });
      const signed = data?.getPresignedUrlDownloadAudio?.url;
      if (signed) {
        item.audioUrl = signed;
        item.url = signed;
      }
    } catch (err) {
      console.error("[prefetch] failed to presign audio", err);
    }
  });
  await Promise.all(tasks);
};

const ensureArtworkPresigned = async (items, client) => {
  if (!client || !items?.length) return;
  const tasks = items.map(async (item) => {
    if (!item) return;
    if (item.artworkPresignedUrl || item.artworkUrl) return;
    const key = item.artworkKey || null;
    if (!key) return;
    try {
      const { data } = await client.mutate({
        mutation: GET_PRESIGNED_URL_DOWNLOAD,
        variables: {
          bucket: "afrofeel-cover-images-for-songs",
          key,
          region: "us-east-2",
        },
      });
      const signed = data?.getPresignedUrlDownload?.url;
      if (signed) {
        item.artworkPresignedUrl = signed;
        item.artworkUrl = signed;
      }
    } catch (err) {
      console.error("[prefetch] failed to presign artwork", err);
    }
  });
  await Promise.all(tasks);
};

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

  const art = pickArtwork(song);
  const releaseYear = song.album?.releaseDate
    ? new Date(song.album.releaseDate).getFullYear()
    : (song.releaseYear || null);

  const credits = [];
  if (Array.isArray(song.composer)) {
    song.composer.forEach((c) => {
      if (c?.name) credits.push({ type: 'Composer', role: c.contribution || 'Composer', name: c.name });
    });
  }
  if (Array.isArray(song.producer)) {
    song.producer.forEach((p) => {
      if (p?.name) credits.push({ type: 'Producer', role: p.role || 'Producer', name: p.name });
    });
  }
  if (Array.isArray(song.featuringArtist)) {
    song.featuringArtist.forEach((f) => {
      if (f) credits.push({ type: 'Featuring', role: 'Featuring', name: f });
    });
  }
  if (song.label) {
    credits.push({ type: 'Label', role: 'Label', name: song.label });
  }

  const track = {
    id,
    title: song.title,
    artist: song.artistName || song.artist?.artistAka,
    artistId: String(song.artistId ?? song.artist ?? ''),
    artistFollowers: Number(song.artistFollowers ?? song.artist?.followers?.length ?? 0),
    artistDownloadCounts: Number(song.artistDownloadCounts ?? song.artist?.artistDownloadCounts ?? 0),
    albumId: String(song.albumId ?? song.album ?? ''),
    album: song.album,
    albumName: song.album?.title || song.albumTitle || 'Single',
    releaseYear,
    genre: song.genre ?? null,
    mood: Array.isArray(song.mood) ? song.mood : (song.mood ? [song.mood] : []),
    subMood: Array.isArray(song.subMoods) ? song.subMoods : (song.subMoods ? [song.subMoods] : []),
    tempo: Number(song.tempo) || null,
    audioUrl: song.audioPresignedUrl || null, // only use presigned; stream key is captured below
    audioStreamKey: song.audioStreamKey || deriveStreamKey(song),
    artworkUrl: art,
    artworkKey: song.artworkKey || null,
    duration: Number(song.durationSeconds ?? song.duration) || 0,
    country: song.artist?.country || song.country || '',
    artistBio: song.artist?.bio || song.artistBio || song.fullOriginal?.artist?.bio || '',
    lyrics: song.lyrics || '',
      credits,
    label: song.label || song.fullOriginal?.label || '',
    featuringArtist: Array.isArray(song.featuringArtist) ? song.featuringArtist : [],
    downloadCount: Number(song.downloadCount) || 0,
    artistFollowers: Number(song.artistFollowers ?? song.artist?.followers?.length ?? song.fullOriginal?.artist?.followers?.length ?? 0) || 0,
    playCount: Number(song.playCount ?? song.plays ?? 0) || 0,
    likesCount: Number(song.likesCount ?? song.fullOriginal?.likesCount ?? 0) || 0,
    likedByMe: Boolean(song.likedByMe ?? false),
    shareCount: Number(song.shareCount ?? song.fullOriginal?.shareCount ?? 0) || 0,

    // ⬅️ added: single definitive URL + mirrored artwork so resume/UI never “loses” it
    url: pickPlayableUrl(song),
    artworkPresignedUrl: art,
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
  const queue = finalQueue.map(s => {
    const artSafe = pickArtwork(s);
    const releaseYearItem = s.album?.releaseDate
      ? new Date(s.album.releaseDate).getFullYear()
      : (s.releaseYear || null);

    const creditsItem = [];
    if (Array.isArray(s.composer)) {
      s.composer.forEach((c) => {
        if (c?.name) creditsItem.push({ type: 'Composer', role: c.contribution || 'Composer', name: c.name });
      });
    }
    if (Array.isArray(s.producer)) {
      s.producer.forEach((p) => {
        if (p?.name) creditsItem.push({ type: 'Producer', role: p.role || 'Producer', name: p.name });
      });
    }
    if (Array.isArray(s.featuringArtist)) {
      s.featuringArtist.forEach((f) => {
        if (f) creditsItem.push({ type: 'Featuring', role: 'Featuring', name: f });
      });
    }
    if (s.label) {
      creditsItem.push({ type: 'Label', role: 'Label', name: s.label });
    }

    return {
      id: String(s.id ?? s._id),
      title: s.title,
      artist: s.artistName || s.artist?.artistAka,
      artistId: String(s.artistId ?? s.artist ?? ''),
      artistFollowers: Number(s.artistFollowers ?? s.artist?.followers?.length ?? 0),
      artistDownloadCounts: Number(s.artistDownloadCounts ?? s.artist?.artistDownloadCounts ?? 0),
      albumId: String(s.albumId ?? s.album ?? ''),
      album: s.album,
      albumName: s.album?.title || s.albumTitle || 'Single',
      releaseYear: releaseYearItem,
      genre: s.genre ?? null,
      mood: Array.isArray(s.mood) ? s.mood : (s.mood ? [s.mood] : []),
      subMood: Array.isArray(s.subMoods) ? s.subMoods : (s.subMoods ? [s.subMoods] : []),
      tempo: Number(s.tempo) || null,
      audioUrl: s.audioPresignedUrl || null, // defer raw stream until presigned
      streamAudioFileUrl: s.streamAudioFileUrl || s.audioUrl || null,
      artworkUrl: artSafe,
      duration: Number(s.durationSeconds ?? s.duration) || 0,
      country: s.country || s.artist?.country || '',
      artistBio: s.artist?.bio || '',
      lyrics: s.lyrics || '',
      credits: creditsItem,
      label: s.label || s.fullOriginal?.label || '',
      featuringArtist: Array.isArray(s.featuringArtist) ? s.featuringArtist : [],
      downloadCount: Number(s.downloadCount) || 0,
      artistFollowers: Number(s.artistFollowers ?? s.artist?.followers?.length ?? 0) || 0,
      playCount: Number(s.playCount ?? s.plays ?? 0) || 0,
      likesCount: Number(s.likesCount ?? s.fullOriginal?.likesCount ?? 0) || 0,
      likedByMe: Boolean(s.likedByMe ?? false),
      shareCount: Number(s.shareCount ?? s.fullOriginal?.shareCount ?? 0) || 0,

      // ⬅️ added for each queue item
      url: pickPlayableUrl(s),
      artworkPresignedUrl: artSafe,
      cover: artSafe,
      artworkKey: s.artworkKey || null,
      audioStreamKey: s.audioStreamKey || deriveStreamKey(s),
    };
  });

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
// TO DO, Add debug here to see if queue has cover
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

  // Make sure current + next few have signed audio/artwork before playback (works with shuffle jumps).
  const PREFETCH_WINDOW = 6;
  const prefetchItems = [queue[currentIndex], ...restQueue.slice(0, PREFETCH_WINDOW)];
  await Promise.all([
    ensureAudioPresigned(prefetchItems, client),
    ensureArtworkPresigned(prefetchItems, client),
  ]);

  // Sync presigned values back to the current track
  const currentPrefetched = prefetchItems[0];
  if (currentPrefetched) {
    if (currentPrefetched.audioUrl) track.audioUrl = currentPrefetched.audioUrl;
    if (currentPrefetched.artworkPresignedUrl) {
      track.artworkUrl = currentPrefetched.artworkPresignedUrl;
      track.cover = currentPrefetched.artworkPresignedUrl;
    }
  }

  // Hand off to player
  const loaded = await handlePlaySong(track, restQueue, context, { prepared });
  if (!loaded) console.error('[Trending] Failed to load and play song.');
};
