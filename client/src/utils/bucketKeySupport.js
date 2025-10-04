
export function toBucketKey(value, defaultBucket = '') {
  if (!value) return { bucket: null, key: null };

  // s3://bucket/key
  if (value.startsWith('s3://')) {
    const rest = value.slice(5);
    const i = rest.indexOf('/');
    return { bucket: rest.slice(0, i), key: rest.slice(i + 1) };
  }

  // Try S3 URL (virtual- or path-style)
  try {
    const u = new URL(value);
    if (u.hostname.includes('amazonaws.com')) {
      const parts = u.hostname.split('.');
      if (parts[0] !== 's3') {
        // bucket.s3.region.amazonaws.com/key
        return { bucket: parts[0], key: u.pathname.replace(/^\/+/, '') };
      }
      // s3.region.amazonaws.com/bucket/key
      const segs = u.pathname.split('/').filter(Boolean);
      const [bucket, ...rest] = segs;
      return { bucket, key: rest.join('/') };
    }
  } catch {
    // not a URL → fall through
  }

  // Raw key under a default bucket
  return { bucket: defaultBucket, key: value.replace(/^\/+/, '') };
}
