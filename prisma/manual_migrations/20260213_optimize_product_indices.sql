-- Optimizing Product Subqueries for Dashboard Load
-- The getProductsAction uses correlated subqueries on these tables.
-- These indices allow "Index Only Scans" or highly efficient lookups.

-- 1. Optimize Product Batches (Lookup by product + active status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_batches_product_active 
ON product_batches (product_id, is_active) 
INCLUDE (id, batch_number, quantity, expiry_date, manufacturing_date, cost_price);

-- 2. Optimize Product Serials (Lookup by product + status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_serials_product_status 
ON product_serials (product_id, status) 
INCLUDE (id, serial_number, notes);

-- 3. Optimize Stock Locations (Lookup by product + business)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_stock_locations_composite
ON product_stock_locations (product_id, business_id)
INCLUDE (warehouse_id, quantity, state);

-- 4. General Product Lookup Optimization (covered by existing PK/indices but good to ensure)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_business_deleted
ON products (business_id) 
WHERE is_deleted = false;
