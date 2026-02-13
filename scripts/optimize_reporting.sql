-- 1. Inventory Ledger Reporting (Date Range Scans)
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_created_at_br ON inventory_ledger (business_id, created_at DESC);

-- 2. Stock Movements Audit Trail
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at_br ON stock_movements (business_id, created_at DESC);

-- 3. GL Entries Financial Reporting
CREATE INDEX IF NOT EXISTS idx_gl_entries_transaction_date_br ON gl_entries (business_id, transaction_date DESC);

-- 4. Production Orders Scheduling
CREATE INDEX IF NOT EXISTS idx_production_orders_scheduled_date_br ON production_orders (business_id, scheduled_date DESC);

-- 5. Invoice Chronology
CREATE INDEX IF NOT EXISTS idx_invoices_date_br ON invoices (business_id, date DESC);

-- 6. Audit Logs (Tenant Specific)
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_created_at ON audit_logs (business_id, created_at DESC);
