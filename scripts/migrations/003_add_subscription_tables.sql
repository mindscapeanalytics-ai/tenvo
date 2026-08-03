-- Migration: Add subscription and billing tables
-- Created: May 21, 2026

-- Add subscription fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_tier VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  amount_paid DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'pkr',
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create index on business_id for subscription history
CREATE INDEX IF NOT EXISTS idx_subscription_history_business_id ON subscription_history(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_transfer', 'crypto'
  last4 VARCHAR(4),
  brand VARCHAR(50),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on business_id for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_business_id ON payment_methods(business_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  stripe_invoice_id VARCHAR(255),
  amount_due DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'pkr',
  status VARCHAR(50) NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  description TEXT,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Add indexes for subscription fields on businesses
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);

-- Create crypto payments table for NowPayments
CREATE TABLE IF NOT EXISTS crypto_payments (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nowpayments_payment_id VARCHAR(255) UNIQUE,
  nowpayments_order_id VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL, -- 'btc', 'eth', 'usdt', etc.
  fiat_amount DECIMAL(12, 2),
  fiat_currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'waiting', 'confirming', 'confirmed', 'finished', 'failed'
  pay_address TEXT,
  pay_amount DECIMAL(20, 8),
  actually_paid DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB
);

-- Create indexes for crypto payments
CREATE INDEX IF NOT EXISTS idx_crypto_payments_business_id ON crypto_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_nowpayments_id ON crypto_payments(nowpayments_payment_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to payment_methods
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to crypto_payments
DROP TRIGGER IF EXISTS update_crypto_payments_updated_at ON crypto_payments;
CREATE TRIGGER update_crypto_payments_updated_at
  BEFORE UPDATE ON crypto_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON subscription_history TO postgres;
GRANT ALL PRIVILEGES ON payment_methods TO postgres;
GRANT ALL PRIVILEGES ON invoices TO postgres;
GRANT ALL PRIVILEGES ON crypto_payments TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE subscription_history_id_seq TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE payment_methods_id_seq TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE invoices_id_seq TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE crypto_payments_id_seq TO postgres;

COMMENT ON TABLE subscription_history IS 'Tracks all subscription changes and payments';
COMMENT ON TABLE payment_methods IS 'Stored payment methods for businesses';
COMMENT ON TABLE invoices IS 'Billing invoices for subscriptions';
COMMENT ON TABLE crypto_payments IS 'Cryptocurrency payments via NowPayments';
