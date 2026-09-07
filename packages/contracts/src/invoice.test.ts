import { describe, expect, it } from 'vitest';
import { createInvoiceRequestSchema, invoiceSchema, sendInvoiceRequestSchema } from './invoice';

describe('invoice contracts', () => {
  const invoice = {
    id: '33333333-3333-3333-3333-333333333333',
    invoiceNumber: 'INV-2026-0001',
    customerId: '44444444-4444-4444-4444-444444444444',
    date: '2026-09-07',
    dueDate: '2026-10-07',
    paymentTermDays: 30,
    subtotal: '4500.00',
    taxAmount: '675.00',
    discountType: 'fixed' as const,
    discountPercent: null,
    discount: null,
    additionalCharges: null,
    total: '5175.00',
    totalPaid: '0.00',
    balanceDue: '5175.00',
    paymentStatus: 'unpaid',
    taxInclusive: false,
    status: 'draft' as const,
    notes: null,
    terms: null,
    currency: 'NZD',
    customerName: 'North Harbour Cafe',
    items: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        description: 'Brand identity',
        quantity: '1',
        unit: 'ea',
        rate: '4500',
        rateUnit: 'ea',
        tax: '675.00',
        total: '4500.00',
      },
    ],
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  };

  it('accepts a camelCase invoice DTO without ownership ids', () => {
    expect(invoiceSchema.parse(invoice).invoiceNumber).toBe('INV-2026-0001');
  });

  it('rejects client totals and ownership ids on create', () => {
    const result = createInvoiceRequestSchema.safeParse({
      customerId: invoice.customerId,
      date: invoice.date,
      dueDate: invoice.dueDate,
      items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
      total: '1.00',
      organisationId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(false);
  });

  it('accepts payment terms and percent discount on create', () => {
    const parsed = createInvoiceRequestSchema.parse({
      customerId: invoice.customerId,
      date: invoice.date,
      dueDate: invoice.dueDate,
      paymentTermDays: 14,
      discountType: 'percent',
      discountPercent: '10',
      items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
    });
    expect(parsed.paymentTermDays).toBe(14);
    expect(parsed.discountType).toBe('percent');
    expect(parsed.discountPercent).toBe('10');
  });

  it('rejects percent discount without a percent value', () => {
    const result = createInvoiceRequestSchema.safeParse({
      customerId: invoice.customerId,
      date: invoice.date,
      dueDate: invoice.dueDate,
      discountType: 'percent',
      items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects payment terms outside 0-365', () => {
    const result = createInvoiceRequestSchema.safeParse({
      customerId: invoice.customerId,
      date: invoice.date,
      dueDate: invoice.dueDate,
      paymentTermDays: 400,
      items: [{ description: 'Brand identity', quantity: '1', rate: '4500' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts send recipients and rejects invalid emails', () => {
    expect(sendInvoiceRequestSchema.parse({ to: ['hello@nhcafe.nz'] }).to).toEqual(['hello@nhcafe.nz']);
    expect(sendInvoiceRequestSchema.safeParse({ to: ['not-an-email'] }).success).toBe(false);
  });
});
