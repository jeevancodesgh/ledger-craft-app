import { describe, expect, it, vi } from 'vitest';
import type { Expense, Invoice } from '@/types';

vi.mock('@/features/invoices/api/invoicesApi', () => ({
  invoicesApiEnabled: () => true,
  invoicesApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/features/expenses/api/expensesApi', () => ({
  expensesApiEnabled: () => true,
  expensesApi: {
    listExpenses: vi.fn(),
  },
}));

import { invoicesApi } from '@/features/invoices/api/invoicesApi';
import { expensesApi } from '@/features/expenses/api/expensesApi';
import { taxApi } from './taxApi';

describe('taxApi period fetches', () => {
  it('maps Hono invoices and expenses into GST snake_case aliases', async () => {
    vi.mocked(invoicesApi.list).mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-1',
        customerId: 'cust-1',
        date: '2026-03-10',
        dueDate: '2026-04-10',
        items: [],
        subtotal: 100,
        taxAmount: 15,
        total: 115,
        status: 'paid',
        currency: 'NZD',
      } as Invoice,
    ]);
    vi.mocked(expensesApi.listExpenses).mockResolvedValue([
      {
        id: 'exp-1',
        description: 'Fuel',
        amount: 46,
        taxAmount: 6,
        currency: 'NZD',
        expenseDate: '2026-03-12',
        status: 'approved',
        isBillable: false,
        categoryId: 'cat-1',
        vendorName: 'BP',
      } as Expense,
    ]);

    const invoices = await taxApi.invoicesByPeriod('2026-03-01', '2026-03-31');
    const expenses = await taxApi.expensesByPeriod('2026-03-01', '2026-03-31');

    expect(invoices[0].tax_amount).toBe(15);
    expect(expenses[0].tax_amount).toBe(6);
    expect(expenses[0].expense_date).toBe('2026-03-12');
    expect(expenses[0].is_claimable).toBe(true);
  });
});
