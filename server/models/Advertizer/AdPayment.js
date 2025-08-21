import { Schema, model, Types } from 'mongoose';


const adPaymentSchema = new Schema({
  ad: {
    type: Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  advertiser: {
    type: Types.ObjectId,
    ref: 'Advertizer',
    required: true
  },
  amount: Number,
  currency: {
    type: String,
    default: 'usd'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  paymentMethod: String,
  stripeSessionId: String,
  paidAt: Date
}, {
  timestamps: true
});

export default model('AdPayment', adPaymentSchema);
