import postgres from 'postgres';

export const TEST_DATABASE_NAME = 'ledgercraft_test';

export function rewriteDatabaseName(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.href;
}

function adminUrl(): string {
  return process.env.DATABASE_ADMIN_URL ?? 'postgres://postgres:postgres@127.0.0.1:55432/ledgercraft';
}

export async function ensureLedgercraftTestDatabase(): Promise<void> {
  const maintenance = postgres(rewriteDatabaseName(adminUrl(), 'postgres'), {
    max: 1,
    connect_timeout: 5,
  });
  try {
    const existing = await maintenance`
      SELECT 1 FROM pg_database WHERE datname = ${TEST_DATABASE_NAME}
    `;
    if (existing.length === 0) {
      await maintenance.unsafe(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
    }
    await maintenance.unsafe(
      `GRANT CONNECT ON DATABASE ${TEST_DATABASE_NAME} TO ledgercraft_migrator, ledgercraft_app, ledgercraft_readonly`,
    );
    await maintenance.unsafe(
      `GRANT CREATE ON DATABASE ${TEST_DATABASE_NAME} TO ledgercraft_migrator`,
    );
  } finally {
    await maintenance.end({ timeout: 5 });
  }

  const testAdmin = postgres(rewriteDatabaseName(adminUrl(), TEST_DATABASE_NAME), {
    max: 1,
    connect_timeout: 5,
  });
  try {
    await testAdmin.unsafe('GRANT USAGE, CREATE ON SCHEMA public TO ledgercraft_migrator');
    await testAdmin.unsafe('GRANT USAGE ON SCHEMA public TO ledgercraft_app, ledgercraft_readonly');
    await testAdmin.unsafe('ALTER SCHEMA public OWNER TO ledgercraft_migrator');
    await testAdmin.unsafe(`
      ALTER DEFAULT PRIVILEGES FOR ROLE ledgercraft_migrator IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ledgercraft_app
    `);
    await testAdmin.unsafe(`
      ALTER DEFAULT PRIVILEGES FOR ROLE ledgercraft_migrator IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ledgercraft_app
    `);
    await testAdmin.unsafe(`
      ALTER DEFAULT PRIVILEGES FOR ROLE ledgercraft_migrator IN SCHEMA public
        GRANT SELECT ON TABLES TO ledgercraft_readonly
    `);
    await testAdmin.unsafe(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ledgercraft_app',
    );
    await testAdmin.unsafe(
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ledgercraft_app',
    );
    await testAdmin.unsafe('GRANT SELECT ON ALL TABLES IN SCHEMA public TO ledgercraft_readonly');
  } finally {
    await testAdmin.end({ timeout: 5 });
  }
}
