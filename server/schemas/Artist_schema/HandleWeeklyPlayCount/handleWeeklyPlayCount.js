import crypto from 'crypto';

import { Song } from '../../../models/Artist/index_artist.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { addSongRedis } from '../Redis/addSongRedis.js';
import { updateSongRedis } from '../Redis/songCreateRedis.js';

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};



const firstNumberFromEnv = (values, fallback) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

const INITIAL_GRAND_PRIZE_MIN_PLAYS =
  numberFromEnv(process.env.PLAYS_NEEDED_TO_WIN_MAXIMUM_PRIZE_INITIALLY, 1000);
const REPEAT_ARTIST_MIN_PLAYS =
  numberFromEnv(process.env.SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_PLAYS, 1000);
const REPEAT_ARTIST_MIN_LIKES =
  numberFromEnv(process.env.SONG_OF_THE_WEEK_REPEAT_ARTIST_MIN_LIKES, 100);
const MIN_WEEKLY_LISTEN_SECONDS =
  firstNumberFromEnv(
    [
      process.env.SEC_NEEDED_TO_WIN_MAXIMUM_PRIZE,
      process.env.VITE_SEC_NEEDED_TO_WIN_MAXIMUM_PRIZE,
    ],
    30
  );
const WEEKLY_PLAY_COOLDOWN_SECONDS =
  numberFromEnv(process.env.SONG_OF_THE_WEEK_PLAY_COOLDOWN_SECONDS, 30 * 60);

const getSongOfTheWeekStartDate = (date = new Date()) => {
  const weekStartDate = new Date(date);
  const daysSinceSaturday = (weekStartDate.getUTCDay() + 1) % 7;
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - daysSinceSaturday);
  weekStartDate.setUTCHours(0, 0, 0, 0);
  return weekStartDate;
};

const getSongOfTheWeekEndDate = (weekStartDate) => {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  weekEndDate.setUTCHours(11, 59, 0, 0);
  return weekEndDate;
};

const isSameSongOfTheWeekWindow = (songWeekStartDate, currentWeekStartDate) => {
  if (!songWeekStartDate) return false;
  return new Date(songWeekStartDate).getTime() === currentWeekStartDate.getTime();
};

const normalizeVisitorId = (visitorId) => String(visitorId || '').trim();

const getViewerId = (context, visitorId) => {
  const normalizedVisitorId = normalizeVisitorId(visitorId);
  if (normalizedVisitorId) return `visitor:${normalizedVisitorId}`;

  const ip =
    (context?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()) ||
    context?.req?.ip ||
    '0.0.0.0';
  const ua = context?.req?.headers?.['user-agent'] || '';
  const anon = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
  return `anon:${anon}`;
};

const songMeetsSongOfTheWeekRepeatThreshold = (song) =>
  Number(song?.weeklyPlayCount || 0) >= REPEAT_ARTIST_MIN_PLAYS &&
  Number(song?.weeklyLikeCount || 0) >= REPEAT_ARTIST_MIN_LIKES;

const songMeetsSongOfTheWeekGrandPrizeThreshold = (song) =>
  Number(song?.weeklyPlayCount || 0) >= INITIAL_GRAND_PRIZE_MIN_PLAYS;

const updateSongOfTheWeekCriteriaReachedAt = async ({
  song,
  weekStartDate,
  now = new Date(),
}) => {
  if (!song?._id || !isSameSongOfTheWeekWindow(song.weekStartDate, weekStartDate)) return song;

  const $set = {};
  if (songMeetsSongOfTheWeekGrandPrizeThreshold(song)) {
    if (!song.songOfTheWeekGrandPrizeCriteriaReachedAt) {
      $set.songOfTheWeekGrandPrizeCriteriaReachedAt = now;
    }
  } else if (song.songOfTheWeekGrandPrizeCriteriaReachedAt) {
    $set.songOfTheWeekGrandPrizeCriteriaReachedAt = null;
  }

  if (songMeetsSongOfTheWeekRepeatThreshold(song)) {
    if (!song.songOfTheWeekRepeatCriteriaReachedAt) {
      $set.songOfTheWeekRepeatCriteriaReachedAt = now;
    }
  } else if (song.songOfTheWeekRepeatCriteriaReachedAt) {
    $set.songOfTheWeekRepeatCriteriaReachedAt = null;
  }

  if (Object.keys($set).length === 0) return song;
  return Song.findByIdAndUpdate(song._id, { $set }, { new: true, runValidators: true });
};

const updateSongOfTheWeekCriteriaReachedAtBestEffort = async ({
  song,
  weekStartDate,
  now = new Date(),
}) => {
  try {
    return await updateSongOfTheWeekCriteriaReachedAt({ song, weekStartDate, now });
  } catch (error) {
    console.warn('[songOfTheWeek] criteria timestamp update skipped:', error?.message || error);
    return song;
  }
};

const resetSongOfTheWeekCountersIfNeeded = async (redisClient, weekStartDate, weekEndDate) => {
  const resetKey = `song-of-the-week:reset:${weekStartDate.toISOString().slice(0, 10)}`;
  const acquired = await redisClient.set(resetKey, '1', {
    EX: 8 * 24 * 60 * 60,
    NX: true,
  });

  if (!acquired) return;

  try {
    const staleWeekFilter = {
      $or: [
        { weekStartDate: { $exists: false } },
        { weekStartDate: null },
        { weekStartDate: { $ne: weekStartDate } },
      ],
    };

    await Song.updateMany(
      staleWeekFilter,
      [
        {
          $set: {
            previousWeekPlayCount: { $ifNull: ['$weeklyPlayCount', 0] },
          },
        },
      ]
    );

    await Song.updateMany(
      staleWeekFilter,
      {
        $set: {
          weekStartDate,
          weekEndDate,
          weeklyPlayCount: 0,
          weeklyLikeCount: 0,
          weeklyShareCount: 0,
          weeklyDownloadCount: 0,
          songOfTheWeekGrandPrizeCriteriaReachedAt: null,
          songOfTheWeekRepeatCriteriaReachedAt: null,
        },
      }
    );
  } catch (error) {
    await redisClient.del(resetKey).catch(() => {});
    throw error;
  }
};

// -------------------------------------------------

export const handleWeeklyPlayCount = async (
  _parent,
  { songId, visitorId, listenedSeconds = 0 },
  context
) => {




  console.log('HANDLE WEEKLY PLAY COUNT IS CALLED:', { songId, visitorId, listenedSeconds });




  const song = await Song.findById(songId).lean();
  if (!song) throw new Error('Song not found');

  if (context?.artist?._id && String(song.artist) === String(context.artist._id)) {
    console.log('[SongOfTheWeek] weekly play skipped: owner playback', {
      songId,
      artistId: String(context.artist._id),
    });
    return song;
  }

  if (Number(listenedSeconds || 0) < MIN_WEEKLY_LISTEN_SECONDS) {
    console.log('[SongOfTheWeek] weekly play skipped: listen seconds below minimum', {
      songId,
      listenedSeconds,
      requiredSeconds: MIN_WEEKLY_LISTEN_SECONDS,
    });
    return song;
  }

  const r = await getRedis();
  const weekStartDate = getSongOfTheWeekStartDate();
  const weekEndDate = getSongOfTheWeekEndDate(weekStartDate);

  try {
    await resetSongOfTheWeekCountersIfNeeded(r, weekStartDate, weekEndDate);
  } catch (resetError) {
    console.warn('[SongOfTheWeek] weekly reset skipped:', resetError?.message || resetError);
  }

  const viewerId = getViewerId(context, visitorId);
  const cooldownKey = `song-of-the-week:play-cooldown:song:${songId}:viewer:${viewerId}`;
  const cooldownStarted = await r.set(cooldownKey, '1', {
    EX: WEEKLY_PLAY_COOLDOWN_SECONDS,
    NX: true,
  });

  if (!cooldownStarted) {
    console.log('[SongOfTheWeek] weekly play skipped: viewer cooldown active', {
      songId,
      viewerId,
      cooldownSeconds: WEEKLY_PLAY_COOLDOWN_SECONDS,
    });
    return Song.findById(songId).lean();
  }

  const isCurrentWeek = isSameSongOfTheWeekWindow(song.weekStartDate, weekStartDate);
  const weeklyUpdate = {
    $set: {
      weekStartDate,
      weekEndDate,
    },
    $inc: {
      weeklyPlayCount: 1,
    },
  };

  if (!isCurrentWeek) {
    weeklyUpdate.$set.weeklyPlayCount = 1;
    weeklyUpdate.$set.weeklyLikeCount = 0;
    weeklyUpdate.$set.weeklyShareCount = 0;
    weeklyUpdate.$set.weeklyDownloadCount = 0;
    weeklyUpdate.$set.songOfTheWeekGrandPrizeCriteriaReachedAt = null;
    weeklyUpdate.$set.songOfTheWeekRepeatCriteriaReachedAt = null;
    delete weeklyUpdate.$inc.weeklyPlayCount;
  }

  let updatedSong = await Song.findByIdAndUpdate(songId, weeklyUpdate, {
    new: true,
    runValidators: true,
  });
  if (!updatedSong) throw new Error('Song not found');

  updatedSong = await updateSongOfTheWeekCriteriaReachedAtBestEffort({
    song: updatedSong,
    weekStartDate,
    now: new Date(),
  });

  try {
    try {
      await updateSongRedis(songId, {
        weekStartDate: updatedSong.weekStartDate,
        weekEndDate: updatedSong.weekEndDate,
        weeklyPlayCount: updatedSong.weeklyPlayCount,
        weeklyLikeCount: updatedSong.weeklyLikeCount,
        weeklyShareCount: updatedSong.weeklyShareCount,
        weeklyDownloadCount: updatedSong.weeklyDownloadCount,
        songOfTheWeekGrandPrizeCriteriaReachedAt: updatedSong.songOfTheWeekGrandPrizeCriteriaReachedAt,
        songOfTheWeekRepeatCriteriaReachedAt: updatedSong.songOfTheWeekRepeatCriteriaReachedAt,
      });
    } catch (updateError) {
      console.warn('[Redis] song cache missing/stale during weekly play count sync; rebuilding:', {
        songId,
        error: updateError?.message || updateError,
      });
      await addSongRedis(songId, r);
    }
  } catch (redisError) {
    console.warn('[Redis] weekly play count sync skipped:', redisError?.message || redisError);
  }

  return updatedSong;
};
