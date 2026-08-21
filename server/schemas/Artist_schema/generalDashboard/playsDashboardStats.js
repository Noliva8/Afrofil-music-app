import { Song } from '../../../models/Artist/index_artist.js';

const calculateChangePercent = (thisWeek, previousWeek) => {
  if (previousWeek > 0) {
    return ((thisWeek - previousWeek) / previousWeek) * 100;
  }

  return thisWeek > 0 ? 100 : 0;
};

export const playsDashboardStats = async () => {
  const [stats] = await Song.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$playCount', 0] } },
        thisWeek: { $sum: { $ifNull: ['$weeklyPlayCount', 0] } },
        previousWeek: { $sum: { $ifNull: ['$previousWeekPlayCount', 0] } },
      },
    },
  ]);

  const total = Number(stats?.total || 0);
  const thisWeek = Number(stats?.thisWeek || 0);
  const previousWeek = Number(stats?.previousWeek || 0);

  return {
    total,
    thisWeek,
    previousWeek,
    changePercent: calculateChangePercent(thisWeek, previousWeek),
  };
};
