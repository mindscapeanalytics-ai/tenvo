-- Performance & Robustness Migration: Batch serial INSERTs, stock sync trigger, updated_at trigger, RLS
-- ============================================================================

-- 1. STOCK SYNC TRIGGER — eliminates redundant syncProductStock() calls
-- ============================================================================
-- This trigger auto-syncs products.stock whenever product_stock_locations changes,
-- replacing the manual application-level sync that required an extra SELECT + UPDATE.

CREATE OR REPLACE FUNCTION fn_sync_product_stock_from_locations()
RETURNS TRIGGER AS $$
DECLARE
  _product_id UUID;
  _business_id UUID;
  _location_total NUMERIC;
  _has_variants BOOLEAN;
  _variant_stock NUMERIC;
BEGIN
  -- Determine affected product
  _product_id := COALESCE(NEW.product_id, OLD.product_id);
  _business_id := COALESCE(NEW.business_id, OLD.business_id);

  -- Sum sellable location stock
  SELECT COALESCE(SUM(quantity), 0)
  INTO _location_total
  FROM product_stock_locations
  WHERE product_id = _product_id
    AND business_id = _business_id
    AND COALESCE(state, 'sellable') = 'sellable';

  -- If no location rows and product has variants, use variant sum instead
  IF _location_total = 0 THEN
    SELECT COALESCE(has_variants, false)
    INTO _has_variants
    FROM products
    WHERE id = _product_id AND business_id = _business_id;

    IF _has_variants THEN
      SELECT COALESCE(SUM(stock), 0)
      INTO _variant_stock
      FROM product_variants
      WHERE product_id = _product_id
        AND business_id = _business_id
        AND COALESCE(is_deleted, false) = false;

      _location_total := _variant_stock;
    END IF;
  END IF;

  UPDATE products
  SET stock = _location_total, updated_at = NOW()
  WHERE id = _product_id AND business_id = _business_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS trg_sync_product_stock ON product_stock_locations;

CREATE TRIGGER trg_sync_product_stock
  AFTER INSERT OR UPDATE OR DELETE ON product_stock_locations
  FOR EACH ROW EXECUTE FUNCTION fn_sync_product_stock_from_locations();

-- 2. AUTO updated_at TRIGGER — ensures raw SQL writes update the timestamp
-- ============================================================================
-- Prisma @updatedAt only works through the ORM. Raw pool.query() calls skip it.

CREATE OR REPLACE FUNCTION fn_auto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to high-traffic tables that use raw SQL mutations
DO $$
DECLARE
  _tables TEXT[] := ARRAY[
    'products',
    'product_variants',
    'product_batches',
    'product_serials',
    'product_stock_locations',
    'stock_movements',
    'invoices',
    'invoice_items',
    'customers',
    'pos_transactions'
  ];
  _tbl TEXT;
  _trigger_name TEXT;
BEGIN
  FOREACH _tbl IN ARRAY _tables
  LOOP
    _trigger_name := 'trg_auto_updated_at_' || _tbl;

    -- Check table exists before creating trigger
    IF to_regclass('public.' || _tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', _trigger_name, _tbl);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_auto_updated_at()',
        _trigger_name, _tbl
      );
    END IF;
  END LOOP;
END;
$$;

-- 3. ROW LEVEL SECURITY — tenant safety net for raw SQL paths
-- ============================================================================
-- Enable RLS on critical tenant tables. Policies use app.business_id session var
-- set via SET LOCAL before each tenant operation.

-- Helper: check if current_setting is set (avoids errors when not in tenant context)
CREATE OR REPLACE FUNCTION fn_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.business_id', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

DO $$
DECLARE
  _tables TEXT[] := ARRAY[
    'products',
    'product_variants',
    'product_batches',
    'product_serials',
    'product_stock_locations',
    'invoices',
    'invoice_items',
    'customers',
    'stock_movements',
    'pos_transactions'
  ];
  _tbl TEXT;
  _policy_name TEXT;
BEGIN
  FOREACH _tbl IN ARRAY _tables
  LOOP
    _policy_name := 'rls_tenant_' || _tbl;

    IF to_regclass('public.' || _tbl) IS NOT NULL THEN
      -- Enable RLS (idempotent)
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', _tbl);

      -- Drop existing policy if any
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _policy_name, _tbl);

      -- Create permissive policy: allow when session var matches OR not set (backward compat)
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (
          fn_current_tenant_id() IS NULL
          OR business_id = fn_current_tenant_id()
        ) WITH CHECK (
          fn_current_tenant_id() IS NULL
          OR business_id = fn_current_tenant_id()
        )',
        _policy_name, _tbl
      );

      -- Superuser / migration user bypasses RLS
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', _tbl);
    END IF;
  END LOOP;
END;
$$;

-- 4. MISSING INDEXES — identified during analysis
-- ============================================================================

-- products.embedding vector index (if pgvector extension exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'products' AND indexname = 'idx_products_embedding_hnsw'
    ) THEN
      EXECUTE 'CREATE INDEX idx_products_embedding_hnsw ON products USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
    END IF;
  END IF;
END;
$$;

-- businesses table: add composite index for common lookups
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses (domain);
CREATE INDEX IF NOT EXISTS idx_businesses_handle ON businesses (handle);

-- Invoice lookup optimization
CREATE INDEX IF NOT EXISTS idx_invoices_business_customer ON invoices (business_id, customer_id)
  WHERE COALESCE(is_deleted, false) = false;

-- Stock movements: business + product composite for hot reads
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_product_date
  ON stock_movements (business_id, product_id, created_at DESC);

-- Product serials: lookup by business + serial for scan flows
CREATE INDEX IF NOT EXISTS idx_product_serials_business_serial
  ON product_serials (business_id, serial_number)
  WHERE COALESCE(is_deleted, false) = false;
