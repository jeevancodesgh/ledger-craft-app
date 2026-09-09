import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl, getMigrateDatabaseUrl } from '../env';
import { accounts, journalEntries, journalEntryLines } from './schema/accounts';
import { businessProfiles } from './schema/business-profiles';
import { customers } from './schema/customers';
import {
  authAccounts,
  organisationMemberships,
  organisations,
  sessions,
  users,
  verifications,
} from './schema/identity';
import { invoices, lineItems } from './schema/invoices';
import { itemCategories, items } from './schema/items';
import { bankAccounts, bankTransactions, transactionImportBatches } from './schema/bank';
import { expenseCategories, expenses } from './schema/expenses';
import { payments } from './schema/payments';
import { reconciliationAdjustments, reconciliationMatches, reconciliationSessions } from './schema/reconciliation';
import { receipts } from './schema/receipts';
import { taxConfigurations, taxReturns } from './schema/tax';
import { idempotencyKeys } from './schema/idempotency';
import { rlsProbe } from './schema/probe';
import { sharedInvoices } from './schema/shared-invoices';

export const schema = {
  rlsProbe,
  users,
  sessions,
  authAccounts,
  verifications,
  organisations,
  organisationMemberships,
  customers,
  businessProfiles,
  itemCategories,
  items,
  invoices,
  lineItems,
  accounts,
  journalEntries,
  journalEntryLines,
  expenseCategories,
  expenses,
  payments,
  receipts,
  bankAccounts,
  bankTransactions,
  transactionImportBatches,
  reconciliationSessions,
  reconciliationMatches,
  reconciliationAdjustments,
  taxConfigurations,
  taxReturns,
  idempotencyKeys,
  sharedInvoices,
};

export type Database = PostgresJsDatabase<typeof schema>;

export function createSql(url: string) {
  return postgres(url, { max: 5, idle_timeout: 10, connect_timeout: 10 });
}

export function createDb(url: string): { db: Database; sql: postgres.Sql } {
  const sql = createSql(url);
  return { db: drizzle(sql, { schema }), sql };
}

export function createAppDb() {
  return createDb(getDatabaseUrl());
}

export function createMigratorDb() {
  return createDb(getMigrateDatabaseUrl());
}
