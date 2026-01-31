import {Artist, Song, User, Message, BookArtist} from "../../../../models/Artist/index_artist.js"
import { AuthenticationError } from '../../../../utils/artist_auth.js';

export const getUnreadCount = async (_parent, { bookingId }, context) => {
  if (!context?.artist && !context?.user) {
    throw new AuthenticationError("Please log in to view unread counts.");
  }
  const booking = await BookArtist.findById(bookingId);
  if (!booking) throw new Error("Booking not found.");
  const participantField = context.artist ? 'artist' : 'user';
  const participantId = context[participantField]._id.toString();
  if (booking[participantField]?.toString() !== participantId) {
    throw new AuthenticationError("You are not part of this booking.");
  }
  return Message.countDocuments({ bookingId, isRead: false });
};
