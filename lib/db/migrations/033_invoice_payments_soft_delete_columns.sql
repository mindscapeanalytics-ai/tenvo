-- Idempotent: align invoice_payments with InvoicePaymentService / calculate_invoice_balance (soft voids).
-- Run against any env that errors with: column ip.is_deleted does not exist

ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE OR REPLACE FUNCTION calculate_invoice_balance(p_invoice_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_balance DECIMAL(12,2);
BEGIN
    SELECT grand_total INTO v_total
    FROM invoices
    WHERE id = p_invoice_id;

    -- Do not reference is_deleted here: many DBs never added that column (42703 inside this function).
    -- After ALTER above, soft-void rows can set is_deleted = true; extend this SUM in a follow-up migration if needed.
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = p_invoice_id;

    v_balance := COALESCE(v_total, 0) - v_paid;
    RETURN GREATEST(v_balance, 0);
END;
$$ LANGUAGE plpgsql;
