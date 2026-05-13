-- Phase 1 Inventory: Reorder automation + cycle counts + low stock alerts
-- Safe, idempotent migration for Postgres

CREATE TABLE IF NOT EXISTS reorder_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    min_stock_level DECIMAL(12,2) NOT NULL,
    reorder_quantity DECIMAL(12,2) NOT NULL,
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reorder_points_unique
ON reorder_points (business_id, product_id, warehouse_id);

CREATE INDEX IF NOT EXISTS idx_reorder_points_business_enabled
ON reorder_points (business_id, enabled);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    current_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_stock_level DECIMAL(12,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_low_stock_alerts_unique_status
ON low_stock_alerts (business_id, product_id, warehouse_id, status);

CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_business_status
ON low_stock_alerts (business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_abc_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    abc_category VARCHAR(1) NOT NULL,
    period_days INTEGER NOT NULL DEFAULT 90,
    total_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_value DECIMAL(14,2) NOT NULL DEFAULT 0,
    pct_of_total_value DECIMAL(7,4) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_abc_business_product_period
ON inventory_abc_analysis (business_id, product_id, period_days);

CREATE INDEX IF NOT EXISTS idx_inventory_abc_business_category
ON inventory_abc_analysis (business_id, abc_category);

CREATE TABLE IF NOT EXISTS cycle_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'manual',
    warehouse_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'in-progress',
    item_count INTEGER NOT NULL DEFAULT 0,
    variance_count INTEGER NOT NULL DEFAULT 0,
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cycle_counts_business_status
ON cycle_counts (business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS cycle_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_count_id UUID NOT NULL REFERENCES cycle_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(120),
    product_name VARCHAR(255) NOT NULL,
    system_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    counted_quantity DECIMAL(12,2),
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cycle_count_items_unique_product
ON cycle_count_items (cycle_count_id, product_id);

CREATE INDEX IF NOT EXISTS idx_cycle_count_items_count
ON cycle_count_items (cycle_count_id);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_count_id UUID REFERENCES cycle_counts(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    adjustment_qty DECIMAL(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_date
ON inventory_adjustments (product_id, created_at DESC);
