import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Artist, Song } from '../models/Artist/index_artist.js';

dotenv.config();

const hasProfileFields = (artist) =>
  Boolean(
    artist?.fullName &&
    artist?.artistAka &&
    artist?.email &&
    artist?.country &&
    artist?.region
  );

const run = async () => {
  const dryRun = !process.argv.includes('--write');
  const requireSongs = process.argv.includes('--require-songs');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afrofeel';

  await mongoose.connect(mongoUri);

  const candidates = await Artist.find({
    confirmed: true,
    selectedPlan: true,
    isProfileComplete: { $ne: true },
  }).select('_id email fullName artistAka country region songs confirmed selectedPlan isProfileComplete');

  const qualified = [];
  const skipped = [];

  for (const artist of candidates) {
    const profileReady = hasProfileFields(artist);
    const songsReady =
      !requireSongs ||
      (Array.isArray(artist.songs) && artist.songs.length > 0) ||
      (await Song.countDocuments({ artist: artist._id })) > 0;

    if (profileReady && songsReady) {
      qualified.push(artist);
      continue;
    }

    skipped.push({
      id: String(artist._id),
      email: artist.email,
      profileReady,
      songsReady,
    });
  }

  if (!dryRun && qualified.length > 0) {
    await Artist.updateMany(
      { _id: { $in: qualified.map((artist) => artist._id) } },
      { $set: { isProfileComplete: true } }
    );
  }

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'write',
    requireSongs,
    candidates: candidates.length,
    qualified: qualified.length,
    skipped: skipped.length,
    qualifiedArtists: qualified.map((artist) => ({
      id: String(artist._id),
      email: artist.email,
    })),
    skipped,
  }, null, 2));

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
