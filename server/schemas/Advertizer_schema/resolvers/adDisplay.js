import { Ad } from '../../../models/Advertizer/index_advertizer.js';
import { GraphQLError } from 'graphql';



const UNAUTH = new GraphQLError('Could not authenticate advertiser', {
  extensions: { code: 'UNAUTHENTICATED' }
});


export default async function myAds(_parent, { limit = 25, offset = 0 }, context) {
  const advertizer = context.advertizer || context?.req?.advertizer;
  if (!advertizer) throw UNAUTH;

  // sanitize pagination
  const lim = Math.min(100, Math.max(1, Number(limit) || 25));
  const off = Math.max(0, Number(offset) || 0);

  try {
    const rows = await Ad.find({ advertiserId: advertizer._id })
      .sort({ updatedAt: -1 })
      .skip(off)
      .limit(lim)
      .lean();

   
    return rows.map(({ _id, ...rest }) => ({ id: String(_id), ...rest }));
  } catch (err) {
    console.error("myAds error:", err);
    throw new GraphQLError("Failed to fetch ads", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
}