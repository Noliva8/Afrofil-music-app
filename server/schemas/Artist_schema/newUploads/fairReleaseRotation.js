import crypto from "crypto";

const DEFAULT_ROTATION_WINDOW_MINUTES = 180;

const getSongId = (song) => String(song?._id ?? song?.id ?? song?.songId ?? "");

const getSeed = (now = Date.now()) => {
  const configured = Number(process.env.NEW_UPLOADS_ROTATION_WINDOW_MINUTES);
  const minutes =
    Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_ROTATION_WINDOW_MINUTES;
  return Math.floor(now / (minutes * 60 * 1000));
};

const seededUnit = (value) => {
  const hex = crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
  return parseInt(hex, 16) / 0xffffffffffff;
};

const shuffleBucket = (items, seed, label) =>
  [...items].sort((a, b) => {
    const aScore = seededUnit(`${seed}:${label}:${getSongId(a.song)}`);
    const bScore = seededUnit(`${seed}:${label}:${getSongId(b.song)}`);
    return bScore - aScore;
  });

const weightedRestOrder = (items, seed) =>
  [...items].sort((a, b) => {
    const aRandom = seededUnit(`${seed}:recent-rest:${getSongId(a.song)}`);
    const bRandom = seededUnit(`${seed}:recent-rest:${getSongId(b.song)}`);
    const aRecency = 1 / Math.sqrt(a.rank + 1);
    const bRecency = 1 / Math.sqrt(b.rank + 1);
    return bRandom * 0.7 + bRecency * 0.3 - (aRandom * 0.7 + aRecency * 0.3);
  });

export const rotateNewUploads = (songs = [], limit = 10, options = {}) => {
  const requested = Math.max(1, Math.floor(Number(limit) || 10));
  const pool = Array.isArray(songs) ? songs.filter(Boolean) : [];
  if (pool.length <= 1) return pool.slice(0, requested);

  const seed = options.seed ?? getSeed(options.now);
  const ranked = pool.map((song, rank) => ({ song, rank }));

  const newestCount = Math.min(pool.length, Math.max(3, Math.ceil(pool.length * 0.3)));
  const recentCount = Math.min(
    Math.max(0, pool.length - newestCount),
    Math.max(3, Math.ceil(pool.length * 0.45))
  );

  const newest = shuffleBucket(ranked.slice(0, newestCount), seed, "newest");
  const recent = shuffleBucket(ranked.slice(newestCount, newestCount + recentCount), seed, "recent");
  const discovery = shuffleBucket(ranked.slice(newestCount + recentCount), seed, "older-recent");
  const selected = [];
  const used = new Set();

  const takeFrom = (bucket) => {
    const next = bucket.find((item) => !used.has(getSongId(item.song)));
    if (!next) return;
    selected.push(next);
    used.add(getSongId(next.song));
  };

  takeFrom(newest);
  if (requested > 1) takeFrom(recent.length ? recent : newest);
  if (requested > 2) takeFrom(discovery.length ? discovery : recent.length ? recent : newest);

  const rest = weightedRestOrder(
    ranked.filter((item) => !used.has(getSongId(item.song))),
    seed
  );

  return [...selected, ...rest].slice(0, requested).map((item) => item.song);
};
