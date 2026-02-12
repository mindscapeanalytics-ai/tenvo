-- ============================================
-- Migration 026: Fix product_stock_locations Schema
-- ============================================
-- This migration aligns the database schema with the application code
-- which expects warehouse_id and state columns

-- 1. Drop the old constraint if it exists
ALTER TABLE product_stock_locations 
DROP CONSTRAINT IF EXISTS unique_product_location;

-- 2. Rename location_id to warehouse_id (if column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_stock_locations' 
        AND column_name = 'location_id'
    ) THEN
        ALTER TABLE product_stock_locations 
        RENAME COLUMN location_id TO warehouse_id;
    END IF;
END $$;

-- 3. Add state column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_stock_locations' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE product_stock_locations 
        ADD COLUMN state VARCHAR(50) DEFAULT 'sellable';
    END IF;
END $$;

-- 4. Add new unique constraint with state
ALTER TABLE product_stock_locations 
DROP CONSTRAINT IF EXISTS unique_product_warehouse_state;

ALTER TABLE product_stock_locations 
ADD CONSTRAINT unique_product_warehouse_state 
UNIQUE (warehouse_id, product_id, state);

-- 5. Ensure warehouse_id foreign key is correct
ALTER TABLE product_stock_locations 
DROP CONSTRAINT IF EXISTS product_stock_locations_location_id_fkey;

ALTER TABLE product_stock_locations 
DROP CONSTRAINT IF EXISTS product_stock_locations_warehouse_id_fkey;

ALTER TABLE product_stock_locations 
ADD CONSTRAINT product_stock_locations_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) 
REFERENCES warehouse_locations(id) 
ON DELETE CASCADE;

-- 6. Create index on state for performance
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_state 
ON product_stock_locations(state);

-- 7. Create index on warehouse_id for performance
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_warehouse 
ON product_stock_locations(warehouse_id);
