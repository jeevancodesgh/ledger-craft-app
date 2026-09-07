import type { CreateInvoiceRequest } from '@ledgercraft/contracts';
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
  discount: string | null;
  additionalCharges: string | null;
  total: string;
  taxInclusive: boolean;
};

export function computeInvoiceTotals(
  input: CreateInvoiceRequest,
  defaultTaxRatePercent: number,
): ComputedInvoiceTotals {
  const taxInclusive = input.taxInclusive ?? true;
  const taxRatePercent = input.taxRate == null ? defaultTaxRatePercent : parseMoney(input.taxRate);
  const taxRate = taxRatePercent / 100;
  const discount = input.discount == null ? 0 : parseMoney(input.discount);
  const additionalCharges = input.additionalCharges == null ? 0 : parseMoney(input.additionalCharges);

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
      taxValue: tax,
    };
  });

  const subtotalNumber = lines.reduce((sum, line) => sum + line.exclusive, 0);
  const taxAmountNumber = lines.reduce((sum, line) => sum + line.taxValue, 0);
  const totalNumber = taxInclusive
    ? lines.reduce((sum, line) => sum + parseMoney(line.total), 0) - discount + additionalCharges
    : subtotalNumber + taxAmountNumber - discount + additionalCharges;

  return {
    lines: lines.map(({ exclusive: _exclusive, taxValue: _taxValue, ...line }) => line),
    subtotal: roundMoney(subtotalNumber),
    taxAmount: roundMoney(taxAmountNumber),
    discount: discount === 0 ? null : roundMoney(discount),
    additionalCharges: additionalCharges === 0 ? null : roundMoney(additionalCharges),
    total: roundMoney(totalNumber),
    taxInclusive,
  };
}
