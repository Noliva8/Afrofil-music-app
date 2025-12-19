import { Artist } from '../../../models/Artist/index_artist.js';
import { AuthenticationError, ApolloError } from 'apollo-server-express';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { ARTIST_DOWNLOADS, ONE_YEAR_SECONDS } from '../Redis/keys.js';

export const handleArtistDownloadCounts = async (_parent, { artistId, userId, role }) => {
  if (!artistId || !userId) {
    throw new ApolloError('artistId and userId are required');
  }

  if (!role || role.toLowerCase() !== 'premium') {
    throw new AuthenticationError('Premium plan required to download');
  }

  const artist = await Artist.findByIdAndUpdate(
    artistId,
    { $inc: { artistDownloadCounts: 1 } },
    { new: true, runValidators: false } // avoid password validation on save
  );
  if (!artist) {
    throw new ApolloError('Artist not found');
  }

  try {
    const client = await getRedis().catch(() => null);
    if (client) {
      const key = ARTIST_DOWNLOADS(artistId);
      await client.incr(key);
      await client.expire(key, ONE_YEAR_SECONDS);
    }
  } catch (err) {
    console.warn('[handleArtistDownloadCounts] Redis sync skipped:', err?.message || err);
  }

  return artist;
};
