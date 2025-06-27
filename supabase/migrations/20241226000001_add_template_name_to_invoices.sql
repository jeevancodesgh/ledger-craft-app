-- Add template_name column to invoices table
-- This migration adds the missing template_name field that stores the selected invoice template

ALTER TABLE invoices 
ADD COLUMN template_name VARCHAR(50) DEFAULT 'classic';

-- Add a comment to document the column
COMMENT ON COLUMN invoices.template_name IS 'Stores the selected template name for invoice rendering (classic, modern, minimal, executive, corporate, modernPro)';

-- Add a check constraint to ensure only valid template names are stored
ALTER TABLE invoices 
ADD CONSTRAINT invoices_template_name_check 
CHECK (template_name IN ('classic', 'modern', 'minimal', 'executive', 'corporate', 'modernPro'));

-- Update any existing invoices to have the default template
UPDATE invoices SET template_name = 'classic' WHERE template_name IS NULL;