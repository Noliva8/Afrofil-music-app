import mongoose from 'mongoose';
import crypto from 'crypto';
import { GraphQLError } from 'graphql';
import { ArtistSupport, Song } from '../../../models/Artist/index_artist.js';
import { getCachedLocation } from '../../User_schema/OtherResorvers/redis/userLocationRedis.js';

const SUPPORT_REQUIREMENTS = {
  playCount: 1,
  shareCount: 1,
  likesCount: 1,
};

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
    console.warn('[artistSupportMobileMoney] supporter location unavailable:', error?.message || error);
    return null;
  }
};

const normalizePhoneNumber = (phoneNumber) => String(phoneNumber || '').replace(/\s+/g, '').trim();

const buildTxRef = ({ songId, userId }) => {
  const suffix = crypto.randomBytes(6).toString('hex');
  return `flolup-artist-support-${String(songId).slice(-8)}-${String(userId).slice(-8)}-${Date.now()}-${suffix}`;
};

export const createArtistSupportMobileMoney = async (_parent, { songId, amount, phoneNumber }, context) => {
  const user = context?.user;
  const userId = user?._id;

  if (!userId) {
    throw new GraphQLError('User login required to support an artist', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  if (!user?.email) {
    throw new GraphQLError('Your account email is required for Mobile Money support', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  assertValidObjectId(songId, 'songId');

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new GraphQLError('Support amount is invalid', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhoneNumber) {
    throw new GraphQLError('Mobile Money phone number is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;

  if (!flutterwavePublicKey) {
    throw new GraphQLError('Flutterwave public key is not configured', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  if (!/^FLWPUBK(?:_TEST)?-[A-Za-z0-9-]+$/.test(String(flutterwavePublicKey))) {
    throw new GraphQLError('Flutterwave public key is invalid', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

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

  const txRef = buildTxRef({ songId, userId });
  const supporterLocation = await getSupporterLocation(userId);
  const amountInRwf = Math.round(numericAmount);
  const customerName = user.username || user.fullName || user.email;

  const support = await ArtistSupport.create({
    songId,
    artistId,
    userId,
    grossAmount: amountInRwf,
    currency: 'rwf',
    stripeFee: 0,
    platformFee: 0,
    artistAmount: 0,
    status: 'pending',
    paymentProvider: 'flutterwave',
    flutterwaveTxRef: txRef,
    mobileMoneyPhoneNumber: normalizedPhoneNumber,
    supporterCountry: supporterLocation?.country || null,
    supporterCountryCode: supporterLocation?.countryCode || supporterLocation?.country || null,
    artistCountry: song.artist?.country || null,
    platformCountry: process.env.PLATFORM_COUNTRY || 'US',
  });

  return {
    supportId: support._id.toString(),
    public_key: flutterwavePublicKey,
    tx_ref: txRef,
    amount: amountInRwf,
    currency: 'RWF',
    payment_options: 'mobilemoneyrwanda',
    customer: {
      email: user.email,
      phone_number: normalizedPhoneNumber,
      name: customerName,
    },
    customizations: {
      title: 'flolup',
      description: 'artist support',
      logo: process.env.FLUTTERWAVE_LOGO_URL || 'https://flolup.com/logo-192.png',
    },
  };
};
