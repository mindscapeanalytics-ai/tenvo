-- Performance Optimization: Add Missing Indexes
-- Run this migration to improve query performance across the system

-- Index 1: GL Entries by Transaction Date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_gl_entries_transaction_date 
ON gl_entries(transaction_date);

-- Index 2: Invoices by Date and Status (for dashboard metrics)
CREATE INDEX IF NOT EXISTS idx_invoices_date_status 
ON invoices(date, status);

-- Index 3: Invoice Items Total Amount (for aggregation queries)
CREATE INDEX IF NOT EXISTS idx_invoice_items_total_amount 
ON invoice_items(total_amount);

-- Index 4: Products Stock Level (for low stock alerts)
CREATE INDEX IF NOT EXISTS idx_products_stock_active 
ON products(stock, is_active) WHERE is_active = true;

-- Index 5: GL Entries by Account and Date (for account-specific queries)
CREATE INDEX IF NOT EXISTS idx_gl_entries_account_date 
ON gl_entries(account_id, transaction_date);

-- Index 6: Invoices Due Date (for overdue alerts)
CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status 
ON invoices(due_date, status) WHERE status = 'pending';

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
