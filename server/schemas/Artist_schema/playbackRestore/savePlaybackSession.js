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

    return true;
  } catch (error) {
    console.error("Error saving playback session to Redis:", error);
    return false;
  }
};
