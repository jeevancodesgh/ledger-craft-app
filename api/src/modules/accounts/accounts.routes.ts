import { accountListResponseSchema, type AccountListResponse } from '@ledgercraft/contracts';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Database } from '../../db/client';
import { accounts } from '../../db/schema/accounts';
import type { AppEnv } from '../../types';
import { withOrganisationTx } from '../auth/bind-organisation';
import { requireSession } from '../auth/require-session';
import { roundMoney } from '../invoices/money';

export async function listAccountsForUser(db: Database, userId: string): Promise<AccountListResponse> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const rows = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.organisationId, ctx.organisationId))
      .orderBy(accounts.accountNumber, accounts.name);
    return accountListResponseSchema.parse({
      accounts: rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        currency: row.currency,
        openingBalance: roundMoney(Number(row.openingBalance)),
        currentBalance: roundMoney(Number(row.currentBalance)),
        accountNumber: row.accountNumber ?? null,
        accountClass: row.accountClass ?? null,
        isActive: row.isActive,
      })),
    });
  });
}

export function accountRoutes() {
  const routes = new Hono<AppEnv>();

  for (const prefix of ['', '/api'] as const) {
    routes.get(`${prefix}/accounts`, async (c) => {
      const { db, user } = await requireSession(c);
      return c.json(await listAccountsForUser(db, user.id));
    });
  }

  return routes;
}
