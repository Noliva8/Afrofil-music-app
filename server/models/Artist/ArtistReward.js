import { Schema, model } from 'mongoose';

const artistRewardSchema = new Schema(
  {
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },

    songId: {
      type: Schema.Types.ObjectId,
      ref: 'Song',
      required: true,
    },

    weeklyPlayCount: {
      type: Number,
      required: true,
      default: 0,
    },

    weeklyLikeCount: {
      type: Number,
      required: true,
      default: 0,
    },

    rewardAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },

    weekStartDate: {
      type: Date,
      required: true,
    },

    weekEndDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ['AVAILABLE', 'PROCESSING', 'PAID'],
      default: 'AVAILABLE',
    },

    payoutPhone: {
      type: String,
      default: null,
    },

    cashoutRequestedAt: {
      type: Date,
      default: null,
    },

    cashoutRequestId: {
      type: String,
      default: null,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same song from receiving two rewards for the same week
artistRewardSchema.index(
  { songId: 1, weekStartDate: 1 },
  { unique: true }
);

const ArtistReward = model('ArtistReward', artistRewardSchema);

export default ArtistReward;
