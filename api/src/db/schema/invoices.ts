import { boolean, date, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  customerId: uuid('customer_id').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  subtotal: money('subtotal').notNull(),
  taxAmount: money('tax_amount').notNull(),
  discount: money('discount'),
  additionalCharges: money('additional_charges'),
  additionalChargesList: jsonb('additional_charges_list'),
  additionalChargesTotal: money('additional_charges_total'),
  total: money('total').notNull(),
  totalPaid: money('total_paid').notNull().default('0'),
  balanceDue: money('balance_due').notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  taxInclusive: boolean('tax_inclusive').notNull().default(true),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  terms: text('terms'),
  currency: text('currency').notNull().default('NZD'),
  templateName: text('template_name'),
  publicViewedAt: timestamptz('public_viewed_at'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const lineItems = pgTable('line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  invoiceId: uuid('invoice_id').notNull(),
  description: text('description').notNull(),
  quantity: money('quantity').notNull(),
  unit: text('unit').notNull().default('ea'),
  rate: money('rate').notNull(),
  rateUnit: text('rate_unit').notNull().default('ea'),
  tax: money('tax'),
  total: money('total').notNull(),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
