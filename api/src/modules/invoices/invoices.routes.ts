import { createInvoiceRequestSchema, updateInvoiceRequestSchema } from '@ledgercraft/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../../types';
import { requireSession } from '../auth/require-session';
import * as invoicesService from './invoices.service';

export function invoiceRoutes() {
  const routes = new Hono<AppEnv>();

  for (const prefix of ['', '/api'] as const) {
    routes.get(`${prefix}/invoices/next-number`, async (c) => {
      const { db, user } = await requireSession(c);
      return c.json(await invoicesService.peekNextInvoiceNumber(db, user.id));
    });

    routes.get(`${prefix}/invoices`, async (c) => {
      const { db, user } = await requireSession(c);
      return c.json(await invoicesService.listInvoicesForUser(db, user.id));
    });

    routes.get(`${prefix}/invoices/:id`, async (c) => {
      const { db, user } = await requireSession(c);
      return c.json(await invoicesService.getInvoiceForUser(db, user.id, c.req.param('id')));
    });

    routes.post(`${prefix}/invoices`, async (c) => {
      const { db, user } = await requireSession(c);
      const input = createInvoiceRequestSchema.parse(await c.req.json());
      return c.json(await invoicesService.createInvoiceForUser(db, user.id, input), 201);
    });

    routes.patch(`${prefix}/invoices/:id`, async (c) => {
      const { db, user } = await requireSession(c);
      const input = updateInvoiceRequestSchema.parse(await c.req.json());
      return c.json(await invoicesService.updateInvoiceForUser(db, user.id, c.req.param('id'), input));
    });
  }

  return routes;
}
