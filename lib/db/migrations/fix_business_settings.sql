-- ============================================
-- FIX BUSINESS_SETTINGS TABLE
-- ============================================

-- Check if table exists and fix structure
DO $$
BEGIN
    -- Create table if not exists
    CREATE TABLE IF NOT EXISTS business_settings (
        id SERIAL PRIMARY KEY,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        plan_tier VARCHAR(50) DEFAULT 'free',
        settings JSONB DEFAULT '{}',
        is_storefront_enabled BOOLEAN DEFAULT false,
        store_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(business_id)
    );
    
    -- Add is_storefront_enabled if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_settings' AND column_name = 'is_storefront_enabled'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN is_storefront_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- Add store_settings if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_settings' AND column_name = 'store_settings'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN store_settings JSONB DEFAULT '{}';
    END IF;
    
    -- Add plan_id if missing (for linking to subscription_plans)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_settings' AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN plan_id INTEGER;
    END IF;
    
    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_business_settings_business ON business_settings(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_settings_plan ON business_settings(plan_id);
    
    RAISE NOTICE 'Business settings table fixed successfully';
END $$;

-- Seed default settings for all existing businesses
INSERT INTO business_settings (business_id, plan_tier, is_storefront_enabled, store_settings)
SELECT 
    id as business_id,
    'growth' as plan_tier,
    true as is_storefront_enabled,
    jsonb_build_object(
        'theme', 'default',
        'currency', 'PKR',
        'allow_guest_checkout', true,
        'require_phone', true
    ) as store_settings
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM business_settings bs WHERE bs.business_id = b.id
);

-- Update any existing settings to have storefront enabled
UPDATE business_settings SET is_storefront_enabled = true WHERE is_storefront_enabled IS NULL;

-- Verify
SELECT business_id, plan_tier, is_storefront_enabled FROM business_settings LIMIT 5;
