import crypto from 'crypto';

import { Song } from '../../../models/Artist/index_artist.js';
import { PlayCount } from '../../../models/User/user_index.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { addSongRedis } from '../Redis/addSongRedis.js';
import { updateSongRedis } from '../Redis/songCreateRedis.js';
import {
  PLAY_COOLDOWN_SECONDS,
  RECENT_PLAYED_CACHE_KEY,
  TRENDING_SONGS_CACHE_KEY,
  TRENDING_WEIGHTS,
  trendIndexZSet,
} from '../Redis/keys.js';

const normalizeVisitorId = (visitorId) => String(visitorId || '').trim();



const getViewerId = (context, visitorId) => {
  const normalizedVisitorId = normalizeVisitorId(visitorId);
  if (normalizedVisitorId) return `visitor:${normalizedVisitorId}`;




  const ip =
    context?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    context?.req?.ip ||
    '0.0.0.0';
  const ua = context?.req?.headers?.['user-agent'] || '';
  const anon = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
  return `anon:${anon}`;
};






const updateTrendingIndex = async ({ redisClient, songId, updatedSong }) => {
  const currentScore = await redisClient.zScore(trendIndexZSet, songId.toString());
  const songNewScore = Number(updatedSong.trendingScore || 0);

  if (currentScore !== null) {
    await redisClient.zAdd(trendIndexZSet, {
      score: (Number(currentScore) || 0) + TRENDING_WEIGHTS.PLAY_WEIGHT,
      value: songId.toString(),
    });
    return;
  }

  const trendingCount = await redisClient.zCard(trendIndexZSet);

  if (trendingCount < 20) {
    await redisClient.zAdd(trendIndexZSet, {
      score: songNewScore,
      value: songId.toString(),
    });
    return;
  }

  const lowestSongs = await redisClient.zRange(trendIndexZSet, 0, 0, {
    WITHSCORES: true,
  });
  const lowestEntry = Array.isArray(lowestSongs) ? lowestSongs[0] : null;
  const lowestScore = Number(
    typeof lowestEntry === 'object' && lowestEntry !== null
      ? lowestEntry.score
      : lowestSongs?.[1]
  );
  if (!Number.isFinite(lowestScore)) {
    await redisClient.zAdd(trendIndexZSet, {
      score: songNewScore,
      value: songId.toString(),
    });
    return;
  }
  if (songNewScore < lowestScore) return;

  const allLowestSongs = await redisClient.zRangeByScore(trendIndexZSet, lowestScore, lowestScore, {
    WITHSCORES: true,
  });
  const lowestSongIds = Array.isArray(allLowestSongs)
    ? allLowestSongs
        .map((entry, index) => {
          if (typeof entry === 'object' && entry !== null) return entry.value;
          return index % 2 === 0 ? entry : null;
        })
        .filter(Boolean)
    : [];
  let oldestSongId = lowestSongIds[0];

  if (lowestSongIds.length > 1) {
    const oldestSong = await Song.findOne({ _id: { $in: lowestSongIds } })
      .select('_id createdAt')
      .sort({ createdAt: 1 })
      .lean();

    if (oldestSong) {
      oldestSongId = oldestSong._id.toString();
    }
  }

  if (!oldestSongId) return;

  await redisClient.zRem(trendIndexZSet, oldestSongId);
  await redisClient.zAdd(trendIndexZSet, {
    score: songNewScore,
    value: songId.toString(),
  });
};

const setCooldownIfMissing = async (redisClient, cooldownKey, ttlSeconds) => {
  const result = await redisClient.sendCommand([
    'SET',
    cooldownKey,
    '1',
    'EX',
    String(ttlSeconds),
    'NX',
  ]);

  return result === 'OK';
};

export const handlePlayCount = async (_parent, { songId, visitorId }, context) => {


  const song = await Song.findById(songId).lean();
  if (!song) throw new Error('Song not found');



  if (context?.artist?._id && String(song.artist) === String(context.artist._id)) {
    return Song.findByIdAndUpdate(
      songId,
      { $set: { lastPlayedAt: new Date() } },
      { new: true, runValidators: true }
    );
  }

  const viewerId = getViewerId(context, visitorId);



  const redisClient = await getRedis();

  const cooldownKey = `cooldown:song:${songId}:viewer:${viewerId}`;



  const onCooldown = await redisClient.exists(cooldownKey);
  if (onCooldown) {
    return song;
  }

  const cooldownStarted = await setCooldownIfMissing(
    redisClient,
    cooldownKey,
    PLAY_COOLDOWN_SECONDS
  );

  if (!cooldownStarted) {
    return song;
  }

  const cooldownTtl = await redisClient.ttl(cooldownKey).catch(() => null);
  if (!Number.isFinite(cooldownTtl) || cooldownTtl <= 0) {
    console.warn('[playCount] cooldown key was not confirmed after SET:', {
      cooldownKey,
      cooldownStarted,
      cooldownTtl,
    });
  }

  const updatedSong = await Song.findByIdAndUpdate(
    songId,
    {
      $inc: {
        playCount: 1,
        trendingScore: TRENDING_WEIGHTS.PLAY_WEIGHT,
      },
      $set: { lastPlayedAt: new Date() },
    },
    { new: true, runValidators: true }
  );





  if (!updatedSong) throw new Error('Song not found');



  if (context?.user?._id) {
    try {
      await PlayCount.findOneAndUpdate(
        { user: context.user._id, played_songs: songId },
        {
          $set: { createdAt: new Date() },
          $inc: { count: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await redisClient.del(
        RECENT_PLAYED_CACHE_KEY(context.user._id, 4),
        RECENT_PLAYED_CACHE_KEY(context.user._id, 5),
        RECENT_PLAYED_CACHE_KEY(context.user._id, 10),
        RECENT_PLAYED_CACHE_KEY(context.user._id, 20),
        RECENT_PLAYED_CACHE_KEY(context.user._id, 50)
      );
    } catch (error) {
      console.warn('PlayCount update failed:', error?.message || error);
    }
  }

  try {
    try {
      await updateSongRedis(songId, {
        playCount: updatedSong.playCount,
        trendingScore: updatedSong.trendingScore,
        lastPlayedAt: updatedSong.lastPlayedAt,
      });
    } catch (updateError) {
      console.warn('[Redis] song cache missing/stale during play count sync; rebuilding:', {
        songId,
        error: updateError?.message || updateError,
      });
      await addSongRedis(songId, redisClient);
    }

    await updateTrendingIndex({ redisClient, songId, updatedSong });
    await redisClient.del(TRENDING_SONGS_CACHE_KEY);
  } catch (redisError) {
    console.warn('[Redis] play count sync skipped:', redisError?.message || redisError);
  }

  return updatedSong;
};
