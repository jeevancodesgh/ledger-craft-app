import { boolean, date, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  currency: text('currency').notNull().default('NZD'),
  openingBalance: money('opening_balance').notNull().default('0'),
  currentBalance: money('current_balance').notNull().default('0'),
  accountNumber: text('account_number'),
  accountClass: text('account_class'),
  normalBalance: text('normal_balance'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  parentAccountId: uuid('parent_account_id'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  entryNumber: text('entry_number').notNull(),
  entryDate: date('entry_date', { mode: 'string' }).notNull(),
  description: text('description').notNull(),
  referenceType: text('reference_type'),
  referenceId: uuid('reference_id'),
  totalAmount: money('total_amount').notNull(),
  status: text('status').notNull().default('posted'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  journalEntryId: uuid('journal_entry_id').notNull(),
  accountId: uuid('account_id').notNull(),
  description: text('description'),
  debitAmount: money('debit_amount').notNull().default('0'),
  creditAmount: money('credit_amount').notNull().default('0'),
  lineOrder: integer('line_order').notNull(),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
});
