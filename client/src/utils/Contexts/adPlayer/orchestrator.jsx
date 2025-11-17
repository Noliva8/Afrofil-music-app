// import { useEffect, useRef, useCallback } from "react";
// import { useApolloClient } from "@apollo/client";
// import { PlayerManager } from "../playerManager";
// import { useAudioPlayer } from "../AudioPlayerContext";
// import { useAdAudio } from "./adPlayerProvider";
// import { useLocationContext } from "../useLocationContext";
// import {
//   createMusicPlayerAdapter,
//   createAdAdapterFactoryFromContext,
//   attachAudioProviderToManager,
//   primeManagerFromAudioContext,
// } from "../playerAdapters";
// import { useUser } from "../userContext";
// import UserAuth from "../../auth.js";

// export default function Orchestrator() {
//   const audio = useAudioPlayer();
//   const { adapter: adAdapter } = useAdAudio();
//   const { geo } = useLocationContext();
//   const userCtx = useUser();
//   const apollo = useApolloClient(); // same client as <ApolloProvider/>

//   const pmRef = useRef(null);             // PlayerManager instance
//   const tickIntervalRef = useRef(null);   // telemetry/tick timer
//   const lastTrackIdRef = useRef(null);    // last track seen by PM
//   const playingRef = useRef(false);       // last play/pause state
//   const initializationRef = useRef(false); // guard double init

//   // ---------- LOGGING ----------
//   const log = useCallback((level, message, data = null) => {
//     const timestamp = new Date().toISOString().substring(11, 19);
//     const prefix = `[${timestamp} 🎛️]`;
//     if (data) console[level](prefix, message, data);
//     else console[level](prefix, message);
//   }, []);

//   // ---------- IDENTITY ----------
//   const getUserIdentity = useCallback(() => {
//     const profile = UserAuth.getProfile?.()?.data;
//     const userId = profile?._id;

//     let userType = "guest";
//     let finalUserId = null;

//     if (userCtx?.isPremium) {
//       userType = "premium";
//       finalUserId = userId || null;
//     } else if (userId) {
//       userType = "regular";
//       finalUserId = userId;
//     } else if (userCtx?.isUser) {
//       userType = "regular";
//       finalUserId = userId || null;
//     }

//     log("info", "Determined user identity:", {
//       userType,
//       userId: finalUserId,
//       reasoning: userCtx?.isPremium
//         ? "premium flag"
//         : userId
//         ? "has user ID"
//         : userCtx?.isUser
//         ? "isUser flag"
//         : "guest",
//     });

//     return { userType, userId: finalUserId };
//   }, [userCtx, log]);

//   // ============================================================
//   //  INIT: CREATE PLAYER MANAGER + WIRE AD EVENTS + TICK BRIDGE
//   // ============================================================
//   useEffect(() => {
//     const hasPm = !!pmRef.current;
//     const hasAudio = !!audio;
//     const hasAdAdapter = !!adAdapter;
//     log("info", "=== ORCHESTRATOR INIT EFFECT RUN ===", {
//       hasAudio,
//       hasAdAdapter,
//       hasPm,
//     });

//     // Single-instance guard – if PM already exists, don't rebuild it
//     if (initializationRef.current || hasPm) {
//       log("info", "PlayerManager already exists, skipping init");
//       return;
//     }

//     if (!hasAudio) {
//       log("error", "Missing audio context in Orchestrator – cannot init PM");
//       return;
//     }

//     if (!hasAdAdapter) {
//       log(
//         "warn",
//         "Missing ad adapter in Orchestrator – PM will be created without ads"
//       );
//     } else {
//       // Hand Apollo Client to ad adapter once
//       try {
//         adAdapter?.setApolloClient?.(apollo);
//         log("info", "🔗 Apollo Client set on ad adapter");
//       } catch (e) {
//         log("error", "Failed to set Apollo Client on ad adapter", e);
//       }
//     }

//     let pm = null;

//     try {
//       // 1) Build music adapter
//       const musicAdapter = createMusicPlayerAdapter(audio);
//       if (!musicAdapter.isValid?.()) {
//         throw new Error("Music adapter is invalid");
//       }

//       // 2) Build ad adapter factory (wraps context adapter)
//       const adFactory = adAdapter
//         ? createAdAdapterFactoryFromContext({ adapter: adAdapter })
//         : null;

//       // 3) Create PlayerManager
//       const config = {
//         policy: { preroll: false, midroll: true, postroll: false },
//         midrollDelayMs: 10000,
//         autoResume: true,
//       };

//       log("info", "Creating PlayerManager with config:", config);
//       pm = new PlayerManager(musicAdapter, adFactory, config);
//       pmRef.current = pm;
//       initializationRef.current = true;

//       // 4) Identity + prime initial track/location
//       const identity = getUserIdentity();
//       attachAudioProviderToManager(pm, identity, audio);
//       primeManagerFromAudioContext(pm, audio, geo);

//       // 5) DEV: test mode
//       if (process.env.NODE_ENV === "development") {
//         pm.enableTestMode({ everyNSongs: 1 });
//         pm.setPolicy({ preroll: false, midroll: true });
//         pm.setMidrollDelay(10000);
//       }

//       // 6) Wire AD EVENTS → pause/resume content correctly
//       pm.events.onAdStart.add(async ({ adType, context }) => {
//         log("info", `🎬 AD START → ${adType}`, {
//           genre: context.genre,
//           location: context.location?.country,
//           engagement: context.engagement?.toFixed?.(2),
//         });

//         // 🔇 PAUSE CONTENT AUDIO WHEN AD STARTS
//         try {
//           if (audio?.pause) {
//             // false = system pause (not manual)
//             await audio.pause(false);
//             log("debug", "⏸️ Content paused for ad");
//           }
//         } catch (err) {
//           log("error", "Failed to pause content for ad", err);
//         }
//       });

//       pm.events.onAdComplete.add(async () => {
//         log("info", "✅ AD COMPLETE");

//         // ▶️ RESUME CONTENT AUDIO AFTER AD (only if user didn't manually pause)
//         try {
//           const st = audio?.playerState;
//           const manuallyPaused = st?.manualPause || false;

//           if (audio?.play && !manuallyPaused) {
//             await audio.play();
//             log("debug", "▶️ Content resumed after ad");
//           } else {
//             log(
//               "debug",
//               "Skipping auto-resume after ad (manual pause or no audio)"
//             );
//           }
//         } catch (err) {
//           log("error", "Failed to resume content after ad", err);
//         }
//       });

//       pm.events.onAdError.add(async ({ error, consecutiveErrors }) => {
//         log(
//           "error",
//           `❌ AD ERROR (${consecutiveErrors} consecutive)`,
//           error
//         );
//         // On ad error, we also resume content if it wasn't manually paused
//         try {
//           const st = audio?.playerState;
//           const manuallyPaused = st?.manualPause || false;

//           if (audio?.play && !manuallyPaused) {
//             await audio.play();
//             log("debug", "▶️ Content resumed after ad error");
//           } else {
//             log(
//               "debug",
//               "Skipping auto-resume after ad error (manual pause or no audio)"
//             );
//           }
//         } catch (err) {
//           log("error", "Failed to resume content after ad error", err);
//         }
//       });

//       pm.events.onAdBlocked.add(({ reason }) =>
//         log("info", `🔕 AD BLOCKED - ${reason}`)
//       );

//       pm.events.onContentInterrupted.add(({ position, adType }) =>
//         log(
//           "info",
//           `⏸️ CONTENT PAUSED for ${adType} at ${position.toFixed(1)}s`
//         )
//       );
//       pm.events.onContentResumed.add(({ position }) =>
//         log("info", `▶️ CONTENT RESUMED at ${position.toFixed(1)}s`)
//       );

//       pm.events.onAdDecision.add(({ adType, decisionFactors, context }) =>
//         log("info", `📊 AD DECISION: ${adType}`, {
//           engagement: decisionFactors.engagement?.toFixed?.(2),
//           genre: decisionFactors.genre,
//           location: decisionFactors.location?.country,
//           songsPlayed: context.songsPlayed,
//         })
//       );

//       // 7) AUDIO → PM TICK BRIDGE (track start + play/pause + telemetry)
//       log("info", "🎚️ Starting audio → PM tick bridge");
//       tickIntervalRef.current = setInterval(() => {
//         const st = audio?.playerState;
//         if (!st || !pmRef.current) return;

//         const currentId = st.currentTrack?.id || st.currentTrack?._id || null;

//         // TRACK START
//         if (currentId && currentId !== lastTrackIdRef.current) {
//           lastTrackIdRef.current = currentId;

//           const meta = {
//             id: currentId,
//             title: st.currentTrack?.title,
//             genre: st.currentTrack?.genre,
//             duration: st.currentTrack?.duration,
//             artist: st.currentTrack?.artist,
//           };

//           log("info", "🎵 TRACK START", {
//             title: meta.title,
//             genre: meta.genre,
//             duration: meta.duration,
//           });

//           try {
//             pmRef.current.onTrackStart(meta);
//           } catch (err) {
//             log("error", "Failed to notify track start", err);
//           }
//         }

//         // PLAY / PAUSE
//         const isNowPlaying = !!st.isPlaying;
//         if (isNowPlaying !== playingRef.current) {
//           playingRef.current = isNowPlaying;
//           try {
//             if (isNowPlaying) {
//               pmRef.current.onPlay();
//               log("debug", "▶️ Play state detected");
//             } else {
//               pmRef.current.onPause();
//               log("debug", "⏸️ Pause state detected");
//             }
//           } catch (err) {
//             log("error", "Failed to notify play state change", err);
//           }
//         }

//         // TELEMETRY TICK
//         try {
//           pmRef.current.updatePlaybackTick?.({
//             t: st.currentTime || 0,
//             d: st.duration || 0,
//             vol: st.volume ?? 1,
//             muted: !!st.muted,
//             buffering: !!st.buffering,
//             readyState: st.readyState || 0,
//             trackId: currentId,
//           });
//         } catch {
//           // swallow telemetry errors
//         }
//       }, 250);

//       log("info", "✅ ORCHESTRATOR READY");
//     } catch (error) {
//       log("error", "❌ ORCHESTRATOR INITIALIZATION FAILED", error);
//       initializationRef.current = false;
//       if (pm) {
//         try {
//           pm.destroy();
//         } catch (e) {
//           log("error", "Error during PM destroy after init failure", e);
//         }
//         pmRef.current = null;
//       }
//     }

//     // CLEANUP ON UNMOUNT ONLY
//     return () => {
//       log("info", "🧹 ORCHESTRATOR CLEANUP STARTED");
//       if (tickIntervalRef.current) {
//         clearInterval(tickIntervalRef.current);
//         tickIntervalRef.current = null;
//         log("info", "🧹 Stopped audio → PM tick bridge");
//       }
//       if (pmRef.current) {
//         try {
//           pmRef.current.destroy();
//           log("info", "🧹 PlayerManager destroyed");
//         } catch (e) {
//           log("error", "Error during PlayerManager destruction", e);
//         }
//         pmRef.current = null;
//       }
//       lastTrackIdRef.current = null;
//       playingRef.current = false;
//       initializationRef.current = false;
//       log("info", "✅ ORCHESTRATOR CLEANUP COMPLETED");
//     };
//     // ⛔ Intentionally NOT adding audio/adAdapter/apollo to deps to avoid
//     //    destroy/recreate loops; Orchestrator is global & mounted once.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ==============================
//   //  RUNTIME: USER IDENTITY UPDATES
//   // ==============================
//   useEffect(() => {
//     if (!pmRef.current || !userCtx) return;
//     try {
//       const identity = getUserIdentity();
//       pmRef.current.setIdentity(identity);
//       log("info", "👤 User identity updated", identity);
//       if (identity.userType === "guest" && identity.userId) {
//         log("warn", "INCONSISTENT STATE: Guest user has ID", identity);
//       }
//     } catch (error) {
//       log("error", "Failed to update user identity", error);
//     }
//   }, [userCtx, getUserIdentity, log]);

//   // ==============================
//   //  RUNTIME: LOCATION UPDATES
//   // ==============================
//   useEffect(() => {
//     if (!pmRef.current || !geo) return;
//     try {
//       pmRef.current.setLocation(geo);
//       log("debug", "📍 Location updated", {
//         country: geo.country,
//         state: geo.region,
//         city: geo.city,
//       });
//     } catch (error) {
//       log("error", "Failed to update location", error);
//     }
//   }, [geo, log]);

//   // ==============================
//   //  DEV: EXPOSE PM ON WINDOW
//   // ==============================
//   useEffect(() => {
//     if (process.env.NODE_ENV === "development" && pmRef.current) {
//       window.__playerManager = pmRef.current;
//       log("info", "🔧 PlayerManager exposed to window.__playerManager");
//       return () => {
//         delete window.__playerManager;
//       };
//     }
//   }, [log]);

//   // ==============================
//   //  DEV: OPTIONAL DIRECT-PLAY TEST
//   // ==============================
//   useEffect(() => {
//     if (process.env.NODE_ENV !== "development") return;
//     if (!pmRef.current || !adAdapter) return;

//     console.log("🔧 ADAPTER DEBUG:", {
//       hasAdapter: !!adAdapter,
//       hasPlayAd: typeof adAdapter.playAd === "function",
//       adapterType: adAdapter.constructor?.name || "object",
//     });

//     const testAdPlayback = setTimeout(() => {
//       const pm = pmRef.current;
//       if (pm) {
//         console.log("🧪 TEST: Attempting to play ad directly...");
//         const state = pm.getState();
//         const report = pm.getUserBehaviorReport();
//         console.log("📊 CURRENT STATE:", {
//           owner: state.owner,
//           songsPlayed: report?.engagement?.songsPlayed,
//           userType: state.identity.userType,
//           isAdBlocked: state.isAdBlocked,
//         });
//         pm
//           .playAd("midroll", pm.getAdContext())
//           .then(() => console.log("✅ TEST: Direct ad play succeeded"))
//           .catch((err) =>
//             console.log(
//               "❌ TEST: Direct ad play failed:",
//               err?.message || err
//             )
//           );
//       }
//     }, 15000);

//     return () => clearTimeout(testAdPlayback);
//   }, [adAdapter]);

//   return null;
// }


// import { useEffect, useRef, useCallback } from "react";
// import { useApolloClient } from "@apollo/client";
// import { PlayerManager } from "../playerManager";
// import { useAudioPlayer } from "../AudioPlayerContext";
// import { useAdAudio } from "./adPlayerProvider";
// import { useLocationContext } from "../useLocationContext";
// import {
//   createMusicPlayerAdapter,
//   createAdAdapterFactoryFromContext,
//   attachAudioProviderToManager,
//   primeManagerFromAudioContext,
// } from "../playerAdapters";
// import { useUser } from "../userContext";
// import UserAuth from "../../auth.js";

// export default function Orchestrator() {
//   const audio = useAudioPlayer();
//   const { adapter: adAdapter } = useAdAudio();
//   const { geo } = useLocationContext();
//   const userCtx = useUser();
//   const apollo = useApolloClient();

//   // =====================================================
//   // NUCLEAR STABILITY - Prevent all re-renders
//   // =====================================================
  
//   // Core refs - never change
//   const pmRef = useRef(null);
//   const tickIntervalRef = useRef(null);
//   const initializationRef = useRef(false);
  
//   // Audio instance lock - capture once and never change
//   const audioInstanceRef = useRef(null);
//   if (!audioInstanceRef.current && audio) {
//     audioInstanceRef.current = audio;
//     console.log("🔒 LOCKED audio instance");
//   }
  
//   // Adapter instance lock  
//   const adAdapterRef = useRef(null);
//   if (!adAdapterRef.current && adAdapter) {
//     adAdapterRef.current = adAdapter;
//     console.log("🔒 LOCKED ad adapter instance");
//   }

//   // State tracking (internal to tick bridge)
//   const stateRef = useRef({
//     lastTrackId: null,
//     playing: false,
//     audioStateSnapshot: null
//   });

//   // ---------- logging helper ----------
//   const log = useCallback((level, message, data = null) => {
//     const timestamp = new Date().toISOString().substring(11, 19);
//     const prefix = `[${timestamp} 🎛️]`;
//     if (data) console[level](prefix, message, data);
//     else console[level](prefix, message);
//   }, []);

//   // ---------- user identity helper ----------
//   const getUserIdentity = useCallback(() => {
//     const profile = UserAuth.getProfile?.()?.data;
//     const userId = profile?._id;

//     let userType = "guest";
//     let finalUserId = null;

//     if (userCtx?.isPremium) {
//       userType = "premium";
//       finalUserId = userId || null;
//     } else if (userId) {
//       userType = "regular";
//       finalUserId = userId;
//     } else if (userCtx?.isUser) {
//       userType = "regular";
//       finalUserId = userId || null;
//     }

//     return { userType, userId: finalUserId };
//   }, [userCtx]);

//   // =====================================================
//   // 1) ONE-TIME INITIALIZATION (RUNS ONCE)
//   // =====================================================
//   useEffect(() => {
//     const hasAudio = !!audioInstanceRef.current;
//     const hasAdAdapter = !!adAdapterRef.current;
//     const alreadyInit = !!pmRef.current;

//     log("info", "=== ORCHESTRATOR NUCLEAR INIT ===", {
//       hasAudio,
//       hasAdAdapter,
//       hasPm: alreadyInit,
//     });

//     if (initializationRef.current || alreadyInit) {
//       log("info", "PlayerManager already initialized, skipping init");
//       return;
//     }

//     if (!hasAudio) {
//       log("error", "Missing audio context");
//       return;
//     }

//     let pm = null;

//     try {
//       // 1) Build music adapter from locked audio instance
//       const musicAdapter = createMusicPlayerAdapter(audioInstanceRef.current);
//       if (!musicAdapter.isValid?.()) {
//         throw new Error("Music adapter is invalid");
//       }

//       // 2) Ad factory from locked adapter
//       const adFactory = createAdAdapterFactoryFromContext({ adapter: adAdapterRef.current });

//       // 3) Create PlayerManager
//       const config = {
//         policy: { preroll: false, midroll: true, postroll: false },
//         midrollDelayMs: 10000,
//         autoResume: true,
//       };

//       log("info", "Creating PlayerManager with config:", config);
//       pm = new PlayerManager(musicAdapter, adFactory, config);
//       pmRef.current = pm;
//       initializationRef.current = true;

//       // 4) Enable test mode
//       if (process.env.NODE_ENV === "development") {
//         pm.enableTestMode({ everyNSongs: 2 });
//         log("info", "🧪 Test mode enabled - ads every 2 songs");
//       }

//       // 5) Identity + prime
//       const identity = getUserIdentity();
//       attachAudioProviderToManager(pm, identity, audioInstanceRef.current);
//       primeManagerFromAudioContext(pm, audioInstanceRef.current, geo);

//       // 6) Hand Apollo Client to ad adapter
//       try {
//         adAdapterRef.current?.setApolloClient?.(apollo);
//         log("info", "🔗 Apollo Client set on ad adapter");
//       } catch (e) {
//         log("error", "Failed to set Apollo Client on ad adapter", e);
//       }

//       // 7) Hook PM events
//       pm.events.onAdStart.add(({ adType, context }) => {
//         log("info", `🎬 AD START → ${adType}`, {
//           genre: context.genre,
//           location: context.location?.country,
//           engagement: context.engagement?.toFixed?.(2),
//         });
//       });

//       pm.events.onAdComplete.add(() => log("info", "✅ AD COMPLETE"));
//       pm.events.onAdError.add(({ error, consecutiveErrors }) =>
//         log("error", `❌ AD ERROR (${consecutiveErrors} consecutive)`, error)
//       );
//       pm.events.onAdBlocked.add(({ reason }) =>
//         log("info", `🔕 AD BLOCKED - ${reason}`)
//       );
//       pm.events.onContentInterrupted.add(({ position, adType }) =>
//         log("info", `⏸️ CONTENT PAUSED for ${adType} at ${position.toFixed(1)}s`)
//       );
//       pm.events.onContentResumed.add(({ position }) =>
//         log("info", `▶️ CONTENT RESUMED at ${position.toFixed(1)}s`)
//       );
//       pm.events.onAdDecision.add(({ adType, decisionFactors, context }) =>
//         log("info", `📊 AD DECISION: ${adType}`, {
//           engagement: decisionFactors.engagement?.toFixed?.(2),
//           genre: decisionFactors.genre,
//           location: decisionFactors.location?.country,
//           songsPlayed: context.songsPlayed,
//         })
//       );

//       // 8) Expose PM in dev
//       if (process.env.NODE_ENV === "development") {
//         window.__playerManager = pm;
//         log("info", "🔧 PlayerManager exposed to window.__playerManager");
//       }

//       log("info", "✅ ORCHESTRATOR READY - NUCLEAR INIT COMPLETE");

//     } catch (error) {
//       log("error", "❌ ORCHESTRATOR INITIALIZATION FAILED", error);
//       initializationRef.current = false;
//       if (pm) {
//         try {
//           pm.destroy();
//         } catch {}
//         pmRef.current = null;
//       }
//     }

//     // Cleanup ONLY on unmount
//     return () => {
//       log("info", "🧹 ORCHESTRATOR NUCLEAR CLEANUP");
//       if (tickIntervalRef.current) {
//         clearInterval(tickIntervalRef.current);
//         tickIntervalRef.current = null;
//       }
//       if (pmRef.current) {
//         try {
//           pmRef.current.destroy();
//         } catch (e) {
//           log("error", "Error during PlayerManager destruction", e);
//         }
//         pmRef.current = null;
//       }
//       initializationRef.current = false;
//       if (process.env.NODE_ENV === "development") {
//         delete window.__playerManager;
//       }
//     };
//   }, []); // EMPTY DEPS - runs once

//   // =====================================================
//   // 2) NUCLEAR TICK BRIDGE (NO DEPENDENCIES)
//   // =====================================================
//   useEffect(() => {
//     const pm = pmRef.current;
//     const audioInstance = audioInstanceRef.current;
    
//     if (!pm || !audioInstance) {
//       log("warn", "Nuclear tick bridge not started: missing pm or audio");
//       return;
//     }

//     log("info", "🎚️ Starting NUCLEAR audio → PM tick bridge");

//     let isRunning = true;
//     let tickCount = 0;

//     const processTick = () => {
//       if (!isRunning || !pmRef.current) return;
      
//       tickCount++;

//       try {
//         const st = audioInstance.playerState;
//         if (!st) {
//           if (tickCount % 40 === 0) {
//             console.log("🔍 NUCLEAR TICK: No playerState");
//           }
//           return;
//         }

//         const currentId = st.currentTrack?.id || st.currentTrack?._id || null;
//         const isNowPlaying = !!st.isPlaying;

//         // Track change detection
//         if (currentId && currentId !== stateRef.current.lastTrackId) {
//           stateRef.current.lastTrackId = currentId;

//           const meta = {
//             id: currentId,
//             title: st.currentTrack?.title,
//             genre: st.currentTrack?.genre || 'unknown',
//             duration: st.currentTrack?.duration,
//             artist: st.currentTrack?.artist,
//           };

//           log("info", "🎵 TRACK START", {
//             title: meta.title,
//             genre: meta.genre,
//             duration: meta.duration,
//           });

//           try {
//             pmRef.current.onTrackStart(meta);
//           } catch (err) {
//             log("error", "Failed to notify track start", err);
//           }
//         }

//         // Play/pause detection
//         if (isNowPlaying !== stateRef.current.playing) {
//           stateRef.current.playing = isNowPlaying;

//           try {
//             if (isNowPlaying) {
//               pmRef.current.onPlay();
//               log("debug", "▶️ Play state detected");
//             } else {
//               pmRef.current.onPause();
//               log("debug", "⏸️ Pause state detected");
//             }
//           } catch (err) {
//             log("error", "Failed to notify play state change", err);
//           }
//         }

//         // Telemetry tick
//         try {
//           pmRef.current.updatePlaybackTick?.({
//             t: st.currentTime || 0,
//             d: st.duration || 0,
//             vol: st.volume ?? 1,
//             muted: !!st.muted,
//             buffering: !!st.buffering,
//             readyState: st.readyState || 0,
//             trackId: currentId,
//           });
//         } catch {
//           // Silent fail
//         }

//       } catch (error) {
//         if (tickCount % 20 === 0) {
//           console.warn("Nuclear tick error:", error);
//         }
//       }
//     };

//     // Start the interval
//     const intervalId = setInterval(processTick, 500);
//     tickIntervalRef.current = intervalId;

//     log("info", "✅ Nuclear tick bridge started");

//     return () => {
//       log("info", "🧹 Stopping NUCLEAR audio → PM tick bridge");
//       isRunning = false;
//       clearInterval(intervalId);
//       tickIntervalRef.current = null;
//     };
//   }, []); // NO DEPENDENCIES - uses refs only

//   // =====================================================
//   // 3) RUNTIME UPDATES (Separate from core logic)
//   // =====================================================
  
//   // User identity updates
//   useEffect(() => {
//     const pm = pmRef.current;
//     if (!pm || !userCtx) return;
    
//     try {
//       const identity = getUserIdentity();
//       pm.setIdentity(identity);
//       log("info", "👤 User identity updated", identity);
//     } catch (error) {
//       log("error", "Failed to update user identity", error);
//     }
//   }, [userCtx, getUserIdentity, log]);

//   // Location updates
//   useEffect(() => {
//     const pm = pmRef.current;
//     if (!pm || !geo) return;
    
//     try {
//       pm.setLocation(geo);
//       log("debug", "📍 Location updated", { country: geo.country });
//     } catch (error) {
//       log("error", "Failed to update location", error);
//     }
//   }, [geo, log]);

//   // Apollo Client setup
//   useEffect(() => {
//     const adapter = adAdapterRef.current;
//     if (!adapter || !apollo) return;
    
//     try {
//       adapter.setApolloClient?.(apollo);
//       log("info", "🔗 Apollo Client set on ad adapter");
//     } catch (e) {
//       log("error", "Failed to set Apollo Client on ad adapter", e);
//     }
//   }, [apollo, log]);

//   // =====================================================
//   // 4) HEALTH MONITORING
//   // =====================================================
//   useEffect(() => {
//     if (process.env.NODE_ENV === "development") {
//       const interval = setInterval(() => {
//         const pm = pmRef.current;
//         if (pm && !pm._isDestroyed) {
//           const state = pm.getState?.();
//           const report = pm.getUserBehaviorReport?.();
          
//           console.log("🏥 NUCLEAR ORCHESTRATOR STATUS", {
//             // PM Status
//             exists: !!pm,
//             isDestroyed: pm._isDestroyed,
//             owner: pm.owner,
            
//             // Playback State
//             currentTrack: state?.currentTrack?.title || state?.currentTrack?.id,
//             songsPlayed: report?.engagement?.songsPlayed ?? pm.state?.userBehavior?.songsPlayed,
//             totalPlayTime: report?.session?.totalPlayTime,
            
//             // Orchestrator State
//             hasTickInterval: !!tickIntervalRef.current,
//             initializationStatus: initializationRef.current,
//             lastTrackId: stateRef.current.lastTrackId,
            
//             // Identity
//             userType: pm.identity?.userType,
//             isAdBlocked: pm.state?.isAdBlocked,
//           });
//         }
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, []);

//   return null;
// }



import { useEffect, useRef, useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { PlayerManager } from "../playerManager";
import { useAudioPlayer } from "../AudioPlayerContext";
import { useAdAudio } from "./adPlayerProvider";
import { useLocationContext } from "../useLocationContext";
import {
  createMusicPlayerAdapter,
  createAdAdapterFactoryFromContext,
  attachAudioProviderToManager,
  primeManagerFromAudioContext,
} from "../playerAdapters";
import { useUser } from "../userContext";
import UserAuth from "../../auth.js";

export default function Orchestrator() {
  const audio = useAudioPlayer();
  const { adapter: adAdapter } = useAdAudio();
  const { geo } = useLocationContext();
  const userCtx = useUser();
  const apollo = useApolloClient();

  const pmRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const lastTrackIdRef = useRef(null);
  const playingRef = useRef(false);

  // NEW: stable refs to avoid re-running effects endlessly
  const audioRef = useRef(audio);
  const adAdapterRef = useRef(adAdapter);

  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);

  useEffect(() => {
    adAdapterRef.current = adAdapter;
  }, [adAdapter]);

  // ---------- logging helper ----------
  const log = useCallback((level, message, data = null) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp} 🎛️]`;
    if (data) console[level](prefix, message, data);
    else console[level](prefix, message);
  }, []);

  // ---------- user identity helper ----------
  const getUserIdentity = useCallback(() => {
    const profile = UserAuth.getProfile?.()?.data;
    const userId = profile?._id;

    let userType = "guest";
    let finalUserId = null;

    if (userCtx?.isPremium) {
      userType = "premium";
      finalUserId = userId || null;
    } else if (userId) {
      userType = "regular";
      finalUserId = userId;
    } else if (userCtx?.isUser) {
      userType = "regular";
      finalUserId = userId || null;
    }

    log("info", "Determined user identity:", {
      userType,
      userId: finalUserId,
      reasoning: userCtx?.isPremium
        ? "premium flag"
        : userId
        ? "has user ID"
        : userCtx?.isUser
        ? "isUser flag"
        : "guest",
    });

    return { userType, userId: finalUserId };
  }, [userCtx, log]);

  // =====================================================
  // 1) ONE-TIME INITIALIZATION OF PLAYER MANAGER
  // =====================================================
  useEffect(() => {
    const hasAudio = !!audioRef.current;
    const hasAdAdapter = !!adAdapterRef.current;
    const alreadyInit = !!pmRef.current;

    log("info", "=== ORCHESTRATOR INIT EFFECT RUN ===", {
      hasAudio,
      hasAdAdapter,
      hasPm: alreadyInit,
    });

    if (!hasAudio) {
      log("error", "Missing audio context");
      return;
    }

    // Do NOT recreate PlayerManager if it already exists
    if (alreadyInit) {
      log("info", "PlayerManager already exists, skipping init");
      return;
    }

    let pm = null;

    try {
      // 1) Build music adapter from AudioPlayerContext
      const musicAdapter = createMusicPlayerAdapter(audioRef.current);
      if (!musicAdapter.isValid?.()) {
        throw new Error("Music adapter is invalid");
      }

      // 2) Ad factory from context (may be null → ads disabled)
      const adFactory = createAdAdapterFactoryFromContext({
        adapter: adAdapterRef.current,
      });

      // 3) Create PlayerManager with REAL policy (no test mode here)
      const config = {
        policy: { preroll: false, midroll: true, postroll: false },
        midrollDelayMs: 10000, // 10s into the song for midroll check
        autoResume: true,
      };

      log("info", "Creating PlayerManager with config:", config);
      pm = new PlayerManager(musicAdapter, adFactory, config);
      pmRef.current = pm;

      // 4) Identity + audio attach + prime with geo
      const identity = getUserIdentity();
      attachAudioProviderToManager(pm, identity, audioRef.current);
      if (geo) {
        pm.setLocation(geo);
      }
      primeManagerFromAudioContext(pm, audioRef.current, geo);

      // 5) Hand Apollo Client to ad adapter (once PM is created)
      try {
        adAdapterRef.current?.setApolloClient?.(apollo);
        log("info", "🔗 Apollo Client set on ad adapter");
      } catch (e) {
        log("error", "Failed to set Apollo Client on ad adapter", e);
      }

      // 6) Hook PM events → logs only
      pm.events.onAdStart.add(({ adType, context }) => {
        log("info", `🎬 AD START → ${adType}`, {
          genre: context.genre,
          location: context.location?.country,
          engagement: context.engagement?.toFixed?.(2),
        });
      });

      pm.events.onAdComplete.add(() => log("info", "✅ AD COMPLETE"));

      pm.events.onAdError.add(({ error, consecutiveErrors }) =>
        log(
          "error",
          `❌ AD ERROR (${consecutiveErrors} consecutive)`,
          error
        )
      );

      pm.events.onAdBlocked.add(({ reason }) =>
        log("info", `🔕 AD BLOCKED - ${reason}`)
      );

      pm.events.onContentInterrupted.add(({ position, adType }) =>
        log(
          "info",
          `⏸️ CONTENT PAUSED for ${adType} at ${position.toFixed(1)}s`
        )
      );

      pm.events.onContentResumed.add(({ position }) =>
        log("info", `▶️ CONTENT RESUMED at ${position.toFixed(1)}s`)
      );

      pm.events.onAdDecision.add(({ adType, decisionFactors, context }) =>
        log("info", `📊 AD DECISION: ${adType}`, {
          engagement: decisionFactors.engagement?.toFixed?.(2),
          genre: decisionFactors.genre,
          location: decisionFactors.location?.country,
          songsPlayed: context.songsPlayed,
        })
      );

      // 7) Expose PM in dev for debugging
      if (process.env.NODE_ENV === "development") {
        window.__playerManager = pm;
        log("info", "🔧 PlayerManager exposed to window.__playerManager");
      }

      log("info", "✅ ORCHESTRATOR READY");
    } catch (error) {
      log("error", "❌ ORCHESTRATOR INITIALIZATION FAILED", error);
      if (pm) {
        try {
          pm.destroy();
        } catch {
          // ignore
        }
        pmRef.current = null;
      }
    }

    // Cleanup ONLY on unmount
    return () => {
      log("info", "🧹 ORCHESTRATOR CLEANUP STARTED");
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      if (pmRef.current) {
        try {
          pmRef.current.destroy();
        } catch (e) {
          log("error", "Error during PlayerManager destruction", e);
        }
        pmRef.current = null;
      }
      lastTrackIdRef.current = null;
      playingRef.current = false;
      if (process.env.NODE_ENV === "development") {
        delete window.__playerManager;
      }
      log("info", "✅ ORCHESTRATOR CLEANUP COMPLETED");
    };
  }, [apollo, geo, getUserIdentity, log]);
  // ^ audio/adAdapter are read via refs so this runs once per mount

  // =====================================================
  // 2) RUNTIME: USER IDENTITY UPDATES
  // =====================================================
  useEffect(() => {
    const pm = pmRef.current;
    if (!pm || !userCtx) return;
    try {
      const identity = getUserIdentity();
      pm.setIdentity(identity);
      log("info", "👤 User identity updated", identity);
    } catch (error) {
      log("error", "Failed to update user identity", error);
    }
  }, [userCtx, getUserIdentity, log]);

  // =====================================================
  // 3) RUNTIME: LOCATION UPDATES
  // =====================================================
  useEffect(() => {
    const pm = pmRef.current;
    if (!pm || !geo) return;
    try {
      pm.setLocation(geo);
      log("info", "📍 Location updated", { country: geo.country });
    } catch (error) {
      log("error", "Failed to update location", error);
    }
  }, [geo, log]);


  // =====================================================
  // 4) STABLE TICK BRIDGE (AUDIO → PLAYER MANAGER)
  //    - runs once, uses refs to always see latest audio/PM
  //    - detects track changes
  //    - detects play/pause (robust)
  //    - streams position/volume/buffering every 250ms
  // =====================================================
 // =====================================================
// 4) STABLE TICK BRIDGE (AUDIO → PLAYER MANAGER) - DEBUG VERSION
// =====================================================
  // =====================================================
  // 4) SIMPLE DEBUG TICK BRIDGE (AUDIO → PLAYER MANAGER)
  //    - verifies the bridge is running
  //    - detects track END and calls pm.onTrackEnd()
  // =====================================================
// =====================================================
// 4) STABLE TICK BRIDGE (AUDIO → PLAYER MANAGER)
// =====================================================
useEffect(() => {
  console.log("[ORCH] 🎚️ BRIDGE EFFECT MOUNTED");

  let lastTrackId = null;
  let lastEndedFlag = false;
  let trackStartTimeout = null;
  let tickCount = 0;

  const intervalId = setInterval(() => {
    tickCount++;
    const pm = pmRef.current;
    const audioCtx = audioRef.current;

    // Log every 10 ticks to avoid spam
    if (tickCount % 10 === 0) {
      console.log("[ORCH] Tick bridge running - tick #" + tickCount);
    }

    // 1) Check PM + audioCtx presence
    if (!pm || !audioCtx) {
      if (tickCount % 20 === 0) {
        console.log("[ORCH] Tick: missing pm or audioCtx", {
          hasPm: !!pm,
          hasAudioCtx: !!audioCtx,
        });
      }
      return;
    }

    const st = audioCtx.playerState;

    if (!st) {
      if (tickCount % 20 === 0) {
        console.log("[ORCH] Tick: audioCtx.playerState is null/undefined", {
          audioKeys: Object.keys(audioCtx),
        });
      }
      return;
    }

    const currentId = st.currentTrack?.id || st.currentTrack?._id || null;

    // 2) Log a small snapshot so we see what shape playerState has
    if (tickCount % 10 === 0) {
      console.log("[ORCH] Tick snapshot", {
        currentId,
        title: st.currentTrack?.title,
        isPlaying: st.isPlaying,
        playing: st.playing,
        paused: st.paused,
        ended: st.ended,
        currentTime: st.currentTime,
        duration: st.duration,
      });
    }

    // ========== TRACK START DETECTION ==========
    if (currentId && currentId !== lastTrackId) {
      console.log("[ORCH] 🎵 TRACK CHANGE DETECTED", {
        from: lastTrackId,
        to: currentId,
        trackTitle: st.currentTrack?.title
      });
      
      clearTimeout(trackStartTimeout);
      trackStartTimeout = setTimeout(() => {
        console.log("[ORCH] 🎵 CONFIRMED TRACK START → pm.onTrackStart()", {
          from: lastTrackId,
          to: currentId
        });
        
        lastTrackId = currentId;

        const meta = {
          id: currentId,
          title: st.currentTrack?.title,
          genre: st.currentTrack?.genre,
          duration: st.currentTrack?.duration,
          artist: st.currentTrack?.artist,
        };

        console.log("[ORCH] 🎵 TRACK START - Metadata:", meta);

        try {
          pm.onTrackStart(meta);
          console.log("[ORCH] 🎵 pm.onTrackStart() called successfully");
        } catch (err) {
          console.error("[ORCH] Error calling pm.onTrackStart:", err);
        }
      }, 100); // Small delay to confirm it's a real track change
    }

    // ========== PLAY/PAUSE DETECTION ==========
    const inferredPlaying =
      st?.isPlaying ??
      st?.playing ??
      (!st?.paused && st?.currentTime > 0 && !st?.ended);

    const isNowPlaying = Boolean(inferredPlaying);

    if (tickCount % 10 === 0) {
      console.log("[ORCH] Play state check:", {
        isNowPlaying,
        rawState: {
          isPlaying: st?.isPlaying,
          playing: st?.playing,
          paused: st?.paused,
          currentTime: st?.currentTime,
          ended: st?.ended
        }
      });
    }

    // ========== TRACK END DETECTION ==========
    const endedFlag = !!st.ended;
    const duration = st.duration || 0;
    const currentTime = st.currentTime || 0;

    // "Near end" heuristic, in case `ended` flag is unreliable
    const nearEnd =
      duration > 0 &&
      currentTime >= duration - 0.5 && // last 0.5s
      !st.isPlaying &&
      !st.playing;

    const endedNow = endedFlag || nearEnd;

    // If we've just transitioned into an ended state for THIS track:
    if (endedNow && !lastEndedFlag && currentId) {
      console.log("[ORCH] 🔚 TRACK END DETECTED", {
        endedFlag,
        nearEnd,
        currentTime,
        duration,
        trackId: currentId
      });
      
      lastEndedFlag = true;

      const meta = {
        id: currentId,
        title: st.currentTrack?.title,
        genre: st.currentTrack?.genre,
        duration: st.currentTrack?.duration,
        artist: st.currentTrack?.artist,
      };

      console.log("[ORCH] 🔚 TRACK END → pm.onTrackEnd(meta)", meta);

      try {
        pm.onTrackEnd(meta);
        console.log("[ORCH] 🔚 pm.onTrackEnd() called successfully");
      } catch (err) {
        console.error("[ORCH] Error when calling pm.onTrackEnd:", err);
      }
    }

    // Reset the "ended" latch when playback is clearly NOT ended anymore
    if (!endedNow && lastEndedFlag) {
      console.log("[ORCH] Reset ended flag - playback resumed or new track");
      lastEndedFlag = false;
    }

    // ========== TELEMETRY TICK ==========
    try {
      pm.updatePlaybackTick?.({
        t: st.currentTime || 0,
        d: st.duration || 0,
        vol: st.volume ?? 1,
        muted: !!st.muted,
        buffering: !!st.buffering,
        readyState: st.readyState || 0,
        trackId: currentId,
      });
    } catch {
      // ignore telemetry errors
    }
  }, 1000); // 1s interval

  return () => {
    console.log("[ORCH] 🧹 BRIDGE EFFECT CLEANUP");
    clearInterval(intervalId);
    if (trackStartTimeout) {
      clearTimeout(trackStartTimeout);
    }
  };
}, []);

 // Empty dependency array - runs once on mount
  return null;
}
