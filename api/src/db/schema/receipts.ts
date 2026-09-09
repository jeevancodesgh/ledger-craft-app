import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  paymentId: uuid('payment_id').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  generatedAt: timestamptz('generated_at').defaultNow().notNull(),
  emailSentAt: timestamptz('email_sent_at'),
  isEmailed: boolean('is_emailed').notNull().default(false),
  receiptData: jsonb('receipt_data').$type<Record<string, unknown>>(),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
});
