-- Migration: Fix Floating Stock & Enforce Warehouse Integrity
-- 1. Create a default "Main Warehouse" if none exists for each business
-- 2. Assign all NULL warehouse_id records in product_batches & stock_movements to this default
-- 3. Add NOT NULL constraint to prevent future floating stock

-- Function to ensure a default warehouse exists for a business
CREATE OR REPLACE FUNCTION ensure_default_warehouse(biz_id UUID) RETURNS UUID AS $$
DECLARE
    wh_id UUID;
    check_id UUID;
BEGIN
    SELECT id INTO check_id FROM warehouse_locations 
    WHERE business_id = biz_id AND is_primary = true LIMIT 1;
    
    IF check_id IS NULL THEN
        INSERT INTO warehouse_locations (business_id, name, is_primary, type)
        VALUES (biz_id, 'Main Warehouse', true, 'warehouse')
        RETURNING id INTO wh_id;
        RETURN wh_id;
    ELSE
        RETURN check_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Correct stock_movements (orphan records)
DO $$
DECLARE
    r RECORD;
    default_wh UUID;
BEGIN
    FOR r IN SELECT DISTINCT business_id FROM stock_movements WHERE warehouse_id IS NULL LOOP
        -- Get or create default WH
        SELECT id INTO default_wh FROM warehouse_locations WHERE business_id = r.business_id AND is_primary = true LIMIT 1;
        IF default_wh IS NULL THEN
             INSERT INTO warehouse_locations (business_id, name, is_primary, type)
             VALUES (r.business_id, 'Main Warehouse', true, 'warehouse')
             RETURNING id INTO default_wh;
        END IF;
        
        UPDATE stock_movements 
        SET warehouse_id = default_wh 
        WHERE business_id = r.business_id AND warehouse_id IS NULL;
    END LOOP;
END $$;

-- Correct product_batches (orphan records)
DO $$
DECLARE
    r RECORD;
    default_wh UUID;
BEGIN
    FOR r IN SELECT DISTINCT business_id FROM product_batches WHERE warehouse_id IS NULL LOOP
        -- Get or create default WH
        SELECT id INTO default_wh FROM warehouse_locations WHERE business_id = r.business_id AND is_primary = true LIMIT 1;
        IF default_wh IS NULL THEN
             INSERT INTO warehouse_locations (business_id, name, is_primary, type)
             VALUES (r.business_id, 'Main Warehouse', true, 'warehouse')
             RETURNING id INTO default_wh;
        END IF;
        
        UPDATE product_batches 
        SET warehouse_id = default_wh 
        WHERE business_id = r.business_id AND warehouse_id IS NULL;
    END LOOP;
END $$;
