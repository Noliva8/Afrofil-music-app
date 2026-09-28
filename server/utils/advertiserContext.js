export const ADVERTISER_ROLES = {
  ADVERTISER: 'advertiser',
  LEGACY_ADVERTIZER: 'advertizer',
  ADMIN: 'admin',
  OWNER: 'owner',
};

export const getAdvertiserFromContext = (context = {}) =>
  context.advertiser ||
  context.advertizer ||
  context?.req?.advertiser ||
  context?.req?.advertizer ||
  null;

export const normalizeAdvertiserRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  return normalized === ADVERTISER_ROLES.LEGACY_ADVERTIZER
    ? ADVERTISER_ROLES.ADVERTISER
    : normalized;
};

export const isAdminAdvertiser = (account) => {
  const role = normalizeAdvertiserRole(account?.role);
  return account?.isSuperAdmin === true || role === ADVERTISER_ROLES.ADMIN || role === ADVERTISER_ROLES.OWNER;
};
