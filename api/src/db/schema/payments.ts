import { date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  invoiceId: uuid('invoice_id').notNull(),
  paymentMethod: text('payment_method').notNull(),
  amount: money('amount').notNull(),
  paymentDate: date('payment_date', { mode: 'string' }).notNull(),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  status: text('status').notNull().default('completed'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
