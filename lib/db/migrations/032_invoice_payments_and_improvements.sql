-- ============================================
-- Invoice System Improvements Migration
-- 1. Invoice Payments Table
-- 2. Invoice Status Improvements
-- 3. Stock Validation Support
-- ============================================

-- ============================================
-- 1. INVOICE PAYMENTS TABLE
-- Tracks partial payments against invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL, -- cash, card, bank_transfer, check, digital_wallet, etc.
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number TEXT, -- Check number, transaction ID, etc.
    
    -- For digital payments
    transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    received_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_payments_business_id ON invoice_payments(business_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- RLS
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice payments" ON invoice_payments
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice payments" ON invoice_payments
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice payments" ON invoice_payments
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice payments" ON invoice_payments
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_invoice_payments_updated_at BEFORE UPDATE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. INVOICE ITEMS AUDIT TABLE
-- Tracks changes to invoice items
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_item_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES invoice_items(id) ON DELETE CASCADE,
    
    -- Change Details
    change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
    field_name TEXT, -- Which field changed (null for created/deleted)
    old_value TEXT,
    new_value TEXT,
    
    -- Full item snapshot for major changes
    item_snapshot JSONB,
    
    -- Who made the change
    changed_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_item_changes_business_id ON invoice_item_changes(business_id);
CREATE INDEX idx_invoice_item_changes_invoice_id ON invoice_item_changes(invoice_id);
CREATE INDEX idx_invoice_item_changes_changed_at ON invoice_item_changes(changed_at);

-- RLS
ALTER TABLE invoice_item_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice item changes" ON invoice_item_changes
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 3. INVOICE EMAIL LOG
-- Tracks invoice emails sent to customers
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Email Details
    email_to TEXT NOT NULL,
    email_cc TEXT,
    email_bcc TEXT,
    subject TEXT NOT NULL,
    template_used TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, bounced, failed
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    sent_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_email_log_business_id ON invoice_email_log(business_id);
CREATE INDEX idx_invoice_email_log_invoice_id ON invoice_email_log(invoice_id);
CREATE INDEX idx_invoice_email_log_status ON invoice_email_log(status);

-- RLS
ALTER TABLE invoice_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice email logs" ON invoice_email_log
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. FUNCTION: Calculate Invoice Balance
-- Returns remaining balance on an invoice
-- ============================================
CREATE OR REPLACE FUNCTION calculate_invoice_balance(p_invoice_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_balance DECIMAL(12,2);
BEGIN
    -- Get invoice total
    SELECT grand_total INTO v_total
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Get total payments
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = p_invoice_id
      AND (is_deleted = false OR is_deleted IS NULL);
    
    v_balance := COALESCE(v_total, 0) - v_paid;
    
    RETURN GREATEST(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FUNCTION: Update Invoice Payment Status
-- Automatically updates payment_status based on payments
-- ============================================
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_new_status TEXT;
BEGIN
    -- Determine which invoice to update
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;
    
    -- Get invoice total
    SELECT grand_total INTO v_total
    FROM invoices
    WHERE id = v_invoice_id;
    
    -- Get total payments
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = v_invoice_id
      AND (is_deleted = false OR is_deleted IS NULL);
    
    -- Determine new status
    IF v_paid >= v_total THEN
        v_new_status := 'paid';
    ELSIF v_paid > 0 THEN
        v_new_status := 'partial';
    ELSE
        v_new_status := 'unpaid';
    END IF;
    
    -- Update invoice
    UPDATE invoices
    SET payment_status = v_new_status,
        status = CASE 
            WHEN v_new_status = 'paid' AND status IN ('draft', 'sent') THEN 'paid'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment status updates
CREATE TRIGGER update_invoice_payment_status_on_insert
    AFTER INSERT ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_update
    AFTER UPDATE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_delete
    AFTER DELETE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

-- ============================================
-- 6. Add soft delete support to invoice_payments
-- ============================================
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES "user"(id) ON DELETE SET NULL;

-- ============================================
-- 6b. Add soft delete support to payments table (if missing)
-- ============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES "user"(id) ON DELETE SET NULL;

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_payments_is_deleted ON payments(business_id, is_deleted) WHERE is_deleted = false;

-- ============================================
-- 7. INVOICE AGING VIEW
-- For quick aging reports
-- ============================================
CREATE OR REPLACE VIEW invoice_aging AS
SELECT 
    i.id,
    i.business_id,
    i.invoice_number,
    i.customer_id,
    c.name as customer_name,
    i.date,
    i.due_date,
    i.grand_total,
    calculate_invoice_balance(i.id) as balance,
    i.payment_status,
    i.status,
    CASE 
        WHEN i.due_date IS NULL THEN NULL
        WHEN i.due_date >= CURRENT_DATE THEN 0
        ELSE CURRENT_DATE - i.due_date
    END as days_overdue,
    CASE 
        WHEN i.due_date IS NULL OR i.due_date >= CURRENT_DATE THEN i.grand_total
        WHEN CURRENT_DATE - i.due_date <= 30 THEN i.grand_total
        ELSE 0
    END as current_amount,
    CASE 
        WHEN i.due_date IS NOT NULL AND CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN i.grand_total
        ELSE 0
    END as days_1_30,
    CASE 
        WHEN i.due_date IS NOT NULL AND CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN i.grand_total
        ELSE 0
    END as days_31_60,
    CASE 
        WHEN i.due_date IS NOT NULL AND CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN i.grand_total
        ELSE 0
    END as days_61_90,
    CASE 
        WHEN i.due_date IS NOT NULL AND CURRENT_DATE - i.due_date > 90 THEN i.grand_total
        ELSE 0
    END as days_over_90
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
WHERE i.is_deleted = false OR i.is_deleted IS NULL;

-- ============================================
-- 8. UNIQUE CONSTRAINT: Prevent duplicate invoice numbers
-- ============================================
-- First, clean up any duplicates that might exist
-- Then add the constraint

-- Note: This is a data fix that should be run carefully
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_invoice_number_per_business 
-- ON invoices(business_id, invoice_number) 
-- WHERE is_deleted = false OR is_deleted IS NULL;

-- For now, we'll add a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_invoice_number_per_business 
ON invoices(business_id, invoice_number) 
WHERE (is_deleted = false OR is_deleted IS NULL);

-- ============================================
-- 9. STOCK RESERVATION IMPROVEMENTS
-- Add status field to inventory_reservations if not exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_reservations' 
                   AND column_name = 'reservation_type') THEN
        ALTER TABLE inventory_reservations ADD COLUMN reservation_type TEXT DEFAULT 'sale';
    END IF;
END $$;

-- ============================================
-- 10. INVOICE TEMPLATES TABLE
-- For custom invoice formats per business
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- Template Details
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    
    -- Template Configuration
    header_html TEXT,
    footer_html TEXT,
    css_styles TEXT,
    
    -- Display Options
    show_logo BOOLEAN DEFAULT true,
    show_signature BOOLEAN DEFAULT false,
    show_bank_details BOOLEAN DEFAULT false,
    show_terms_on_footer BOOLEAN DEFAULT true,
    
    -- Color Scheme (JSON)
    color_scheme JSONB DEFAULT '{
        "primary": "#10B981",
        "secondary": "#374151",
        "accent": "#F59E0B"
    }',
    
    -- Metadata
    created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_invoice_templates_business_id ON invoice_templates(business_id);

-- RLS
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice templates" ON invoice_templates
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own invoice templates" ON invoice_templates
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON invoice_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default template
INSERT INTO invoice_templates (business_id, name, is_default, header_html, footer_html)
SELECT id, 'Default Template', true, '', ''
FROM businesses
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. INVENTORY STOCK TABLE (Missing - Required for Stock Validation)
-- Tracks current stock levels per product/warehouse
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    
    -- Stock Levels
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    available_quantity DECIMAL(12,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Tracking
    last_movement_at TIMESTAMPTZ,
    last_counted_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_stock_business_id ON inventory_stock(business_id);
CREATE INDEX idx_inventory_stock_product_id ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id);
CREATE UNIQUE INDEX idx_inventory_stock_product_warehouse ON inventory_stock(product_id, warehouse_id) WHERE is_deleted = false;

-- RLS
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory stock" ON inventory_stock
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own inventory stock" ON inventory_stock
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON inventory_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. INVENTORY RESERVATIONS TABLE (For Stock Reservations)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- What is reserved
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    
    -- Why it's reserved
    reference_type TEXT NOT NULL, -- 'invoice', 'sales_order', 'production_order'
    reference_id UUID NOT NULL,
    
    -- Reservation status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled', 'expired'
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_reservations_business_id ON inventory_reservations(business_id);
CREATE INDEX idx_inventory_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX idx_inventory_reservations_reference ON inventory_reservations(reference_type, reference_id);
CREATE INDEX idx_inventory_reservations_status ON inventory_reservations(status);

-- RLS
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON inventory_reservations
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own reservations" ON inventory_reservations
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
