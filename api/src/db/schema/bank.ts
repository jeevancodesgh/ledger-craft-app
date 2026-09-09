import { boolean, date, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(),
  bankName: text('bank_name').notNull(),
  accountType: text('account_type').notNull(),
  currency: text('currency').notNull().default('NZD'),
  openingBalance: money('opening_balance').notNull().default('0'),
  currentBalance: money('current_balance').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  bankAccountId: uuid('bank_account_id').notNull(),
  transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
  description: text('description').notNull(),
  reference: text('reference'),
  amount: money('amount').notNull(),
  type: text('type').notNull(),
  balance: money('balance'),
  category: text('category'),
  merchant: text('merchant'),
  isReconciled: boolean('is_reconciled').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const transactionImportBatches = pgTable('transaction_import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  bankAccountId: uuid('bank_account_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  totalRows: integer('total_rows').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  duplicatesSkipped: integer('duplicates_skipped').notNull().default(0),
  errorsCount: integer('errors_count').notNull().default(0),
  earliestDate: date('earliest_date', { mode: 'string' }),
  latestDate: date('latest_date', { mode: 'string' }),
  status: text('status').notNull().default('completed'),
  errorMessage: text('error_message'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  completedAt: timestamptz('completed_at'),
});
