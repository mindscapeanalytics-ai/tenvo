-- ============================================
-- ADD DESCRIPTION COLUMN TO BUSINESSES TABLE
-- ============================================

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE businesses ADD COLUMN description TEXT;
        
        -- Update existing businesses with default description
        UPDATE businesses 
        SET description = business_name || ' - ' || COALESCE(category, 'Business')
        WHERE description IS NULL;
        
        RAISE NOTICE 'Added description column to businesses table';
    ELSE
        RAISE NOTICE 'Description column already exists in businesses table';
    END IF;
END $$;
