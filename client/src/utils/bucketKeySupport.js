
export function toBucketKey(value, defaultBucket = '') {
  if (!value) return { bucket: null, key: null, passthrough: null };

  // s3://bucket/key
  if (value.startsWith('s3://')) {
    const rest = value.slice(5);
    const i = rest.indexOf('/');
    return { bucket: rest.slice(0, i), key: rest.slice(i + 1), passthrough: null };
  }

  // Try URL (S3 or public CDN)
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (!host.includes('amazonaws.com')) {
      // e.g. CloudFront or any other CDN URL: don't try to re-map/re-sign it
      return { bucket: null, key: null, passthrough: value };
    }

    if (host.includes('amazonaws.com')) {
      const parts = u.hostname.split('.');
      if (parts[0] !== 's3') {
        // bucket.s3.region.amazonaws.com/key
        return { bucket: parts[0], key: u.pathname.replace(/^\/+/, ''), passthrough: null };
      }
      // s3.region.amazonaws.com/bucket/key
      const segs = u.pathname.split('/').filter(Boolean);
      const [bucket, ...rest] = segs;
      return { bucket, key: rest.join('/'), passthrough: null };
    }
  } catch {
    // not a URL → fall through
  }

  // Raw key under a default bucket
  return { bucket: defaultBucket, key: value.replace(/^\/+/, ''), passthrough: null };
}
