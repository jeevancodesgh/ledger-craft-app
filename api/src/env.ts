import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../.env') });

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function getDatabaseUrl(): string {
  return requiredEnv('DATABASE_URL');
}

export function getMigrateDatabaseUrl(): string {
  return process.env.DATABASE_MIGRATE_URL ?? requiredEnv('DATABASE_URL');
}

export function getAdminDatabaseUrl(): string | undefined {
  return process.env.DATABASE_ADMIN_URL;
}

export const apiPort = Number(process.env.API_PORT ?? 3001);
