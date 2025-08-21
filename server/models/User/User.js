import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
  // Core Identity
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },

  // Monetization
 role: {
  type: String,
  enum: ['regular', 'premium'], 
  default: 'regular',
  index: true
},


 subscription: {
  status: {
    type: String,
    enum: ['none', 'trialing', 'active', 'past_due', 'canceled'],
    default: 'none' 
  },
  periodEnd: {
    type: Date,
    index: true
  },
  planId: {
    type: String // 'monthly_plan' or 'annual_plan'
  }
},


  // Ad Tracking
  adLimits: {
    skipsAllowed: {
      type: Number,
      default: 5,
      min: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// --------------------------
// Indexes
// --------------------------
userSchema.index({ 'subscription.status': 1, 'subscription.periodEnd': 1 });
userSchema.index({ role: 1, 'subscription.status': 1 });
userSchema.index({ 'adLimits.lastReset': 1 });

// --------------------------
// Virtuals
// --------------------------
userSchema.virtual('isPremium').get(function() {
  return this.role === 'premium' && 
         this.subscription.status === 'active' &&
         (!this.subscription.periodEnd || this.subscription.periodEnd > new Date());
});

userSchema.virtual('shouldSeeAds').get(function() {
  return !this.isPremium;
});

// --------------------------
// Methods
// --------------------------
userSchema.methods = {
  // Password handling
  comparePassword: async function(candidate) {
    return bcrypt.compare(candidate, this.password);
  },

  // Ad skip handling
  canSkipAd: function() {
    if (this.isPremium) return true;
    
    // Reset daily skip allowance
    if (Date.now() - this.adLimits.lastReset > 86400000) {
      this.adLimits.skipsAllowed = 5;
      this.adLimits.lastReset = new Date();
      this.markModified('adLimits');
      return true;
    }
    
    return this.adLimits.skipsAllowed > 0;
  },

  recordAdSkip: function() {
    if (!this.isPremium) {
      this.adLimits.skipsAllowed -= 1;
    }
    return this.save();
  }
};

// --------------------------
// Statics
// --------------------------
userSchema.statics = {
  // Payment processor integration
  handleSubscriptionUpdate: async function(userId, eventData) {
    const update = {
      'subscription.status': eventData.status,
      'subscription.periodEnd': eventData.current_period_end 
        ? new Date(eventData.current_period_end * 1000) 
        : null
    };

    if (eventData.status === 'active') {
      update.role = 'premium';
    }

    return this.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );
  }
};

// --------------------------
// Hooks
// --------------------------
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

export default model('User', userSchema);