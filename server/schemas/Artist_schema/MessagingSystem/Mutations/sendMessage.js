import {Artist, Song, User, Message, BookArtist, UserNotification} from "../../../../models/Artist/index_artist.js"
import { AuthenticationError } from '../../../../utils/artist_auth.js';
import { pubsub } from '../../../../utils/ pubsub.js';
const NEW_MESSAGE = 'NEW_MESSAGE';




export const sendMessage = async (_parent, { input }, context) => {
  const { bookingId, content } = input;

  const booking = await BookArtist.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const isArtist = Boolean(context.artist && booking.artist && context.artist._id.toString() === booking.artist.toString());
  const isUser = Boolean(context.user && booking.user && context.user._id.toString() === booking.user.toString());

  if (!isArtist && !isUser) {
    throw new AuthenticationError("You do not have permission to message this booking.");
  }

  if (!booking.isChatEnabled) {
    throw new Error("Chat is not enabled for this booking yet.");
  }

  const senderType = isArtist ? "ARTIST" : "USER";
  const senderId = isArtist ? context.artist._id : context.user._id;

  const message = await Message.create({
    bookingId,
    artistId: booking.artist,
    userId: booking.user,
    senderId,
    senderType: senderType.toLowerCase(),
    content,
  });

  message.senderType = senderType;

  if (isArtist) {
    await UserNotification.findOneAndUpdate(
      { bookingId, userId: booking.user },
      {
        userId: booking.user,
        bookingId,
        messageId: message._id,
        message: content,
        isChatEnabled: true,
      },
      { upsert: true, new: true }
    );
  }
  await message.populate([
    { path: "userId", select: "username" },
    { path: "artistId", select: "artistAka" },
  ]);

  await pubsub.publish(NEW_MESSAGE, { newMessage: message });

  return message;
};
