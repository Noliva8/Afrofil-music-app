// // ./adPlayer.js
// import { useCallback, useRef, useState } from 'react';
// import { getAdAudioUrlWithFallback } from '../adPlayerHelper';

// export function useAdPlayer() {
//   const [isPlayingAd, setIsPlayingAd] = useState(false);
//   const [currentAd, setCurrentAd] = useState(null);
//   const [adError, setAdError] = useState(null);
//   const [adProgress, setAdProgress] = useState(0);

//   const adAudioRef = useRef(null);
//   const timeoutIdRef = useRef(null);

//   const cleanup = useCallback(() => {
//     if (timeoutIdRef.current) {
//       clearTimeout(timeoutIdRef.current);
//       timeoutIdRef.current = null;
//     }
//     const a = adAudioRef.current;
//     if (a) {
//       a.onloadeddata = null;
//       a.onended = null;
//       a.onerror = null;
//       a.ontimeupdate = null;
//       try { a.pause(); } catch {}
//       a.src = '';
//     }
//     adAudioRef.current = null;
//     setIsPlayingAd(false);
//     setAdProgress(0);
//     setCurrentAd(null);
//   }, []);

// // useAdPlayer.js  (inside playAd)
// const playAd = useCallback(async (adData, onAdComplete) => {
//   // ✅ accept both { creative: {...} } and flat {...}
//   const creative = adData?.creative || adData;

//   // if there’s no audio pointer at all, bail gracefully
//   const hasAnyAudio =
//     !!creative?.streamingAudioAdUrl ||
//     !!creative?.streamingFallBackAudioUrl ||
//     !!creative?.masterAudionAdUrl;

//   if (!hasAnyAudio) {
//     console.warn('[AdPlayer] No audio pointers on ad; skipping.');
//     onAdComplete?.();
//     return;
//   }

//   try {
//     setIsPlayingAd(true);
//     // keep the full object AND stash a normalized creative for downstream
//     setCurrentAd({ ...adData, creative });
//     setAdError(null);
//     setAdProgress(0);

//     const audioUrl = await getAdAudioUrlWithFallback(creative); // works for either shape

//     adAudioRef.current = new Audio(audioUrl);
//     adAudioRef.current.preload = 'auto';

//     // progress
//     clearInterval(progressIntervalRef.current);
//     progressIntervalRef.current = setInterval(() => {
//       if (adAudioRef.current && isFinite(adAudioRef.current.duration) && adAudioRef.current.duration > 0) {
//         const progress = (adAudioRef.current.currentTime / adAudioRef.current.duration) * 100;
//         setAdProgress(progress);
//       }
//     }, 100);

//     const handleLoaded = () => {
//       console.log('🔊 Ad loaded, playing...');
//       adAudioRef.current.play().catch(handleError);
//     };

//     const handleEnded = () => {
//       console.log('✅ Ad completed');
//       cleanup();
//       onAdComplete?.();
//     };


//     const handleError = (error) => {
//       console.warn('❌ Ad playback failed:', error);
//       setAdError(`Playback error: ${error?.message || String(error)}`);
//       cleanup();
//       onAdComplete?.();
//     };

//     const handleTimeUpdate = () => {
//       if (adAudioRef.current && isFinite(adAudioRef.current.duration) && adAudioRef.current.duration > 0) {
//         const progress = (adAudioRef.current.currentTime / adAudioRef.current.duration) * 100;
//         setAdProgress(progress);
//       }
//     };

//     adAudioRef.current.addEventListener('loadeddata', handleLoaded);
//     adAudioRef.current.addEventListener('ended', handleEnded);
//     adAudioRef.current.addEventListener('error', handleError);
//     adAudioRef.current.addEventListener('timeupdate', handleTimeUpdate);

//     const timeoutMs = (creative?.durationSec || Math.ceil((creative?.audioDurationMs || 0) / 1000) || 30) * 1000 + 10000;
//     const timeoutId = setTimeout(() => {
//       console.log('⏰ Ad playback timeout');
//       handleError(new Error('Ad playback timeout'));
//     }, timeoutMs);

//     const cleanup = () => {
//       clearTimeout(timeoutId);
//       clearInterval(progressIntervalRef.current);
//       if (adAudioRef.current) {
//         adAudioRef.current.removeEventListener('loadeddata', handleLoaded);
//         adAudioRef.current.removeEventListener('ended', handleEnded);
//         adAudioRef.current.removeEventListener('error', handleError);
//         adAudioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
//         adAudioRef.current.pause();
//         adAudioRef.current.src = '';
//         adAudioRef.current = null;
//       }
//       setIsPlayingAd(false);
//       setAdProgress(0);
//     };
//   } catch (error) {
//     console.error('Failed to play ad:', error);
//     setAdError(error.message);
//     setIsPlayingAd(false);
//     setCurrentAd(null);
//     onAdComplete?.();
//   }
// }, []);


//   const stopAd = useCallback(() => {
//     cleanup();
//   }, [cleanup]);

//   const skipAd = useCallback(() => {
//     // only allow if your policy permits skipping
//     cleanup();
//   }, [cleanup]);

//   return {
//     isPlayingAd,
//     currentAd,
//     adError,
//     adProgress,
//     playAd,
//     stopAd,
//     skipAd
//   };
// }
