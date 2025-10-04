// // // hooks/useTrackTelemetry.js
// // import * as React from 'react';
// // import { v4 as uuidv4 } from 'uuid';
// // import { useMutation } from '@apollo/client';
// // import { TRACK_START, TRACK_PROGRESS, TRACK_END, TRACK_COMPLETE, TRACK_SKIP,TRACK_AD_EVENT, TRACK_EN } from '../mutations';
// // import { useLocationOnce } from './useLocation';











// // export function useTrackTelemetry({ userId, userTier, audioRef }) {

// //     console.log('telemetry is being called ....')

// //   const [trackStart]    = useMutation(TRACK_START);
// //   const [trackProgress] = useMutation(TRACK_PROGRESS);
// //   const [trackEnd]      = useMutation(TRACK_END);

// //   const { get: getLocation } = useLocationOnce();

// //   const sessionIdRef = React.useRef(uuidv4());
// //   const hbRef = React.useRef(null);
// //   const hbTrackRef = React.useRef(null);


  

// //   const tier = React.useMemo(() => {
// //     const t = (userTier || '').toUpperCase();
// //     return t === 'PREMIUM' || t === 'FREE' || t === 'GUEST' ? t : 'FREE';
// //   }, [userTier]);

// //   const stopHeartbeat = React.useCallback(() => {
// //     if (hbRef.current) {
// //       clearInterval(hbRef.current);
// //       hbRef.current = null;
// //       hbTrackRef.current = null;
// //     }
// //   }, []);

// //   const startHeartbeat = React.useCallback((trackId) => {
// //     stopHeartbeat();
// //     if (!trackId) return;
// //     hbTrackRef.current = trackId;

// //     hbRef.current = setInterval(() => {
// //       const pos = Math.floor((audioRef.current?.currentTime ?? 0));
// //       trackProgress({
// //         variables: {
// //           input: {
// //             userId,
// //             sessionId: sessionIdRef.current,
// //             trackId,
// //             positionSec: pos,
// //             heartbeatSec: 15,
// //           },
// //         },
// //       }).catch(() => {});
// //     }, 15000);
// //   }, [audioRef, trackProgress, stopHeartbeat, userId]);

// //   const setPlaying = React.useCallback((isPlaying, trackId) => {
// //     if (isPlaying) startHeartbeat(trackId);
// //     else stopHeartbeat();
// //   }, [startHeartbeat, stopHeartbeat]);

// //   const beginTrack = React.useCallback(async ({ id, genre }) => {
// //     if (!id) return;

// //     // 1) get client location (cached), may be null
// //     const loc = await getLocation().catch(() => null);
// //     const geo = loc ? {
// //       country: loc.country || loc.countryCode || null,
// //       state:   loc.region || null,
// //       city:    loc.city   || null,
// //       latitude:  typeof loc.latitude  === 'number' ? loc.latitude  : null,
// //       longitude: typeof loc.longitude === 'number' ? loc.longitude : null,
// //       accuracyMeters: typeof loc.accuracyMeters === 'number' ? loc.accuracyMeters : null,
// //       source: loc.source || null
// //     } : null;

// //     // 2) send trackStart with geo (server falls back to GeoIP if null)
// //     try {
// //       await trackStart({
// //         variables: {
// //           input: {
// //             userId,
// //             sessionId: sessionIdRef.current,
// //             userTier: tier,
// //             device: 'web',
// //             trackId: id,
// //             trackGenre: genre || null,
// //             geo
// //           },
// //         },
// //       });
// //       if (process.env.NODE_ENV === 'development') {
// //         console.log('[telemetry] trackStart sent with geo:', geo);
// //       }
// //     } catch (e) {
// //       if (process.env.NODE_ENV === 'development') {
// //         console.warn('[telemetry] trackStart failed', e);
// //       }
// //     }
// //   }, [getLocation, trackStart, userId, tier]);

// //   const endTrack = React.useCallback(async ({ trackId, durationSec, listenedSec, finished }) => {
// //     if (!trackId) return;
// //     stopHeartbeat();
// //     try {
// //       await trackEnd({
// //         variables: {
// //           input: {
// //             userId,
// //             sessionId: sessionIdRef.current,
// //             trackId,
// //             durationSec: Math.floor(durationSec || 0),
// //             listenedSec: Math.floor(listenedSec || 0),
// //             finished: !!finished,
// //           },
// //         },
// //       });
// //       if (process.env.NODE_ENV === 'development') {
// //         console.log('[telemetry] trackEnd sent', { finished, listenedSec, durationSec });
// //       }
// //     } catch (e) {
// //       if (process.env.NODE_ENV === 'development') {
// //         console.warn('[telemetry] trackEnd failed', e);
// //       }
// //     }
// //   }, [stopHeartbeat, trackEnd, userId]);

// //   React.useEffect(() => stopHeartbeat, [stopHeartbeat]);

// //   return {
// //     sessionId: sessionIdRef.current,
// //     beginTrack,
// //     endTrack,
// //     setPlaying,
// //     stopHeartbeat
// //   };
// // }




// // src/lib/adEngineClient.js


// import { TRACK_START,
//   TRACK_COMPLETE,
//   TRACK_SKIP,
//   TRACK_AD_EVENT,
//   TRACK_END,
//   NEXT_SONG,} from '../mutations.js'
//   import { onTrackComplete } from '../../../../server/utils/AdEngine/telemetry/telemetryOps.js';


// // import { getClientGeo} from './useLocation.js'
// import { useLocationContext } from './useLocationContext.jsx';

// const sanitizeGeo = (g) =>
//   g ? { country: g.country ?? undefined, city: g.city ?? undefined } : undefined;

// const toGraphQLTier = (tier) => {
//   const t = String(tier || '').toLowerCase();
//   if (t === 'premium') return 'PREMIUM';
//   if (t === 'regular' || t === 'free' || t === 'basic') return 'FREE';
//   return 'GUEST';
// };

// const safeGqlError = (e) =>
//   e?.networkError?.result?.errors || e?.graphQLErrors || e?.message || e;



// /** Keep a 48h session id in localStorage */
// export const ensureSessionId = () => {
//   const KEY = 'afrofeel_session_v1';
//   const TTL = 'afrofeel_session_v1_ttl';
//   const now = Date.now();
//   const ttl = Number(localStorage.getItem(TTL) || 0);
//   let sid = localStorage.getItem(KEY);
//   if (!sid || now > ttl) {
//     sid = (crypto.randomUUID?.() ?? base64url(16));
//     localStorage.setItem(KEY, sid);
//     localStorage.setItem(TTL, String(now + 48 * 3600 * 1000));
//   }
//   return sid;
// };

// /** Base64URL random fallback when crypto.randomUUID is unavailable */
// const base64url = (bytes = 16) => {
//   const a = new Uint8Array(bytes);
//   crypto.getRandomValues(a);
//   return btoa(String.fromCharCode(...a))
//     .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
// };

// /** Per-event idempotency key */
// export const newEventId = () =>
//   crypto.randomUUID?.() ?? base64url(12);

// /** Choose best audio URL from creative */
// export function pickAdAudioUrl(creative = {}) {
//   return (
//     creative.streamingAudioAdUrl ||
//     creative.masterAudioAdUrl ||
//     creative.streamingFallbackAudioUrl ||
//     null
//   );
// }

// /**
//  * Factory: createAdEngineClient
//  * @param {import('@apollo/client').ApolloClient<any>} apollo
//  * @param {{ userId:string, userTier:'guest'|'regular'|'premium', device?:string, sessionId?:string }} opts
//  */
// export function createAdEngineClient(apollo, opts) {
//   const userId = opts.userId;
//   const userTier = opts.userTier;
//   const device = opts.device || 'web';
//   const sessionId = opts.sessionId || ensureSessionId();

//   /**
//    * trackStart: preview ad (no reserve on server).
//    * Pass geo explicitly, or set autoGeo=true to try navigator.geolocation and optionally reverse.
//    * @param {{trackId:string, trackGenre?:string, mood?:string, subMood?:string,
//    *          geo?:{country?:string, city?:string}, autoGeo?:boolean,
//    *          reverseGeo?: ({lat:number, lon:number})=>Promise<{country?:string, city?:string}|undefined>}} [p]
//    */
//   async function trackStart(p = {}) {
//     const { trackId, trackGenre, mood, subMood, geo, autoGeo = false, reverseGeo } = p;
//     const eventId = newEventId();

//     let finalGeo = geo;
//     if (!finalGeo && autoGeo) {
//       try { const { geo } = useLocationContext(); const finalGeo = geo } catch {}
//     }

//     try {

//   const { data } = await apollo.mutate({
//   mutation: TRACK_START,
//   variables: {
//     input: {
//       eventId,
//       userId,                       // ✅ keep the real id here
//       sessionId,
//       device,
//       userTier: toGraphQLTier(userTier), // ✅ map to enum here
//       trackId,
//       trackGenre,
//       mood,
//       subMood,
//       geo: sanitizeGeo(geo),   // only {country, city}
//     },
//   },
// }).catch((e) => {
//   console.warn('[TRACK_START] 400 details ->', safeGqlError(e));
//   throw e;
// });

//       const ad = data?.trackStart?.ad || null;
//       return { ok: true, ad, audioUrl: ad ? pickAdAudioUrl(ad.creative) : null };
//     } catch (e) {
//       console.warn('[trackStart] failed:', e);
//       return { ok: false, ad: null, audioUrl: null, error: e };
//     }
//   }

//   /** trackComplete: reserve ad on server */
// const trackComplete = async (_p, { input }, ctx) => {
//   try {
//     // Input validation
//     if (!input) {
//       throw new Error('Input is required');
//     }
    
//     if (!input.trackId) {
//       throw new Error('trackId is required');
//     }

//     // Deduplication check
//     if (input.eventId) {
//       const fresh = await markEventSeen(input.eventId);
//       if (!fresh) {
//         console.log('TrackComplete event deduplicated:', input.eventId);
//         return { ok: true, deduped: true, ad: null };
//       }
//     }

//     // Record the completion analytics
//     await onTrackComplete({
//       userId: input.userId,
//       sessionId: input.sessionId,
//       songId: input.trackId,
//       genre: input.trackGenre || '',
//       ms_listened: Math.max(0, Math.floor(input.ms_listened ?? 0))
//     });

//     // Get user profile for ad targeting
//     const profile = await getUserProfile(input.userId).catch(() => null);
//     const serverGeo = ctx?.req?.geo ?? {};
//     const country = profile?.country || serverGeo.country || '';
    
//     // Get user's top genres
//     const topGenres = await topGenresForUser(input.userId, 3).catch(() => []);

//     // Select appropriate ad - use input.subMoods (with 's')
//     const ad = await chooseAdForUser({
//       userId: input.userId,
//       role: profile?.role || 'regular',
//       country: country || 'US',
//       mood: input.mood || null,
//       subMood: input.subMoods || null, // Use subMoods from input
//       age: profile?.age,
//       topGenres: topGenres.length > 0 ? topGenres : ['pop']
//     }, { reserve: true }).catch(() => null);

//     // RETURN STRUCTURE THAT MATCHES GRAPHQL SCHEMA
//     return { 
//       ok: true, 
//       ad: ad ? {
//         adId: ad.adId,
//         campaignId: ad.campaignId,
//         creative: {
//           streamingOverlayAdUrl: ad.creative.imageUrl || '',
//           streamingFallbackAudioUrl: ad.creative.audioUrl || '',
//           streamingBannerAdUrl: ad.creative.imageUrl || '',
//           streamingAudioAdUrl: ad.creative.audioUrl || '',
//           adArtworkUrl: ad.creative.imageUrl || ''
//         }
//       } : null,
//       deduped: false
//     };

//   } catch (error) {
//     console.error('Error in trackComplete:', error);
//     return { 
//       ok: true, 
//       ad: null,
//       deduped: false
//     };
//   }
// };






//   /** trackSkip: reserve ad on server */
//   async function trackSkip({ trackId, trackGenre, mood, subMood } = {}) {
//     const eventId = newEventId();
//     try {
//       const { data } = await apollo.mutate({
//         mutation: TRACK_SKIP,
//         variables: {
//           input: {
//             eventId,
//             userId,
//             sessionId,
//             trackId,
//             trackGenre,
//             mood,
//             subMood,
//           },
//         },
//       });

//       const payload = data?.trackSkip;
//       const ad = payload?.ad || null;
//       return {
//         ok: !!payload?.ok,
//         deduped: !!payload?.deduped,
//         ad,
//         audioUrl: ad ? pickAdAudioUrl(ad.creative) : null,
//       };
//     } catch (e) {
//       console.warn('[trackSkip] failed:', e);
//       return { ok: false, deduped: false, ad: null, audioUrl: null, error: e };
//     }
//   }

//   /** trackAdEvent: fire-and-forget analytics */
//   async function trackAdEvent({ campaignId, adId, event, completed, clicked } = {}) {
//     try {
//       const { data } = await apollo.mutate({
//         mutation: TRACK_AD_EVENT,
//         variables: { input: { userId, campaignId, adId, event, completed, clicked } },
//       });
//       return { ok: !!data?.trackAdEvent?.ok };
//     } catch (e) {
//       console.warn('[trackAdEvent] failed:', e);
//       return { ok: false, error: e };
//     }
//   }

//   /** trackEnd: optional end marker */
//   async function trackEnd({ trackId, reason } = {}) {
//     try {
//       const { data } = await apollo.mutate({
//         mutation: TRACK_END,
//         variables: { input: { userId, sessionId, trackId, reason } },
//       });
//       return { ok: !!data?.trackEnd?.ok, now: data?.trackEnd?.now || null };
//     } catch (e) {
//       console.warn('[trackEnd] failed:', e);
//       return { ok: false, now: null, error: e };
//     }
//   }

//   /** ask server for next song id */
//   async function nextSongAfterComplete({ currentSongId }) {
//     try {
//       const { data } = await apollo.mutate({
//         mutation: NEXT_SONG,
//         variables: { input: { userId, currentSongId } },
//       });
//       return {
//         ok: !!data?.nextSongAfterComplete?.ok,
//         songId: data?.nextSongAfterComplete?.songId || null,
//       };
//     } catch (e) {
//       console.warn('[nextSongAfterComplete] failed:', e);
//       return { ok: false, songId: null, error: e };
//     }
//   }

//   return {
//     getSessionId: () => sessionId,
//     getUserId: () => userId,
//     getUserTier: () => userTier,
//     trackStart,
//     trackComplete,
//     trackSkip,
//     trackAdEvent,
//     trackEnd,
//     nextSongAfterComplete,
//   };
// }
