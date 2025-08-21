import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const AdvertizerSchema = new Schema({
  // Core Identity
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  companyName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  businessEmail: {
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



  isConfirmed: {
  type: Boolean,
  default: false
},

confirmationToken: {
  type: String
},
confirmationTokenExpire: {
  type: Date,
},

isPhoneConfirmed:{
  type: Boolean,
  default: false
},
phoneCode: {
  type: Number
},


country: {
  type: String,
  required: true
},
 companyWebsite: {
  type: String,
  
},

acceptedTerms: {
  type: Boolean,
  required: true,
  default: false
},
acceptedTermsAt: {
  type: Date
},
termsVersion: {
  type: String,
  default: 'v1.0'
},



  role: {
    type: String,
    enum: ['advertizer', 'admin'],
    default: 'advertizer'
  },
  brandType: {
    type: String,
    enum: ['creator', 'business', 'nonprofit', 'other'],
    default: 'business',
    required: true
  },

   // Admin-specific fields
  isSuperAdmin: { type: Boolean, default: false },
  permissions: {
    type: [String] 
},

  },

 {
  timestamps: true,
  toJSON: { virtuals: true }
});

// --------------------------
// Methods
// --------------------------
AdvertizerSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};


AdvertizerSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin';
});

AdvertizerSchema.methods.hasPermission = function (perm) {
  return this.isSuperAdmin || (Array.isArray(this.permissions) && this.permissions.includes(perm));
};

// --------------------------
// Hooks
// --------------------------
AdvertizerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const hashed = await bcrypt.hash(this.password, 12);
    this.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});

export default model('Advertizer', AdvertizerSchema);
