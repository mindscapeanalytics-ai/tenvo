-- Idempotent repair: missing invoice_payments.is_deleted + broken calculate_invoice_balance (42703).
-- Same logic as prisma/migrations/20260604_invoice_payments_soft_delete_and_balance/migration.sql
-- Run in Supabase SQL editor or: psql $DATABASE_URL -f lib/db/migrations/034_calculate_invoice_balance_no_is_deleted.sql

ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE OR REPLACE FUNCTION calculate_invoice_balance(invoice_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_balance DECIMAL(12,2);
BEGIN
    SELECT COALESCE(grand_total, 0) INTO v_total
    FROM invoices
    WHERE id = invoice_uuid
      AND (is_deleted = false OR is_deleted IS NULL);

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = invoice_uuid
      AND (is_deleted = false OR is_deleted IS NULL);

    v_balance := COALESCE(v_total, 0) - v_paid;
    RETURN GREATEST(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_new_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT COALESCE(grand_total, 0) INTO v_total
    FROM invoices
    WHERE id = v_invoice_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = v_invoice_id
      AND (is_deleted = false OR is_deleted IS NULL);

    IF v_paid >= v_total AND v_total > 0 THEN
        v_new_status := 'paid';
    ELSIF v_paid > 0 THEN
        v_new_status := 'partial';
    ELSE
        v_new_status := 'unpaid';
    END IF;

    UPDATE invoices
    SET payment_status = v_new_status,
        status = CASE
            WHEN v_new_status = 'paid' AND status IN ('draft', 'sent', 'awaiting_approval') THEN 'paid'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_payment_status_on_insert ON invoice_payments;
DROP TRIGGER IF EXISTS update_invoice_payment_status_on_update ON invoice_payments;
DROP TRIGGER IF EXISTS update_invoice_payment_status_on_delete ON invoice_payments;

CREATE TRIGGER update_invoice_payment_status_on_insert
    AFTER INSERT ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_update
    AFTER UPDATE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_delete
    AFTER DELETE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();
