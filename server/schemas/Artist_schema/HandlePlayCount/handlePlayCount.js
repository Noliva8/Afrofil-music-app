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
  songKey,
  trendIndexZSet,
} from '../Redis/keys.js';
import { songHashExpiration } from '../Redis/redisExpiration.js';

const getViewerId = (context) => {
  if (context?.user?._id) return `user:${String(context.user._id)}`;
  if (context?.artist?._id) return `artist:${String(context.artist._id)}`;

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

  if (currentScore !== null) {
    await redisClient.zAdd(trendIndexZSet, {
      score: parseFloat(currentScore) + TRENDING_WEIGHTS.PLAY_WEIGHT,
      value: songId.toString(),
    });
    return;
  }

  const songNewScore = updatedSong.trendingScore;
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
  const lowestScore = parseFloat(lowestSongs[1]);
  if (songNewScore < lowestScore) return;

  const allLowestSongs = await redisClient.zRangeByScore(trendIndexZSet, lowestScore, lowestScore, {
    WITHSCORES: true,
  });
  let oldestSongId = allLowestSongs[0];

  if (allLowestSongs.length > 2) {
    const songIds = [];
    for (let i = 0; i < allLowestSongs.length; i += 2) {
      songIds.push(allLowestSongs[i]);
    }

    const oldestSong = await Song.findOne({ _id: { $in: songIds } })
      .select('_id createdAt')
      .sort({ createdAt: 1 })
      .lean();

    if (oldestSong) {
      oldestSongId = oldestSong._id.toString();
    }
  }

  await redisClient.zRem(trendIndexZSet, oldestSongId);
  await redisClient.zAdd(trendIndexZSet, {
    score: songNewScore,
    value: songId.toString(),
  });
};

export const handlePlayCount = async (_parent, { songId }, context) => {
  const song = await Song.findById(songId).lean();
  if (!song) throw new Error('Song not found');

  if (context?.artist?._id && String(song.artist) === String(context.artist._id)) {
    return Song.findByIdAndUpdate(
      songId,
      { $set: { lastPlayedAt: new Date() } },
      { new: true, runValidators: true }
    );
  }

  const viewerId = getViewerId(context);
  const redisClient = await getRedis();
  const cooldownKey = `cooldown:song:${songId}:viewer:${viewerId}`;
  const onCooldown = await redisClient.exists(cooldownKey);

  const updatedSong = await Song.findByIdAndUpdate(
    songId,
    onCooldown
      ? { $set: { lastPlayedAt: new Date() } }
      : {
          $inc: {
            playCount: 1,
            trendingScore: TRENDING_WEIGHTS.PLAY_WEIGHT,
          },
          $set: { lastPlayedAt: new Date() },
        },
    { new: true, runValidators: true }
  );
  if (!updatedSong) throw new Error('Song not found');

  if (!onCooldown) {
    try {
      await redisClient.set(cooldownKey, '1', { EX: PLAY_COOLDOWN_SECONDS, NX: true });
    } catch (cooldownError) {
      console.warn('Cooldown setting failed:', cooldownError?.message || cooldownError);
    }
  }

  if (context?.user?._id) {
    try {
      await PlayCount.findOneAndUpdate(
        { user: context.user._id, played_songs: songId },
        {
          $set: { createdAt: new Date() },
          $inc: { count: onCooldown ? 0 : 1 },
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
    const songCacheKey = songKey(songId);
    const songExists = await redisClient.exists(songCacheKey);

    if (songExists) {
      if (!onCooldown) {
        await updateSongRedis(songId, {
          playCount: updatedSong.playCount,
          trendingScore: updatedSong.trendingScore,
          lastPlayedAt: updatedSong.lastPlayedAt,
        });
      }
      await redisClient.expire(songCacheKey, songHashExpiration);
    } else {
      await addSongRedis(songId, redisClient);
    }

    if (!onCooldown) {
      await updateTrendingIndex({ redisClient, songId, updatedSong });
      await redisClient.del(TRENDING_SONGS_CACHE_KEY);
    }
  } catch (redisError) {
    console.warn('[Redis] play count sync skipped:', redisError?.message || redisError);
  }

  return updatedSong;
};
