import { errorEnvelopeSchema, invoiceSchema } from '@ledgercraft/contracts';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { createDb } from '../../db/client';
import { getDatabaseUrl } from '../../env';
import { createAuth } from '../auth/auth';
import { assertLocalDatabaseReachable, withTestDb } from '../../test/harness';

function cookieHeader(response: Response): string {
  const cookies = response.headers.getSetCookie();
  return cookies.map((cookie) => cookie.split(';')[0]).join('; ');
}

const originHeaders = {
  Origin: 'http://localhost:8080',
  'Content-Type': 'application/json',
};

async function signUp(app: ReturnType<typeof createApp>, name: string) {
  const email = `${name.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}@example.com`;
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: originHeaders,
    body: JSON.stringify({ name, email, password: 'password123' }),
  });
  expect(response.status).toBeLessThan(400);
  return { cookie: cookieHeader(response) };
}

async function seedCustomerAndProfile(
  app: ReturnType<typeof createApp>,
  cookie: string,
) {
  await app.request('/api/business-profile', {
    method: 'PUT',
    headers: { ...originHeaders, Cookie: cookie },
    body: JSON.stringify({
      name: 'Kauri Studio Ltd',
      email: 'hello@kauristudio.nz',
      country: 'NZ',
      defaultTaxRate: '15',
      invoiceNumberFormat: 'INV-{YYYY}-{SEQ}',
      invoiceNumberSequence: 0,
    }),
  });
  const customer = await app.request('/api/customers', {
    method: 'POST',
    headers: { ...originHeaders, Cookie: cookie },
    body: JSON.stringify({ name: 'North Harbour Cafe', email: 'hello@nhcafe.nz', country: 'NZ' }),
  });
  expect(customer.status).toBe(201);
  return (await customer.json()) as { id: string };
}

describe('invoice routes', () => {
  it('unauthenticated GET /api/invoices returns 401', async () => {
    const response = await createApp().request('/api/invoices');
    expect(response.status).toBe(401);
    expect(errorEnvelopeSchema.parse(await response.json()).error.code).toBe('UNAUTHORIZED');
  });

  it('creates an invoice with server totals and isolates organisations', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async () => {
      const { db, sql } = createDb(getDatabaseUrl());
      try {
        const auth = createAuth(db);
        const app = createApp({ auth, db, checkDatabase: async () => true });
        const ownerA = await signUp(app, 'Owner A');
        const ownerB = await signUp(app, 'Owner B');
        const customer = await seedCustomerAndProfile(app, ownerA.cookie);

        const created = await app.request('/api/invoices', {
          method: 'POST',
          headers: { ...originHeaders, Cookie: ownerA.cookie },
          body: JSON.stringify({
            customerId: customer.id,
            date: '2026-09-07',
            dueDate: '2026-10-07',
            taxInclusive: false,
            taxRate: '15',
            items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
          }),
        });
        expect(created.status).toBe(201);
        const invoice = invoiceSchema.parse(await created.json());
        expect(invoice.subtotal).toBe('4500.00');
        expect(invoice.taxAmount).toBe('675.00');
        expect(invoice.total).toBe('5175.00');
        expect(invoice.invoiceNumber).toMatch(/^INV-2026-/);

        const leaked = await app.request(`/api/invoices/${invoice.id}`, {
          headers: { Cookie: ownerB.cookie },
        });
        expect(leaked.status).toBe(404);
      } finally {
        await sql.end({ timeout: 5 });
      }
    });
  });

  it('ignores client-supplied totals on create', async () => {
    await assertLocalDatabaseReachable();
    await withTestDb(async () => {
      const { db, sql } = createDb(getDatabaseUrl());
      try {
        const auth = createAuth(db);
        const app = createApp({ auth, db, checkDatabase: async () => true });
        const owner = await signUp(app, 'Owner C');
        const customer = await seedCustomerAndProfile(app, owner.cookie);

        const forged = {
          customerId: customer.id,
          date: '2026-09-07',
          dueDate: '2026-10-07',
          taxInclusive: false,
          taxRate: '15',
          items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
          total: '1.00',
        };
        const response = await app.request('/api/invoices', {
          method: 'POST',
          headers: { ...originHeaders, Cookie: owner.cookie },
          body: JSON.stringify(forged),
        });
        expect(response.status).toBe(400);
        expect(errorEnvelopeSchema.parse(await response.json()).error.code).toBe('VALIDATION_ERROR');
      } finally {
        await sql.end({ timeout: 5 });
      }
    });
  });
});
