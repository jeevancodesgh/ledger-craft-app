import { z } from 'zod';

const money = z.string().regex(/^-?\d+(\.\d+)?$/);

export const taxConfigurationSchema = z.object({
  id: z.string().uuid(),
  countryCode: z.string().min(1),
  taxType: z.enum(['GST', 'VAT', 'Sales_Tax']),
  taxRate: money,
  taxName: z.string().min(1),
  appliesToServices: z.boolean(),
  appliesToGoods: z.boolean(),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const upsertTaxConfigurationRequestSchema = z
  .object({
    countryCode: z.string().min(1).optional(),
    taxType: z.enum(['GST', 'VAT', 'Sales_Tax']).optional(),
    taxRate: money.optional(),
    taxName: z.string().min(1).optional(),
    appliesToServices: z.boolean().optional(),
    appliesToGoods: z.boolean().optional(),
    effectiveFrom: z.string().min(1).optional(),
    effectiveTo: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const taxReturnSchema = z.object({
  id: z.string().uuid(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  returnType: z.enum(['GST', 'Income_Tax', 'PAYE']),
  totalSales: money,
  totalPurchases: money,
  gstOnSales: money,
  gstOnPurchases: money,
  netGst: money,
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']),
  submittedAt: z.string().nullable(),
  irdReference: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const createTaxReturnRequestSchema = z
  .object({
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    returnType: z.enum(['GST', 'Income_Tax', 'PAYE']).optional(),
    totalSales: money,
    totalPurchases: money,
    gstOnSales: money,
    gstOnPurchases: money,
    netGst: money,
    status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
    irdReference: z.string().nullable().optional(),
  })
  .strict();

export const updateTaxReturnRequestSchema = createTaxReturnRequestSchema.partial();

export const taxReturnListResponseSchema = z.object({
  taxReturns: z.array(taxReturnSchema),
});

export type TaxConfigurationDto = z.infer<typeof taxConfigurationSchema>;
export type UpsertTaxConfigurationRequest = z.infer<typeof upsertTaxConfigurationRequestSchema>;
export type TaxReturnDto = z.infer<typeof taxReturnSchema>;
export type CreateTaxReturnRequest = z.infer<typeof createTaxReturnRequestSchema>;
export type UpdateTaxReturnRequest = z.infer<typeof updateTaxReturnRequestSchema>;
export type TaxReturnListResponse = z.infer<typeof taxReturnListResponseSchema>;
