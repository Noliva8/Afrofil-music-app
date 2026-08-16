import mongoose from 'mongoose';
import { Artist } from '../models/Artist/index_artist.js';
import { User } from '../models/User/user_index.js';

const DEFAULT_MIGRATION_ID = 'legacy-user-artist-unified-flow-v1';

const hasArtistProfileFields = (artist) =>
  Boolean(
    artist?.fullName &&
    artist?.artistAka &&
    artist?.email &&
    artist?.country &&
    artist?.region
  );

const getCutoffDate = () => {
  const raw = process.env.LEGACY_BACKFILL_BEFORE;
  if (!raw) return new Date();

  const cutoff = new Date(raw);
  if (Number.isNaN(cutoff.getTime())) {
    throw new Error('Invalid LEGACY_BACKFILL_BEFORE value. Use an ISO date or YYYY-MM-DD.');
  }
  return cutoff;
};

export const runLegacyStartupBackfill = async () => {
  if (process.env.RUN_LEGACY_BACKFILL_ON_START !== 'true') {
    return;
  }

  const migrationId = process.env.LEGACY_BACKFILL_ID || DEFAULT_MIGRATION_ID;
  const cutoff = getCutoffDate();
  const locks = mongoose.connection.collection('migrationLocks');

  const lock = await locks.findOne({ _id: migrationId });
  if (lock?.completedAt) {
    console.log(`[legacy-backfill] ${migrationId} already completed at ${lock.completedAt.toISOString()}`);
    return;
  }

  const claimed = await locks.findOneAndUpdate(
    { _id: migrationId, completedAt: { $exists: false } },
    {
      $setOnInsert: {
        _id: migrationId,
        startedAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: 'before',
    }
  );

  const existingClaim = claimed?.value ?? claimed;
  if (existingClaim) {
    console.log(`[legacy-backfill] ${migrationId} is already running.`);
    return;
  }

  console.log(`[legacy-backfill] Starting ${migrationId} with cutoff ${cutoff.toISOString()}`);

  const userResult = await User.updateMany(
    {
      isUserEmailVerified: { $ne: true },
      createdAt: { $lt: cutoff },
    },
    {
      $set: { isUserEmailVerified: true },
      $unset: {
        userEmailVerificationCode: '',
        userEmailVerificationExpires: '',
      },
    }
  );

  const artists = await Artist.find({
    confirmed: true,
    selectedPlan: true,
    isProfileComplete: { $ne: true },
  }).select('_id email fullName artistAka country region');

  const qualifiedArtistIds = artists
    .filter(hasArtistProfileFields)
    .map((artist) => artist._id);

  const artistResult = qualifiedArtistIds.length
    ? await Artist.updateMany(
        { _id: { $in: qualifiedArtistIds } },
        { $set: { isProfileComplete: true } }
      )
    : { matchedCount: 0, modifiedCount: 0 };

  const completedAt = new Date();
  await locks.updateOne(
    { _id: migrationId },
    {
      $set: {
        completedAt,
        cutoff,
        usersMatched: userResult.matchedCount || 0,
        usersModified: userResult.modifiedCount || 0,
        artistsMatched: artistResult.matchedCount || 0,
        artistsModified: artistResult.modifiedCount || 0,
      },
    }
  );

  console.log('[legacy-backfill] Completed', {
    migrationId,
    usersMatched: userResult.matchedCount || 0,
    usersModified: userResult.modifiedCount || 0,
    artistsMatched: artistResult.matchedCount || 0,
    artistsModified: artistResult.modifiedCount || 0,
  });
};
