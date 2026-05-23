import { Schema, model } from 'mongoose';


const artistSupportSchema = new Schema({
  songId: {
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    index: true
  },
  
  artistId: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
    index: true
  },
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },

  currency: {
    type: String,
    default: 'usd',
    lowercase: true,
    trim: true
  },

  stripeFee: {
    type: Number,
    default: 0,
    min: 0
  },

  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },

  artistAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'canceled', 'refunded'],
    default: 'pending',
    index: true
  },

  stripeCheckoutSessionId: {
    type: String,
    index: true
  },

  stripePaymentIntentId: {
    type: String,
    index: true
  },

  supporterCountry: {
    type: String,
    trim: true
  },

  supporterCountryCode: {
    type: String,
    uppercase: true,
    trim: true
  },

  artistCountry: {
    type: String,
    trim: true
  },

  platformCountry: {
    type: String,
    default: 'US',
    uppercase: true,
    trim: true
  },

  paidAt: Date
}, {
  timestamps: true
});

export default model('ArtistSupport', artistSupportSchema);
