
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { GET_PRESIGNED_URL_DOWNLOAD } from '../mutations'; 
import { resolveAdCoverLocation } from '../adArtworkPointer';


const PLACEHOLDER = '/images/ad-placeholder.png';
// Simple per-tab cache for signed URLs
const cache = new Map(); // key: `${bucket}/${key}@${region}` → signed URL

/**
 * Flip to ad cover art while ad plays. If no cover: show placeholder + "Ad is playing…"
 * Does not touch audio/progress.
 *
 * @param {object} params
 * @param {boolean} params.isPlayingAd
 * @param {object|null} params.currentAd
 * @param {object|null} params.currentTrack
 */
export function useNowPlayingArtwork({ isPlayingAd, currentAd, currentTrack }) {
  const [artworkUrl, setArtworkUrl] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const lastKeyRef = useRef('');
  const [getSigned] = useMutation(GET_PRESIGNED_URL_DOWNLOAD);

  const model = useMemo(() => {
    if (isPlayingAd && currentAd) {
      return {
        isAd: true,
        title: currentAd.adTitle || 'Advertisement',
        subtitle: 'Sponsored',
        coverLoc: resolveAdCoverLocation(currentAd), // { bucket, key, region } | null
      };
    }
    const t = currentTrack || {};
    return {
      isAd: false,
      title: t.title || '',
      subtitle: t.artistName || t.artist || '',
      trackArtwork: t.artworkUrl || t.image || ''
    };
  }, [isPlayingAd, currentAd, currentTrack]);

  useEffect(() => {
    let abort = false;

    async function run() {
      if (!model.isAd) {
        setArtworkUrl(model.trackArtwork || '');
        setIsPlaceholder(false);
        return;
      }

      // Ad cover path
      const loc = model.coverLoc;
      if (!loc) {
        setArtworkUrl(PLACEHOLDER);
        setIsPlaceholder(true);
        return;
      }

      const keyId = `${loc.bucket}/${loc.key}@${loc.region}`;
      if (cache.has(keyId)) {
        if (!abort) {
          setArtworkUrl(cache.get(keyId));
          setIsPlaceholder(false);
        }
        return;
      }
      if (lastKeyRef.current === keyId && artworkUrl) return;
      lastKeyRef.current = keyId;

      try {
        const { data } = await getSigned({ variables: loc });
        if (abort) return;

        const signed = data?.getPresignedUrlDownload?.urlToDownload;
        if (signed) {
          cache.set(keyId, signed);
          setArtworkUrl(signed);
          setIsPlaceholder(false);
        } else {
          setArtworkUrl(PLACEHOLDER);
          setIsPlaceholder(true);
        }
      } catch {
        if (!abort) {
          setArtworkUrl(PLACEHOLDER);
          setIsPlaceholder(true);
        }
      }
    }

    run();
    return () => { abort = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.isAd, model.coverLoc, model.trackArtwork, getSigned]);

  return {
    artworkUrl,
    title: model.title,
    subtitle: model.subtitle,
    isAd: model.isAd,
    isPlaceholder,
    note: model.isAd && isPlaceholder ? 'Ad is playing…' : undefined
  };
}
