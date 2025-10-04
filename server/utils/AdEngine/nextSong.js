
import { getRedis } from './redis/redisClient.js';
import { K } from './redis/redisSchema.js';
import { getSongMetaCached } from './songCashe.js';

const norm = (s) => (s ?? '').toString().trim().replace(/[_-]+/g, ' ').toLowerCase();
const parseJSON = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

async function recentSet(r, userId, cap = 50) {
  const arr = await r.lRange(K.userRecentSongs(userId), 0, cap - 1);
  return new Set(arr);
}

/** Get submoods array from meta (supports legacy single subMood) */
function getMetaSubMoods(meta) {
  const arr = parseJSON(meta?.subMoodsJson) || [];
  const single = meta?.subMood ? [norm(meta.subMood)] : [];
  const all = [...arr, ...single].map(norm).filter(Boolean);
  return Array.from(new Set(all));
}

// deterministic but varied choice per user/day
function stablePick(list, userId) {
  if (!list.length) return null;
  const day = new Date().toISOString().slice(0, 10);
  const hash = (str) => [...(str + day)].reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  const i = Math.abs(hash(userId + '|' + list.length)) % list.length;
  return list[i];
}

/**
 * Recommend the next song after a FULL play, using strict facet fallback:
 * Start strict → progressively relax: drop album → genre → mood → subMood → tempo → country → any.
 *
 * @param {{ userId:string, currentSongId:string }} ctx
 * @returns {Promise<string|null>} nextSongId or null
 */
export async function recommendNextAfterFull(ctx) {
  const r = await getRedis();
  const { userId, currentSongId } = ctx;

  // hydrate-on-miss (Mongo -> Redis) and read normalized meta
  const meta = await getSongMetaCached(currentSongId);
  if (!meta || !Object.keys(meta).length) return null;

  // Fill tempo bucket if missing
  if (!meta.tempoBucket && meta.tempoBpm) {
    const bpm = Number(meta.tempoBpm || 0);
    meta.tempoBucket = bpm <= 0 ? '' : (bpm < 85 ? 'slow' : bpm < 110 ? 'mid' : bpm < 135 ? 'fast' : 'veryfast');
  }

  const metaSubMoods = getMetaSubMoods(meta);
  const recent = await recentSet(r, userId);
  recent.add(currentSongId); // avoid immediate repeat

  // Fallback plan
  const plan = [
    { artist: true, album: true, genre: true, mood: true, subMood: true, tempo: true, country: true },
    { artist: true,              genre: true, mood: true, subMood: true, tempo: true, country: true },
    { artist: true,                        mood: true, subMood: true, tempo: true, country: true },
    { artist: true,                                   subMood: true, tempo: true, country: true },
    { artist: true,                                                  tempo: true, country: true },
    { artist: true,                                                                country: true },

    {              genre: true, mood: true, subMood: true, tempo: true, country: true },
    {                         mood: true, subMood: true, tempo: true, country: true },
    {                                    subMood: true, tempo: true, country: true },
    {                                                   tempo: true, country: true },
    {                                                                country: true },

    { /* any */ },
  ];

  for (const req of plan) {
    const keys = [];
    if (req.artist && meta.artistId)       keys.push(K.idxSongArtist(meta.artistId));
    if (req.album && meta.albumId)         keys.push(K.idxSongAlbum(meta.albumId));
    if (req.genre && meta.genre)           keys.push(K.idxSongGenre(norm(meta.genre)));
    if (req.mood && meta.mood)             keys.push(K.idxSongMood(norm(meta.mood)));
    if (req.tempo && meta.tempoBucket)     keys.push(K.idxSongTempo(norm(meta.tempoBucket)));
    if (req.country && meta.artistCountry) keys.push(K.idxSongCountry(norm(meta.artistCountry)));

    let tmpSubUnionKey = null;
    try {
      if (req.subMood && metaSubMoods.length) {
        if (metaSubMoods.length === 1) {
          keys.push(K.idxSongSubMood(metaSubMoods[0]));
        } else {
          tmpSubUnionKey = `tmp:submood:union:${Math.random().toString(36).slice(2, 10)}`;
          await r.sUnionStore(tmpSubUnionKey, metaSubMoods.map((sm) => K.idxSongSubMood(sm)));
          keys.push(tmpSubUnionKey);
        }
      }

      let candidates = [];
      if (keys.length === 0) {
        // "any" fallback — try genre chart then global
        if (meta.genre) candidates = await r.lRange(K.genreTopTracks(norm(meta.genre)), 0, 199);
        if (!candidates.length) candidates = await r.lRange(K.genreTopTracks('global'), 0, 199);
      } else {
        candidates = await r.sInter(keys);
      }

      // filter recent + self
      const filtered = (candidates || []).filter((sid) => !recent.has(sid));
      if (!filtered.length) continue;

      // liked boost
      const liked = new Set(await r.sMembers(K.userLikedSongs(userId)));
      const likedFirst = filtered.sort((a, b) => (liked.has(b) - liked.has(a)));

      const pick = stablePick(likedFirst, userId) || likedFirst[0];
      if (pick) return pick;
    } finally {
      if (tmpSubUnionKey) {
        try { await r.del(tmpSubUnionKey); } catch {}
      }
    }
  }

  return null;
}
