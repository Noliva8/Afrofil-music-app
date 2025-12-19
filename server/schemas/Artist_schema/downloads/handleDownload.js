import { Artist, Song } from '../../../models/Artist/index_artist.js';
import { AuthenticationError, ApolloError } from 'apollo-server-express';
import { getRedis } from '../../../utils/AdEngine/redis/redisClient.js';
import { ARTIST_DOWNLOADS, songKey, ONE_YEAR_SECONDS } from '../Redis/keys.js';



// Currently returns the artist after verifying premium role; extend to increment artist/song downloads as needed.
export const handleDownload = async (_parent, { artistId, userId, songId, role }) => {
  if (!artistId || !userId || !songId) {
    throw new ApolloError('artistId, userId and songId are required');
  }

  if (!role || role.toLowerCase() !== 'premium') {
    throw new AuthenticationError('Premium plan required to download');
  }

  const client = await getRedis().catch(() => null);
  const artist = await Artist.findById(artistId);
  if (!artist) {
    throw new ApolloError('Artist not found');
  }

  const song = await Song.findById(songId);
  if (!song) {
    throw new ApolloError('Song not found');
  }

  // Enforce artist ownership if provided
  if (artistId && String(song.artist) !== String(artistId)) {
    throw new ApolloError('Song does not belong to artist');
  }

  // increment counts
  song.downloadCount = Number(song.downloadCount || 0) + 1;
  artist.artistDownloadCounts = Number(artist.artistDownloadCounts || 0) + 1;

  await song.save();
  await artist.save();

  // Best-effort Redis sync for download tracking
  try {
    if (client) {
      // per-artist counter
      const artistKey = ARTIST_DOWNLOADS(artistId);
      await client.incr(artistKey);
      await client.expire(artistKey, ONE_YEAR_SECONDS);

      // per-song hash counter
      const skey = songKey(songId);
      await client.hIncrBy(skey, 'downloadCount', 1);
      await client.expire(skey, ONE_YEAR_SECONDS);
    }
  } catch (err) {
    console.warn('[handleDownload] Redis sync skipped:', err?.message || err);
  }

  return song;
};
