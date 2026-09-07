import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { IDENTITY_COLUMNS } from '../db/schema/identity-inventory';
import { assertLocalDatabaseReachable, ORG_A, ORG_B, USER_A, withTestDb } from './harness';

const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('W3 identity schema', () => {
  it('creates organisations, memberships, and Better Auth tables', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator }) => {
      for (const [table, columns] of Object.entries(IDENTITY_COLUMNS)) {
        const rows = await asMigrator.execute<{ column_name: string }>(sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${table}
        `);
        const present = new Set(rows.map((row) => row.column_name));
        expect(present.size, `missing table ${table}`).toBeGreaterThan(0);
        for (const column of columns) {
          expect(present.has(column), `${table}.${column}`).toBe(true);
        }
      }
    });
  });

  it('keeps Better Auth provider accounts off the chart-of-accounts table', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator }) => {
      const authAccounts = await asMigrator.execute<{ table_name: string }>(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'auth_accounts'
      `);
      expect(authAccounts).toHaveLength(1);

      const accountsColumns = await asMigrator.execute<{ column_name: string }>(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'accounts'
      `);
      const names = new Set(accountsColumns.map((row) => row.column_name));
      expect(names.has('organisation_id')).toBe(true);
      expect(names.has('provider_id')).toBe(false);
      expect(names.has('account_id')).toBe(false);
    });
  });

  it('isolates organisations and memberships by organisation_id under the app role', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator, asApp }) => {
      await asMigrator.execute(sql`
        INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
        VALUES
          (${USER_A}, 'User A', 'a@example.com', true, now(), now()),
          (${USER_B}, 'User B', 'b@example.com', true, now(), now())
      `);
      await asMigrator.execute(sql`
        INSERT INTO organisations (id, name)
        VALUES
          (${ORG_A}::uuid, 'Org A'),
          (${ORG_B}::uuid, 'Org B')
      `);
      await asMigrator.execute(sql`
        INSERT INTO organisation_memberships (organisation_id, user_id, role)
        VALUES
          (${ORG_A}::uuid, ${USER_A}, 'owner'),
          (${ORG_B}::uuid, ${USER_B}, 'owner')
      `);

      const orgs = await asApp(ORG_A, (tx) =>
        tx.execute<{ name: string }>(sql`SELECT name FROM organisations ORDER BY name`),
      );
      expect(orgs.map((row) => row.name)).toEqual(['Org A']);

      const memberships = await asApp(ORG_A, (tx) =>
        tx.execute<{ user_id: string }>(sql`
          SELECT user_id FROM organisation_memberships ORDER BY user_id
        `),
      );
      expect(memberships.map((row) => row.user_id)).toEqual([USER_A]);

      const forged = await asApp(ORG_A, (tx) =>
        tx.execute<{ name: string }>(sql`
          SELECT name FROM organisations WHERE id = ${ORG_B}::uuid
        `),
      );
      expect(forged).toEqual([]);
    });
  });
});
