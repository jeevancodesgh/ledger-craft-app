import { boolean, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const itemCategories = pgTable('item_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  categoryId: uuid('category_id'),
  salePrice: numeric('sale_price', { precision: 19, scale: 4, mode: 'string' }),
  purchasePrice: numeric('purchase_price', { precision: 19, scale: 4, mode: 'string' }),
  taxRate: numeric('tax_rate', { precision: 9, scale: 4, mode: 'string' }),
  enableSaleInfo: boolean('enable_sale_info').notNull().default(false),
  enablePurchaseInfo: boolean('enable_purchase_info').notNull().default(false),
  unit: text('unit').notNull().default('ea'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at').defaultNow().notNull(),
});
