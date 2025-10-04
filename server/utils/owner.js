
// import dotenv from 'dotenv';
// dotenv.config();

// import mongoose from 'mongoose';
// import { Advertizer } from '../models/Advertizer/index_advertizer.js';
// import { signAdminToken } from './advertizer_auth.js';

// // Prefer DB_URI, else MONGODB_URI/MONGODB_URL

// const DB_URI =
//   process.env.DB_URI 

const PERMISSIONS = {
  // Ad management
  VIEW_ADS: 'view_ads',
  APPROVE_ADS: 'approve_ads',
  REJECT_ADS: 'reject_ads',
  EDIT_ADS: 'edit_ads',
  DELETE_ADS: 'delete_ads',
  
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  BAN_USERS: 'ban_users',
  // Advertiser management
  VIEW_ADVERTISERS: 'view_advertisers',
  APPROVE_ADVERTISERS: 'approve_advertisers',
  MANAGE_ADVERTISERS: 'manage_advertisers',
  // Reports & analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_PAYMENTS: 'manage_payments',
  // Admin management
  MANAGE_ADMINS: 'manage_admins',
  ASSIGN_PERMISSIONS: 'assign_permissions'
};

// async function owner() {
//   if (!DB_URI) {
//     console.error('❌ Missing DB_URI (or MONGODB_URI/MONGODB_URL) in .env');
//     process.exit(1);
//   }

//   try {
//     await mongoose.connect(DB_URI);
//     console.log('🔗 Connected to MongoDB');

//     // Abort if an Owner already exists
//     const exists = await Advertizer.exists({ isSuperAdmin: true });
//     if (exists) {
//       console.log('❌ Owner (isSuperAdmin) already exists:', exists._id.toString());
//       process.exit(1);
//     }

//     // Pull Owner fields from env or use sensible placeholders
//     const fullName      = process.env.OWNER_FULLNAME  || 'Site Owner';
//     const businessEmail = (process.env.OWNER_EMAIL    || 'owner@afrofeel.com').toLowerCase();
//     const companyName   = process.env.OWNER_COMPANY   || 'AfroFeel';
//     const phoneNumber   = process.env.OWNER_PHONE     || '+1-555-9999';
//     const password      = process.env.OWNER_PASSWORD  || 'ChangeMe!123'; // will be hashed by pre-save hook
//     const country       = process.env.OWNER_COUNTRY   || 'US';

//     const ownerDoc = await Advertizer.create({
//       fullName,
//       companyName,
//       phoneNumber,
//       businessEmail,
//       password,                  // hashed by your schema's pre-save hook
//       country,
//       acceptedTerms: true,
//       acceptedTermsAt: new Date(),

//       // 🔒 Owner flags
//       role: 'admin',
//       isSuperAdmin: true,
//       permissions: Object.values(PERMISSIONS),

//       // make usable immediately
//       isConfirmed: true,
//       isPhoneConfirmed: true
//     });

//     // Create an admin token (role enforced inside your signer)
//     const adminToken = signAdminToken(ownerDoc.toObject());

//     console.log('✅ Owner created:', {
//       id: ownerDoc._id.toString(),
//       email: ownerDoc.businessEmail
//     });
//     console.log('🔑 Admin JWT (for testing):');
//     console.log(adminToken);
//   } catch (err) {
//     if (err?.code === 11000) {
//       console.error('❌ Duplicate key (email already in use). Change OWNER_EMAIL.');
//     } else {
//       console.error('❌ Error bootstrapping owner:', err);
//     }
//     process.exit(1);
//   } finally {
//     await mongoose.disconnect();
//     process.exit(0);
//   }
// }

// owner();
