-- CreateTable: Add min_stock_level column to products table
-- This migration adds the missing min_stock_level column that is referenced in queries

-- Add min_stock_level column with default value
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "min_stock_level" DECIMAL(12,2) DEFAULT 5;

-- Update existing products to use min_stock as min_stock_level if min_stock_level is null
UPDATE "products" 
SET "min_stock_level" = COALESCE("min_stock", 5)
WHERE "min_stock_level" IS NULL;

-- Add index for performance on low stock queries
CREATE INDEX IF NOT EXISTS "idx_products_low_stock" 
ON "products" ("business_id", "is_active", "stock", "min_stock_level")
WHERE "is_active" = true;

-- Add comment for documentation
COMMENT ON COLUMN "products"."min_stock_level" IS 'Minimum stock level threshold for low stock alerts';
