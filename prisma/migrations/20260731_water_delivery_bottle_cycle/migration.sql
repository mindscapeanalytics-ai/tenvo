-- Water delivery: ZARA-style bottle cycle + cash recovery columns
ALTER TABLE water_delivery_stops
  ADD COLUMN IF NOT EXISTS cash_collected DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS special_discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_no_snapshot VARCHAR(64),
  ADD COLUMN IF NOT EXISTS town_code_snapshot VARCHAR(32);

ALTER TABLE water_delivery_lines
  ADD COLUMN IF NOT EXISTS received_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0;
