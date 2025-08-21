import { GraphQLError } from 'graphql';
import { Advertizer, Ad } from '../../../models/Advertizer/index_advertizer.js'
import { calculateAdPrice } from '../../../utils/priceCalculator.js';
import stripe from 'stripe';


const stripeEngne = stripe(process.env.STRIPE_SECRET_KEY);

const confirmPrice = async (_parent, { adId, isCostConfirmed, adTitle, campaignId, duration, amount, currency, location, adType }, context) => {
  const advertizer = context.advertizer || context?.req?.advertizer;

  if (!advertizer) {
    throw new GraphQLError('Could not authenticate advertiser', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }



 

  // Log the data received for verification
  console.log('Data received by the server to create the PaymentIntent object:', {
    adId,
    isCostConfirmed,
    adTitle,
    adType,
    campaignId,
    duration,
    amount,
    currency,
    location
  });

  try {
    // Update the ad in the database
    const updatedAd = await Ad.findByIdAndUpdate(
      { _id: adId },
      { $set: { isCostConfirmed: true } },
      { new: true }  // This returns the updated ad
    );

    // Log the updated ad to verify that the update was successful
    console.log('Updated ad:', updatedAd);

    if (!updatedAd) {
      console.error('Ad not found or update failed');
      throw new GraphQLError('Ad not found or update failed');
    }

  // Helper to ensure all metadata values are strings
const toStr = (v) => v == null ? '' : (typeof v === 'string' ? v : (v.toString?.() ?? String(v)));

const pi = await stripeEngne.paymentIntents.create({
  amount: Math.round(Number(amount) * 100), // ensure integer cents
  currency: currency,
  metadata: {
    adId: toStr(adId),
    campaignId: toStr(campaignId),
    advertiserId: toStr(advertizer._id), // ObjectId → string
    location: toStr(location),           // Ensure location is string, e.g. "Rwanda, Kigali"
    duration: toStr(duration)            // Number → string
  }
});


console.log('does the price created?', pi)

   return {
  id: pi.id,
  clientSecret: pi.client_secret,
  isCostConfirmed: true,
 
  amount: pi.amount,             
  currency: pi.currency,          
  location,                       
  adId,                         
  campaignId,
  adType
};

  } catch (error) {
    console.error('Error updating ad or creating PaymentIntent:', error);
    throw new GraphQLError('Error confirming price and creating payment intent');
  }
};

export default confirmPrice;