import { scanReceiptRequestSchema } from '@ledgercraft/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../../types';
import { requireSession } from '../auth/require-session';
import * as aiService from './scanner';

export function aiRoutes() {
  const routes = new Hono<AppEnv>();

  for (const prefix of ['', '/api'] as const) {
    routes.post(`${prefix}/ai/receipt-scan`, async (c) => {
      const { db, user } = await requireSession(c);
      const input = scanReceiptRequestSchema.parse(await c.req.json());
      return c.json(await aiService.scanReceiptForUser(db, user.id, c.get('receiptScanner'), input));
    });
  }

  return routes;
}
