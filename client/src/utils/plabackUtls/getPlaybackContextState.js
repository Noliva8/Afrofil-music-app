


const lower = (s) => (s ?? "").toString().trim().toLowerCase();

export function parseContextUri(uri) {
  if (!uri) return null;
  const parts = String(uri).split(':'); // e.g. ["afrofeel","trending","global","2025-09-20"]
  if (parts.length < 2) return null;
  return {
    ns: lower(parts[0]),
    kind: lower(parts[1]),
    args: parts.slice(2),
    raw: uri,
  };
}

// ==== derivations (prefer URI; never require sourceId) ====
export function deriveTrendingKey(uri) {
  const p = parseContextUri(uri);
  if (!p || p.kind !== 'trending') return 'trending:global';
  const [region, date] = p.args;
  return ['trending', region || 'global', date || ''].filter(Boolean).join(':');
}

export const derivePlaylistId = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'playlist' ? p.args[0] || null : null;
};

export const deriveAlbumId = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'album' ? p.args[0] || null : null;
};

export const deriveArtistId = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'artist' ? p.args[0] || null : null;
};

export function deriveChartKey(uri) {
  const p = parseContextUri(uri);
  if (!p || p.kind !== 'chart') return null;
  const [region, date] = p.args;
  return ['chart', region || 'global', date || ''].filter(Boolean).join(':');
}

export const deriveStationKey = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'station' ? p.args[0] || null : null;
};

export const deriveGenreKey = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'genre' ? p.args[0] || null : null;
};

export const deriveMoodKey = (uri) => {
  const p = parseContextUri(uri);
  return p && p.kind === 'mood' ? p.args[0] || null : null;
};

export function deriveRadioSeed(uri) {
  const p = parseContextUri(uri);
  if (!p || p.kind !== 'radio') return null;
  const [seedType, seedId] = p.args; // e.g. radio:track:<id> or radio:artist:<id>
  if (!seedType || !seedId) return null;
  return { type: lower(seedType), id: seedId };
}

export function deriveSearchQuery(uri) {
  const p = parseContextUri(uri);
  if (!p || p.kind !== 'search') return null;
  try { return decodeURIComponent(p.args.join(':') || ''); }
  catch { return p.args.join(':') || ''; }
}



// NOTE: assume these data fetchers already exist:
/// fetchTrendingIds(key), fetchPlaylistIds(id), fetchAlbumIds(id), fetchArtistTopIds(id)
/// fetchChartIds(key), fetchStationIds(key), fetchGenreTopIds(key), fetchMoodTopIds(key)
/// fetchRadioSeedIds(seed), fetchSearchResultIds(query)

export async function resolveTrackIdsFromBlock(source, /* sourceId */ _unused, ctx = {}) {
  const s = (source || '').toString().toUpperCase();
  const uri = ctx.contextUri || '';

  switch (s) {
    case 'TRENDING': {
      const key = deriveTrendingKey(uri);
      return fetchTrendingIds(key);
    }
    case 'PLAYLIST': {
      const id = derivePlaylistId(uri) /* fallback: || ctx.sourceId */;
      return id ? fetchPlaylistIds(id) : [];
    }
    case 'ALBUM': {
      const id = deriveAlbumId(uri) /* || ctx.sourceId */;
      return id ? fetchAlbumIds(id) : [];
    }
    case 'ARTIST': {
      const id = deriveArtistId(uri) /* || ctx.sourceId */;
      return id ? fetchArtistTopIds(id) : [];
    }
    case 'CHART': {
      const key = deriveChartKey(uri) /* || ctx.sourceId */;
      return key ? fetchChartIds(key) : [];
    }
    case 'STATION': {
      const key = deriveStationKey(uri) /* || ctx.sourceId */;
      return key ? fetchStationIds(key) : [];
    }
    case 'GENRE': {
      const key = deriveGenreKey(uri);
      return key ? fetchGenreTopIds(key) : [];
    }
    case 'MOOD': {
      const key = deriveMoodKey(uri);
      return key ? fetchMoodTopIds(key) : [];
    }
    case 'RADIO': {
      const seed = deriveRadioSeed(uri) || (ctx.radioSeed && { type: 'track', id: ctx.radioSeed });
      return seed ? fetchRadioSeedIds(seed) : [];
    }
    case 'SEARCH': {
      const q = deriveSearchQuery(uri) || ctx.searchQuery;
      return q ? fetchSearchResultIds(q) : [];
    }
    // Liked/Recent/History/User-generated can also use contextUri if you encode them:
    // afrofeel:liked, afrofeel:recent, afrofeel:history, afrofeel:user_generated:<listId?>
    case 'LIKED':    return fetchLikedTrackIds?.() || [];
    case 'RECENT':   return fetchRecentTrackIds?.() || [];
    case 'HISTORY':  return fetchHistoryTrackIds?.() || [];
    case 'USER_GENERATED': {
      const listId = parseContextUri(uri)?.args?.[0] || ctx.sourceId || null;
      return listId ? fetchUserGeneratedListIds(listId) : [];
    }
    default:
      return [];
  }
}
