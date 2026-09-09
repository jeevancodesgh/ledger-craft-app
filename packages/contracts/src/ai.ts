import { z } from 'zod';

export const receiptScanItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const receiptScanResultSchema = z.object({
  merchantName: z.string().nullable(),
  date: z.string().nullable(),
  total: z.number().nullable(),
  tax: z.number().nullable(),
  subtotal: z.number().nullable(),
  items: z.array(receiptScanItemSchema),
  paymentMethod: z.enum(['cash', 'card', 'other']).nullable(),
  suggestedCategory: z.string().nullable(),
  confidence: z.number(),
  notes: z.string().nullable(),
});

export const scanReceiptRequestSchema = z
  .object({
    imageBase64: z.string().min(1),
    contentType: z.string().min(1).optional(),
  })
  .strict();

export type ReceiptScanItemDto = z.infer<typeof receiptScanItemSchema>;
export type ReceiptScanResultDto = z.infer<typeof receiptScanResultSchema>;
export type ScanReceiptRequest = z.infer<typeof scanReceiptRequestSchema>;
