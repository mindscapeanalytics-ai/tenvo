ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS batch_number TEXT, ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS batch_number TEXT, ADD COLUMN IF NOT EXISTS serial_number TEXT, ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE delivery_challan_items ADD COLUMN IF NOT EXISTS batch_number TEXT, ADD COLUMN IF NOT EXISTS serial_number TEXT;
CREATE INDEX IF NOT EXISTS idx_so_items_batch ON sales_order_items(batch_number);
CREATE INDEX IF NOT EXISTS idx_so_items_serial ON sales_order_items(serial_number);
