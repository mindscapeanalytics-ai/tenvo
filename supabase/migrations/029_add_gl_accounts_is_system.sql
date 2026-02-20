-- Migration 029: Restore is_system guard for GL Accounts
-- Purpose: Protect core accounting accounts from accidental deletion in enterprise workflows.

-- 1. Add is_system column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gl_accounts' AND column_name = 'is_system') THEN
        ALTER TABLE gl_accounts ADD COLUMN is_system BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Backfill system status for known core accounts
-- This ensures existing businesses also benefit from the guard
UPDATE gl_accounts 
SET is_system = true 
WHERE code IN (
    '1001', -- Cash on Hand
    '1002', -- Bank Accounts
    '1100', -- Accounts Receivable
    '1200', -- Inventory Asset
    '2001', -- Accounts Payable
    '2100', -- Sales Tax Payable
    '2101', -- Provincial Tax Payable
    '2102', -- Withholding Tax Payable
    '3000', -- Owner Equity
    '3100', -- Retained Earnings
    '4000', -- Sales Revenue
    '4100', -- Service Revenue
    '5000', -- Cost of Goods Sold
    '5001'  -- Manufacturing Cost
);
