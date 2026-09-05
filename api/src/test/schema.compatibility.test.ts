import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { COMPATIBILITY_COLUMNS } from '../db/schema/compatibility-inventory';
import { assertLocalDatabaseReachable, ORG_A, ORG_B, withTestDb } from './harness';

describe('compatibility schema from app types', () => {
  it('creates every table and column the clients select', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator }) => {
      for (const [table, columns] of Object.entries(COMPATIBILITY_COLUMNS)) {
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

  it('stores money as numeric, not float', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator }) => {
      const rows = await asMigrator.execute<{ column_name: string; data_type: string }>(sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'invoices'
          AND column_name IN ('subtotal', 'tax_amount', 'total', 'total_paid', 'balance_due')
      `);
      expect(rows).toHaveLength(5);
      for (const row of rows) {
        expect(row.data_type, row.column_name).toBe('numeric');
      }
    });
  });

  it('isolates customers by organisation_id under the app role', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asMigrator, asApp }) => {
      await asMigrator.execute(sql`TRUNCATE TABLE customers CASCADE`);
      await asMigrator.execute(sql`
        INSERT INTO customers (organisation_id, user_id, name, email, country)
        VALUES
          (${ORG_A}::uuid, ${ORG_A}::uuid, 'A Ltd', 'a@example.com', 'NZ'),
          (${ORG_B}::uuid, ${ORG_B}::uuid, 'B Ltd', 'b@example.com', 'NZ')
      `);

      const visible = await asApp(ORG_A, (tx) =>
        tx.execute<{ name: string }>(sql`SELECT name FROM customers ORDER BY name`),
      );
      expect(visible.map((row) => row.name)).toEqual(['A Ltd']);
    });
  });
});
