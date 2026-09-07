import { z } from 'zod';

const money = z.string().regex(/^-?\d+(\.\d+)?$/);

export const invoiceLineInputSchema = z
  .object({
    description: z.string().min(1),
    quantity: money,
    unit: z.string().min(1).optional(),
    rate: money,
    rateUnit: z.string().min(1).optional(),
  })
  .strict();

export const createInvoiceRequestSchema = z
  .object({
    customerId: z.string().uuid(),
    date: z.string().min(1),
    dueDate: z.string().min(1),
    notes: z.string().nullable().optional(),
    terms: z.string().nullable().optional(),
    currency: z.string().min(1).optional(),
    taxInclusive: z.boolean().optional(),
    taxRate: money.nullable().optional(),
    discount: money.nullable().optional(),
    additionalCharges: money.nullable().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
    items: z.array(invoiceLineInputSchema).min(1),
  })
  .strict();

export const updateInvoiceRequestSchema = z
  .object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
    notes: z.string().nullable().optional(),
    terms: z.string().nullable().optional(),
  })
  .strict();

export const invoiceLineSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  quantity: money,
  unit: z.string(),
  rate: money,
  rateUnit: z.string(),
  tax: money.nullable(),
  total: money,
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  customerId: z.string().uuid(),
  date: z.string().min(1),
  dueDate: z.string().min(1),
  subtotal: money,
  taxAmount: money,
  discount: money.nullable(),
  additionalCharges: money.nullable(),
  total: money,
  totalPaid: money,
  balanceDue: money,
  paymentStatus: z.string(),
  taxInclusive: z.boolean(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  notes: z.string().nullable(),
  terms: z.string().nullable(),
  currency: z.string(),
  customerName: z.string().nullable(),
  items: z.array(invoiceLineSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const nextInvoiceNumberResponseSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export const invoiceListResponseSchema = z.object({
  invoices: z.array(invoiceSchema),
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceRequestSchema>;
export type UpdateInvoiceRequest = z.infer<typeof updateInvoiceRequestSchema>;
export type InvoiceDto = z.infer<typeof invoiceSchema>;
export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;
export type NextInvoiceNumberResponse = z.infer<typeof nextInvoiceNumberResponseSchema>;
