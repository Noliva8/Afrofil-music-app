import { GraphQLError } from 'graphql';
import { pubsub } from '../../../utils/ pubsub.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import {
  USER_PRESENCE_KEY_PATTERN,
  USER_PRESENCE_TTL_SECONDS,
  userPresenceKey,
} from '../../Artist_schema/Redis/keys.js';

export const ONLINE_USER_PRESENCE_STATS_UPDATED = 'ONLINE_USER_PRESENCE_STATS_UPDATED';
const PRESENCE_STATS_PUBLISH_INTERVAL_MS = 30000;

let presenceStatsPublisherId = null;

const logPresenceDebug = (...args) => {
  if (process.env.PRESENCE_DEBUG === 'true') {
    console.log('[presence]', ...args);
  }
};

const normalizeId = (value) => String(value || '').trim();
const normalizeAction = (value) => {
  const action = String(value || '').trim().toLowerCase();
  return action === 'uploading' ? 'uploading' : 'browsing';
};

const buildPresenceId = ({ visitorId, userId, artistId }) => {
  const normalizedVisitorId = normalizeId(visitorId);
  const normalizedUserId = normalizeId(userId);
  const normalizedArtistId = normalizeId(artistId);

  if (normalizedArtistId) {
    return `artist:${normalizedArtistId}`;
  }

  if (normalizedUserId) {
    return `user:${normalizedUserId}`;
  }

  return `visitor:${normalizedVisitorId}`;
};

const scanPresenceKeys = async (redis) => {
  const keys = [];

  for await (const entry of redis.scanIterator({
    MATCH: USER_PRESENCE_KEY_PATTERN,
    COUNT: 100,
  })) {
    if (Array.isArray(entry)) {
      keys.push(...entry);
    } else if (entry) {
      keys.push(entry);
    }
  }

  if (!keys.length && typeof redis.keys === 'function') {
    const fallbackKeys = await redis.keys(USER_PRESENCE_KEY_PATTERN);
    logPresenceDebug('scan found no keys; KEYS fallback:', {
      pattern: USER_PRESENCE_KEY_PATTERN,
      count: fallbackKeys.length,
      sample: fallbackKeys.slice(0, 5),
    });
    return fallbackKeys;
  }

  logPresenceDebug('scan result:', {
    pattern: USER_PRESENCE_KEY_PATTERN,
    count: keys.length,
    sample: keys.slice(0, 5),
  });

  return keys;
};

export const recordUserPresence = async (_parent, { input }, context = {}) => {
  const visitorId = normalizeId(input?.visitorId);
  const userId = normalizeId(input?.userId || context.user?._id);
  const artistId = normalizeId(input?.artistId || context.artist?._id);

  if (!visitorId) {
    throw new GraphQLError('visitorId is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const redis = await getRedis();
  const now = Date.now();
  const action = normalizeAction(input?.action);
  const isPlaying = Boolean(input?.isPlaying);
  const presenceId = buildPresenceId({ visitorId, userId, artistId });
  const previousPresenceId = normalizeId(input?.previousPresenceId);
  const stalePresenceIds = new Set();

  if (previousPresenceId && previousPresenceId !== presenceId) {
    stalePresenceIds.add(previousPresenceId);
  }

  if (artistId) {
    if (userId) stalePresenceIds.add(buildPresenceId({ visitorId, userId }));
    stalePresenceIds.add(buildPresenceId({ visitorId }));
  } else if (userId) {
    stalePresenceIds.add(buildPresenceId({ visitorId }));
  }

  stalePresenceIds.delete(presenceId);

  const key = userPresenceKey(presenceId);

  const pipe = redis.multi();

  stalePresenceIds.forEach((stalePresenceId) => {
    pipe.del(userPresenceKey(stalePresenceId));
  });

  await pipe
    .hSet(key, {
      action,
      isPlaying: isPlaying ? '1' : '0',
      fullPath: input?.fullPath || input?.pathname || '',
    })
    .expire(key, USER_PRESENCE_TTL_SECONDS)
    .exec();

  logPresenceDebug('recorded:', {
    presenceId,
    action,
    isPlaying,
    key,
    stalePresenceIds: [...stalePresenceIds],
    ttlSeconds: USER_PRESENCE_TTL_SECONDS,
  });

  await publishOnlineUserPresenceStats();

  return {
    ok: true,
    presenceId,
    action,
    isPlaying,
    lastSeenAt: new Date(now),
  };
};

export const onlineUserPresenceStats = async () => {
  const redis = await getRedis();
  const keys = await scanPresenceKeys(redis);

  if (!keys.length) {
    if (typeof redis.keys === 'function') {
      const presenceKeys = await redis.keys('presence:*');
      logPresenceDebug('no user presence keys found; broader presence sample:', {
        count: presenceKeys.length,
        sample: presenceKeys.slice(0, 10),
      });
    }

    return {
      totalOnline: 0,
      browsing: 0,
      uploading: 0,
      playing: 0,
    };
  }

  const records = (await Promise.all(keys.map(async (key) => {
    const type = await redis.type(key);

    if (type !== 'hash') {
      logPresenceDebug('skipping non-hash presence key:', { key, type });
      return null;
    }

    const record = await redis.hGetAll(key);
    return record && Object.keys(record).length > 0 ? record : null;
  }))).filter(Boolean);

  const uploading = records.filter((record) => record.action === 'uploading').length;
  const playing = records.filter((record) => record.isPlaying === '1').length;
  const browsing = records.length - uploading;

  return {
    totalOnline: records.length,
    browsing,
    uploading,
    playing,
  };
};

export const publishOnlineUserPresenceStats = async () => {
  try {
    const stats = await onlineUserPresenceStats();

    await pubsub.publish(ONLINE_USER_PRESENCE_STATS_UPDATED, {
      onlineUserPresenceStatsUpdated: stats,
    });

    logPresenceDebug('published stats:', stats);

    return stats;
  } catch (error) {
    console.error('[presence] failed to publish presence stats:', error?.message || error);
    return null;
  }
};

export const startOnlineUserPresenceStatsPublisher = () => {
  if (presenceStatsPublisherId) {
    return presenceStatsPublisherId;
  }

  presenceStatsPublisherId = setInterval(
    publishOnlineUserPresenceStats,
    PRESENCE_STATS_PUBLISH_INTERVAL_MS
  );

  return presenceStatsPublisherId;
};
