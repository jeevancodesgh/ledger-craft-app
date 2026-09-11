import { config } from 'dotenv';
import { resolve } from 'node:path';
import {
  ensureLedgercraftTestDatabase,
  rewriteDatabaseName,
  TEST_DATABASE_NAME,
} from './ensure-test-database';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../.env') });

process.env.NODE_ENV = 'test';
process.env.DATABASE_ADMIN_URL ??= 'postgres://postgres:postgres@127.0.0.1:55432/ledgercraft';

const appUrl = process.env.DATABASE_URL ?? 'postgres://ledgercraft_app:app@127.0.0.1:55432/ledgercraft';
const migrateUrl =
  process.env.DATABASE_MIGRATE_URL ?? 'postgres://ledgercraft_migrator:migrator@127.0.0.1:55432/ledgercraft';

process.env.DATABASE_URL =
  process.env.DATABASE_TEST_URL ?? rewriteDatabaseName(appUrl, TEST_DATABASE_NAME);
process.env.DATABASE_MIGRATE_URL =
  process.env.DATABASE_TEST_MIGRATE_URL ?? rewriteDatabaseName(migrateUrl, TEST_DATABASE_NAME);

process.env.BETTER_AUTH_SECRET ??= 'test-only-better-auth-secret-32ch';
process.env.BETTER_AUTH_URL ??= 'http://localhost:8080';

await ensureLedgercraftTestDatabase();
