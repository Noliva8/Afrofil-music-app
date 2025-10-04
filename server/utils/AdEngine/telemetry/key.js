

export const keys = {
  userFirstSeen: (uid) => `user:${uid}:first_seen_ts`,
  userDailyAds:  (uid) => `user:${uid}:daily_ads`,
  userPremium:   (uid) => `user:${uid}:is_premium`,
  userTime:      (uid) => `user:${uid}:time_spent_secs`,
  userLastGeo:   (uid) => `user:${uid}:last_geo`,      // JSON string (TTL ~6h)

  sessStart:     (sid) => `sess:${sid}:start_ts`,
  sessSongsFull: (sid) => `sess:${sid}:songs_full`,
  sessSongsSkip: (sid) => `sess:${sid}:songs_skip`,
  sessSongs:     (sid) => `sess:${sid}:songs_played`,
  sessTime:      (sid) => `sess:${sid}:time_spent_secs`,
  sessLastAdTs:  (sid) => `sess:${sid}:last_ad_ts`,
};
