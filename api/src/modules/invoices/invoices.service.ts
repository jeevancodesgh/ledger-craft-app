import {
  invoiceListResponseSchema,
  type CreateInvoiceRequest,
  type InvoiceDto,
  type InvoiceListResponse,
  type UpdateInvoiceRequest,
} from '@ledgercraft/contracts';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../../db/client';
import { withOrganisationTx } from '../auth/bind-organisation';
import * as profileRepo from '../business-profile/business-profile.repository';
import * as customersRepo from '../customers/customers.repository';
import { postInvoiceJournal } from './invoices.journal';
import * as invoicesRepo from './invoices.repository';
import { parseMoney } from './money';
import { computeInvoiceTotals } from './totals';

function formatInvoiceNumber(format: string, sequence: number, date: Date): string {
  return format
    .replaceAll('{YYYY}', String(date.getFullYear()))
    .replaceAll('{MM}', String(date.getMonth() + 1).padStart(2, '0'))
    .replaceAll('{SEQ}', String(sequence).padStart(4, '0'));
}

export async function listInvoicesForUser(db: Database, userId: string): Promise<InvoiceListResponse> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const invoices = await invoicesRepo.listInvoices(tx, ctx.organisationId);
    return invoiceListResponseSchema.parse({ invoices });
  });
}

export async function getInvoiceForUser(db: Database, userId: string, id: string): Promise<InvoiceDto> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const invoice = await invoicesRepo.getInvoice(tx, ctx.organisationId, id);
    if (!invoice) throw new HTTPException(404, { message: 'Invoice not found' });
    return invoice;
  });
}

export async function peekNextInvoiceNumber(db: Database, userId: string): Promise<{ invoiceNumber: string }> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const profile = await profileRepo.getBusinessProfile(tx, ctx.organisationId);
    if (!profile) {
      throw new HTTPException(400, { message: 'Set up your business profile first' });
    }
    const sequence = profile.invoiceNumberSequence ?? 1;
    return {
      invoiceNumber: formatInvoiceNumber(
        profile.invoiceNumberFormat ?? 'INV-{YYYY}-{SEQ}',
        sequence,
        new Date(),
      ),
    };
  });
}

export async function createInvoiceForUser(
  db: Database,
  userId: string,
  input: CreateInvoiceRequest,
): Promise<InvoiceDto> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const customer = await customersRepo.getCustomer(tx, ctx.organisationId, input.customerId);
    if (!customer) throw new HTTPException(400, { message: 'Customer not found' });

    const profile = await profileRepo.lockBusinessProfile(tx, ctx.organisationId);
    if (!profile) {
      throw new HTTPException(400, { message: 'Set up your business profile first' });
    }

    const nextSequence = profile.invoiceNumberSequence ?? 1;
    const invoiceNumber = formatInvoiceNumber(
      profile.invoiceNumberFormat ?? 'INV-{YYYY}-{SEQ}',
      nextSequence,
      new Date(input.date),
    );
    await profileRepo.bumpInvoiceSequence(tx, profile.id, nextSequence + 1);

    const defaultTaxRate = parseMoney(profile.defaultTaxRate ?? '0');
    const totals = computeInvoiceTotals(input, defaultTaxRate);
    const invoice = await invoicesRepo.insertInvoice(tx, ctx, {
      customerId: input.customerId,
      invoiceNumber,
      date: input.date,
      dueDate: input.dueDate,
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      currency: input.currency ?? 'NZD',
      status: input.status ?? 'draft',
      totals,
    });

    await postInvoiceJournal(tx, ctx, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
    });

    return invoice;
  });
}

export async function updateInvoiceForUser(
  db: Database,
  userId: string,
  id: string,
  input: UpdateInvoiceRequest,
): Promise<InvoiceDto> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    if (!input.status) {
      const invoice = await invoicesRepo.getInvoice(tx, ctx.organisationId, id);
      if (!invoice) throw new HTTPException(404, { message: 'Invoice not found' });
      return invoice;
    }
    const invoice = await invoicesRepo.updateInvoiceStatus(tx, ctx.organisationId, id, input.status);
    if (!invoice) throw new HTTPException(404, { message: 'Invoice not found' });
    return invoice;
  });
}
