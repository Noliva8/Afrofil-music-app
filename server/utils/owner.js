
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

import dotenv from 'dotenv';
import { dbConnection } from '../config/connection.js';
import Advertizer from '../models/Advertizer/Advertizer.js';
import { signAdvertiserToken } from './AuthSystem/tokenUtils.js';
import { USER_TYPES } from './AuthSystem/constant/systemRoles.js';

dotenv.config();

const loggedBootstrapMessages = new Set();

function logBootstrapMessage(level, message) {
  if (loggedBootstrapMessages.has(message)) return;
  loggedBootstrapMessages.add(message);
  console[level](message);
}

function readAccountEnv(envPrefix, defaults) {
  return {
    fullName: process.env[`${envPrefix}_FULLNAME`] || defaults.fullName,
    businessEmail: (process.env[`${envPrefix}_EMAIL`] || defaults.businessEmail).toLowerCase(),
    companyName: process.env[`${envPrefix}_COMPANY`] || defaults.companyName,
    phoneNumber: process.env[`${envPrefix}_PHONE`] || defaults.phoneNumber,
    password: process.env[`${envPrefix}_PASSWORD`] || defaults.password,
    country: process.env[`${envPrefix}_COUNTRY`] || defaults.country
  };
}

async function bootstrapAccount({ role, isSuperAdmin, label, envPrefix, defaults }) {
  try {
    if (dbConnection.readyState === 0) {
      throw new Error('Mongoose is not connected. Connect the app database before bootstrapping accounts.');
    }

    if (dbConnection.readyState === 2) {
      await dbConnection.asPromise();
    }

    const {
      fullName,
      businessEmail,
      companyName,
      phoneNumber,
      password,
      country
    } = readAccountEnv(envPrefix, defaults);

    const existingAccount = await Advertizer.findOne({
      $or: [
        { isSuperAdmin, role },
        { businessEmail }
      ]
    });

    if (existingAccount) {
      if (existingAccount.role === role && existingAccount.isSuperAdmin === isSuperAdmin) {
        return existingAccount;
      }

      logBootstrapMessage(
        'error',
        `${label} bootstrap skipped: ${businessEmail} already belongs to role "${existingAccount.role}" with isSuperAdmin=${existingAccount.isSuperAdmin}. Change ${envPrefix}_EMAIL or update that account.`
      );
      return null;
    }

    const ownerDoc = await Advertizer.create({
      fullName,
      companyName,
      phoneNumber,
      businessEmail,
      password,
      country,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      role,
      isSuperAdmin,
      permissions: Object.values(PERMISSIONS),
      isConfirmed: true,
      isPhoneConfirmed: true
    });

    const ownerToken = signAdvertiserToken(ownerDoc.toObject(), USER_TYPES.ADVERTISER);

    console.log(`${label} created successfully`);
    console.log(JSON.stringify({
      id: ownerDoc._id.toString(),
      email: ownerDoc.businessEmail,
      role: ownerDoc.role,
      token: ownerToken
    }, null, 2));

    return ownerDoc;
  } catch (err) {
    if (err?.code === 11000) {
      if (err?.keyPattern?.isSuperAdmin) {
        logBootstrapMessage(
          'error',
          `${label} bootstrap skipped: old unique isSuperAdmin index is still active. Drop the isSuperAdmin_1 index and restart.`
        );
        return null;
      }

      if (err?.keyPattern?.businessEmail) {
        logBootstrapMessage(
          'error',
          `${label} bootstrap skipped: duplicate email. Change ${envPrefix}_EMAIL.`
        );
        return null;
      }

      logBootstrapMessage('error', `${label} bootstrap skipped: duplicate key ${JSON.stringify(err.keyValue || {})}.`);
      return null;
    }
    logBootstrapMessage('error', `${label} bootstrap failed: ${err?.message || err}`);
    return null;
  }
}

export async function admin() {
  return bootstrapAccount({
    role: 'admin',
    isSuperAdmin: false,
    label: 'Admin',
    envPrefix: 'ADMIN',
    defaults: {
      fullName: 'Platform Admin',
      businessEmail: 'admin@afrofeel.com',
      companyName: 'flolup',
      phoneNumber: '+1-555-9998',
      password: 'ChangeMe!123',
      country: 'US'
    }
  });
}

export async function owner() {
  return bootstrapAccount({
    role: 'owner',
    isSuperAdmin: true,
    label: 'Owner',
    envPrefix: 'OWNER',
    defaults: {
      fullName: 'Site Owner',
      businessEmail: 'owner@afrofeel.com',
      companyName: 'flolup',
      phoneNumber: '+1-555-9999',
      password: 'ChangeMe!123',
      country: 'US'
    }
  });
}

export async function superAdmin() {
  return bootstrapAccount({
    role: 'admin',
    isSuperAdmin: true,
    label: 'Super Admin',
    envPrefix: 'SUPER_ADMIN',
    defaults: {
      fullName: 'Super Admin',
      businessEmail: 'superadmin@afrofeel.com',
      companyName: 'flolup',
      phoneNumber: '+1-555-9997',
      password: 'ChangeMe!123',
      country: 'US'
    }
  });
}
