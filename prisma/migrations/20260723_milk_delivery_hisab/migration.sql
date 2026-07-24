-- Milk shop route hisab (doorstep delivery log)
CREATE TABLE IF NOT EXISTS milk_delivery_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  house_no_snapshot VARCHAR(120),
  customer_name_snapshot TEXT,
  route_label VARCHAR(120),
  notes TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS milk_delivery_stops_business_date_customer_key
  ON milk_delivery_stops (business_id, delivery_date, customer_id);

CREATE INDEX IF NOT EXISTS idx_milk_delivery_stops_business_date
  ON milk_delivery_stops (business_id, delivery_date);

CREATE INDEX IF NOT EXISTS idx_milk_delivery_stops_business_customer
  ON milk_delivery_stops (business_id, customer_id);

CREATE TABLE IF NOT EXISTS milk_delivery_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES milk_delivery_stops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_snapshot TEXT,
  unit_snapshot VARCHAR(32),
  quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
  unit_price_snapshot DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS milk_delivery_lines_stop_product_key
  ON milk_delivery_lines (stop_id, product_id);

CREATE INDEX IF NOT EXISTS idx_milk_delivery_lines_business_product
  ON milk_delivery_lines (business_id, product_id);
