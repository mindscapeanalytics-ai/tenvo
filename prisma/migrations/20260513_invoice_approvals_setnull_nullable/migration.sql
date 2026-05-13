-- Align invoice_approvals.approved_by with ON DELETE SET NULL semantics
-- Required because SET NULL on a non-nullable column causes referential action warnings/issues.
ALTER TABLE invoice_approvals
  ALTER COLUMN approved_by DROP NOT NULL;

ALTER TABLE invoice_approvals
  DROP CONSTRAINT IF EXISTS invoice_approvals_approved_by_fkey;

ALTER TABLE invoice_approvals
  ADD CONSTRAINT invoice_approvals_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES "user"(id) ON DELETE SET NULL;
