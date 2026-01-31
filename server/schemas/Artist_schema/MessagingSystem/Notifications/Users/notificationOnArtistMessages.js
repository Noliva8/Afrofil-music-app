import { UserNotification } from '../../../../../models/User/user_index.js';
import { BookArtist } from '../../../../../models/Artist/index_artist.js';
import { AuthenticationError } from '../../../../../utils/user_auth.js';




export const notificationOnArtistMessages = async (_parent, { messageId, bookingId }, context) => {
  const userId = context?.user?._id;
  if (!userId) {
    throw new AuthenticationError('You must be logged in to view messages.');
  }

  const query = { userId, messageId: { $exists: true } };
  if (messageId) query.messageId = messageId;
  if (bookingId) query.bookingId = bookingId;

  const notifications = await UserNotification.find(query)
    .sort({ createdAt: -1 })
    .populate({
      path: 'bookingId',
      populate: { path: 'artist', select: 'artistAka' },
      select: 'artist eventType eventDate location',
    })
    .lean();

  return notifications;
};
