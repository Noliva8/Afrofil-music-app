// helpers


const normId   = (v) => (v == null ? null : String(v));
const asArr    = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const setHasAny= (set, arr) => arr?.some(x => set.has(String(x)));
const pickPrimary = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null);
const tempoDiffOk = (a, b, win) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= win;

const stableSort = (arr, fns) =>
  [...arr].sort((a, b) => { for (const fn of fns) { const d = fn(a,b); if (d) return d; } return 0; });




// main
export function buildTrendingQueue(clickedSong, allTrendingSongs, opts = {}) {
  const {
    maxQueueSize = 50,
    capSameArtistFirstK = { cap: 2, window: 10 },
    capSameAlbumFirstK  = { cap: 1, window: 8 },
    w1 = 10, w2 = 15, w3 = 20, w4 = 25,            // tempo windows
    userAffinity = { artists: new Set(), genres: new Set(), moods: new Set() },
  } = opts;

  // --- normalize seed
  const seed = {
    id:        normId(clickedSong.id),
    artistId:  normId(clickedSong.artistId ?? clickedSong.artist),
    albumId:   normId(clickedSong.albumId  ?? clickedSong.album),
    genre:     clickedSong.genre || null,
    moods:     asArr(clickedSong.mood),
    subMoods:  asArr(clickedSong.subMoods),
    tempo:     Number(clickedSong.tempo),
    releaseDate: clickedSong.releaseDate ? new Date(clickedSong.releaseDate) : null,
    trendingScore: Number(clickedSong.trendingScore) || 0,
  };
  const seedPrimaryMood = pickPrimary(seed.moods);
  const seedPrimarySub  = pickPrimary(seed.subMoods);

  // --- normalize candidates
  const candidates = allTrendingSongs.map(s => ({
    raw: s,
    id:       normId(s.id),
    artistId: normId(s.artistId ?? s.artist),
    albumId:  normId(s.albumId  ?? s.album),
    genre:    s.genre || null,
    moods:    asArr(s.mood),
    subMoods: asArr(s.subMoods),
    tempo:    Number(s.tempo),
    releaseDate: s.releaseDate ? new Date(s.releaseDate) : null,
    trendingScore: Number(s.trendingScore) || 0,
  }));

  const usedIds = new Set([seed.id]);
  const queue = [{ ...clickedSong }]; // seed first

  const pushMany = (items) => {
    for (const it of items) {
      const id = normId(it.id ?? it._id);
      if (!id || usedIds.has(id)) continue;
      if (queue.length >= maxQueueSize) break;
      queue.push(it);
      usedIds.add(id);
    }
  };

  // tier helper
  const findBy = (pred, limit, tempoWin=null) => {
    const out = [];
    for (const c of candidates) {
      if (out.length >= limit) break;
      if (!c.id || usedIds.has(c.id) || c.id === seed.id) continue;
      if (!pred(c)) continue;
      if (tempoWin != null && !tempoDiffOk(c.tempo, seed.tempo, tempoWin)) continue;
      out.push(c.raw);
    }
    return out;
  };

  // P1: same artist + same album
  pushMany(findBy(c => c.artistId && c.albumId &&
                      c.artistId === seed.artistId && c.albumId === seed.albumId, 3));

  // P2: same artist (other albums)
  if (queue.length < maxQueueSize * 0.6) {
    pushMany(findBy(c => c.artistId && c.artistId === seed.artistId, 4));
  }

  // P3: featuring overlap (if present)
  if (Array.isArray(clickedSong.featuringArtist) && queue.length < maxQueueSize * 0.7) {
    const seedFeat = new Set(clickedSong.featuringArtist.map(String));
    pushMany(findBy(c => {
      const feat = asArr(c.raw.featuringArtist).map(String);
      return setHasAny(seedFeat, feat) || (c.artistId && seedFeat.has(c.artistId));
    }, 2));
  }

  // P4: genre + mood + subMood + tight tempo
  if (queue.length < maxQueueSize * 0.8) {
    pushMany(findBy(c =>
      c.genre === seed.genre &&
      (seedPrimaryMood ? c.moods.includes(seedPrimaryMood) : true) &&
      (seedPrimarySub  ? c.subMoods.includes(seedPrimarySub) : true)
    , 5, w1));
  }

  // P5: mood + subMood + looser tempo
  if (queue.length < maxQueueSize * 0.9) {
    pushMany(findBy(c =>
      (seedPrimaryMood ? c.moods.includes(seedPrimaryMood) : false) &&
      (seedPrimarySub  ? c.subMoods.includes(seedPrimarySub) : false)
    , 4, w2));
  }

  // P6: subMood + wider tempo
  if (queue.length < maxQueueSize) {
    pushMany(findBy(c =>
      (seedPrimarySub ? c.subMoods.includes(seedPrimarySub) : false)
    , 3, w3));
  }

  // P7: tempo only
  if (queue.length < maxQueueSize) {
    pushMany(findBy(_c => true, maxQueueSize - queue.length, w4));
  }

  // P8: recent fallback (stable order)
  if (queue.length < maxQueueSize) {
    const remaining = candidates
      .filter(c => !usedIds.has(c.id) && c.id !== seed.id)
      .map(c => c.raw)
      .sort((a, b) => {
        const ts = (Number(b.trendingScore)||0) - (Number(a.trendingScore)||0);
        if (ts) return ts;
        const rd = (new Date(b.releaseDate||0)) - (new Date(a.releaseDate||0));
        if (rd) return rd;
        return String(a.id).localeCompare(String(b.id));
      });
    pushMany(remaining.slice(0, maxQueueSize - queue.length));
  }

  // Diversity caps within first K
  const applyCap = (arr, keyFn, { cap, window }) => {
    const seen = new Map();
    for (let i = 1; i < Math.min(arr.length, window); i++) {
      const k = keyFn(arr[i]);
      if (!k) continue;
      const n = (seen.get(k) || 0) + 1;
      seen.set(k, n);
      if (n > cap) {
        for (let j = window; j < arr.length; j++) {
          const kj = keyFn(arr[j]);
          if (!kj || kj !== k) { const t = arr[i]; arr[i] = arr[j]; arr[j] = t; break; }
        }
      }
    }
  };
  applyCap(queue, s => normId(s.artistId ?? s.artist), capSameArtistFirstK);
  applyCap(queue, s => normId(s.albumId  ?? s.album),  capSameAlbumFirstK);

  // Light personalization on tail (optional; candidate-only)
  if (userAffinity) {
    const artistBoost = (s) => userAffinity.artists?.has(String(s.artistId ?? s.artist)) ? 1 : 0;
    const genreBoost  = (s) => s.genre && userAffinity.genres?.has(s.genre) ? 1 : 0;
    const moodBoost   = (s) => asArr(s.mood)?.some(m => userAffinity.moods?.has(m)) ? 1 : 0;
    const tempoSim    = (s) =>
      Number.isFinite(s.tempo) && Number.isFinite(seed.tempo)
        ? Math.exp(-Math.pow((s.tempo - seed.tempo) / 12, 2)) : 0;

    const head = queue.slice(0, Math.min(queue.length, 5));
    const tail = queue.slice(head.length);
    const reranked = stableSort(tail, [
      (a, b) => artistBoost(b) - artistBoost(a),
      (a, b) => genreBoost(b)  - genreBoost(a),
      (a, b) => moodBoost(b)   - moodBoost(a),
      (a, b) => tempoSim(b)    - tempoSim(a),
    ]);
    queue.splice(0, queue.length, ...head, ...reranked);
  }

  // Final de-dupe (defensive)
  const seen = new Set();
  const deduped = [];
  for (const s of queue) {
    const id = normId(s.id ?? s._id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push(s);
    if (deduped.length >= maxQueueSize) break;
  }

  return {
    queue: deduped,
    queueIds: deduped.map(s => normId(s.id ?? s._id)),
    currentIndex: 0,
  };
}
