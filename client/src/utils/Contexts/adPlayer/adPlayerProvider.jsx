


// import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
// import PropTypes from "prop-types";
// import { createAdPlayerAdapter } from "../playerAdapters";
// import { eventBus } from "../playerAdapters";

// const AdAudioCtx = createContext(null);

// export function AdAudioProvider({ children, getCreative, onBeacon }) {
//   const audioRef = useRef(null);

//   // PM will set these:
//   const identityRef = useRef({ userType: "guest", userId: null });
//   const environmentRef = useRef({ location: null });

//   // Keep incoming props stable via refs (no re-memo storms)
//   const creativeRef = useRef(getCreative);
//   const beaconRef = useRef(onBeacon);
//   useEffect(() => { creativeRef.current = getCreative; }, [getCreative]);
//   useEffect(() => { beaconRef.current = onBeacon; }, [onBeacon]);

//   const [adState, setAdState] = useState({
//     isPlaying: false,
//     currentAd: null, // {url, type, meta}
//     error: null
//   });

//   // PM will assign handlers through adapter.onComplete(fn)/onError(fn)
//   const completeCbRef = useRef(null);
//   const errorCbRef = useRef(null);

//   // Create the underlying <audio> element exactly once
//   useEffect(() => {
//     const a = new Audio();
//     a.preload = "auto";
//     a.crossOrigin = "anonymous";
//     audioRef.current = a;

//     const onEnded = () => {
//       setAdState((s) => ({ ...s, isPlaying: false }));
//       // Notify PM that ad completed so it can resume content
//       completeCbRef.current?.();
//     };

//     const onError = () => {
//       const err = a.error ? a.error.code : "AD_ERROR";
//       setAdState((s) => ({ ...s, isPlaying: false, error: String(err) }));
//       errorCbRef.current?.(new Error(`Ad audio error: ${err}`));
//     };

//     a.addEventListener("ended", onEnded);
//     a.addEventListener("error", onError);

//     return () => {
//       a.removeEventListener("ended", onEnded);
//       a.removeEventListener("error", onError);
//       a.pause();
//       a.src = "";
//       audioRef.current = null;
//     };
//   }, []);

//   // ---------- STABLE ADAPTER (never recreated) ----------
//   const adapterRef = useRef(null);
//   if (!adapterRef.current) {
//     adapterRef.current = {
//       /** PM calls this when it’s time to play an ad */
//       playAd: async (adType, context) => {
//         const meta = {
//           adType,
//           identity: identityRef.current,
//           environment: environmentRef.current,
//           context
//         };

//         let adUrl = null;
//         try {
//           if (typeof creativeRef.current === "function") {
//             adUrl = await creativeRef.current({
//               adType,
//               identity: identityRef.current,
//               environment: environmentRef.current,
//               context
//             });
//           }
//         } catch (e) {
//           // swallow creative errors; report via beacon and finish gracefully
//           beaconRef.current?.({ event: "ad_creative_error", error: String(e), meta });
//         }

//         // If no creative, gracefully complete without throwing
//         if (!adUrl) {
//           beaconRef.current?.({ event: "ad_skipped_no_creative", meta });
//           // Let the manager resume content immediately
//           completeCbRef.current?.();
//           return;
//         }

//         const a = audioRef.current;
//         if (!a) {
//           // No audio element yet — just complete so content resumes
//           beaconRef.current?.({ event: "ad_audio_missing", meta });
//           completeCbRef.current?.();
//           return;
//         }

//         // Load & play
//         a.pause();
//         a.src = adUrl;
//         a.currentTime = 0;
//         setAdState({ isPlaying: true, currentAd: { url: adUrl, type: adType, meta }, error: null });

//         try {
//           await a.play();
//           beaconRef.current?.({ event: "ad_start", url: adUrl, meta });
//         } catch (e) {
//           // Autoplay/capability error — report and complete so content resumes
//           setAdState((s) => ({ ...s, isPlaying: false, error: String(e?.message || e) }));
//           beaconRef.current?.({ event: "ad_play_error", error: String(e?.message || e), meta });
//           completeCbRef.current?.();
//         }
//       },

//       /** PM will attach these once */
//       onComplete: (cb) => { completeCbRef.current = cb; },
//       onError:    (cb) => { errorCbRef.current = cb; },

//       /** PM can stop ad early (e.g., on error) */
//       stopAd: () => {
//         const a = audioRef.current;
//         if (a) { a.pause(); a.currentTime = 0; }
//         setAdState((s) => ({ ...s, isPlaying: false }));
//       },

//       /** PM updates these before first ad play and anytime they change */
//       updateIdentity: (ident) => { identityRef.current = ident || { userType: "guest" }; },
//       updateEnvironment: (env) => { environmentRef.current = env || { location: null }; }
//     };
//   }

//   // Only adState changes should cause consumer rerenders; adapter is stable
//   const value = useMemo(() => ({ adapter: adapterRef.current, adState }), [adState]);

//   return (
//     <AdAudioCtx.Provider value={value}>
//       {children}
//       {/* keep it off-screen; your ad UI comes later */}
//       <audio ref={audioRef} style={{ display: "none" }} />
//     </AdAudioCtx.Provider>
//   );
// }

// AdAudioProvider.propTypes = {
//   children: PropTypes.node.isRequired,
//   getCreative: PropTypes.func, // async ({adType, identity, environment, context}) => url
//   onBeacon: PropTypes.func     // (payload) => void
// };

// export const useAdAudio = () => {
//   const ctx = useContext(AdAudioCtx);
//   if (!ctx) throw new Error("useAdAudio must be used within <AdAudioProvider>");
//   return ctx;
// };





// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import PropTypes from "prop-types";
// import { useApolloClient } from "@apollo/client";
// import { createAdPlayerAdapter, eventBus } from "../playerAdapters";

// const AdAudioCtx = createContext(null);

// /**
//  * AdAudioProvider
//  *
//  * Responsibilities:
//  * - Create a single instance of the REAL ad adapter (createAdPlayerAdapter)
//  *   with the Apollo Client injected.
//  * - Subscribe to AD_* events via eventBus.
//  * - Expose:
//  *    - adapter: the object PlayerManager will call playAd() on
//  *    - adState: UI-facing state for current ad + progress + error
//  */
// export function AdAudioProvider({ children }) {
//   const apolloClient = useApolloClient();
//   const [adState, setAdState] = useState({
//     isPlaying: false,
//     currentAd: null, // { id, title, artwork, duration, ... }
//     error: null,
//     progress: {
//       currentTime: 0, // ms
//       duration: 0,    // ms
//       percent: 0,
//     },
//   });

//   // ---------- STABLE ADAPTER INSTANCE ----------
//   const adapterRef = useRef(null);
//   if (!adapterRef.current) {
//     adapterRef.current = createAdPlayerAdapter({
//       apolloClient, // ✅ inject here
//     });
//     console.log("🎧 AdAudioProvider: ad adapter created with Apollo client");
//   }

//   // ---------- EVENT SUBSCRIPTIONS (eventBus -> adState) ----------
//   useEffect(() => {
//     const handleMetadataLoaded = (payload) => {
//       console.log("📡 UI: AD_METADATA_LOADED", payload);
//       setAdState((s) => ({
//         ...s,
//         currentAd: payload,
//         error: null,
//       }));
//     };

//     const handleAdStarted = (payload) => {
//       console.log("📡 UI: AD_STARTED", payload);
//       setAdState((s) => ({
//         ...s,
//         isPlaying: true,
//       }));
//     };

//     const handleProgress = (payload) => {
//       setAdState((s) => ({
//         ...s,
//         progress: {
//           currentTime: payload.currentTime ?? 0,
//           duration: payload.duration ?? 0,
//           percent: payload.percent ?? 0,
//         },
//       }));
//     };

//     const handleCompleted = (payload) => {
//       console.log("📡 UI: AD_COMPLETED", payload);
//       setAdState((s) => ({
//         ...s,
//         isPlaying: false,
//         progress: {
//           currentTime: 0,
//           duration: 0,
//           percent: 0,
//         },
//       }));
//     };

//     const handleError = ({ error }) => {
//       console.log("📡 UI: AD_ERROR", error);
//       setAdState((s) => ({
//         ...s,
//         isPlaying: false,
//         error: error || "Unknown ad error",
//       }));
//     };

//     eventBus.on("AD_METADATA_LOADED", handleMetadataLoaded);
//     eventBus.on("AD_STARTED", handleAdStarted);
//     eventBus.on("AD_PROGRESS", handleProgress);
//     eventBus.on("AD_COMPLETED", handleCompleted);
//     eventBus.on("AD_ERROR", handleError);

//     return () => {
//       eventBus.off("AD_METADATA_LOADED", handleMetadataLoaded);
//       eventBus.off("AD_STARTED", handleAdStarted);
//       eventBus.off("AD_PROGRESS", handleProgress);
//       eventBus.off("AD_COMPLETED", handleCompleted);
//       eventBus.off("AD_ERROR", handleError);
//     };
//   }, []);

//   const value = useMemo(
//     () => ({
//       adapter: adapterRef.current,
//       adState,
//     }),
//     [adState]
//   );

//   return (
//     <AdAudioCtx.Provider value={value}>
//       {children}
//     </AdAudioCtx.Provider>
//   );
// }

// AdAudioProvider.propTypes = {
//   children: PropTypes.node.isRequired,
// };

// export const useAdAudio = () => {
//   const ctx = useContext(AdAudioCtx);
//   if (!ctx) throw new Error("useAdAudio must be used within <AdAudioProvider>");
//   return ctx;
// };



import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { useApolloClient } from "@apollo/client";
import { createAdPlayerAdapter, eventBus } from "../playerAdapters";

const AdAudioCtx = createContext(null);

export function AdAudioProvider({ children }) {
  const apolloClient = useApolloClient();

  const [adState, setAdState] = useState({
    isPlaying: false,
    currentAd: null,
    error: null,
    progress: {
      currentTime: 0,
      duration: 0,
      percent: 0,
    },
  });

  // ---------- STABLE ADAPTER INSTANCE ----------
  const adapterRef = useRef(null);
  const initializationRef = useRef(false); // ✅ Track initialization

  // ✅ FIX: Use useEffect to create adapter ONCE
  useEffect(() => {
    if (initializationRef.current) return;
    
    console.log("🎧 AdAudioProvider: Creating ad adapter");
    adapterRef.current = createAdPlayerAdapter({
      apolloClient,
    });
    initializationRef.current = true;
    
    console.log("🎧 AdAudioProvider: ad adapter created", {
      hasClient: !!apolloClient,
    });
  }, [apolloClient]); // Only recreate if apolloClient changes

  // Ensure the adapter always has the latest Apollo client
  useEffect(() => {
    if (!adapterRef.current) return;
    if (!apolloClient) {
      console.warn("⚠️ AdAudioProvider: apolloClient not ready yet");
      return;
    }

    adapterRef.current.setApolloClient(apolloClient);
    console.log("🔗 AdAudioProvider: Apollo Client synced to ad adapter");
  }, [apolloClient]);

  // ---------- EVENT SUBSCRIPTIONS (eventBus -> adState) ----------
  useEffect(() => {
    const handleMetadataLoaded = (payload) => {
      console.log("📡 UI: AD_METADATA_LOADED", payload);
      setAdState((s) => ({
        ...s,
        currentAd: payload,
        error: null,
      }));
    };

    const handleAdStarted = (payload) => {
      console.log("📡 UI: AD_STARTED", payload);
      setAdState((s) => ({
        ...s,
        isPlaying: true,
      }));
    };

    const handleProgress = (payload) => {
      setAdState((s) => ({
        ...s,
        progress: {
          currentTime: payload.currentTime ?? 0,
          duration: payload.duration ?? 0,
          percent: payload.percent ?? 0,
        },
      }));
    };

    const handleCompleted = (payload) => {
      console.log("📡 UI: AD_COMPLETED", payload);
      
      setAdState((s) => ({
        ...s,
        isPlaying: false,
        progress: {
          currentTime: 0,
          duration: 0,
          percent: 0,
        },
      }));

      // 🔥 CRITICAL: Notify main audio player that ad finished
      eventBus.emit("AD_PLAYBACK_FINISHED", {
        adIndex: payload?.adIndex,
        timestamp: Date.now()
      });
    };

    const handleError = ({ error }) => {
      console.log("📡 UI: AD_ERROR", error);
      setAdState((s) => ({
        ...s,
        isPlaying: false,
        error: error || "Unknown ad error",
      }));
    };

    eventBus.on("AD_METADATA_LOADED", handleMetadataLoaded);
    eventBus.on("AD_STARTED", handleAdStarted);
    eventBus.on("AD_PROGRESS", handleProgress);
    eventBus.on("AD_COMPLETED", handleCompleted);
    eventBus.on("AD_ERROR", handleError);

    return () => {
      eventBus.off("AD_METADATA_LOADED", handleMetadataLoaded);
      eventBus.off("AD_STARTED", handleAdStarted);
      eventBus.off("AD_PROGRESS", handleProgress);
      eventBus.off("AD_COMPLETED", handleCompleted);
      eventBus.off("AD_ERROR", handleError);
    };
  }, []);

  const value = useMemo(
    () => ({
      adapter: adapterRef.current,
      adState,
    }),
    [adState]
  );

  return (
    <AdAudioCtx.Provider value={value}>
      {children}
    </AdAudioCtx.Provider>
  );
}

AdAudioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAdAudio = () => {
  const ctx = useContext(AdAudioCtx);
  if (!ctx) throw new Error("useAdAudio must be used within <AdAudioProvider>");
  return ctx;
};
