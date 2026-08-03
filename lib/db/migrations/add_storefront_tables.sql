-- Migration: Add storefront and business settings tables
-- Created: 2026-05-22
-- Description: Creates tables required for storefront functionality

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
(
    'Free',
    'free',
    'Perfect for getting started with basic features',
    0,
    0,
    '{"inventory_management": true, "basic_pos": true, "single_location": true, "community_support": true}',
    '{"products": 100, "users": 2, "locations": 1, "monthly_orders": 50}',
    1
),
(
    'Starter',
    'starter',
    'For small businesses ready to grow',
    29,
    290,
    '{"inventory_management": true, "advanced_pos": true, "multi_location": true, "basic_analytics": true, "email_support": true, "storefront": true}',
    '{"products": 1000, "users": 5, "locations": 3, "monthly_orders": 500}',
    2
),
(
    'Growth',
    'growth',
    'For growing businesses with advanced needs',
    79,
    790,
    '{"inventory_management": true, "advanced_pos": true, "multi_location": true, "advanced_analytics": true, "priority_support": true, "storefront": true, "api_access": true, "integrations": true}',
    '{"products": 10000, "users": 15, "locations": 10, "monthly_orders": 5000}',
    3
),
(
    'Enterprise',
    'enterprise',
    'For large businesses with custom requirements',
    199,
    1990,
    '{"inventory_management": true, "advanced_pos": true, "unlimited_locations": true, "advanced_analytics": true, "dedicated_support": true, "storefront": true, "api_access": true, "integrations": true, "custom_development": true, "sla": true}',
    '{"products": -1, "users": -1, "locations": -1, "monthly_orders": -1}',
    4
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. BUSINESS SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    plan_tier VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    storefront_settings JSONB DEFAULT '{"enabled": true}'
    payment_settings JSONB DEFAULT '{}',
    shipping_settings JSONB DEFAULT '{}',
    tax_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    daily_sales_target DECIMAL(12, 2) DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_plan_id ON business_settings(plan_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_settings_timestamp ON business_settings;
CREATE TRIGGER update_business_settings_timestamp
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_business_settings_updated_at();

-- ============================================
-- 3. BUSINESS CUSTOM DOMAINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_custom_domains (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    ssl_enabled BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, domain)
);

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_business_custom_domains_domain ON business_custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_business_custom_domains_business_id ON business_custom_domains(business_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_business_custom_domains_timestamp ON business_custom_domains;
CREATE TRIGGER update_business_custom_domains_timestamp
    BEFORE UPDATE ON business_custom_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_business_settings_updated_at();

-- ============================================
-- 4. PRODUCT CATEGORIES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id INTEGER REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_business_id ON product_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);

-- ============================================
-- 5. ADD DEFAULT SETTINGS FOR EXISTING BUSINESSES
-- ============================================
INSERT INTO business_settings (business_id, plan_tier, settings, storefront_settings)
SELECT 
    b.id,
    'free',
    '{"theme": "default", "currency": "PKR", "timezone": "Asia/Karachi"}',
    '{"enabled": true}'
FROM businesses b
LEFT JOIN business_settings bs ON b.id = bs.business_id
WHERE bs.id IS NULL;

-- ============================================
-- 6. ADD ORDER MANAGEMENT TABLES (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS storefront_orders (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_name VARCHAR(255),
    shipping_address JSONB,
    billing_address JSONB,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id ON storefront_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_status ON storefront_orders(status);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_created_at ON storefront_orders(created_at);

CREATE TABLE IF NOT EXISTS storefront_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES storefront_orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_storefront_order_items_order_id ON storefront_order_items(order_id);

-- ============================================
-- COMPLETION
-- ============================================
-- Verify tables were created
SELECT 'Tables created successfully' as status;
