
import { Schema, model } from 'mongoose';

const AdSchema = new Schema({
  advertiserId: {
    type: Schema.Types.ObjectId,
    ref: 'Advertizer',
    required: true,
  },

  campaignId: {
    type: String,
    unique: true,
    default: () => `afrofeel_${Math.random().toString(36).slice(2, 11)}`
  },

  // === Basics ===
  adTitle: { type: String, required: true, maxlength: 60 },
  description: { type: String, default: '' },
  adType: { type: String, enum: ['audio', 'banner', 'overlay'], required: true },

  // === Location & Duration (inline objects) ===
  targeting: {
    scope: { type: String, enum: ['worldwide', 'country', 'city'], required: true },
    countries: { type: [String], default: [] },
    wholeCountry: { type: Boolean, default: false }, 
     state: {
    type: String, 
    default: '',
  },
    city: { type: String, default: '' }
  },

  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  // === Pricing ===
  isCostConfirmed: { type: Boolean, default: false },
  pricing: {
    dailyRate: { type: Number, default: null },
    totalCost: { type: Number, default: null }
  },

  // === Payment ===
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null },

  // === Creative ===

  streamingOverlayAdUrl: { type: String, default: null},
  originalOverlayUrl: { type: String, default: null},
streamingBannerAdUrl: { type: String, default: null },
originalBannerAdUrl: { type: String, default: null },
  masterAudionAdUrl: { type: String, default: null },
  streamingAudioAdUrl: { type: String, default: null },
  streamingFallBackAudioUrl: { type: String, default: null },
  adArtWorkUrl: { type: String, default: null },


 
  bannerFormat: {
  type: String,
  enum: [
    'image/jpeg',
    'image/png',
  ]
},

audioFormat: {
  type: String,
  enum: [
    'audio/mpeg',  
    'audio/wav',
    'audio/aac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/flac',
    'audio/ogg',
    'audio/opus',
    'audio/webm'
  ]
},

  // === Performance Tracking ===
  analytics: {
    plays: { type: Number, default: 0 },
    skips: { type: Number, default: 0 },
    avgPlayDuration: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    byCountry: [{
      country: String,
      impressions: Number,
      clicks: Number
    }],
    lastUpdated: { type: Date, default: null }
  },

  // === Status ===
  status: {
    type: String,
    enum: ['draft', 'waiting_for_approval', 'active', 'paused', 'completed'],
    default: 'draft'
  },


    audioDurationMs: {
    type: Number,
    min: 0
  },
  bannerAdWidthPx:{type: Number},
  bannerAdHeghtPx: {type: Number},

  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto fields
AdSchema.pre('save', function(next) {
  if (this.isModified('analytics')) {
    this.analytics.lastUpdated = new Date();
    if (this.analytics.impressions > 0) {
      this.analytics.clickThroughRate = (this.analytics.clicks / this.analytics.impressions) * 100;
    }
  }
  this.updatedAt = new Date();
  next();
});

const Ad = model('Ad', AdSchema);
export default Ad;
