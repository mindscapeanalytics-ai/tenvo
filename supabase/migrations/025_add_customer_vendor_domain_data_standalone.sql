-- Migration script to be run via psql or Supabase SQL Editor
-- This adds domain_data columns to customers and vendors tables

\echo 'Starting Migration 025: Add domain_data to customers and vendors'

-- Add domain_data JSONB column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

-- Add domain_data JSONB column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

-- Add indexes for efficient querying of domain-specific data
CREATE INDEX IF NOT EXISTS idx_customers_domain_data 
ON customers USING GIN (domain_data);

CREATE INDEX IF NOT EXISTS idx_vendors_domain_data 
ON vendors USING GIN (domain_data);

-- Add comments for documentation
COMMENT ON COLUMN customers.domain_data IS 'Domain-specific customer fields (e.g., Vehicle Registration for auto-parts, Loyalty Card for retail)';
COMMENT ON COLUMN vendors.domain_data IS 'Domain-specific vendor fields (e.g., OEM Authorization for auto-parts, FSSAI License for food)';

\echo 'Migration 025 completed successfully!'

-- Verify migration
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name IN ('customers', 'vendors')
AND column_name = 'domain_data';
