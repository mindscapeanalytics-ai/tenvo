-- ============================================
-- Migration 019: Align Quotation/Order/Challan Tables with Actions
-- ============================================

-- Align quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0;
-- Add business_id to quotation_items for better filtering
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Align sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Align delivery_challans
ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE delivery_challan_items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Also add tax_amount to items if missing
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;
