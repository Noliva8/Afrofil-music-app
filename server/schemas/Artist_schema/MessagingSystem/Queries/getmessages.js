import {Artist, Song, User, Message, BookArtist} from "../../../../models/Artist/index_artist.js"
import { AuthenticationError } from '../../../../utils/artist_auth.js';

export const getMessages = async (_parent, { bookingId }, context) => {
  if (!context?.artist && !context?.user) {
    throw new AuthenticationError("Please log in to view messages.");
  }
  const booking = await BookArtist.findById(bookingId);
  if (!booking) throw new Error("Booking not found.");
  const participantId = context.artist ? context.artist._id.toString() : context.user ? context.user._id.toString() : null;
  const participantField = context.artist ? 'artist' : 'user';
  const ownerId = booking[participantField] ? booking[participantField].toString() : null;
  if (!participantId || participantId !== ownerId) {
    throw new AuthenticationError("You are not part of this booking.");
  }

  const messages = await Message.find({ bookingId }).sort({ createdAt: 1 }).lean();
  return messages.map((message) => ({
    ...message,
    senderType: message.senderType?.toUpperCase(),
  }));
};
