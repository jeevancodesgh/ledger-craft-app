import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl, getMigrateDatabaseUrl } from '../env';
import { customers } from './schema/customers';
import {
  authAccounts,
  organisationMemberships,
  organisations,
  sessions,
  users,
  verifications,
} from './schema/identity';
import { rlsProbe } from './schema/probe';

export const schema = {
  rlsProbe,
  users,
  sessions,
  authAccounts,
  verifications,
  organisations,
  organisationMemberships,
  customers,
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
