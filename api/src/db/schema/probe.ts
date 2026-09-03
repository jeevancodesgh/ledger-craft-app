import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const rlsProbe = pgTable('rls_probe', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  label: text('label').notNull(),
});
