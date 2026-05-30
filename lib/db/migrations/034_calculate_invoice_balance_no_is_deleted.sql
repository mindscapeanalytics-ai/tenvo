-- Fix: calculate_invoice_balance() fails with 42703 when invoice_payments has no is_deleted column.
-- Safe to run even if 033 was already applied (replaces function only).

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

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = p_invoice_id;

    v_balance := COALESCE(v_total, 0) - v_paid;
    RETURN GREATEST(v_balance, 0);
END;
$$ LANGUAGE plpgsql;
