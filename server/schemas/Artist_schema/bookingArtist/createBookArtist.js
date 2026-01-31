

import { BookArtist, Artist, Song, UserNotification } from '../../../models/Artist/index_artist.js';
import { normalizeBookingForResponse } from './normalizeBooking.js';

export const createBookArtist = async (_parent, { input }, ctx) => {
  // 1. Auth (user comes from context)
  if (!ctx?.user?._id) {
    throw new Error('Not authenticated');
  }

  const userId = ctx.user._id;

  const {
    artistId,
    songId,
    eventType,
    eventDate,
    location,
    budgetRange,
    performanceType,
    setLength,
    customSetLength,
    message,
  } = input;

  // 2. Validate artist
  const artistExists = await Artist.exists({ _id: artistId });
  if (!artistExists) {
    throw new Error('Artist not found');
  }

  // 3. Validate song (optional)
  if (songId) {
    const songExists = await Song.exists({ _id: songId });
    if (!songExists) {
      throw new Error('Song not found');
    }
  }

  // 4. Validate set length logic
  if (setLength && typeof customSetLength === 'number') {
    throw new Error('Provide either setLength or customSetLength, not both');
  }

  // 5. Create booking
  const duplicateBooking = await BookArtist.findOne({
    artist: artistId,
    user: userId,
    song: songId,
    eventDate: new Date(eventDate),
    status: { $in: ["pending", "accepted"] },
  });

  if (duplicateBooking) {
    throw new Error("You already have an active booking request for that event.");
  }

  const booking = await BookArtist.create({
    artist: artistId,
    user: userId,
    song: songId || undefined,

    eventType: eventType.toLowerCase(),
    eventDate: new Date(eventDate),

    location,

    budgetRange:
      budgetRange === 'RANGE_500_1000' ? '500-1000' :
      budgetRange === 'RANGE_1000_3000' ? '1000-3000' :
      budgetRange === 'RANGE_3000_5000' ? '3000-5000' :
      budgetRange === 'RANGE_5000_PLUS' ? '5000+' :
      'flexible',

    performanceType:
      performanceType === 'BACKING_TRACK' ? 'Backing-track' :
      performanceType === 'DJ' ? 'DJ' :
      performanceType === 'LIVE' ? 'Live' :
      performanceType === 'ACOUSTIC' ? 'Acoustic' :
      undefined,

    setLength:
      setLength === 'MIN_30' ? 30 :
      setLength === 'MIN_60' ? 60 :
      setLength === 'MIN_90' ? 90 :
      undefined,

    customSetLength: customSetLength || undefined,

    message: message || undefined,
    status: 'pending',
  });

  await UserNotification.create({
    userId,
    bookingId: booking._id,
    type: 'pending',
    message: message || 'Your booking request is pending the artist response.',
    isArtistRead: false,
    isChatEnabled: false,
  });

  // 6. Return populated booking
  const bookingDoc = await BookArtist.findById(booking._id)
    .populate('artist')
    .populate('user')
    .populate('song')
    .lean();

  return { booking: normalizeBookingForResponse(bookingDoc) };
};
