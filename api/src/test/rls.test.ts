import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { DATABASE_ROLES } from '../db/roles';
import { rlsProbe } from '../db/schema/probe';
import { assertLocalDatabaseReachable, ORG_A, ORG_B, withTestDb } from './harness';

describe('RLS request context', () => {
  it('uses the app role, not the table owner', () => {
    expect(DATABASE_ROLES.app).toBe('ledgercraft_app');
    expect(DATABASE_ROLES.migrator).toBe('ledgercraft_migrator');
  });

  it('cannot read another organisation when organisation_id is unset', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ db }) => {
      const rows = await db.select().from(rlsProbe);
      expect(rows).toEqual([]);
    });
  });

  it('asApp only returns the active organisation', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asApp }) => {
      const rows = await asApp(ORG_A, (tx) => tx.select().from(rlsProbe));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.organisationId).toBe(ORG_A);
      expect(rows[0]?.label).toBe('org-a');
    });
  });

  it('asApp cannot read the other organisation even with a forged id filter', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async ({ asApp }) => {
      const rows = await asApp(ORG_A, (tx) =>
        tx.select().from(rlsProbe).where(eq(rlsProbe.organisationId, ORG_B)),
      );
      expect(rows).toEqual([]);
    });
  });
});
