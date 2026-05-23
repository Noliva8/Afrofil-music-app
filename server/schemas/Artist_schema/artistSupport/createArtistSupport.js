import mongoose from 'mongoose';
import Stripe from 'stripe';
import { GraphQLError } from 'graphql';
import { ArtistSupport, Song } from '../../../models/Artist/index_artist.js';
import { getCachedLocation } from '../../User_schema/OtherResorvers/redis/userLocationRedis.js';

const SUPPORT_REQUIREMENTS = {
  playCount: 1,
  shareCount: 1,
  likesCount: 1,
};
const MIN_SUPPORT_AMOUNT = 1;
const MAX_SUPPORT_AMOUNT = 500;

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new GraphQLError(`${fieldName} is invalid`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
};

const getSupporterLocation = async (userId) => {
  try {
    return await getCachedLocation(String(userId));
  } catch (error) {
    console.warn('[artistSupport] supporter location unavailable:', error?.message || error);
    return null;
  }
};

export const createArtistSupport = async (_parent, { songId, amount }, context) => {
  const userId = context?.user?._id;

  if (!userId) {
    throw new GraphQLError('User login required to support an artist', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  assertValidObjectId(songId, 'songId');

  const numericAmount = Number(amount);
  if (
    !Number.isFinite(numericAmount) ||
    numericAmount < MIN_SUPPORT_AMOUNT ||
    numericAmount > MAX_SUPPORT_AMOUNT
  ) {
    throw new GraphQLError('Support amount is invalid', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new GraphQLError('Stripe is not configured', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const amountInCents = Math.round(numericAmount * 100);

  const song = await Song.findById(songId)
    .select('_id title artist playCount shareCount likesCount')
    .populate('artist', '_id artistName artistAka country')
    .lean();

  if (!song) {
    throw new GraphQLError('Song not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const artistId = song.artist?._id || song.artist;
  const supporterLocation = await getSupporterLocation(userId);

  if (!artistId) {
    throw new GraphQLError('Song artist not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const currentStats = {
    playCount: song.playCount || 0,
    shareCount: song.shareCount || 0,
    likesCount: song.likesCount || 0,
  };


  const isEligible =
    currentStats.playCount >= SUPPORT_REQUIREMENTS.playCount &&
    currentStats.shareCount >= SUPPORT_REQUIREMENTS.shareCount &&
    currentStats.likesCount >= SUPPORT_REQUIREMENTS.likesCount;

  if (!isEligible) {
    throw new GraphQLError('Artist support is not available for this song yet', {
      extensions: {
        code: 'ARTIST_SUPPORT_NOT_ELIGIBLE',
        requirements: SUPPORT_REQUIREMENTS,
        current: currentStats,
      },
    });
  }

  const support = await ArtistSupport.create({
    songId,
    artistId,
    userId,
    grossAmount: amountInCents,
    currency: 'usd',
    stripeFee: 0,
    platformFee: 0,
    artistAmount: 0,
    status: 'pending',
    supporterCountry: supporterLocation?.country || null,
    supporterCountryCode: supporterLocation?.countryCode || supporterLocation?.country || null,
    artistCountry: song.artist?.country || null,
    platformCountry: process.env.PLATFORM_COUNTRY || 'US',
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    description: song.title ? `Support for ${song.title}` : 'Fan support payment',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      type: 'artist_support',
      supportId: support._id.toString(),
      songId: songId.toString(),
      artistId: artistId.toString(),
      userId: userId.toString(),
    },
  });

  support.stripePaymentIntentId = paymentIntent.id;
  await support.save();

  return {
    supportId: support._id.toString(),
    clientSecret: paymentIntent.client_secret,
  };
};
