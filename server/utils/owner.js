export const PERMISSION_OWNER = {

// Super admin Management
// -----------------------

CREATE_SUPER_ADMIN: "create_super_admin",
EDIT_SUPER_ADMIN:"edit_super_admin",
VIEW_SUPER_ADMINS: "view_super_admins",
DELETE_SUPER_ADMIN: "delete_super_admin",
 ASSIGN_PERMISSIONS: 'assign_permissions',





// admin Management
// -----------------------


CREATE_ADMIN: "create_admin",
EDIT_ADMIN:"edit_admin",
VIEW_ADMINS: "view_admins",
DELETE_ADMIN: "delete_admin",





// artist management
// ------------------

EDIT_ARTIST:"edit_artist",
VIEW_ARTIST: "view_artist",
DELETE_ARTIST: "delete_artist",






// Songs management
// ---------------

SONGS_INVENTORY: 'view_songs',
EDIT_SONG: "edit_song",
DELETE_SONGS: 'delete_songs',






 // Advertiser management
// ---------------------

  VIEW_ADVERTISERS: 'view_advertisers',
  APPROVE_ADVERTISERS: 'approve_advertisers',
  MANAGE_ADVERTISERS: 'manage_advertisers',



  // Ad management
  // -------------

 VIEW_ADS: 'view_ads',
  APPROVE_ADS: 'approve_ads',
  REJECT_ADS: 'reject_ads',
  EDIT_ADS: 'edit_ads',
  DELETE_ADS: 'delete_ads',
  CREATE_PLATFORM_ADS: 'create_platform_ads',



  // User management
  // ---------------
 VIEW_USERS: 'view_users',
  DELETE_USERS: 'delete_users',


    // Reports & analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_PAYMENTS: 'manage_payments',


}



export const PERMISSION_SUPER_ADMIN = {

// admin Management
// -----------------------


CREATE_ADMIN: "create_admin",
EDIT_ADMIN:"edit_admin",
VIEW_ADMINS: "view_admins",
DELETE_ADMIN: "delete_admin",





// artist management
// ------------------

EDIT_ARTIST:"edit_artist",
VIEW_ARTIST: "view_artist",
DELETE_ARTIST: "delete_artist",






// Songs management
// ---------------

SONGS_INVENTORY: 'view_songs',
EDIT_SONG: "edit_song",
DELETE_SONGS: 'delete_songs',






 // Advertiser management
// ---------------------

  VIEW_ADVERTISERS: 'view_advertisers',
  APPROVE_ADVERTISERS: 'approve_advertisers',
  MANAGE_ADVERTISERS: 'manage_advertisers',



  // Ad management
  // -------------

 VIEW_ADS: 'view_ads',
  APPROVE_ADS: 'approve_ads',
  REJECT_ADS: 'reject_ads',
  EDIT_ADS: 'edit_ads',
  DELETE_ADS: 'delete_ads',
  CREATE_PLATFORM_ADS: 'create_platform_ads',



  // User management
  // ---------------
 VIEW_USERS: 'view_users',
  DELETE_USERS: 'delete_users',


    // Reports & analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_PAYMENTS: 'manage_payments',


}


export const PERMISSION_ADMIN = {

// artist management
// ------------------

EDIT_ARTIST:"edit_artist",
VIEW_ARTIST: "view_artist",
DELETE_ARTIST: "delete_artist",






// Songs management
// ---------------

SONGS_INVENTORY: 'view_songs',
EDIT_SONG: "edit_song",
DELETE_SONGS: 'delete_songs',






 // Advertiser management
// ---------------------

  VIEW_ADVERTISERS: 'view_advertisers',
  APPROVE_ADVERTISERS: 'approve_advertisers',
  MANAGE_ADVERTISERS: 'manage_advertisers',



  // Ad management
  // -------------

 VIEW_ADS: 'view_ads',
  APPROVE_ADS: 'approve_ads',
  REJECT_ADS: 'reject_ads',
  EDIT_ADS: 'edit_ads',
  DELETE_ADS: 'delete_ads',
  CREATE_PLATFORM_ADS: 'create_platform_ads',



  // User management
  // ---------------
 VIEW_USERS: 'view_users',
  DELETE_USERS: 'delete_users',


    // Reports & analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_PAYMENTS: 'manage_payments',


}


export const PERMISSION_SECTIONS = [
  {
    label: "Super admins",
    permissions: [
      { key: PERMISSION_OWNER.CREATE_SUPER_ADMIN, label: "Create super admin" },
      { key: PERMISSION_OWNER.EDIT_SUPER_ADMIN, label: "Edit super admin" },
      { key: PERMISSION_OWNER.VIEW_SUPER_ADMINS, label: "View super admins" },
      { key: PERMISSION_OWNER.DELETE_SUPER_ADMIN, label: "Delete super admin" },
      { key: PERMISSION_OWNER.ASSIGN_PERMISSIONS, label: "Assign permissions" },
    ],
  },
  {
    label: "Admins",
    permissions: [
      { key: PERMISSION_OWNER.CREATE_ADMIN, label: "Create admin" },
      { key: PERMISSION_OWNER.EDIT_ADMIN, label: "Edit admin" },
      { key: PERMISSION_OWNER.VIEW_ADMINS, label: "View admins" },
      { key: PERMISSION_OWNER.DELETE_ADMIN, label: "Delete admin" },
    ],
  },
  {
    label: "Artists",
    permissions: [
      { key: PERMISSION_OWNER.EDIT_ARTIST, label: "Edit artist" },
      { key: PERMISSION_OWNER.VIEW_ARTIST, label: "View artist" },
      { key: PERMISSION_OWNER.DELETE_ARTIST, label: "Delete artist" },
    ],
  },
  {
    label: "Songs",
    permissions: [
      { key: PERMISSION_OWNER.SONGS_INVENTORY, label: "View songs" },
      { key: PERMISSION_OWNER.EDIT_SONG, label: "Edit song" },
      { key: PERMISSION_OWNER.DELETE_SONGS, label: "Delete songs" },
    ],
  },
  {
    label: "Advertisers",
    permissions: [
      { key: PERMISSION_OWNER.VIEW_ADVERTISERS, label: "View advertisers" },
      { key: PERMISSION_OWNER.APPROVE_ADVERTISERS, label: "Approve advertisers" },
      { key: PERMISSION_OWNER.MANAGE_ADVERTISERS, label: "Manage advertisers" },
    ],
  },
  {
    label: "Ads",
    permissions: [
      { key: PERMISSION_OWNER.VIEW_ADS, label: "View ads" },
      { key: PERMISSION_OWNER.APPROVE_ADS, label: "Approve ads" },
      { key: PERMISSION_OWNER.REJECT_ADS, label: "Reject ads" },
      { key: PERMISSION_OWNER.EDIT_ADS, label: "Edit ads" },
      { key: PERMISSION_OWNER.DELETE_ADS, label: "Delete ads" },
      { key: PERMISSION_OWNER.CREATE_PLATFORM_ADS, label: "Create platform ads" },
    ],
  },
  {
    label: "Users",
    permissions: [
      { key: PERMISSION_OWNER.VIEW_USERS, label: "View users" },
      { key: PERMISSION_OWNER.DELETE_USERS, label: "Delete users" },
    ],
  },
  {
    label: "Reports",
    permissions: [
      { key: PERMISSION_OWNER.VIEW_REPORTS, label: "View reports" },
      { key: PERMISSION_OWNER.EXPORT_REPORTS, label: "Export reports" },
    ],
  },
  {
    label: "Settings",
    permissions: [
      { key: PERMISSION_OWNER.MANAGE_SETTINGS, label: "Manage settings" },
      { key: PERMISSION_OWNER.MANAGE_CATEGORIES, label: "Manage categories" },
      { key: PERMISSION_OWNER.MANAGE_PAYMENTS, label: "Manage payments" },
    ],
  },
];






import dotenv from 'dotenv';
import { dbConnection } from '../config/connection.js';
import Advertizer from '../models/Advertizer/Advertizer.js';
import { signAdvertiserToken } from './AuthSystem/tokenUtils.js';
import { USER_TYPES } from './AuthSystem/constant/systemRoles.js';

dotenv.config();

export function getPermissionsForAccount({ role, isSuperAdmin }) {
  if (role === 'owner') return Object.values(PERMISSION_OWNER);
  if (role === 'admin' && isSuperAdmin) return Object.values(PERMISSION_SUPER_ADMIN);
  if (role === 'admin') return Object.values(PERMISSION_ADMIN);
  return [];
}

export function getRoleLabelForAccount({ role, isSuperAdmin }) {
  if (role === 'owner') return 'Owner';
  if (role === 'admin' && isSuperAdmin) return 'Super admin';
  if (role === 'admin') return 'Admin';
  return 'Advertiser';
}

export function getAccountTypeForAccount({ role, isSuperAdmin }) {
  if (role === 'owner') return 'owner';
  if (role === 'admin' && isSuperAdmin) return 'super_admin';
  if (role === 'admin') return 'admin';
  return 'advertiser';
}

export function getPermissionSectionsForAccount(account = {}) {
  const permissions = Array.isArray(account.permissions)
    ? account.permissions
    : getPermissionsForAccount(account);
  const permissionSet = new Set(permissions);

  return PERMISSION_SECTIONS
    .map((section) => ({
      label: section.label,
      permissions: section.permissions.filter((permission) => permissionSet.has(permission.key)),
    }))
    .filter((section) => section.permissions.length > 0);
}

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

    const permissions = getPermissionsForAccount({ role, isSuperAdmin });
    const permissionSections = getPermissionSectionsForAccount({ role, isSuperAdmin, permissions });
    const roleLabel = getRoleLabelForAccount({ role, isSuperAdmin });
    const accountType = getAccountTypeForAccount({ role, isSuperAdmin });

    if (existingAccount) {
      if (existingAccount.role === role && existingAccount.isSuperAdmin === isSuperAdmin) {
        const existingPermissions = Array.isArray(existingAccount.permissions)
          ? existingAccount.permissions
          : [];
        const shouldUpdatePermissions =
          existingPermissions.length !== permissions.length ||
          existingPermissions.some((permission, index) => permission !== permissions[index]);

        if (shouldUpdatePermissions) {
          existingAccount.permissions = permissions;
          await existingAccount.save();
        }

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
      permissions,
      isConfirmed: true,
      isPhoneConfirmed: true
    });

    const ownerToken = signAdvertiserToken(
      { ...ownerDoc.toObject(), permissionSections, roleLabel, accountType },
      USER_TYPES.ADVERTISER
    );

    console.log(`${label} created successfully`);

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
