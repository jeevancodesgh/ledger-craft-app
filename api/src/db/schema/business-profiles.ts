import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country').notNull().default('NZ'),
  taxId: text('tax_id'),
  logoUrl: text('logo_url'),
  website: text('website'),
  defaultTaxRate: numeric('default_tax_rate', { precision: 9, scale: 4, mode: 'string' }),
  defaultTerms: text('default_terms'),
  paymentTermDays: integer('payment_term_days').notNull().default(30),
  defaultNotes: text('default_notes'),
  bankInfo: text('bank_info'),
  theme: jsonb('theme'),
  invoiceNumberFormat: text('invoice_number_format'),
  invoiceNumberSequence: integer('invoice_number_sequence'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
