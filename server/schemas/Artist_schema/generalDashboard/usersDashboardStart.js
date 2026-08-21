import { User } from '../../../models/Artist/index_artist.js';


import { getWeekStart } from './artistDashboardStats.js';

export const usersDashboardStats = async () => {
  const now = new Date();
  const weekStart = getWeekStart(now);

  const [total, thisWeek] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      createdAt: { $gte: weekStart, $lte: now },
    }),
  ]);

  return {
    total,
    thisWeek,
  };
};
