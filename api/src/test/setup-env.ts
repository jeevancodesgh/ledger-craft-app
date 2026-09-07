import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../.env') });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgres://ledgercraft_app:app@127.0.0.1:55432/ledgercraft';
process.env.DATABASE_MIGRATE_URL ??=
  'postgres://ledgercraft_migrator:migrator@127.0.0.1:55432/ledgercraft';
process.env.DATABASE_ADMIN_URL ??= 'postgres://postgres:postgres@127.0.0.1:55432/ledgercraft';
process.env.BETTER_AUTH_SECRET ??= 'test-only-better-auth-secret-32ch';
process.env.BETTER_AUTH_URL ??= 'http://localhost:8080';
