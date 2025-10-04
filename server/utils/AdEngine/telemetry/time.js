// server/utils/telemetry/time.js
export function secondsUntilMidnightUTC() {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1, 0, 0, 0
  );
  return Math.max(1, Math.floor((midnight - now.getTime()) / 1000));
}
