// adArtworkPointer.js
import { BUCKETS, AD_CREATIVE_FIELDS } from './previewSupport';
import { toBucketKey } from './bucketKeySupport';

const DEFAULT_REGION = 'us-west-2';
// If your keys live under "artwork/<adId>/<file.webp>", keep this.
// If they live under "<adId>/<file.webp>", set to ''.
const ARTWORK_KEY_PREFIX = 'artwork/';

function looksLikeS3Url(urlStr) {
  try { return new URL(urlStr).hostname.includes('amazonaws.com'); }
  catch { return false; }
}

function inferRegionFromHost(host, fallback = DEFAULT_REGION) {
  const parts = host.split('.');
  const i = parts.indexOf('s3');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : fallback;
}

/**
 * Resolve an ad's *cover* artwork location for audio ads.
 * Only uses ad.adArtWorkUrl (the cover). If missing → null (UI will show fallback text).
 * Supports full S3 URL, s3://, or raw key; raw keys are mapped into BUCKETS.ARTWORK.
 *
 * @param {object} ad
 * @returns {{ bucket: string, key: string, region: string } | null}
 */
export function resolveAdCoverLocation(ad) {
  if (!ad) return null;

  const coverField = AD_CREATIVE_FIELDS.IMAGE.ARTWORK; // 'adArtWorkUrl'
  const pointer = ad[coverField];
  if (!pointer) return null;

  // Full S3-style URL (or s3://) → parse bucket/key/region
  if (looksLikeS3Url(pointer) || String(pointer).startsWith('s3://')) {
    const u = looksLikeS3Url(pointer) ? new URL(pointer) : null;
    const region = u ? inferRegionFromHost(u.hostname, DEFAULT_REGION) : DEFAULT_REGION;
    const { bucket, key } = toBucketKey(pointer, BUCKETS.ARTWORK);
    return { bucket: bucket || BUCKETS.ARTWORK, key, region };
  }

  // Raw key → normalize to your nested pattern under the artwork bucket
  const raw = String(pointer).replace(/^\/+/, '');
  const adId = (ad && (ad._id && (ad._id.$oid || ad._id))) ? String(ad._id.$oid || ad._id) : '';
  let key = raw;

  // If it's just a filename, nest it by adId
  if (!raw.includes('/')) {
    key = `${ARTWORK_KEY_PREFIX}${adId}/${raw}`;
  } else if (ARTWORK_KEY_PREFIX && !raw.startsWith(ARTWORK_KEY_PREFIX)) {
    // e.g. "<adId>/file.webp" → "artwork/<adId>/file.webp"
    const firstSeg = raw.split('/')[0];
    if (firstSeg === adId) key = `${ARTWORK_KEY_PREFIX}${raw}`;
  }

  return { bucket: BUCKETS.ARTWORK, key, region: DEFAULT_REGION };
}
