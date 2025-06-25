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

// Theme types for business branding
export interface BusinessTheme {
  primary: string;      // Primary brand color (hex)
  secondary: string;    // Secondary brand color (hex)  
  accent: string;       // Accent color for highlights (hex)
  text: string;         // Primary text color (hex)
  textLight: string;    // Light/muted text color (hex)
  background: string;   // Background color (hex)
  surface: string;      // Surface/card background color (hex)
}

export const DEFAULT_BUSINESS_THEME: BusinessTheme = {
  primary: '#3B82F6',     // Blue-600
  secondary: '#06B6D4',   // Cyan-500
  accent: '#10B981',      // Emerald-500
  text: '#111827',        // Gray-900
  textLight: '#6B7280',   // Gray-500
  background: '#F9FAFB',  // Gray-50
  surface: '#FFFFFF'      // White
};

export const PRESET_THEMES: Record<string, BusinessTheme> = {
  blue: {
    primary: '#3B82F6',
    secondary: '#06B6D4', 
    accent: '#10B981',
    text: '#111827',
    textLight: '#6B7280',
    background: '#F9FAFB',
    surface: '#FFFFFF'
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#A855F7',
    accent: '#EC4899',
    text: '#111827',
    textLight: '#6B7280',
    background: '#FAF5FF',
    surface: '#FFFFFF'
  },
  green: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F59E0B',
    text: '#111827',
    textLight: '#6B7280',
    background: '#F0FDF4',
    surface: '#FFFFFF'
  },
  red: {
    primary: '#EF4444',
    secondary: '#F97316',
    accent: '#8B5CF6',
    text: '#111827',
    textLight: '#6B7280',
    background: '#FEF2F2',
    surface: '#FFFFFF'
  },
  slate: {
    primary: '#475569',
    secondary: '#64748B',
    accent: '#0EA5E9',
    text: '#0F172A',
    textLight: '#64748B',
    background: '#F8FAFC',
    surface: '#FFFFFF'
  }
};

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
  theme?: BusinessTheme | null;  // Business theme colors
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
  businessProfile?: BusinessProfile;
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
  public_viewed_at?: string | null;
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
  public_viewed_at: string | null;
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
  theme: BusinessTheme | null;  // Business theme stored as JSON
  user_id: string;
  created_at: string;
  updated_at: string;
  invoice_number_format: string | null;
  invoice_number_sequence: number | null;
}

export interface ItemCategory {
  id: string;
  name: string;
  color?: string; // Hex color code for category color
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  type: 'product' | 'service';
  categoryId?: string | null;
  category?: ItemCategory;
  salePrice?: number | null;
  purchasePrice?: number | null;
  taxRate?: number | null;
  enableSaleInfo: boolean;
  enablePurchaseInfo: boolean;
  unit: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupabaseItemCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseItem {
  id: string;
  name: string;
  description: string | null;
  type: 'product' | 'service';
  category_id: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  tax_rate: number | null;
  enable_sale_info: boolean;
  enable_purchase_info: boolean;
  unit: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Account types
export type AccountType = 'bank' | 'cash' | 'credit_card' | 'loan' | 'custom';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupabaseAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  current_balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Expense types
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId?: string | null;
  category?: ExpenseCategory;
  accountId?: string | null;
  account?: Account;
  vendorName?: string | null;
  receiptUrl?: string | null;
  expenseDate: string;
  status: ExpenseStatus;
  isBillable: boolean;
  customerId?: string | null;
  customer?: Customer;
  taxAmount: number;
  currency: string;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupabaseExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseExpense {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  vendor_name: string | null;
  receipt_url: string | null;
  expense_date: string;
  status: ExpenseStatus;
  is_billable: boolean;
  customer_id: string | null;
  tax_amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Onboarding types
export type OnboardingStep = 'welcome' | 'invoice-setup' | 'branding' | 'complete';

export interface OnboardingData {
  // Welcome step - business basics (required)
  businessName: string;
  businessEmail: string;
  country: string;
  
  // Invoice setup step (recommended)
  invoiceNumberFormat?: string;
  defaultTaxRate?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Branding step (optional)
  theme?: BusinessTheme;
  logoFile?: File;
}

export interface OnboardingStepProps {
  data: OnboardingData;
  onDataChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}
