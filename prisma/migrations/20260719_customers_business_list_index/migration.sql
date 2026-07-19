-- Hub CRM list: (business_id, is_deleted, is_active, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_customers_business_list
  ON customers (business_id, is_deleted, is_active, created_at DESC);
