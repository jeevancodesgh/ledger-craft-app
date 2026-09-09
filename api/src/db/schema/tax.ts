import { boolean, date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 19, scale: 4, mode: 'string' });

export const taxConfigurations = pgTable('tax_configurations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  countryCode: text('country_code').notNull().default('NZ'),
  taxType: text('tax_type').notNull(),
  taxRate: money('tax_rate').notNull(),
  taxName: text('tax_name').notNull(),
  appliesToServices: boolean('applies_to_services').notNull().default(true),
  appliesToGoods: boolean('applies_to_goods').notNull().default(true),
  effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
  effectiveTo: date('effective_to', { mode: 'string' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const taxReturns = pgTable('tax_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  returnType: text('return_type').notNull(),
  totalSales: money('total_sales').notNull().default('0'),
  totalPurchases: money('total_purchases').notNull().default('0'),
  gstOnSales: money('gst_on_sales').notNull().default('0'),
  gstOnPurchases: money('gst_on_purchases').notNull().default('0'),
  netGst: money('net_gst').notNull().default('0'),
  status: text('status').notNull().default('draft'),
  submittedAt: timestamptz('submitted_at'),
  irdReference: text('ird_reference'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
