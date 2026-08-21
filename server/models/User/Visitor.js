import { Schema, model } from 'mongoose';

const visitorSchema = new Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    becameUserAt: {
      type: Date,
      default: null,
      index: true,
    },
    conversionType: {
      type: String,
      enum: ['NEW_USER', 'EXISTING_USER', null],
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

const Visitor = model('Visitor', visitorSchema);

export default Visitor;
