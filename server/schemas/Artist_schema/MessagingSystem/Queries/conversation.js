import {Artist, Song, User, Message, BookArtist} from "../../../../models/Artist/index_artist.js"
import { AuthenticationError } from '../../../../utils/artist_auth.js';

export const getConversations = async (_parent, _args, context) => {
  if (!context?.artist && !context?.user) {
    throw new AuthenticationError("Please log in to view conversations.");
  }
  const participantField = context.artist ? 'artist' : 'user';
  const participantId = context[participantField]._id;
  const bookings = await BookArtist.find({ [participantField]: participantId })
    .select("_id eventType location song isChatEnabled user artist eventDate status")
    .populate("song", "title")
    .populate("user", "username")
    .populate("artist", "artistAka profileImage")
    .lean();
  if (!bookings.length) return [];
  const bookingIds = bookings.map((booking) => booking._id);
  const aggregation = await Message.aggregate([
    { $match: { bookingId: { $in: bookingIds }, isRead: { $exists: true } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$bookingId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [{ $eq: ["$isRead", false] }, 1, 0],
          },
        },
      },
    },
  ]);
  const aggrMap = new Map(aggregation.map((item) => [item._id.toString(), item]));
  const summaries = bookings.map((booking) => {
    const key = booking._id.toString();
    const record = aggrMap.get(key);
    const transformedLastMessage = record?.lastMessage
      ? {
          ...record.lastMessage,
          senderType: record.lastMessage.senderType?.toUpperCase(),
        }
      : null;

    return {
      bookingId: booking._id,
      eventType: booking.eventType,
      songTitle: booking.song?.title || null,
      location: booking.location || null,
      isChatEnabled: !!booking.isChatEnabled,
      lastMessage: transformedLastMessage,
      unreadCount: record?.unreadCount || 0,
      userName: booking.user?.username || "guest",
      artistName: booking.artist?.artistAka || "Artist",
      eventDate: booking.eventDate || null,
    };
  });
  return summaries.sort((a, b) => {
    const aStamp = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.eventDate || 0).getTime();
    const bStamp = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.eventDate || 0).getTime();
    return bStamp - aStamp;
  });
};
