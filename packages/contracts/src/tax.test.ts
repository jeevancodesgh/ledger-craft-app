import { describe, expect, it } from 'vitest';
import { createTaxReturnRequestSchema } from './tax';

describe('tax contracts', () => {
  it('rejects ownership ids on tax return create', () => {
    expect(
      createTaxReturnRequestSchema.safeParse({
        periodStart: '2026-07-01',
        periodEnd: '2026-09-30',
        totalSales: '5175.00',
        totalPurchases: '79.00',
        gstOnSales: '675.00',
        gstOnPurchases: '10.30',
        netGst: '664.70',
        organisationId: '11111111-1111-1111-1111-111111111111',
      }).success,
    ).toBe(false);
  });
});
