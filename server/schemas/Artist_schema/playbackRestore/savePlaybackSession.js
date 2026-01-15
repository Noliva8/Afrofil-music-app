import { getRedis } from "../../../utils/AdEngine/redis/redisClient.js";
import { PLAYBACK_SONGS } from "../Redis/keys.js";

export const savePlaybackSession = async (_, { data }, context) => {
  const userId = context.user?._id;
  if (!userId) {
    // console.log("User is not logged in");
    return false;
  }

  try {
    const client = await getRedis();
    const redisKey = PLAYBACK_SONGS(userId);
// console.log('recieved data:', data)


await client.json.set(redisKey, '$', data); // set new JSON


    // Set TTL for 6 days (in seconds)
    await client.expire(redisKey, 5 * 24 * 60 * 60);

    // ✅ Also write legacy plain JSON for getPlaybackContextState (ctx:user:<id>)
    const legacyKey = `ctx:user:${userId}`;
    const legacySnapshot = {
      trackId: data?.track?.id || data?.track?._id || null,
      playbackContext: data?.playbackContext || {
        source: 'PLAYBACK',
        queuePosition: 0,
        queueLength: Array.isArray(data?.queue) ? data.queue.length : 0,
      },
      positionSec: Number(data?.currentTime ?? 0),
      updatedAt: Date.now(),
      userId: String(userId),
    };
    if (legacySnapshot.trackId) {
      try {
        await client.set(legacyKey, JSON.stringify(legacySnapshot), {
          EX: 30 * 24 * 60 * 60, // 30 days
        });
      } catch (err) {
        console.warn("Failed to write legacy playback snapshot:", err?.message || err);
      }
    }

    return true;
  } catch (error) {
    console.error("Error saving playback session to Redis:", error);
    return false;
  }
};
