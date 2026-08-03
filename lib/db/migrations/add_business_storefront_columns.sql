-- ============================================
-- ADD ALL MISSING STOREFRONT COLUMNS TO BUSINESSES
-- ============================================

-- Add all storefront columns if they don't exist
DO $$
BEGIN
    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'description') THEN
        ALTER TABLE businesses ADD COLUMN description TEXT;
    END IF;

    -- Add logo_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'logo_url') THEN
        ALTER TABLE businesses ADD COLUMN logo_url TEXT;
    END IF;

    -- Add cover_image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'cover_image_url') THEN
        ALTER TABLE businesses ADD COLUMN cover_image_url TEXT;
    END IF;

    -- Add website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'website') THEN
        ALTER TABLE businesses ADD COLUMN website TEXT;
    END IF;

    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'category') THEN
        ALTER TABLE businesses ADD COLUMN category VARCHAR(100);
    END IF;

    -- Add address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address') THEN
        ALTER TABLE businesses ADD COLUMN address TEXT;
    END IF;

    -- Add city column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'city') THEN
        ALTER TABLE businesses ADD COLUMN city VARCHAR(100);
    END IF;

    -- Add country column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'country') THEN
        ALTER TABLE businesses ADD COLUMN country VARCHAR(100);
    END IF;

    -- Add postal_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'postal_code') THEN
        ALTER TABLE businesses ADD COLUMN postal_code VARCHAR(20);
    END IF;

    -- Add is_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_active') THEN
        ALTER TABLE businesses ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add is_verified column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_verified') THEN
        ALTER TABLE businesses ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    -- Add phone column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'phone') THEN
        ALTER TABLE businesses ADD COLUMN phone VARCHAR(50);
    END IF;

    -- Add email column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'email') THEN
        ALTER TABLE businesses ADD COLUMN email VARCHAR(255);
    END IF;

    RAISE NOTICE 'All storefront columns added successfully';
END $$;

-- Update existing businesses with default data for storefront
UPDATE businesses SET
    description = COALESCE(description, business_name || ' - ' || COALESCE(category, 'Business')),
    is_active = COALESCE(is_active, true),
    is_verified = COALESCE(is_verified, false)
WHERE description IS NULL OR is_active IS NULL OR is_verified IS NULL;

-- Create indexes for common storefront queries
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(LOWER(domain));
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- Verify columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;
