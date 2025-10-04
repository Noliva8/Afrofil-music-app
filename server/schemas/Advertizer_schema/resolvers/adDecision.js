import { GraphQLError } from 'graphql';
import { decideAdMVP, bumpServed } from '../../../utils/AdEngine/adDecision.js';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';



function normalizePlayer(player) {
  if (!player) {
    throw new GraphQLError('`player` input is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
  const {
    userId,
    userTier,
    device = 'mobile',
    availableAdTime = 30,
    wantType = 'audio',
    locationCountry = null,
    locationState = null,
    locationCity = null,
  } = player || {};

  if (!userId) {
    throw new GraphQLError('`player.userId` is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
  if (!userTier) {
    throw new GraphQLError('`player.userTier` is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  return {
    userId: String(userId),
    userTier: String(userTier).toLowerCase(), // 'free' | 'premium' | 'trial'
    device,
    availableAdTime: Number(availableAdTime) || 30,
    wantType: String(wantType).toLowerCase(), // 'audio' | 'overlay' | 'banner'
    location: {
      country: locationCountry || null,
      state:   locationState   || null,
      city:    locationCity    || null,
    }
  };
}


export async function adDecisionEngine(_parent, {player}){
try {
    const ctx = normalizePlayer(player);
    // decideAdMVP may throw; let GraphQL wrap unexpected errors
    const decision = await decideAdMVP(ctx);
    return decision; // { decision: 'play_ad'|'no_ad'|..., ad?, metadata?, ... }
  } catch (err) {
    // Convert known user errors to GraphQL errors, keep stack out of client
    if (err instanceof GraphQLError) throw err;
    console.error('[adDecideEngine] error:', err);
    throw new GraphQLError('Failed to decide ad', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
}

export async function adBumpServed(_parent, { userId }) {
  try {
    if (!userId) {
      throw new GraphQLError('`userId` is required', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }
    const redis = await getRedis(); // singleton connection
    await bumpServed(redis, String(userId));
    return { ok: true };
  } catch (err) {
    if (err instanceof GraphQLError) throw err;
    console.error('[adBumpServed] error:', err);
    throw new GraphQLError('Failed to mark ad as served', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
}

