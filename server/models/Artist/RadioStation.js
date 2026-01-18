import mongoose from "mongoose";
import { RADIO_TYPES } from "../../utils/radioTypes.js";

const { Schema } = mongoose;

const seedSchema = new Schema(
  {
    seedType: {
      type: String,
      enum: ["artist", "genre", "mood", "track", "era"],
      required: true,
      trim: true,
    },
    seedId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const radioStationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    type: {
      type: String,
      enum: Object.values(RADIO_TYPES),
      required: true,
    },
    seeds: {
      type: [seedSchema],
      default: [],
    },
    coverImage: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RadioStation", radioStationSchema);
