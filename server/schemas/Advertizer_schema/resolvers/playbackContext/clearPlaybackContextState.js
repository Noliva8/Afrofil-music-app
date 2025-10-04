import { getRedis } from "../../../../utils/AdEngine/redis/redisClient.js";



export async function clearPlaybackContextState(_, { userId }) {
  const redis = await getRedis();
  const key = userId ? `ctx:user:${userId}` : null;
  if (!key) return false;
  await redis.del(key);
  return true;
}
