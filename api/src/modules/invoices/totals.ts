import type { CreateInvoiceRequest } from '@ledgercraft/contracts';
import { apiError } from '../../http-error';
import { parseMoney, roundMoney } from './money';

export type ComputedInvoiceTotals = {
  lines: Array<{
    description: string;
    quantity: string;
    unit: string;
    rate: string;
    rateUnit: string;
    tax: string;
    total: string;
  }>;
  subtotal: string;
  taxAmount: string;
  discountType: 'fixed' | 'percent';
  discountPercent: string | null;
  discount: string | null;
  additionalCharges: string | null;
  total: string;
  taxInclusive: boolean;
};

type DiscountInput = {
  discountType?: 'fixed' | 'percent';
  discountPercent?: string | null;
  discount?: string | null;
  additionalCharges?: string | null;
  taxInclusive?: boolean;
  taxRate?: string | null;
  items: CreateInvoiceRequest['items'];
};

/**
 * Exclusive GST: lines → exclusive subtotal → discount → GST on (subtotal − discount) → add charges.
 * Inclusive GST: discount the GST-inclusive line total (current server policy); GST stays the line extract.
 * Additional charges are not discounted and are not taxed.
 */
export function computeInvoiceTotals(
  input: DiscountInput,
  defaultTaxRatePercent: number,
): ComputedInvoiceTotals {
  const taxInclusive = input.taxInclusive ?? true;
  const taxRatePercent = input.taxRate == null ? defaultTaxRatePercent : parseMoney(input.taxRate);
  const taxRate = taxRatePercent / 100;
  const additionalCharges = input.additionalCharges == null ? 0 : parseMoney(input.additionalCharges);
  const discountType = input.discountType ?? 'fixed';

  const lines = input.items.map((item) => {
    const quantity = parseMoney(item.quantity);
    const rate = parseMoney(item.rate);
    const lineAmount = quantity * rate;
    let exclusive = lineAmount;
    let tax = 0;
    if (taxRate > 0) {
      if (taxInclusive) {
        exclusive = lineAmount / (1 + taxRate);
        tax = lineAmount - exclusive;
      } else {
        tax = lineAmount * taxRate;
      }
    }
    return {
      description: item.description,
      quantity: roundMoney(quantity),
      unit: item.unit ?? 'ea',
      rate: roundMoney(rate),
      rateUnit: item.rateUnit ?? item.unit ?? 'ea',
      tax: roundMoney(tax),
      total: roundMoney(taxInclusive ? lineAmount : exclusive),
      exclusive,
      inclusive: taxInclusive ? lineAmount : exclusive + tax,
      taxValue: tax,
    };
  });

  const subtotalNumber = lines.reduce((sum, line) => sum + line.exclusive, 0);
  const inclusiveSubtotal = lines.reduce((sum, line) => sum + line.inclusive, 0);
  const discountBase = taxInclusive ? inclusiveSubtotal : subtotalNumber;
  const { amount: discountAmount, percent: discountPercent } = resolveDiscount(input, discountType, discountBase);

  let taxAmountNumber: number;
  let totalNumber: number;
  if (taxInclusive) {
    taxAmountNumber = lines.reduce((sum, line) => sum + line.taxValue, 0);
    totalNumber = inclusiveSubtotal - discountAmount + additionalCharges;
  } else {
    const taxable = subtotalNumber - discountAmount;
    taxAmountNumber = taxRate > 0 ? taxable * taxRate : 0;
    totalNumber = taxable + taxAmountNumber + additionalCharges;
  }

  return {
    lines: lines.map(({ exclusive: _exclusive, inclusive: _inclusive, taxValue: _taxValue, ...line }) => line),
    subtotal: roundMoney(subtotalNumber),
    taxAmount: roundMoney(taxAmountNumber),
    discountType,
    discountPercent,
    discount: discountAmount === 0 ? null : roundMoney(discountAmount),
    additionalCharges: additionalCharges === 0 ? null : roundMoney(additionalCharges),
    total: roundMoney(totalNumber),
    taxInclusive,
  };
}

function resolveDiscount(
  input: DiscountInput,
  discountType: 'fixed' | 'percent',
  discountBase: number,
): { amount: number; percent: string | null } {
  if (discountType === 'percent') {
    const percent = input.discountPercent == null ? 0 : parseMoney(input.discountPercent);
    if (percent < 0 || percent > 100) {
      throw apiError(400, 'VALIDATION_ERROR', 'Enter a discount between 0 and 100%');
    }
    const amount = Math.round(discountBase * (percent / 100) * 100) / 100;
    return { amount, percent: roundMoney(percent) };
  }

  const amount = input.discount == null ? 0 : parseMoney(input.discount);
  if (amount < 0) {
    throw apiError(400, 'VALIDATION_ERROR', 'Discount must be a positive amount');
  }
  if (amount - discountBase > 0.0001) {
    throw apiError(400, 'VALIDATION_ERROR', "Discount can't exceed the subtotal");
  }
  return { amount, percent: null };
}
