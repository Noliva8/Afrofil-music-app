import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User/user_index.js';

dotenv.config();

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
};

const run = async () => {
  const dryRun = !process.argv.includes('--write');
  const includeAll = process.argv.includes('--all');
  const beforeArg = getArgValue('before');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afrofeel';

  if (!includeAll && !beforeArg) {
    throw new Error(
      'Provide --before=YYYY-MM-DD to verify only legacy users, or --all if you intentionally want every unverified user.'
    );
  }

  const query = {
    isUserEmailVerified: { $ne: true },
  };

  if (beforeArg) {
    const cutoff = new Date(beforeArg);
    if (Number.isNaN(cutoff.getTime())) {
      throw new Error('Invalid --before date. Use YYYY-MM-DD.');
    }
    query.createdAt = { $lt: cutoff };
  }

  await mongoose.connect(mongoUri);

  const users = await User.find(query).select('_id email username createdAt isUserEmailVerified');

  if (!dryRun && users.length > 0) {
    await User.updateMany(
      { _id: { $in: users.map((user) => user._id) } },
      {
        $set: { isUserEmailVerified: true },
        $unset: {
          userEmailVerificationCode: '',
          userEmailVerificationExpires: '',
        },
      }
    );
  }

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'write',
    cutoff: beforeArg || null,
    includeAll,
    matched: users.length,
    users: users.map((user) => ({
      id: String(user._id),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    })),
  }, null, 2));

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
