// queries/myAds.js
import { GraphQLError } from 'graphql';
import { Ad } from '../../../models/Advertizer/index_advertizer.js';
import mongoose from 'mongoose';
import { CreatePresignedUrlDownload } from '../../../utils/awsS3.js';

const UNAUTH = new GraphQLError('Could not authenticate advertiser', {
  extensions: { code: 'UNAUTHENTICATED' }
});

const DEFAULT_LIMIT = 50;





export default async function myAds(_parent, _args, context) {
  const me = context.advertizer || context?.req?.advertizer;
  if (!me) throw UNAUTH;

  const ownerId = mongoose.Types.ObjectId.isValid(me._id)
    ? new mongoose.Types.ObjectId(me._id)
    : me._id;

  const baseQuery = me.role === 'admin' ? {} : { advertiserId: ownerId };

  try {
    const rows = await Ad.find(baseQuery)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(DEFAULT_LIMIT)
      .populate({
        path: 'advertiserId',
        select: '_id fullName companyName businessEmail companyWebsite phoneNumber country'
      })
      .lean();

      // 

    // Attach a separate "advertiser" object while preserving advertiserId: ID!
    return rows.map(({ _id, advertiserId, ...rest }) => ({
      id: String(_id),
      _id,
      advertiserId: String(
        advertiserId && typeof advertiserId === 'object' ? advertiserId._id : advertiserId
      ),
      advertiser:
        advertiserId && typeof advertiserId === 'object'
          ? { ...advertiserId, _id: String(advertiserId._id) }
          : null,
      ...rest
    }));
  } catch (err) {
    console.error('myAds error:', err);
    throw new GraphQLError('Failed to fetch ads', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
}



