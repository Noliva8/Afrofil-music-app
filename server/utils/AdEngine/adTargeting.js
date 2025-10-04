

export function withinSchedule(ad, now = Date.now()) {
  const s = ad?.schedule?.startDate ? new Date(ad.schedule.startDate).getTime() : 0;
  const e = ad?.schedule?.endDate ? new Date(ad.schedule.endDate).getTime() : 0;
  return now >= s && now <= e;
}

export function eligible(ad) {
  return (
    ad &&
    ad.status === 'active' &&
    ad.isApproved === true &&
    ad.isPaid === true &&
    withinSchedule(ad)
  );
}

export function matchesTargeting(ad, userLoc) {
  const t = ad.targeting || {};
  const scope = t.scope;

  if (scope === 'worldwide') return true;

  if (scope === 'country') {
    if (t.wholeCountry && userLoc?.country) return true;
    if (Array.isArray(t.countries) && userLoc?.country) {
      return t.countries.includes(userLoc.country);
    }
    return false;
  }

  if (scope === 'city') {
    if (!userLoc?.country) return false;
    const countryOk = Array.isArray(t.countries) ? t.countries.includes(userLoc.country) : true;
    if (!countryOk) return false;
    const stateOk = t.state ? t.state === userLoc.state : true;
    const cityOk  = t.city  ? t.city  === userLoc.city  : true;
    return stateOk && cityOk;
  }

  // default: conservative
  return false;
}

export function scoreAd(ad) {
  const price = ad?.pricing?.dailyRate ?? ad?.pricing?.totalCost ?? 0;
  return Number(price) || 0;
}

export function pickCreativePointer(ad, deviceSupport = { opus: true }) {
  const type = (ad.adType || '').toLowerCase();

  if (type === 'audio') {
    if (deviceSupport.opus && ad.streamingAudioAdUrl)
      return { codec: 'opus', pointer: ad.streamingAudioAdUrl };
    if (ad.streamingFallBackAudioUrl)
      return { codec: 'aac', pointer: ad.streamingFallBackAudioUrl };
    if (ad.masterAudionAdUrl)
      return { codec: 'aac', pointer: ad.masterAudionAdUrl };
    return null;
  }

  const ptr =
    ad.streamingOverlayAdUrl ||
    ad.streamingBannerAdUrl ||
    ad.originalOverlayUrl ||
    ad.originalBannerAdUrl ||
    null;

  return ptr ? { codec: 'image', pointer: ptr } : null;
}
