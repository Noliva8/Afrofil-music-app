import { Artist } from '../../../models/Artist/index_artist.js';

export const getWeekStart = (date = new Date()) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day;
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};



export const artistDashboardStats = async () => {
  const now = new Date();
  const weekStart = getWeekStart(now);

  const [total, thisWeek] = await Promise.all([
    Artist.countDocuments(),
    Artist.countDocuments({
      createdAt: { $gte: weekStart, $lte: now },
    }),
  ]);

  return {
    total,
    thisWeek,
  };
};
