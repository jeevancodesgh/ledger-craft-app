import {
  invoiceSchema,
  type InvoiceDto,
} from '@ledgercraft/contracts';
import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { customers } from '../../db/schema/customers';
import { invoices, lineItems } from '../../db/schema/invoices';
import { roundMoney } from './money';
import type { ComputedInvoiceTotals } from './totals';

function toLineDto(row: typeof lineItems.$inferSelect) {
  return {
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    rate: row.rate,
    rateUnit: row.rateUnit,
    tax: row.tax ?? null,
    total: row.total,
  };
}

function toDto(
  row: typeof invoices.$inferSelect,
  lines: Array<ReturnType<typeof toLineDto>>,
  customerName: string | null,
): InvoiceDto {
  return invoiceSchema.parse({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    customerId: row.customerId,
    date: row.date,
    dueDate: row.dueDate,
    subtotal: roundMoney(Number(row.subtotal)),
    taxAmount: roundMoney(Number(row.taxAmount)),
    discount: row.discount == null ? null : roundMoney(Number(row.discount)),
    additionalCharges:
      row.additionalCharges == null ? null : roundMoney(Number(row.additionalCharges)),
    total: roundMoney(Number(row.total)),
    totalPaid: roundMoney(Number(row.totalPaid)),
    balanceDue: roundMoney(Number(row.balanceDue)),
    paymentStatus: row.paymentStatus,
    taxInclusive: row.taxInclusive,
    status: row.status,
    notes: row.notes ?? null,
    terms: row.terms ?? null,
    currency: row.currency,
    customerName,
    items: lines,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function listInvoices(tx: Database, organisationId: string): Promise<InvoiceDto[]> {
  const rows = await tx
    .select({ invoice: invoices, customerName: customers.name })
    .from(invoices)
    .leftJoin(customers, eq(customers.id, invoices.customerId))
    .where(eq(invoices.organisationId, organisationId))
    .orderBy(desc(invoices.date), desc(invoices.createdAt));

  const result: InvoiceDto[] = [];
  for (const row of rows) {
    const lines = await tx.select().from(lineItems).where(eq(lineItems.invoiceId, row.invoice.id));
    result.push(toDto(row.invoice, lines.map(toLineDto), row.customerName ?? null));
  }
  return result;
}

export async function getInvoice(
  tx: Database,
  organisationId: string,
  id: string,
): Promise<InvoiceDto | undefined> {
  const [row] = await tx
    .select({ invoice: invoices, customerName: customers.name })
    .from(invoices)
    .leftJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(eq(invoices.id, id), eq(invoices.organisationId, organisationId)));
  if (!row) return undefined;
  const lines = await tx.select().from(lineItems).where(eq(lineItems.invoiceId, row.invoice.id));
  return toDto(row.invoice, lines.map(toLineDto), row.customerName ?? null);
}

export async function insertInvoice(
  tx: Database,
  ctx: { organisationId: string; userId: string },
  input: {
    customerId: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    notes: string | null;
    terms: string | null;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    totals: ComputedInvoiceTotals;
  },
): Promise<InvoiceDto> {
  const paid = input.status === 'paid';
  const [row] = await tx
    .insert(invoices)
    .values({
      organisationId: ctx.organisationId,
      userId: ctx.userId,
      invoiceNumber: input.invoiceNumber,
      customerId: input.customerId,
      date: input.date,
      dueDate: input.dueDate,
      subtotal: input.totals.subtotal,
      taxAmount: input.totals.taxAmount,
      discount: input.totals.discount,
      additionalCharges: input.totals.additionalCharges,
      additionalChargesTotal: input.totals.additionalCharges,
      total: input.totals.total,
      totalPaid: paid ? input.totals.total : '0.00',
      balanceDue: paid ? '0.00' : input.totals.total,
      paymentStatus: paid ? 'paid' : 'unpaid',
      taxInclusive: input.totals.taxInclusive,
      status: input.status,
      notes: input.notes,
      terms: input.terms,
      currency: input.currency,
    })
    .returning();
  if (!row) throw new Error('Failed to insert invoice');

  for (const line of input.totals.lines) {
    await tx.insert(lineItems).values({
      organisationId: ctx.organisationId,
      invoiceId: row.id,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      rate: line.rate,
      rateUnit: line.rateUnit,
      tax: line.tax,
      total: line.total,
    });
  }

  return (await getInvoice(tx, ctx.organisationId, row.id))!;
}

export async function updateInvoiceStatus(
  tx: Database,
  organisationId: string,
  id: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue',
): Promise<InvoiceDto | undefined> {
  const existing = await getInvoice(tx, organisationId, id);
  if (!existing) return undefined;
  const paid = status === 'paid';
  await tx
    .update(invoices)
    .set({
      status,
      paymentStatus: paid ? 'paid' : existing.paymentStatus === 'paid' ? 'unpaid' : existing.paymentStatus,
      totalPaid: paid ? existing.total : '0.00',
      balanceDue: paid ? '0.00' : existing.total,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, id), eq(invoices.organisationId, organisationId)));
  return getInvoice(tx, organisationId, id);
}
