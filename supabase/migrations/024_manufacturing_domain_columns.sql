-- Migration 024: Add Domain Data to Manufacturing
-- Enable domain-specific fields for BOMs and Production Orders

-- 1. Add domain_data to BOMs
ALTER TABLE boms 
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_boms_domain_data ON boms USING GIN (domain_data);

-- 2. Add domain_data to Production Orders
ALTER TABLE production_orders
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_production_orders_domain_data ON production_orders USING GIN (domain_data);

-- 3. Add batch_number to Production Orders (Output Batch)
ALTER TABLE production_orders
ADD COLUMN IF NOT EXISTS batch_number TEXT;
