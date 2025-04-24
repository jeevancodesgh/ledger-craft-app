import { Invoice, LineItem } from '@/types';

/**
 * Calculates the subtotal for an array of line items
 */
export const calculateSubtotal = (items: LineItem[]): number => {
  return items.reduce((sum, item) => sum + item.total, 0);
};

/**
 * Calculates the tax amount for an invoice based on its line items
 */
export const calculateTaxAmount = (items: LineItem[]): number => {
  return items.reduce((sum, item) => {
    const taxRate = item.tax || 0;
    return sum + (item.rate * item.quantity * taxRate) / 100;
  }, 0);
};

/**
 * Calculates the total amount for an invoice including subtotal, tax, and discount
 */
export const calculateTotal = (subtotal: number, taxAmount: number, discount = 0): number => {
  return subtotal + taxAmount - discount;
};

/**
 * Generates a unique invoice number
 */
export const generateInvoiceNumber = (): string => {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Formats a date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formats currency based on locale and currency code
 */
export const formatCurrency = (amount: number, currencyCode = 'USD', locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Gets status color based on invoice status
 */
export const getStatusColor = (status: Invoice['status']): string => {
  const statusColors = {
    draft: 'bg-gray-200 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };
  
  return statusColors[status];
};

/**
 * Checks if an invoice is overdue
 */
export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'paid') return false;
  
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  
  return today > dueDate;
};

/**
 * Updates invoice status based on payment and due date
 */
export const updateInvoiceStatus = (invoice: Invoice): Invoice['status'] => {
  if (invoice.status === 'paid') return 'paid';
  
  return isInvoiceOverdue(invoice) ? 'overdue' : invoice.status;
};

/**
 * Generates an invoice number based on business profile settings
 */
export const generateNextInvoiceNumber = (format: string | undefined | null, sequence: number | undefined | null): string => {
  if (!format) {
    return `INV-${Date.now()}`; // Fallback format
  }

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const seq = sequence ? String(sequence).padStart(4, '0') : '0001';

  // Replace placeholders in the format string
  return format
    .replace('{YYYY}', year.toString())
    .replace('{MM}', month)
    .replace('{SEQ}', seq);
};
