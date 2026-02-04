-- Migration 023: Fix Manufacturing Schema (Dynamic SQL for Safety)

DO $$ 
BEGIN

    -- 1a. Ensure Warehouses Table Exists (Missing Dependency)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warehouses') THEN
        CREATE TABLE warehouses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
            name TEXT NOT NULL,
            location TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        -- Enable RLS
        EXECUTE 'ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY';
        -- Add Policy (Need to be outside DO block strictly, but we can try generic or skip for now)
    END IF;

    -- 1b. Handle BOM Tables (Rename or Create)
    -- Rename bom_items -> bom_materials if source exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bom_items') THEN
        EXECUTE 'ALTER TABLE bom_items RENAME TO bom_materials';
    END IF;

    -- Create bom_materials if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bom_materials') THEN
        CREATE TABLE bom_materials (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
            bom_id UUID REFERENCES boms(id) ON DELETE CASCADE NOT NULL,
            material_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
            quantity DECIMAL(12,2) NOT NULL,
            unit TEXT
        );
    END IF;

    -- Ensure business_id exists explicitly (if table existed but lacked column)
    -- We use dynamic SQL to avoid errors if table didn't exist at parsing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bom_materials' AND column_name = 'business_id') THEN
        EXECUTE 'ALTER TABLE bom_materials ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE';
    END IF;
    
    -- Fix column name product_id -> material_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bom_materials' AND column_name = 'product_id') THEN
        EXECUTE 'ALTER TABLE bom_materials RENAME COLUMN product_id TO material_id';
    END IF;


    -- 2. Fix Production Orders
    -- Add columns safely
    EXECUTE 'ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL';
    EXECUTE 'ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS quantity_to_produce DECIMAL(12,2)';
    EXECUTE 'ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS notes TEXT';
    EXECUTE 'ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS scheduled_date DATE';

    -- Data Backfill Operations (Commented out to isolate uuid=text error)
    -- UPDATE production_orders SET quantity_to_produce = quantity WHERE quantity_to_produce IS NULL;
    -- UPDATE production_orders SET scheduled_date = start_date WHERE scheduled_date IS NULL;
    
    -- Backfill product_id
    -- UPDATE production_orders po
    -- SET product_id = b.product_id
    -- FROM boms b
    -- WHERE po.bom_id = b.id AND po.product_id IS NULL;


    -- 3. Indexes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bom_materials_bom ON bom_materials(bom_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_production_orders_product ON production_orders(product_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status)';

END $$;


-- 4. RLS for bom_materials (Separate command as CREATE POLICY can't be in DO block easily or needs dynamic SQL)
-- We use a safe-- 4. RLS for bom_materials
-- DROP POLICY IF EXISTS "Users can manage own bom_items" ON bom_materials;
-- DROP POLICY IF EXISTS "Users can manage own bom_materials" ON bom_materials;

-- CREATE POLICY "Users can manage own bom_materials" ON bom_materials 
--   FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
