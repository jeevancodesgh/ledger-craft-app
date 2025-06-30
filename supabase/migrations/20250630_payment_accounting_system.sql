-- Payment & Accounting System Migration
-- Phase 1: Core Payment and Receipt Tables

-- 1. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'cash', 'cheque', 'credit_card', 'online'
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Receipts Table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  is_emailed BOOLEAN DEFAULT false,
  receipt_data JSONB, -- Store receipt content for consistency
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tax Configuration Table (NZ IRD focused)
CREATE TABLE tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) DEFAULT 'NZ',
  tax_type VARCHAR(20) NOT NULL, -- 'GST', 'VAT', 'Sales_Tax'
  tax_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.15 for 15% GST
  tax_name VARCHAR(50) NOT NULL, -- 'GST', 'VAT'
  applies_to_services BOOLEAN DEFAULT true,
  applies_to_goods BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tax_type, effective_from)
);

-- 4. Enhanced Invoices for Tax Tracking
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' 
  CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'));

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0 CHECK (total_paid >= 0);

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total - total_paid) STORED;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT true;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB; -- Store detailed tax calculations

-- 5. Journal Entries for Double-Entry Bookkeeping
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_number VARCHAR(50) NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(20), -- 'invoice', 'payment', 'expense', 'manual'
  reference_id UUID, -- ID of the related record
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR(20) DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_number)
);

-- 6. Journal Entry Lines (Debit/Credit entries)
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  description TEXT,
  debit_amount DECIMAL(12,2) DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount DECIMAL(12,2) DEFAULT 0 CHECK (credit_amount >= 0),
  line_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  ) -- Ensure only debit OR credit, not both
);

-- 7. Enhanced Accounts Table (from accounting integration)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_number VARCHAR(10);

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_class VARCHAR(20) 
  CHECK (account_class IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense'));

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES accounts(id);

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS normal_balance VARCHAR(10) 
  CHECK (normal_balance IN ('debit', 'credit'));

-- 8. Account Templates for Chart of Accounts
CREATE TABLE account_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  account_number VARCHAR(10) NOT NULL,
  account_class VARCHAR(20) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  normal_balance VARCHAR(10) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  country_code VARCHAR(3) DEFAULT 'NZ',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_number, country_code)
);

-- 9. IRD Tax Returns Table
CREATE TABLE tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  return_type VARCHAR(20) NOT NULL, -- 'GST', 'Income_Tax', 'PAYE'
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  gst_on_sales DECIMAL(12,2) DEFAULT 0,
  gst_on_purchases DECIMAL(12,2) DEFAULT 0,
  net_gst DECIMAL(12,2) GENERATED ALWAYS AS (gst_on_sales - gst_on_purchases) STORED,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  ird_reference VARCHAR(100),
  return_data JSONB, -- Store complete return data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end, return_type)
);

-- Indexes for Performance
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_tax_returns_user_period ON tax_returns(user_id, period_start, period_end);

-- Row Level Security Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tax configurations" ON tax_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own journal entries" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access journal entry lines through journal entries" ON journal_entry_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journal_entries je 
      WHERE je.id = journal_entry_lines.journal_entry_id 
      AND je.user_id = auth.uid()
    )
  );

CREATE POLICY "Account templates are public readable" ON account_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own tax returns" ON tax_returns
  FOR ALL USING (auth.uid() = user_id);

-- Insert Default NZ Tax Configuration
INSERT INTO tax_configurations (
  user_id, country_code, tax_type, tax_rate, tax_name, 
  applies_to_services, applies_to_goods, effective_from
) 
SELECT 
  auth.uid(), 'NZ', 'GST', 0.15, 'GST', 
  true, true, '2023-01-01'::DATE
WHERE auth.uid() IS NOT NULL;

-- Insert NZ Chart of Accounts Templates
INSERT INTO account_templates (name, account_number, account_class, account_type, normal_balance, description, is_system, country_code) VALUES
-- Assets
('Bank Account - Current', '1110', 'Asset', 'bank', 'debit', 'Business checking account', true, 'NZ'),
('Bank Account - Savings', '1115', 'Asset', 'bank', 'debit', 'Business savings account', true, 'NZ'),
('Cash on Hand', '1120', 'Asset', 'cash', 'debit', 'Physical cash and petty cash', true, 'NZ'),
('Accounts Receivable', '1200', 'Asset', 'receivable', 'debit', 'Money owed by customers', true, 'NZ'),
('GST Paid on Purchases', '1300', 'Asset', 'tax', 'debit', 'GST paid on business purchases', true, 'NZ'),
('Prepaid Expenses', '1400', 'Asset', 'prepaid', 'debit', 'Expenses paid in advance', true, 'NZ'),
('Equipment', '1500', 'Asset', 'fixed', 'debit', 'Business equipment and machinery', true, 'NZ'),
('Vehicles', '1510', 'Asset', 'fixed', 'debit', 'Business vehicles', true, 'NZ'),

-- Liabilities
('Accounts Payable', '2100', 'Liability', 'payable', 'credit', 'Money owed to suppliers', true, 'NZ'),
('GST Collected on Sales', '2200', 'Liability', 'tax', 'credit', 'GST collected from customers', true, 'NZ'),
('PAYE Payable', '2210', 'Liability', 'tax', 'credit', 'PAYE tax owed to IRD', true, 'NZ'),
('Credit Card', '2300', 'Liability', 'credit_card', 'credit', 'Business credit card debt', true, 'NZ'),
('Bank Loan', '2400', 'Liability', 'loan', 'credit', 'Business bank loans', true, 'NZ'),

-- Equity
('Owner Equity', '3000', 'Equity', 'equity', 'credit', 'Owner investment in business', true, 'NZ'),
('Retained Earnings', '3100', 'Equity', 'equity', 'credit', 'Accumulated business profits', true, 'NZ'),

-- Revenue
('Sales Revenue', '4000', 'Revenue', 'income', 'credit', 'Revenue from sales of goods/services', true, 'NZ'),
('Service Revenue', '4100', 'Revenue', 'income', 'credit', 'Revenue from services provided', true, 'NZ'),
('Interest Income', '4200', 'Revenue', 'income', 'credit', 'Interest earned on investments', true, 'NZ'),
('Other Income', '4900', 'Revenue', 'income', 'credit', 'Miscellaneous income', true, 'NZ'),

-- Expenses
('Cost of Goods Sold', '5000', 'Expense', 'expense', 'debit', 'Direct costs of goods sold', true, 'NZ'),
('Rent Expense', '6000', 'Expense', 'expense', 'debit', 'Office and warehouse rent', true, 'NZ'),
('Utilities', '6100', 'Expense', 'expense', 'debit', 'Electricity, water, internet', true, 'NZ'),
('Insurance', '6200', 'Expense', 'expense', 'debit', 'Business insurance premiums', true, 'NZ'),
('Professional Services', '6300', 'Expense', 'expense', 'debit', 'Legal, accounting, consulting', true, 'NZ'),
('Marketing & Advertising', '6400', 'Expense', 'expense', 'debit', 'Marketing and promotional costs', true, 'NZ'),
('Travel & Entertainment', '6500', 'Expense', 'expense', 'debit', 'Business travel and client entertainment', true, 'NZ'),
('Office Supplies', '6600', 'Expense', 'expense', 'debit', 'Stationery, printing, office materials', true, 'NZ'),
('Telephone', '6700', 'Expense', 'expense', 'debit', 'Phone and communication costs', true, 'NZ'),
('Bank Fees', '6800', 'Expense', 'expense', 'debit', 'Banking and financial service fees', true, 'NZ'),
('Depreciation', '6900', 'Expense', 'expense', 'debit', 'Depreciation of fixed assets', true, 'NZ');

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_configurations_updated_at BEFORE UPDATE ON tax_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_returns_updated_at BEFORE UPDATE ON tax_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();