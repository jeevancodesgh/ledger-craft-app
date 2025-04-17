
export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isVip?: boolean;
  tags?: string[];
}

export interface BusinessProfile {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId?: string;
  logoUrl?: string;
  website?: string;
  defaultTaxRate?: number;
  defaultTerms?: string;
  defaultNotes?: string;
  bankInfo?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  tax?: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
