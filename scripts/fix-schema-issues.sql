-- Fix Schema Issues
-- Run this to add missing columns and constraints

-- 1. Add variant_id to storefront_order_items (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'storefront_order_items' 
        AND column_name = 'variant_id'
    ) THEN
        ALTER TABLE storefront_order_items 
        ADD COLUMN variant_id UUID;
        
        RAISE NOTICE 'Added variant_id column to storefront_order_items';
    ELSE
        RAISE NOTICE 'variant_id column already exists in storefront_order_items';
    END IF;
END $$;

-- 2. Add proper unique constraint on (business_id, order_number) if missing
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'storefront_orders_business_id_order_number_key'
    ) THEN
        -- Add the constraint
        ALTER TABLE storefront_orders 
        ADD CONSTRAINT storefront_orders_business_id_order_number_key 
        UNIQUE (business_id, order_number);
        
        RAISE NOTICE 'Added unique constraint on (business_id, order_number)';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on (business_id, order_number)';
    END IF;
END $$;

-- 3. Verify the fixes
DO $$
DECLARE
    variant_id_exists BOOLEAN;
    unique_constraint_exists BOOLEAN;
BEGIN
    -- Check variant_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'storefront_order_items' 
        AND column_name = 'variant_id'
    ) INTO variant_id_exists;
    
    -- Check unique constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'storefront_orders_business_id_order_number_key'
    ) INTO unique_constraint_exists;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Schema Fix Verification:';
    RAISE NOTICE '  variant_id column: %', CASE WHEN variant_id_exists THEN '✓ Present' ELSE '✗ Missing' END;
    RAISE NOTICE '  unique constraint: %', CASE WHEN unique_constraint_exists THEN '✓ Present' ELSE '✗ Missing' END;
    RAISE NOTICE '==============================================';
END $$;
