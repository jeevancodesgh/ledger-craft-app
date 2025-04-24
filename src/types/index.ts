
export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone?: string | null;
  isVip?: boolean | null;
  tags?: string[] | null;
  userId?: string; // Added for Supabase compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  taxId?: string | null;
  logoUrl?: string | null;  // Ensure consistent camelCase naming
  website?: string | null;
  defaultTaxRate?: number | null;
  defaultTerms?: string | null;
  defaultNotes?: string | null;
  bankInfo?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  invoiceNumberFormat?: string | null;
  invoiceNumberSequence?: number | null;
}

export interface LineItem {
  id: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unit: string;  // Already has this field
  rate: number;
  tax?: number | null;
  total: number;
  createdAt?: string;
  updatedAt?: string;
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
  discount?: number | null;
  additionalCharges?: number | null;
  total: number;
  status: InvoiceStatus;
  notes?: string | null;
  terms?: string | null;
  currency: string;
  userId?: string; // Added for Supabase compatibility
  createdAt?: string;
  updatedAt?: string;
}

// Helper interfaces for Supabase compatibility
export interface SupabaseCustomer {
  id: string;
  name: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone: string | null;
  is_vip: boolean | null;
  tags: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount: number | null;
  additional_charges: number | null;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  currency: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string;
  };
}

export interface SupabaseLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;  // This field already exists
  rate: number;
  tax: number | null;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseBusinessProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  tax_id: string | null;
  logo_url: string | null;  // This stays snake_case for database mapping
  website: string | null;
  default_tax_rate: number | null;
  default_terms: string | null;
  default_notes: string | null;
  bank_info: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  invoice_number_format: string | null;
  invoice_number_sequence: number | null;
}
