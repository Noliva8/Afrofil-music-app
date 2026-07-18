import { GraphQLError } from 'graphql';
import fetch from 'node-fetch';
import { ArtistSupport } from '../../../models/Artist/index_artist.js';
import { sendArtistSupportReceivedEmail } from '../../../utils/artistSupportEmail.js';

const ARTIST_SUPPORT_PLATFORM_FEE_RATE = 0.2;

const getFlutterwaveSecret = () =>
  process.env.FLUTTERWAVE_SECRET_KEY || process.env.MOBILEMONEY_CLIENT_SECRET;

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const verifyFlutterwaveTransaction = async (transactionId) => {
  const secretKey = getFlutterwaveSecret();

  if (!secretKey) {
    throw new GraphQLError('Mobile Money verification is not configured', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new GraphQLError('Could not verify the Mobile Money payment', {
      extensions: { code: 'PAYMENT_VERIFICATION_FAILED' },
    });
  }

  const payload = await response.json();
  const verifiedData = payload?.data || payload || {};
  const status = normalizeStatus(verifiedData?.status || payload?.status);

  if (!['successful', 'success', 'completed'].includes(status)) {
    throw new GraphQLError('The Mobile Money payment was not successful', {
      extensions: { code: 'PAYMENT_NOT_SUCCESSFUL' },
    });
  }

  return verifiedData;
};

export const confirmArtistSupportMobileMoney = async (
  _parent,
  { supportId, flutterwaveTransactionId },
  context
) => {
  const userId = context?.user?._id;

  if (!userId) {
    throw new GraphQLError('User login required to confirm Mobile Money support', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  if (!supportId || !flutterwaveTransactionId) {
    throw new GraphQLError('Support ID and transaction ID are required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const support = await ArtistSupport.findById(supportId);

  if (!support) {
    throw new GraphQLError('Artist support record not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (String(support.userId) !== String(userId)) {
    throw new GraphQLError('You can only confirm your own support payment', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (support.status === 'paid') {
    return {
      supportId: support._id.toString(),
      status: support.status,
      artistAmount: support.artistAmount,
      platformFee: support.platformFee,
      paidAt: support.paidAt,
      flutterwaveTransactionId: support.flutterwaveTransactionId || flutterwaveTransactionId,
    };
  }

  if (support.paymentProvider !== 'flutterwave') {
    throw new GraphQLError('This support payment is not managed by Flutterwave', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const verifiedData = await verifyFlutterwaveTransaction(flutterwaveTransactionId);

  const verifiedTxRef = String(verifiedData?.tx_ref || '').trim();
  if (support.flutterwaveTxRef && verifiedTxRef && support.flutterwaveTxRef !== verifiedTxRef) {
    throw new GraphQLError('Verified Mobile Money transaction does not match this support record', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const verifiedAmount = Number(verifiedData?.amount || 0);
  const expectedAmount = Number(support.grossAmount || 0);
  if (Number.isFinite(verifiedAmount) && verifiedAmount > 0 && Math.round(verifiedAmount) !== expectedAmount) {
    throw new GraphQLError('Verified payment amount does not match the support amount', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const platformFee = Math.round(expectedAmount * ARTIST_SUPPORT_PLATFORM_FEE_RATE);
  const artistAmount = Math.max(0, expectedAmount - platformFee);

  support.status = 'paid';
  support.flutterwaveTransactionId = String(flutterwaveTransactionId);
  support.platformFee = platformFee;
  support.artistAmount = artistAmount;
  support.paidAt = new Date();

  await support.save();
  await sendArtistSupportReceivedEmail(support);

  return {
    supportId: support._id.toString(),
    status: support.status,
    artistAmount: support.artistAmount,
    platformFee: support.platformFee,
    paidAt: support.paidAt,
    flutterwaveTransactionId: support.flutterwaveTransactionId,
  };
};
