import { sql as dsql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { createDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { rlsProbe } from '../db/schema/probe';
import { getAdminDatabaseUrl, getDatabaseUrl, getMigrateDatabaseUrl } from '../env';

export const ORG_A = '11111111-1111-1111-1111-111111111111';
export const ORG_B = '22222222-2222-2222-2222-222222222222';
export const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

export type AppTx = Database;

export async function withTestDb<T>(
  run: (ctx: {
    db: Database;
    asApp: <R>(organisationId: string, fn: (tx: AppTx) => Promise<R>, userId?: string) => Promise<R>;
    asMigrator: Database;
    appSql: ReturnType<typeof createDb>['sql'];
  }) => Promise<T>,
): Promise<T> {
  await applyMigrations();

  const migrator = createDb(getMigrateDatabaseUrl());
  const app = createDb(getDatabaseUrl());

  try {
    await migrator.sql`TRUNCATE TABLE rls_probe`;
    await migrator.sql`
      TRUNCATE TABLE
        journal_entry_lines,
        journal_entries,
        line_items,
        shared_invoices,
        idempotency_keys,
        invoices,
        items,
        item_categories,
        business_profiles,
        accounts,
        customers,
        organisation_memberships,
        organisations,
        sessions,
        auth_accounts,
        verifications,
        users
      CASCADE
    `;
    await migrator.db.insert(rlsProbe).values([
      { organisationId: ORG_A, label: 'org-a' },
      { organisationId: ORG_B, label: 'org-b' },
    ]);

    const asApp = async <R>(
      organisationId: string,
      fn: (tx: AppTx) => Promise<R>,
      userId = USER_A,
    ): Promise<R> => {
      return app.db.transaction(async (tx) => {
        await tx.execute(dsql`SELECT set_config('app.user_id', ${userId}, true)`);
        await tx.execute(dsql`SELECT set_config('app.organisation_id', ${organisationId}, true)`);
        return fn(tx);
      });
    };

    return await run({
      db: app.db,
      asApp,
      asMigrator: migrator.db,
      appSql: app.sql,
    });
  } finally {
    await Promise.all([migrator.sql.end({ timeout: 5 }), app.sql.end({ timeout: 5 })]);
  }
}

export async function assertLocalDatabaseReachable(): Promise<void> {
  const adminUrl = getAdminDatabaseUrl() ?? getMigrateDatabaseUrl();
  const sql = (await import('postgres')).default(adminUrl, { max: 1, connect_timeout: 5 });
  try {
    await sql`SELECT 1`;
  } catch (error) {
    throw new Error(
      `Postgres is not reachable. Run \`pnpm db:up\` first. ${(error as Error).message}`,
    );
  } finally {
    await sql.end({ timeout: 2 });
  }
}
