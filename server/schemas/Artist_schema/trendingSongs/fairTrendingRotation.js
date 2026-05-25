import crypto from "crypto";

const DEFAULT_ROTATION_WINDOW_MINUTES = 180;

const getSongId = (song) => String(song?._id ?? song?.id ?? song?.songId ?? "");

const getSeed = (now = Date.now()) => {
  const configured = Number(process.env.TRENDING_ROTATION_WINDOW_MINUTES);
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

const rankBucket = (items, seed, label) =>
  [...items].sort((a, b) => {
    const aId = getSongId(a.song);
    const bId = getSongId(b.song);
    const aJitter = seededUnit(`${seed}:${label}:${aId}`);
    const bJitter = seededUnit(`${seed}:${label}:${bId}`);
    return bJitter - aJitter;
  });

const weightedRestOrder = (items, seed) =>
  [...items].sort((a, b) => {
    const aId = getSongId(a.song);
    const bId = getSongId(b.song);
    const aRandom = seededUnit(`${seed}:rest:${aId}`);
    const bRandom = seededUnit(`${seed}:rest:${bId}`);
    const aQuality = 1 / Math.sqrt(a.rank + 1);
    const bQuality = 1 / Math.sqrt(b.rank + 1);
    return bRandom * 0.75 + bQuality * 0.25 - (aRandom * 0.75 + aQuality * 0.25);
  });

export const rotateTrendingSongs = (songs = [], limit = 10, options = {}) => {
  const requested = Math.max(1, Math.floor(Number(limit) || 10));
  const pool = Array.isArray(songs) ? songs.filter(Boolean) : [];
  if (pool.length <= 1) return pool.slice(0, requested);

  const seed = options.seed ?? getSeed(options.now);
  const ranked = pool.map((song, rank) => ({ song, rank }));

  const eliteCount = Math.min(pool.length, Math.max(3, Math.ceil(pool.length * 0.25)));
  const midCount = Math.min(
    Math.max(0, pool.length - eliteCount),
    Math.max(3, Math.ceil(pool.length * 0.45))
  );

  const elite = rankBucket(ranked.slice(0, eliteCount), seed, "elite");
  const middle = rankBucket(ranked.slice(eliteCount, eliteCount + midCount), seed, "middle");
  const discovery = rankBucket(ranked.slice(eliteCount + midCount), seed, "discovery");
  const selected = [];
  const used = new Set();

  const takeFrom = (bucket) => {
    const next = bucket.find((item) => !used.has(getSongId(item.song)));
    if (!next) return;
    selected.push(next);
    used.add(getSongId(next.song));
  };

  takeFrom(elite);
  if (requested > 1) takeFrom(middle.length ? middle : elite);
  if (requested > 2) takeFrom(discovery.length ? discovery : middle.length ? middle : elite);

  const rest = weightedRestOrder(
    ranked.filter((item) => !used.has(getSongId(item.song))),
    seed
  );

  return [...selected, ...rest].slice(0, requested).map((item) => item.song);
};
