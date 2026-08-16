import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const now = new Date();
const target = resolve(process.cwd(), 'src/Routes/appVersion.js');
const year = String(now.getFullYear()).slice(-2);
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const datePrefix = `${year}.${month}.${day}`;

const readCurrentVersion = () => {
  if (!existsSync(target)) return null;
  const current = readFileSync(target, 'utf8');
  return current.match(/version:\s*'([^']+)'/)?.[1] || null;
};

const currentVersion = readCurrentVersion();
const currentMatch = currentVersion?.match(/^(\d{2}\.\d{2}\.\d{2})\.(\d+)$/);
const nextNumber = currentMatch?.[1] === datePrefix
  ? Number(currentMatch[2]) + 1
  : 1;
const version = `${datePrefix}.${nextNumber}`;

writeFileSync(
  target,
  `export const APP_VERSION = {
  version: '${version}',
  buildTime: '${now.toISOString()}',
};
`,
);

console.log(`Updated app version: ${version}`);
