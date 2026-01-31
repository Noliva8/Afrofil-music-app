import { UserNotification } from '../../../../../models/User/user_index.js';
import { BookArtist } from '../../../../../models/Artist/index_artist.js';
import { AuthenticationError } from '../../../../../utils/user_auth.js';



export const notificationOnCreatedBookings = async (_parent, { bookingId }, context) => {
  const userId = context?.user?._id;
  if (!userId) {
    throw new AuthenticationError('User must be logged in.');
  }

  const booking = await BookArtist.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }
  if (booking.user.toString() !== userId.toString()) {
    throw new AuthenticationError('Unauthorized access to notification.');
  }

  const notification = await UserNotification.findOne({ bookingId, userId }).lean();
  if (!notification) {
    throw new Error('Notification not found for this booking.');
  }

  notification.type = String(notification.type || 'pending').toUpperCase();
  return notification;
};
