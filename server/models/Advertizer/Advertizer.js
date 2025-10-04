import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const AdvertizerSchema = new Schema(
  {
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
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    businessEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,                 // ✅ normalize for unique index
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },

    // Email verification
    isConfirmed: { type: Boolean, default: false },
    confirmationToken: { type: String },
    confirmationTokenExpire: { type: Date },

    // Phone verification
    isPhoneConfirmed: { type: Boolean, default: false },
    phoneCode: { type: Number },

    // Business meta
    country: { type: String, required: true },
    companyWebsite: { type: String, trim: true },

    acceptedTerms: { type: Boolean, required: true, default: false },
    acceptedTermsAt: { type: Date },
    termsVersion: { type: String, default: 'v1.0' },

    // Roles & permissions
    role: {
      type: String,
      enum: ['advertizer', 'admin'],
      default: 'advertizer',
      index: true
    },
    brandType: {
      type: String,
      enum: ['creator', 'business', 'nonprofit', 'other'],
      default: 'business',             // ✅ match enum case
      required: true
    },

    // Admin-specific fields
    isSuperAdmin: { type: Boolean, default: false },
    permissions: {
      type: [String],
      default: [],                     // ✅ safer default
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;          // ✅ never leak password in JSON
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// --------------------------
// Methods
// --------------------------
AdvertizerSchema.methods.comparePassword = async function (candidate) {
  // NOTE: when fetching for login, use .select('+password')
  return bcrypt.compare(candidate, this.password);
};

AdvertizerSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin';
});

AdvertizerSchema.methods.hasPermission = function (perm) {
  return this.isSuperAdmin || (Array.isArray(this.permissions) && this.permissions.includes(perm));
};

AdvertizerSchema.index(
  { isSuperAdmin: 1 },
  { unique: true, partialFilterExpression: { isSuperAdmin: true } }
);


// --------------------------
// Hooks
// --------------------------
AdvertizerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

export default model('Advertizer', AdvertizerSchema);
