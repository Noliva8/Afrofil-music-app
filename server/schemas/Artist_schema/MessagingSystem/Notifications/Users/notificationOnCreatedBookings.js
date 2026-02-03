import { UserNotification } from '../../../../../models/User/user_index.js';
import { BookArtist } from '../../../../../models/Artist/index_artist.js';
import { AuthenticationError } from '../../../../../utils/user_auth.js';



export const notificationOnCreatedBookings = async (_parent, _args, context) => {
  const userId = context?.user?._id;

  if (!userId) {
    throw new AuthenticationError('User must be logged in.');
  }

  const notifications = await UserNotification.find({ userId }).sort({ updatedAt: -1 }).lean();
  if (!notifications.length) {
    return [];
  }

  return notifications.map((notification) => ({
    ...notification,
    type: String(notification.type || 'pending').toUpperCase(),
  }));
};
