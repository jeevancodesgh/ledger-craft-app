import { boolean, date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  description: text('description').notNull(),
  amount: money('amount').notNull(),
  categoryId: uuid('category_id'),
  accountId: uuid('account_id'),
  vendorName: text('vendor_name'),
  receiptUrl: text('receipt_url'),
  expenseDate: date('expense_date', { mode: 'string' }).notNull(),
  status: text('status').notNull().default('pending'),
  isBillable: boolean('is_billable').notNull().default(false),
  customerId: uuid('customer_id'),
  taxAmount: money('tax_amount').notNull().default('0'),
  currency: text('currency').notNull().default('NZD'),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
