// Minimal config. Use `rediss://` for TLS providers (e.g. Upstash).
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
