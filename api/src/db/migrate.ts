import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMigratorDb } from './client';

const drizzleFolder = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../drizzle');

export async function applyMigrations(): Promise<void> {
  const { db, sql } = createMigratorDb();
  try {
    await migrate(db, { migrationsFolder: drizzleFolder });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  applyMigrations()
    .then(() => {
      console.log(JSON.stringify({ msg: 'migrations_applied', folder: drizzleFolder }));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
