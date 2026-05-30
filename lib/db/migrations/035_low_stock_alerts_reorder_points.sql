-- Low-stock alerts + reorder points (inventory automation)
-- Run if GET /api/v1/inventory/low-stock-alerts fails with 42P01 (relation does not exist).
-- Idempotent; safe to re-run.

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
