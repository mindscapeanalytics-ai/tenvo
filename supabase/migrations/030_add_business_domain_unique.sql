-- Add UNIQUE constraint to business domain handle
-- This ensures multi-tenant routing integrity at the database level

DO $$ 
BEGIN
    -- 1. Check if the index already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses'
        AND indexname = 'unique_business_domain'
    ) THEN
        -- Add unique constraint
        ALTER TABLE businesses ADD CONSTRAINT unique_business_domain UNIQUE (domain);
        
        -- Create explicit index for faster routing lookups (often redundant with UNIQUE but good for explicit planning)
        CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);
    END IF;
END $$;
