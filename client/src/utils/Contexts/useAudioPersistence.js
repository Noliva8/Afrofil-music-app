


import { useEffect, useRef, useCallback, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { useUser } from './userContext';
import { readCtxPointer } from '../plabackUtls/presistancePointer';
import { GET_PLAYBACK_CONTEXT_STATE } from '../queries';
import { GET_PRESIGNED_URL_DOWNLOAD, GET_PRESIGNED_URL_DOWNLOAD_AUDIO } from '../mutations';
// import { PLAYBACK_CONTEXT_REDIS } from '../queries';
import { GET_PLAYBACK_SESSION } from '../queries';





// Wait for audio metadata to load
function waitForMetadata(audio) {
  return new Promise((resolve) => {
    if (!audio) return resolve();
    if (audio.readyState >= 1 && !Number.isNaN(audio.duration)) return resolve();
    
    const ok = () => { cleanup(); resolve(); };
    const err = () => { cleanup(); resolve(); };
    
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', ok);
      audio.removeEventListener('error', err);
    };
    
    audio.addEventListener('loadedmetadata', ok, { once: true });
    audio.addEventListener('error', err, { once: true });
    
    // Timeout fallback
    setTimeout(resolve, 5000);
  });
}

// Improved URL extraction function
function extractS3Key(url, expectedBucket) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and split
    const pathParts = pathname.replace(/^\//, '').split('/');
    
    // Handle different S3 URL formats
    if (urlObj.hostname.includes('amazonaws.com')) {
      // Format 1: bucket.s3.region.amazonaws.com/key
      if (urlObj.hostname.startsWith(`${expectedBucket}.s3.`)) {
        return pathParts.join('/');
      }
      
      // Format 2: s3.region.amazonaws.com/bucket/key
      if (urlObj.hostname.startsWith('s3.')) {
        const bucketIndex = pathParts.indexOf(expectedBucket);
        if (bucketIndex >= 0) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      }
    }
    
    // For direct S3 URLs, just return the path without the bucket name
    // If the URL already contains "for-streaming", don't duplicate it
    if (pathParts.includes('for-streaming')) {
      return pathParts.join('/');
    }
    
    // Default: return the last part of the path (filename)
    return pathParts.pop();
  } catch (error) {
    console.warn('Failed to parse URL:', url, error);
    return null;
  }
}

// Improved URL decoding function
function decodeS3Key(encodedKey) {
  try {
    // Double decode for S3 keys that are double-encoded
    return decodeURIComponent(decodeURIComponent(encodedKey));
  } catch (error) {
    console.warn('Failed to decode key:', encodedKey, error);
    return encodedKey;
  }
}

export const useAudioPersistence = ({
  audioRef,
  setPlayerState,
  load,
  play,
  canonicalQueueRef,
  currentIndexRef
}) => {
  const restoredRef = useRef(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const userCtx = useUser();
  const userIdFromCtx = userCtx?.user?._id || userCtx?.id || null;

  const [getCtx, { loading: queryLoading, error: queryError }] = useLazyQuery(GET_PLAYBACK_CONTEXT_STATE, {
    fetchPolicy: 'network-only',
    onError: (err) => {
      console.error('Resume fetch failed:', {
        message: err?.message,
        graphQLErrors: err?.graphQLErrors?.map(e => e.message),
        networkError: err?.networkError,
      });
      setRestoreError(err);
    },
  });

  const [getPresignedUrlDownload] = useMutation(GET_PRESIGNED_URL_DOWNLOAD, {
    onError: (err) => console.warn('Artwork signing failed:', err?.message),
  });

  const [getPresignedUrlDownloadAudio] = useMutation(GET_PRESIGNED_URL_DOWNLOAD_AUDIO, {
    onError: (err) => console.warn('Audio signing failed:', err?.message),
  });

  // Restore playback state
  const restorePlayback = useCallback(async () => {
    if (restoredRef.current || isRestoring) return;
    
    setIsRestoring(true);
    setRestoreError(null);

    try {
      // Resolve owner (user:ID or sess:ID) → variables for query
      const ptr = readCtxPointer();
      const owner = String(ptr?.owner || '');
      const userId = userIdFromCtx || (owner.startsWith('user:') ? owner.slice(5) : null);
      const sessionId = !userIdFromCtx && owner.startsWith('sess:') ? owner.slice(5) : null;

      if (!userId && !sessionId) {
        console.log('No user or session ID found for playback restoration');
        restoredRef.current = true;
        setIsRestoring(false);
        return;
      }

      console.log('Restoring playback for:', { userId, sessionId });

      // 1) Pull snapshot (trackId + playbackContext + minimal song)
      const { data, error } = await getCtx({ variables: { userId, sessionId } });
      
      if (error) throw new Error(`GraphQL error: ${error.message}`);
      
      const snap = data?.getPlaybackContextState;
      const song = snap?.song;
      
      if (!snap || !song) {
        console.log('No playback state found');
        restoredRef.current = true;
        setIsRestoring(false);
        return;
      }

      console.log('Found playback state:', snap);

      // 2) Sign artwork
      let artworkUrl = null;
      if (song.artwork) {
        try {
          const artworkKey = extractS3Key(song.artwork, 'afrofeel-cover-images-for-songs');
          if (artworkKey) {
            const { data: artworkData } = await getPresignedUrlDownload({
              variables: {
                bucket: 'afrofeel-cover-images-for-songs',
                key: artworkKey,
                region: 'us-east-2',
                expiresIn: 60 * 60 * 24 * 7, // 7 days
              },
            });
            artworkUrl = artworkData?.getPresignedUrlDownload?.urlToDownload;
          }
        } catch (err) {
          console.error('Error signing artwork:', err);
        }
      }

      // Fallback to original artwork URL if signing failed
      if (!artworkUrl && song.artwork) {
        artworkUrl = song.artwork;
      }

      // 3) Sign audio - FIXED THE DUPLICATE "for-streaming" ISSUE
      let audioUrl = null;
      const audioSourceUrl = song.streamAudioFileUrl || song.audioFileUrl;
      
      if (audioSourceUrl) {
        try {
          // Extract the key without duplicating "for-streaming"
          let audioKey = extractS3Key(audioSourceUrl, 'afrofeel-songs-streaming');
          
          // If the key already contains "for-streaming", use it as-is
          // Otherwise, prepend "for-streaming/"
          if (audioKey && !audioKey.includes('for-streaming/')) {
            audioKey = `for-streaming/${audioKey}`;
          }
          
          // Decode the key to handle URL encoding
          if (audioKey) {
            audioKey = decodeS3Key(audioKey);
            
            const { data: audioData } = await getPresignedUrlDownloadAudio({
              variables: {
                bucket: 'afrofeel-songs-streaming',
                key: audioKey,
                region: 'us-west-2',
              },
            });
            audioUrl = audioData?.getPresignedUrlDownloadAudio?.url;
            
            console.log('Generated audio URL:', audioUrl);
          }
        } catch (err) {
          console.error('Error signing audio:', err);
        }
      }

      // Fallback to original URL if signing failed
      if (!audioUrl && audioSourceUrl) {
        audioUrl = audioSourceUrl;
        console.log('Using original audio URL as fallback:', audioUrl);
      }

      // If we still don't have an audio URL, we can't proceed
      if (!audioUrl) {
        throw new Error('No audio URL available for playback');
      }

      // 4) Build the track object
      const track = {
        id: song._id || song.id,
        title: song.title,
        duration: song.duration ?? 0,
        artworkUrl: artworkUrl || 'https://placehold.co/300x300?text=No+Cover',
        audioUrl,
        artist: song.artist || null,
        album: song.album || null,
      };

      // 5) Hydrate player state
      setPlayerState(prev => ({
        ...prev,
        currentTrack: track,
        queue: [],
        playbackContext: snap.playbackContext,
        playbackSource: snap.playbackContext?.source || null,
        playbackSourceId: snap.playbackContext?.sourceId || null,
        isLoading: true,
        error: null,
        isRestoring: true,
      }));

      // 6) Load and seek
      const ok = await load(track, []);
      
      if (ok && audioRef.current) {
        await waitForMetadata(audioRef.current);
        audioRef.current.currentTime = Math.min(
          snap.positionSec || 0,
          audioRef.current.duration || 0
        );

        // Handle queue restoration
        const ids = Array.isArray(snap.queueIds) ? snap.queueIds : [];
        let idx = ids.indexOf(track.id);
        
        if (idx < 0 && Number.isFinite(snap.playbackContext?.queuePosition)) {
          idx = snap.playbackContext.queuePosition;
        }
        
        if (idx < 0) idx = 0;

        // Update queue references if provided
        if (canonicalQueueRef?.current) {
          canonicalQueueRef.current = ids;
        }
        
        if (currentIndexRef?.current !== undefined) {
          currentIndexRef.current = idx;
        }

        // Set minimal queue for UI
        const nextIds = ids.slice(idx + 1);
        setPlayerState(prev => ({
          ...prev,
          queue: nextIds.map(id => ({ id })),
        }));

        // Set up gesture-based playback resumption
        const playOnInteraction = () => {
          play(track, snap.playbackContext);
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('keydown', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });

        console.log('Playback restored. Click/tap to resume.');
      }

      restoredRef.current = true;
      
    } catch (error) {
      console.error('Playback restoration failed:', error);
      setRestoreError(error);
      
      setPlayerState(prev => ({
        ...prev,
        error: 'Failed to restore playback: ' + error.message,
        isRestoring: false,
      }));
    } finally {
      setIsRestoring(false);
      
      setPlayerState(prev => ({
        ...prev,
        isRestoring: false,
      }));
    }
  }, [
    audioRef, 
    load, 
    play, 
    setPlayerState, 
    userIdFromCtx, 
    getCtx, 
    getPresignedUrlDownload, 
    getPresignedUrlDownloadAudio,
    canonicalQueueRef,
    currentIndexRef,
    isRestoring
  ]);

  // Main effect
  useEffect(() => {
    restorePlayback();
  }, [restorePlayback]);

  // Manual restoration function
  const retryRestoration = useCallback(() => {
    restoredRef.current = false;
    setRestoreError(null);
    restorePlayback();
  }, [restorePlayback]);

  return {
    isRestoring: isRestoring || queryLoading,
    restoreError: restoreError || queryError,
    retryRestoration,
  };
};




