import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/probe.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATE_URL ?? '',
  },
});
