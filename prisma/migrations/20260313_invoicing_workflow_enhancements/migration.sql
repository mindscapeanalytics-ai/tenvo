-- Migration: Enhanced Invoicing Workflow (Approval, Status States, Audit)
-- Purpose: Add professional workflow features for approval, status tracking, and audit trail
-- Scope: invoices table + new invoice_approvals table

-- 1. Add workflow columns to invoices table
ALTER TABLE invoices
ADD COLUMN created_by VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL,
ADD COLUMN approval_status VARCHAR(50) DEFAULT 'none',  -- none, pending, approved, rejected
ADD COLUMN approval_by VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL,
ADD COLUMN approval_date TIMESTAMPTZ,
ADD COLUMN approval_notes TEXT,
ADD COLUMN sent_by VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL,
ADD COLUMN sent_date TIMESTAMPTZ,
ADD COLUMN viewed_date TIMESTAMPTZ,
ADD COLUMN print_count INT DEFAULT 0,
ADD COLUMN email_sent_count INT DEFAULT 0,
ADD COLUMN fbr_status VARCHAR(50) DEFAULT 'pending', -- pending, valid, invalid, sync_error
ADD COLUMN fbr_response JSONB DEFAULT '{}',
ADD COLUMN template_id UUID,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurring_parent_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN recurring_frequency VARCHAR(50), -- daily, weekly, monthly, quarterly, yearly
ADD COLUMN next_invoice_date DATE;

-- 2. Enhance status enum - support extended status values
-- status values: draft, sent, viewed, approved, payment_pending, partially_paid, paid, overdue, voided, amended
ALTER TABLE invoices
ALTER COLUMN status SET DEFAULT 'draft';

-- 3. Create invoice_approvals audit trail table
CREATE TABLE IF NOT EXISTS invoice_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    approved_by VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE SET NULL,
    approval_status VARCHAR(50) NOT NULL, -- approved, rejected
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(invoice_id) -- Only one active approval per invoice (or we check status)
);

CREATE INDEX idx_invoice_approvals_business_id ON invoice_approvals(business_id);
CREATE INDEX idx_invoice_approvals_invoice_id ON invoice_approvals(invoice_id);
CREATE INDEX idx_invoice_approvals_approved_by ON invoice_approvals(approved_by);
CREATE INDEX idx_invoice_approvals_created_at ON invoice_approvals(created_at DESC);

-- 4. Create invoice_templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- standard, recurring, credit_note
    items JSONB NOT NULL DEFAULT '[]', -- Template items: {product_id, name, quantity, rate, tax_percent}
    notes TEXT,
    terms TEXT,
    tax_category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL,
    
    UNIQUE(business_id, name)
);

CREATE INDEX idx_invoice_templates_business_id ON invoice_templates(business_id);
CREATE INDEX idx_invoice_templates_is_active ON invoice_templates(is_active);
CREATE INDEX idx_invoice_templates_type ON invoice_templates(template_type);

-- 5. Create invoice_payment_reminders table for recurring payment notifications
CREATE TABLE IF NOT EXISTS invoice_payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- first_due, overdue_3days, overdue_7days, overdue_14days, overdue_30days
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMPTZ,
    is_sent BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate reminders
    UNIQUE(invoice_id, reminder_type)
);

CREATE INDEX idx_invoice_reminders_business_id ON invoice_payment_reminders(business_id);
CREATE INDEX idx_invoice_reminders_invoice_id ON invoice_payment_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_scheduled_date ON invoice_payment_reminders(scheduled_date);
CREATE INDEX idx_invoice_reminders_is_sent ON invoice_payment_reminders(is_sent);

-- 6. Add indexes for new workflow queries
CREATE INDEX idx_invoices_approval_status ON invoices(business_id, approval_status) WHERE approval_status != 'none';
CREATE INDEX idx_invoices_fbr_status ON invoices(business_id, fbr_status);
CREATE INDEX idx_invoices_recurring ON invoices(business_id, is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_invoices_next_invoice_date ON invoices(next_invoice_date);

-- 7. Comments for documentation
COMMENT ON COLUMN invoices.approval_status IS 'Approval workflow state: none (no approval needed), pending (awaiting approval), approved (approved), rejected (rejected)';
COMMENT ON COLUMN invoices.status IS 'Invoice lifecycle state: draft, sent, viewed, approved, payment_pending, partially_paid, paid, overdue, voided, amended';
COMMENT ON COLUMN invoices.fbr_status IS 'FBR validation state: pending (not validated), valid (passed FBR), invalid (failed FBR), sync_error (API error)';
COMMENT ON TABLE invoice_approvals IS 'Audit trail for invoice approvals - tracks all approval decisions';
COMMENT ON TABLE invoice_templates IS 'Reusable invoice templates for fast invoice creation';
COMMENT ON TABLE invoice_payment_reminders IS 'Scheduled payment reminders for follow-up automation';
