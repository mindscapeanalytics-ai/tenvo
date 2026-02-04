-- Migration 022: Add Domain Data to Stock Movements and Batches
-- Purpose: Enable storing domain-specific transaction details (e.g. textile thaan length, pharmacy expiry logic used)

-- 1. Add domain_data to stock_movements
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

-- 2. Add domain_data to product_batches if not exists (though batches usually have specific columns, flexibility helps)
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

-- 3. Create Indexes for better querying
CREATE INDEX IF NOT EXISTS idx_stock_movements_domain_data_gin ON stock_movements USING GIN (domain_data);
CREATE INDEX IF NOT EXISTS idx_product_batches_domain_data_gin ON product_batches USING GIN (domain_data);

-- 4. Notify user (comment)
-- Migration ready to run
