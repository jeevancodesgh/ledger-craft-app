import { createInvoiceRequestSchema, sendInvoiceRequestSchema, updateInvoiceRequestSchema } from '@ledgercraft/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../../types';
import { requireSession } from '../auth/require-session';
import { createLoggingInvoiceMailer } from './mailer';
import * as invoicesService from './invoices.service';

const fallbackMailer = createLoggingInvoiceMailer();

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

    routes.post(`${prefix}/invoices/:id/send`, async (c) => {
      const { db, user } = await requireSession(c);
      let body: unknown = {};
      try {
        body = await c.req.json();
      } catch {
        body = {};
      }
      const input = sendInvoiceRequestSchema.parse(body ?? {});
      const mailer = c.get('invoiceMailer') ?? fallbackMailer;
      return c.json(await invoicesService.sendInvoiceForUser(db, user.id, c.req.param('id'), input, mailer));
    });

    routes.patch(`${prefix}/invoices/:id`, async (c) => {
      const { db, user } = await requireSession(c);
      const input = updateInvoiceRequestSchema.parse(await c.req.json());
      return c.json(await invoicesService.updateInvoiceForUser(db, user.id, c.req.param('id'), input));
    });
  }

  return routes;
}
