-- Offline POS idempotency: nullable client_ref; multiple NULLs allowed for online sales.
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_ref VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS pos_transactions_business_client_ref_uidx
  ON pos_transactions (business_id, client_ref)
  WHERE client_ref IS NOT NULL;
