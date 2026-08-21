import { Schema, model } from 'mongoose';

const visitSchema = new Schema(

  {
    visitorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    endedAt: {
      type: Date,
      default: null,
      index: true,
    },

    startedAnonymous: {
      type: Boolean,
      default: true,
      index: true,
    },

    isAnonymous: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    conversionType: {
      type: String,
      enum: ['ANONYMOUS', 'NEW_USER', 'EXISTING_USER'],
      default: 'ANONYMOUS',
      index: true,
    },

    convertedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

visitSchema.index({ visitorId: 1, lastSeenAt: -1 });
visitSchema.index({ startedAt: 1, visitorId: 1 });

const Visit = model('Visit', visitSchema);

export default Visit;
