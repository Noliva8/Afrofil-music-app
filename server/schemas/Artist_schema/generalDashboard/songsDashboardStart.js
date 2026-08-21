import { Song } from '../../../models/Artist/index_artist.js';
import { getWeekStart } from './artistDashboardStats.js';

export const songsDashboardStats = async () => {
  const now = new Date();
  const weekStart = getWeekStart(now);

  const [total, thisWeek] = await Promise.all([
    Song.countDocuments(),
    Song.countDocuments({
      createdAt: { $gte: weekStart, $lte: now },
    }),
  ]);

  return {
    total,
    thisWeek,
  };
};
