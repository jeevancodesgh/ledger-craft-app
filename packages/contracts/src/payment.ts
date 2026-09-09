import { z } from 'zod';

const money = z.string().regex(/^\d+(\.\d+)?$/);
const paymentMethod = z.enum(['bank_transfer', 'cash', 'cheque', 'credit_card', 'online']);
const paymentStatus = z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']);

export const paymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string().nullable(),
  paymentMethod,
  amount: money,
  paymentDate: z.string().min(1),
  referenceNumber: z.string().nullable(),
  notes: z.string().nullable(),
  status: paymentStatus,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const createPaymentRequestSchema = z
  .object({
    invoiceId: z.string().uuid(),
    paymentMethod,
    amount: money,
    paymentDate: z.string().min(1),
    referenceNumber: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict()
  .refine((value) => Number(value.amount) > 0, {
    message: 'Amount must be greater than 0',
    path: ['amount'],
  });

export const paymentListResponseSchema = z.object({
  payments: z.array(paymentSchema),
});

export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.string().min(1),
  currency: z.string().min(1),
  openingBalance: money,
  currentBalance: money,
  accountNumber: z.string().nullable(),
  accountClass: z.string().nullable(),
  isActive: z.boolean(),
});

export const accountListResponseSchema = z.object({
  accounts: z.array(accountSchema),
});

export type PaymentDto = z.infer<typeof paymentSchema>;
export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type PaymentListResponse = z.infer<typeof paymentListResponseSchema>;
export type AccountDto = z.infer<typeof accountSchema>;
export type AccountListResponse = z.infer<typeof accountListResponseSchema>;
