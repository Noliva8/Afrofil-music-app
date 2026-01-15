import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { PLAYBACK_SONGS } from "../Redis/keys.js";




export const playbackSession = async (_parent, _args, context) => {
  const userId = context.user?._id;
  if (!userId) return null;

  const client = await getRedis();
  const key = PLAYBACK_SONGS(userId);

  // If key doesn’t exist or expired → null
  const exists = await client.exists(key);
  if (!exists) return null;

  const data = await client.json.get(key, '$');
  // RedisJSON returns an array when using '$' path
  const value = Array.isArray(data) ? data[0] : data;

  if (!value || !value.track) return null;

  // tack on updatedAt (optional)
  return {
    ...value,
    updatedAt: new Date().toISOString(),
  };
};
