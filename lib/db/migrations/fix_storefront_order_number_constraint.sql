-- =============================================================================
-- Fix: Storefront Order Number Constraint Issue
-- Date: 2026-07-03
-- 
-- Problem: Duplicate key value violates unique constraint 
--          "storefront_orders_order_number_key"
-- 
-- Root Cause: The old global unique constraint on order_number still exists,
--             causing conflicts when multiple businesses use the same order number
--             (e.g., ORD-20260703-0001) on the same day.
-- 
-- Solution: Drop the global constraint and ensure the composite constraint
--           (business_id, order_number) is in place for multi-tenancy.
-- =============================================================================

-- STEP 1: Drop all existing order_number unique constraints and orphan indexes
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint 
        WHERE conrelid = 'storefront_orders'::regclass
          AND contype = 'u'
          AND conname LIKE '%order_number%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I CASCADE', 
                      constraint_rec.table_name, 
                      constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END;
$$;

DROP INDEX IF EXISTS storefront_orders_order_number_key;

-- STEP 2: Add the correct composite unique constraint
DO $$
BEGIN
    -- Only add if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_business_id_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) THEN
        ALTER TABLE storefront_orders
            ADD CONSTRAINT storefront_orders_business_id_order_number_key
            UNIQUE (business_id, order_number);
        RAISE NOTICE 'Added composite unique constraint: (business_id, order_number)';
    ELSE
        RAISE NOTICE 'Composite constraint already exists';
    END IF;
END;
$$;

-- STEP 3: Ensure business_id index exists for performance
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id
    ON storefront_orders (business_id);

-- STEP 4: Add additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_order
    ON storefront_orders (business_id, order_number);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_email
    ON storefront_orders (customer_email);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_status_payment
    ON storefront_orders (status, payment_status);

-- STEP 5: Verify the fix
DO $$
DECLARE
    global_constraint_exists BOOLEAN;
    composite_constraint_exists BOOLEAN;
BEGIN
    -- Check for global constraint (should NOT exist)
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) INTO global_constraint_exists;
    
    -- Check for composite constraint (SHOULD exist)
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'storefront_orders_business_id_order_number_key'
          AND conrelid = 'storefront_orders'::regclass
    ) INTO composite_constraint_exists;
    
    RAISE NOTICE '=== Verification Results ===';
    RAISE NOTICE 'Global constraint exists: %', global_constraint_exists;
    RAISE NOTICE 'Composite constraint exists: %', composite_constraint_exists;
    
    IF global_constraint_exists THEN
        RAISE WARNING 'Global constraint still exists! Manual intervention required.';
    END IF;
    
    IF NOT composite_constraint_exists THEN
        RAISE WARNING 'Composite constraint missing! Check migration logs.';
    END IF;
    
    IF NOT global_constraint_exists AND composite_constraint_exists THEN
        RAISE NOTICE 'SUCCESS: Constraints are correctly configured!';
    END IF;
END;
$$;

-- STEP 6: Show current constraints for verification
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'storefront_orders'::regclass
  AND conname LIKE '%order_number%'
ORDER BY conname;
