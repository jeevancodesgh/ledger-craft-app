import type { CreateInvoiceRequest, InvoiceDto, UpdateInvoiceRequest } from '@ledgercraft/contracts';
import type { Invoice, LineItem } from '@/types';

export function invoicesApiEnabled(): boolean {
  return import.meta.env.VITE_INVOICES_API !== 'false';
}

export class InvoicesApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'InvoicesApiError';
  }
}

function money(value: number | string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null) return null;
  return String(value);
}

function toLine(dto: InvoiceDto['items'][number]): LineItem {
  return {
    id: dto.id,
    description: dto.description,
    quantity: Number(dto.quantity),
    unit: dto.unit,
    rate: Number(dto.rate),
    rateUnit: dto.rateUnit,
    tax: dto.tax == null ? null : Number(dto.tax),
    total: Number(dto.total),
  };
}

function toInvoice(dto: InvoiceDto): Invoice {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    customerId: dto.customerId,
    customer: dto.customerName
      ? {
          id: dto.customerId,
          name: dto.customerName,
          email: '',
          address: null,
          city: null,
          state: null,
          zip: null,
          country: 'NZ',
          phone: null,
          isVip: false,
          tags: [],
        }
      : undefined,
    date: dto.date,
    dueDate: dto.dueDate,
    items: dto.items.map(toLine),
    subtotal: Number(dto.subtotal),
    taxAmount: Number(dto.taxAmount),
    discount: dto.discount == null ? null : Number(dto.discount),
    additionalCharges: dto.additionalCharges == null ? null : Number(dto.additionalCharges),
    total: Number(dto.total),
    status: dto.status,
    notes: dto.notes,
    terms: dto.terms,
    currency: dto.currency,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toCreateInvoiceRequest(
  invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
  lineItems: Array<Pick<LineItem, 'description' | 'quantity' | 'unit' | 'rate' | 'rateUnit'>>,
): CreateInvoiceRequest {
  const taxRate =
    invoice.taxAmount && invoice.subtotal
      ? String(Math.round((invoice.taxAmount / invoice.subtotal) * 10000) / 100)
      : '0';
  return {
    customerId: invoice.customerId,
    date: invoice.date,
    dueDate: invoice.dueDate,
    notes: invoice.notes ?? null,
    terms: invoice.terms ?? null,
    currency: invoice.currency || 'NZD',
    taxInclusive: false,
    taxRate,
    discount: money(invoice.discount),
    additionalCharges: money(invoice.additionalCharges),
    status: invoice.status,
    items: lineItems.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit || 'ea',
      rate: String(item.rate),
      rateUnit: item.rateUnit || item.unit || 'ea',
    })),
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    throw new InvoicesApiError(await parseError(response), response.status);
  }
  return (await response.json()) as T;
}

export const invoicesApi = {
  async list(): Promise<Invoice[]> {
    const body = await request<{ invoices: InvoiceDto[] }>('/api/invoices');
    return body.invoices.map(toInvoice);
  },

  async get(id: string): Promise<Invoice | null> {
    try {
      return toInvoice(await request<InvoiceDto>(`/api/invoices/${id}`));
    } catch (error) {
      if (error instanceof InvoicesApiError && error.status === 404) return null;
      throw error;
    }
  },

  async create(
    invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>,
    lineItems: Array<Pick<LineItem, 'description' | 'quantity' | 'unit' | 'rate' | 'rateUnit'>>,
  ): Promise<Invoice> {
    const dto = await request<InvoiceDto>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(toCreateInvoiceRequest(invoice, lineItems)),
    });
    return toInvoice(dto);
  },

  async updateStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    const input: UpdateInvoiceRequest = { status };
    return toInvoice(
      await request<InvoiceDto>(`/api/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    );
  },

  async nextNumber(): Promise<string> {
    const body = await request<{ invoiceNumber: string }>('/api/invoices/next-number');
    return body.invoiceNumber;
  },
};
