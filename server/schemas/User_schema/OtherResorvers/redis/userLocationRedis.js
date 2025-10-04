
import { getRedis } from "../../../../utils/AdEngine/redis/redisClient.js";


const GOOGLE_MONTHLY_LIMIT = 9500;
const IPWHO_MONTHLY_LIMIT = 10000;


const LOCATION_KEY = (userId) => `location:user:${userId}`;
const VENDOR_USAGE_KEY = (vendor) => `usage:vendor:${vendor}`;
const TTL_30_DAYS = 60 * 60 * 24 * 30;





export async function getCachedLocation(userId) {
  const redis = await getRedis(); 
  const key = LOCATION_KEY(userId);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}




export async function cacheUserLocation(userId, location) {
  const redis = await getRedis(); // ✅
  const key = LOCATION_KEY(userId);
  await redis.set(key, JSON.stringify(location), {
    EX: TTL_30_DAYS,
  });
}

export async function incrementVendorUsage(vendor) {
  const redis = await getRedis(); // ✅
  const key = VENDOR_USAGE_KEY(vendor);
  return redis.incr(key);
}



export function isSameLocation(loc1, loc2) {
  if (!loc1 || !loc2) return false;
  // Just compare 3 decimal places (~100m)
  return (
    +Number(loc1.lat).toFixed(3) === +Number(loc2.lat).toFixed(3) &&
    +Number(loc1.lon).toFixed(3) === +Number(loc2.lon).toFixed(3)
  );
}




export async function getVendorUsage(vendor) {
  const redis = await getRedis();
  const key = VENDOR_USAGE_KEY(vendor);
  const count = await redis.get(key);
  return parseInt(count) || 0;
}

export const checkVendorLimit = async (vendor) => {
  const current = await getVendorUsage(vendor);
  if (vendor === 'google') return current < GOOGLE_MONTHLY_LIMIT;
  if (vendor === 'ipwho') return current < IPWHO_MONTHLY_LIMIT;
  return true;
};




