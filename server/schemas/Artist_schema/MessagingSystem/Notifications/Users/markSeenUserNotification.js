import { UserNotification } from '../../../../../models/User/user_index.js';
import { AuthenticationError } from '../../../../../utils/user_auth.js';

export const markSeenUserNotification = async (_parent, { notificationId, isNotificationSeen = true }, context) => {
  const userId = context?.user?._id;
  if (!userId) {
    throw new AuthenticationError('You must be logged in to mark notifications.');
  }

  const notification = await UserNotification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isNotificationSeen },
    { new: true }
  );

  if (!notification) {
    return null;
  }

  return notification;
};
