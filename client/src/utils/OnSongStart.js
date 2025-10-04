// import { useMutation } from "@apollo/client";
// import { TRACK_START } from "./mutations";

// // Probably not used anywhere



// const getClientDeviceInfo = () => {
//   const userAgent = navigator.userAgent;
  
//   return {
//     device: /Mobile|Android|iPhone|iPad|iPod/.test(userAgent) ? 'mobile' : 'desktop',
//     platform: /iPhone|iPad|iPod/.test(userAgent) ? 'ios' : 
//               /Android/.test(userAgent) ? 'android' : 'web',
//     userAgent: userAgent,
//     screen: `${window.screen.width}x${window.screen.height}`,
//     language: navigator.language,
//     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//   };
// };



// export const useTrackStart = () => {
//   const [trackStart] = useMutation(TRACK_START);
//   const userContext = useUser();
//   const { currentTrack, queue } = useAudioPlayer();

//   const handleTrackStart = async (track, playerState, eventType = 'play') => {
//     try {
//       // Get device info (you already have this function)
//       const deviceInfo = getClientDeviceInfo();
      
//       // Generate unique event ID for deduplication
//       const eventId = `${eventType}_${track.id}_${Date.now()}`;

//       // Execute mutation
//       const result = await trackStart({
//         variables: {
//           input: {
//             // Core Identity
//             userId: userContext.userId,
//             sessionId: userContext.sessionId, // You'll need to manage sessions
//             userTier: userContext.isPremium ? 'premium' : 
//                      userContext.isUser ? 'regular' : 'guest',

//             // Device & Platform
//             device: deviceInfo.device,
//             platform: deviceInfo.platform,

//             // Location (optional - can be empty)
//             geo: {
//               country: '', // You can add IP-based geo later
//               city: '',
//               state: '',
//               lat: null,
//               lon: null
//             },

//             // Current Song (from track object)
//             trackId: track.id,
//             trackGenre: track.genre || '',
//             trackMood: track.mood || '',
//             trackSubMood: track.subMood || '',
//             artistId: track.artistId,
//             albumId: track.albumId,
//             tempo: track.tempo || 0,
//             duration: track.duration,

//             // Playback Context (from playerState)
//             playbackSource: playerState.source || 'unknown',
//             sourceId: playerState.sourceId || '',
//             queuePosition: playerState.queuePosition || 0,
//             queueLength: playerState.queueLength || 0,
//             shuffle: playerState.shuffle || false,
//             repeat: playerState.repeat || 'off',

//             // Technical
//             eventId: eventId
//           }
//         }
//       });

//       return result.data?.trackStart;

//     } catch (error) {
//       console.error('Track start recording failed:', error);
//       // Don't break playback for analytics errors
//       return { ok: false, error: error.message };
//     }
//   };

//   return handleTrackStart;
// };




// // Usage in your player component
// export const usePlayerWithAnalytics = () => {
//   const player = useAudioPlayer();
//   const handleTrackStart = useTrackStart();

//   // Wrap the play function to include analytics
//   const playWithAnalytics = async (track) => {
//     const result = await player.play(track);
//     if (result && track) {
//       await handleTrackStart(track, player.playerState, 'play');
//     }
//     return result;
//   };

//   // Wrap skip function for analytics
//   const skipNextWithAnalytics = async () => {
//     await player.skipNext();
//     if (player.currentTrack) {
//       await handleTrackStart(player.currentTrack, player.playerState, 'skip');
//     }
//   };

//   return {
//     ...player,
//     play: playWithAnalytics,
//     skipNext: skipNextWithAnalytics
//   };
// };