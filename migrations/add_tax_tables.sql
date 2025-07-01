-- Create comprehensive tax tables for IRD compliance
-- This migration adds all necessary tables for real tax calculations

-- Tax Configurations Table
CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL DEFAULT 'NZ',
    tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('GST', 'VAT', 'Sales_Tax')),
    tax_rate DECIMAL(5,4) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 1),
    tax_name VARCHAR(50) NOT NULL,
    applies_to_services BOOLEAN DEFAULT TRUE,
    applies_to_goods BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table for Purchase Tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255),
    receipt_url TEXT,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_inclusive BOOLEAN DEFAULT TRUE,
    is_claimable BOOLEAN DEFAULT TRUE,
    is_capital_expense BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table for Cash Flow Tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    reference_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Returns Table for IRD Reporting
CREATE TABLE IF NOT EXISTS tax_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('GST', 'Income_Tax', 'FBT', 'PAYE')),
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    gst_on_sales DECIMAL(10,2) DEFAULT 0,
    gst_on_purchases DECIMAL(10,2) DEFAULT 0,
    net_gst DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    ird_reference VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    return_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Adjustments Table for Complex Scenarios
CREATE TABLE IF NOT EXISTS tax_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('bad_debt', 'capital_goods', 'correction', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_impact DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing fields to existing invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'written_off')),
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB;

-- Add tax_inclusive field to line_items
ALTER TABLE line_items 
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS taxable BOOLEAN DEFAULT TRUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_configurations_user_active ON tax_configurations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_period ON tax_returns(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(user_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- RLS Policies
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_adjustments ENABLE ROW LEVEL SECURITY;

-- Tax Configurations Policies
CREATE POLICY "Users can view own tax configurations" ON tax_configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax configurations" ON tax_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax configurations" ON tax_configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax configurations" ON tax_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Payments Policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON payments
    FOR DELETE USING (auth.uid() = user_id);

-- Tax Returns Policies
CREATE POLICY "Users can view own tax returns" ON tax_returns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax returns" ON tax_returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns" ON tax_returns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax returns" ON tax_returns
    FOR DELETE USING (auth.uid() = user_id);

-- Tax Adjustments Policies
CREATE POLICY "Users can view own tax adjustments" ON tax_adjustments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax adjustments" ON tax_adjustments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax adjustments" ON tax_adjustments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax adjustments" ON tax_adjustments
    FOR DELETE USING (auth.uid() = user_id);

-- Insert default NZ GST configuration for existing users
INSERT INTO tax_configurations (user_id, country_code, tax_type, tax_rate, tax_name, effective_from)
SELECT DISTINCT user_id, 'NZ', 'GST', 0.15, 'GST', '2024-01-01'
FROM business_profiles
ON CONFLICT DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tax_configurations_updated_at BEFORE UPDATE ON tax_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_returns_updated_at BEFORE UPDATE ON tax_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_adjustments_updated_at BEFORE UPDATE ON tax_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();