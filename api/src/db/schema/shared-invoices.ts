import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const sharedInvoices = pgTable('shared_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  originalInvoiceId: uuid('original_invoice_id').notNull(),
  invoiceData: jsonb('invoice_data').notNull(),
  templateData: jsonb('template_data').notNull(),
  shareToken: text('share_token').notNull().unique(),
  expiresAt: timestamptz('expires_at'),
  accessCount: integer('access_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
});
