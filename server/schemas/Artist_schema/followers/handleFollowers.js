import { Artist } from '../../../models/Artist/index_artist.js';
import { ApolloError } from 'apollo-server-express';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { ARTIST_FOLLOWERS } from '../Redis/keys.js';


export const handleFollowers = async (_parent, { artistId, userId }) => {
  if (!artistId || !userId) {
    throw new ApolloError('artistId and userId are required');
  }


  const artist = await Artist.findById(artistId);
  if (!artist) {
    throw new ApolloError('Artist not found');
  }

  const alreadyFollowing = artist.followers?.some(
    (f) => String(f) === String(userId)
  );

  const update = alreadyFollowing
    ? { $pull: { followers: userId } }
    : { $addToSet: { followers: userId } };

  // Sync followers set in Redis (best-effort)
  try {
    const client = await getRedis();
    if (client) {
      const key = ARTIST_FOLLOWERS(artistId);
      if (alreadyFollowing) {
        await client.sRem(key, String(userId));
      } else {
        await client.sAdd(key, String(userId));
      }
    }
  } catch (err) {
    console.warn('[handleFollowers] Redis sync skipped:', err?.message || err);
  }

  const updatedArtist = await Artist.findByIdAndUpdate(
    artistId,
    update,
    { new: true, runValidators: false }
  );

  return updatedArtist;
};
