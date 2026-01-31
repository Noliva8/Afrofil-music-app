import { BookArtist } from '../../../models/Artist/index_artist.js';
import { normalizeBookingForResponse } from './normalizeBooking.js';
import UserNotification from '../../../models/User/Notification.js';



export const respondToBooking = async (_parent, { input }, ctx) => {
  if (!ctx?.artist?._id) {
    throw new Error('Not authenticated');
  }

  const { bookingId, status, message } = input;

  const booking = await BookArtist.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // GraphQL enum -> Mongoenum string
  booking.status = String(status).toLowerCase();
  booking.artistResponse = {
    message: message || undefined,
    respondedAt: new Date(),
  };
  booking.isChatEnabled = status.toLowerCase() === "accepted";

  await booking.save();

  const normalizedType = String(status).toLowerCase();
  await UserNotification.findOneAndUpdate(
    { bookingId: booking._id, userId: booking.user },
    {
      userId: booking.user,
      bookingId: booking._id,
      type: normalizedType,
      message: booking.artistResponse?.message,
      isChatEnabled: booking.isChatEnabled,
      isArtistRead: false,
      messageId: undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const updated = await BookArtist.findById(bookingId)
    .populate('artist')
    .populate('user')
    .populate('song')
    .lean();

  return { booking: normalizeBookingForResponse(updated) };
};
