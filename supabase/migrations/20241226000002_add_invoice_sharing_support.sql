-- Comprehensive migration to add invoice template support and sharing functionality

-- First, add template_name column to existing invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS template_name VARCHAR(50) DEFAULT 'classic';

-- Add additional columns that might be missing
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS additional_charges DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_charges_list JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS additional_charges_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_viewed_at TIMESTAMP DEFAULT NULL;

-- Add check constraint for template names
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_template_name_check'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_template_name_check 
        CHECK (template_name IN ('classic', 'modern', 'minimal', 'executive', 'corporate', 'modernPro'));
    END IF;
END $$;

-- Create shared_invoices table for anonymous invoice sharing
CREATE TABLE IF NOT EXISTS shared_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    share_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    template_name VARCHAR(50) DEFAULT 'classic',
    invoice_data JSONB NOT NULL,
    template_data JSONB NOT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_shared_invoices_invoice_id 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Check constraint for template names
    CONSTRAINT shared_invoices_template_name_check 
        CHECK (template_name IN ('classic', 'modern', 'minimal', 'executive', 'corporate', 'modernPro'))
);

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_invoices_share_token ON shared_invoices(share_token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_shared_invoices_expires_at ON shared_invoices(expires_at);

-- Enable Row Level Security on shared_invoices
ALTER TABLE shared_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_invoices

-- Policy: Users can only create shared invoices for their own invoices
CREATE POLICY IF NOT EXISTS "Users can create shared invoices for their own invoices" 
ON shared_invoices FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = shared_invoices.invoice_id 
        AND invoices.user_id = auth.uid()
    )
);

-- Policy: Users can view and manage their own shared invoices
CREATE POLICY IF NOT EXISTS "Users can manage their own shared invoices" 
ON shared_invoices FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = shared_invoices.invoice_id 
        AND invoices.user_id = auth.uid()
    )
);

-- Policy: Anonymous access for valid, non-expired shared invoices
CREATE POLICY IF NOT EXISTS "Anonymous access to non-expired shared invoices" 
ON shared_invoices FOR SELECT 
USING (
    expires_at IS NULL OR expires_at > NOW()
);

-- Create a function to get shared invoice by token (for anonymous access)
CREATE OR REPLACE FUNCTION get_shared_invoice_by_token(token UUID)
RETURNS TABLE (
    id UUID,
    invoice_id UUID,
    share_token UUID,
    template_name VARCHAR(50),
    invoice_data JSONB,
    template_data JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.invoice_id,
        si.share_token,
        si.template_name,
        si.invoice_data,
        si.template_data,
        si.expires_at,
        si.created_at
    FROM shared_invoices si
    WHERE si.share_token = token
    AND (si.expires_at IS NULL OR si.expires_at > NOW());
END;
$$;

-- Update existing invoices to have default template if NULL
UPDATE invoices SET template_name = 'classic' WHERE template_name IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN invoices.template_name IS 'Selected template for invoice rendering (classic, modern, minimal, executive, corporate, modernPro)';
COMMENT ON COLUMN invoices.additional_charges IS 'Legacy additional charges field for backward compatibility';
COMMENT ON COLUMN invoices.additional_charges_list IS 'Structured list of additional charges with labels and calculation types';
COMMENT ON COLUMN invoices.additional_charges_total IS 'Calculated total of all additional charges';
COMMENT ON COLUMN invoices.public_viewed_at IS 'Timestamp when invoice was last viewed publicly via share link';

COMMENT ON TABLE shared_invoices IS 'Stores shared invoice data for anonymous access via secure share links';
COMMENT ON COLUMN shared_invoices.share_token IS 'Unique token for anonymous access to shared invoice';
COMMENT ON COLUMN shared_invoices.invoice_data IS 'Snapshot of invoice data at time of sharing';
COMMENT ON COLUMN shared_invoices.template_data IS 'Additional template rendering data (business profile, etc.)';
COMMENT ON COLUMN shared_invoices.expires_at IS 'Optional expiration date for the share link';

-- Grant necessary permissions
GRANT SELECT ON shared_invoices TO anon;
GRANT EXECUTE ON FUNCTION get_shared_invoice_by_token(UUID) TO anon;