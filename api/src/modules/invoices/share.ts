import {
  publicSharedInvoiceSchema,
  shareInvoiceResponseSchema,
  type CreateShareInvoiceRequest,
  type InvoiceDto,
  type PublicSharedInvoice,
  type ShareInvoiceResponse,
} from '@ledgercraft/contracts';
import { sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../../db/client';
import { sharedInvoices } from '../../db/schema/shared-invoices';
import { apiError } from '../../http-error';
import { withOrganisationTx } from '../auth/bind-organisation';
import * as profileRepo from '../business-profile/business-profile.repository';
import * as invoicesRepo from './invoices.repository';

function parseExpiry(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw apiError(400, 'VALIDATION_ERROR', 'expiresAt must be an ISO date');
  }
  return parsed;
}

export async function createShareForUser(
  db: Database,
  userId: string,
  invoiceId: string,
  input: CreateShareInvoiceRequest,
): Promise<ShareInvoiceResponse> {
  return withOrganisationTx(db, userId, async (tx, ctx) => {
    const invoice = await invoicesRepo.getInvoice(tx, ctx.organisationId, invoiceId);
    if (!invoice) throw new HTTPException(404, { message: 'Invoice not found' });

    const profile = await profileRepo.getBusinessProfile(tx, ctx.organisationId);
    if (!profile) {
      throw new HTTPException(400, { message: 'Set up your business profile first' });
    }

    const expiresAt = parseExpiry(input.expiresAt);
    const shareToken = crypto.randomUUID();
    const templateName = input.templateName ?? 'classic';

    await tx.insert(sharedInvoices).values({
      organisationId: ctx.organisationId,
      originalInvoiceId: invoice.id,
      invoiceData: invoice,
      templateData: { templateName, businessProfile: profile },
      shareToken,
      expiresAt,
      createdBy: ctx.userId,
    });

    return shareInvoiceResponseSchema.parse({
      shareToken,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isActive: true,
    });
  });
}

export async function getPublicSharedInvoice(
  db: Database,
  token: string,
): Promise<PublicSharedInvoice> {
  const rows = await db.execute<{ invoice_data: InvoiceDto; template_data: unknown }>(sql`
    SELECT invoice_data, template_data
    FROM ledgercraft_get_shared_invoice(${token})
  `);
  const row = rows[0];
  if (!row) throw new HTTPException(404, { message: 'Invoice not found' });

  const templateData = (row.template_data ?? {}) as {
    templateName?: string;
    businessProfile?: unknown;
  };
  return publicSharedInvoiceSchema.parse({
    invoice: row.invoice_data,
    templateName: templateData.templateName ?? 'classic',
    businessProfile: templateData.businessProfile,
  });
}
