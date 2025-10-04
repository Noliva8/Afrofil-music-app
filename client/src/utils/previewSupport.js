import { getAudioSupport } from "./audioSupport";

// Your buckets
// previewSupport.js
export const BUCKETS = {
  STREAMING: 'audio-ad-streaming',
  FALLBACK:  'audio-ad-streaming-fallback',
  ORIGINAL:  'audio-ad-original',
  ARTWORK:   'audio-ad-artwork',          // ← bucket name
};

export const AD_CREATIVE_FIELDS = {
  AUDIO: {
    STREAMING: 'streamingAudioAdUrl',
    FALLBACK:  'streamingFallBackAudioUrl',
    ORIGINAL:  'masterAudionAdUrl',
  },
  IMAGE: {
    STREAMING: 'streamingOverlayAdUrl',
    ORIGINAL:  'originalOverlayUrl',
    ARTWORK:   'adArtWorkUrl',            // ← field name on the ad doc
  },
};




export function previewPointer(ad, support) {
  if (!ad) return null;
  const sup = support || getAudioSupport();
  const type = (ad.adType || '').toLowerCase();

  if (type === 'audio') {
    // Priority 1: Opus streaming (BUCKETS.STREAMING)
    if ((sup.opusWebM || sup.opusOgg || sup.opusMp4) && ad.streamingAudioAdUrl) {
      return { pointer: ad.streamingAudioAdUrl, defaultBucket: BUCKETS.STREAMING };
    }
    
    // Priority 2: AAC fallback (BUCKETS.FALLBACK)
    if (sup.aac && ad.streamingFallBackAudioUrl) {
      return { pointer: ad.streamingFallBackAudioUrl, defaultBucket: BUCKETS.FALLBACK };
    }
    
    // Priority 3: MP3 fallback (BUCKETS.FALLBACK)
    if (sup.mp3 && ad.streamingFallBackAudioUrl) {
      return { pointer: ad.streamingFallBackAudioUrl, defaultBucket: BUCKETS.FALLBACK };
    }
    
    // Priority 4: Original/master audio (BUCKETS.ORIGINAL)
    if (ad.masterAudionAdUrl) {
      return { pointer: ad.masterAudionAdUrl, defaultBucket: BUCKETS.ORIGINAL };
    }
    
    return null;
  }

  // Non-audio creatives
  if (ad.streamingOverlayAdUrl) {
    return { pointer: ad.streamingOverlayAdUrl, defaultBucket: BUCKETS.ARTWORK };
  }
  if (ad.streamingBannerAdUrl) {
    return { pointer: ad.streamingBannerAdUrl, defaultBucket: BUCKETS.ARTWORK };
  }
  if (ad.originalOverlayUrl) {
    return { pointer: ad.originalOverlayUrl, defaultBucket: BUCKETS.ARTWORK };
  }
  if (ad.originalBannerAdUrl) {
    return { pointer: ad.originalBannerAdUrl, defaultBucket: BUCKETS.ARTWORK };
  }
  
  return null;
}