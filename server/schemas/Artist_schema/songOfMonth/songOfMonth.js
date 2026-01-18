import { Song } from "../../../models/Artist/index_artist.js";
import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { SONG_OF_MONTH_KEY } from "../Redis/keys.js";

const getMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return { year, month, key: SONG_OF_MONTH_KEY(year, month) };
};

const getPreviousMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  if (month === 0) {
    return { year: year - 1, month: 12, key: SONG_OF_MONTH_KEY(year - 1, 12) };
  }
  return { year, month, key: SONG_OF_MONTH_KEY(year, month) };
};

const secondsUntilNextMonth = (date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));
  const diffMs = nextMonth.getTime() - date.getTime();
  return Math.max(60, Math.floor(diffMs / 1000));
};

const mapSongPayload = (song) => ({
  ...song,
  artistFollowers: Array.isArray(song.artist?.followers) ? song.artist.followers.length : 0,
  mood: song.mood || [],
  subMoods: song.subMoods || [],
  composer: Array.isArray(song.composer) ? song.composer : [],
  producer: Array.isArray(song.producer) ? song.producer : [],
  likesCount: song.likedByUsers?.length || song.likesCount || 0,
  downloadCount: song.downloadCount || 0,
  playCount: song.playCount || 0,
  shareCount: song.shareCount || 0,
  artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
});

export const songOfMonth = async () => {
  const now = new Date();
  const { key: currentKey } = getMonthKey(now);
  const { key: previousKey } = getPreviousMonthKey(now);

  let redis;
  try {
    redis = await getRedis();
  } catch {
    redis = null;
  }

  if (redis) {
    try {
      const cached = await redis.get(currentKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cachedId = parsed?.songId || parsed?._id;
        if (cachedId) {
          const cachedSong = await Song.findOne({
            _id: cachedId,
            visibility: { $ne: "private" },
          })
            .populate({
              path: "artist",
              select: "artistAka country bio followers artistDownloadCounts profileImage",
            })
            .populate({ path: "album", select: "title releaseDate albumCoverImage" })
            .lean();

          if (cachedSong) return mapSongPayload(cachedSong);
        }
      }
    } catch (error) {
      console.warn("Song of month cache read failed:", error?.message || error);
    }
  }

  let previousSongId = null;
  if (redis) {
    try {
      const previous = await redis.get(previousKey);
      if (previous) {
        const parsed = JSON.parse(previous);
        previousSongId = parsed?.songId || parsed?._id || null;
      }
    } catch (error) {
      console.warn("Song of month previous cache read failed:", error?.message || error);
    }
  }

  try {
    const query = { visibility: { $ne: "private" } };
    if (previousSongId) {
      query._id = { $ne: previousSongId };
    }

    const songs = await Song.find(query)
      .sort({ playCount: -1, trendingScore: -1, createdAt: -1 })
      .limit(20)
      .populate({
        path: "artist",
        select: "artistAka country bio followers artistDownloadCounts profileImage",
      })
      .populate({ path: "album", select: "title releaseDate albumCoverImage" })
      .lean();

    const topSong = songs[0];
    if (!topSong) return null;

    if (redis) {
      try {
        await redis.set(
          currentKey,
          JSON.stringify({ songId: String(topSong._id) }),
          { EX: secondsUntilNextMonth(now) }
        );
      } catch (error) {
        console.warn("Song of month cache write failed:", error?.message || error);
      }
    }

    return mapSongPayload(topSong);
  } catch (error) {
    console.error("Song of month error:", error);
    return null;
  }
};
