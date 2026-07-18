-- A/R aging view used by diagnostics / ad-hoc SQL.
-- Runtime Finance Hub A/R uses InvoicePaymentService.getAgingReport (balance-based buckets).
-- Amounts use outstanding balance from calculate_invoice_balance, not invoice grand_total.
-- Buckets are mutually exclusive.

CREATE OR REPLACE VIEW invoice_aging AS
SELECT
    i.id,
    i.business_id,
    i.invoice_number,
    i.customer_id,
    c.name AS customer_name,
    i.date,
    i.due_date,
    i.grand_total,
    aged.balance,
    i.payment_status,
    i.status,
    aged.days_overdue,
    CASE WHEN aged.days_overdue = 0 THEN aged.balance ELSE 0 END AS current_amount,
    CASE WHEN aged.days_overdue BETWEEN 1 AND 30 THEN aged.balance ELSE 0 END AS days_1_30,
    CASE WHEN aged.days_overdue BETWEEN 31 AND 60 THEN aged.balance ELSE 0 END AS days_31_60,
    CASE WHEN aged.days_overdue BETWEEN 61 AND 90 THEN aged.balance ELSE 0 END AS days_61_90,
    CASE WHEN aged.days_overdue > 90 THEN aged.balance ELSE 0 END AS days_over_90
FROM invoices i
LEFT JOIN customers c
    ON i.customer_id = c.id
   AND c.business_id = i.business_id
CROSS JOIN LATERAL (
    SELECT
        COALESCE(calculate_invoice_balance(i.id), i.grand_total, 0)::numeric AS balance,
        GREATEST(
            (CURRENT_DATE - COALESCE(i.due_date, i.date)::date),
            0
        )::int AS days_overdue
) aged
WHERE (i.is_deleted = false OR i.is_deleted IS NULL)
  AND COALESCE(LOWER(i.payment_status), '') <> 'paid'
  AND COALESCE(LOWER(i.status), '') NOT IN ('voided', 'cancelled', 'draft')
  AND aged.balance > 0;
