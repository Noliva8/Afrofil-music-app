import { getRedis } from "../../../../utils/AdEngine/redis/redisClient.js";




export const keyFor = ({ userId, sessionId }) => {
  if (userId) return `ctx:user:${userId}`;
  if (sessionId) return `ctx:session:${sessionId}`;
  return null;
};



const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function savePlaybackContextState(_, { input: SavePlaybackContextStateInput }) {
  const redis = await getRedis();
  if (!SavePlaybackContextStateInput) throw new Error("input is required.");

  const {
    userId,
    sessionId,
    trackId,
    positionSec = 0,
    playbackContext,
  } = SavePlaybackContextStateInput;

  if (!trackId) throw new Error("trackId is required.");
  if (!playbackContext || !playbackContext.source) {
    throw new Error("playbackContext.source is required.");
  }

  const key = keyFor({ userId, sessionId });
  if (!key) throw new Error("Either userId or sessionId is required.");

  const payload = {
    v: 1,
    userId: userId ?? null,
    sessionId: sessionId ?? null,
    trackId,
    positionSec: Number.isFinite(positionSec) ? Number(positionSec) : 0,
    updatedAt: Date.now(),
    playbackContext, // reuse your existing telemetry shape
  };


  // node-redis v4
  await redis.set(key, JSON.stringify(payload), { EX: TTL_SECONDS });
  


  return true;
}
