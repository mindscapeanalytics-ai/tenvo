-- Migration: Create notifications table for approval workflow and inventory alerts
-- Requirements: 5.3, 5.5
-- Created: 2026-04-03

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_notifications_user_business ON notifications(user_id, business_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, business_id, read);
CREATE INDEX idx_notifications_type ON notifications(business_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority) WHERE read = false;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert notifications
CREATE POLICY "System can insert notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores in-app notifications for approval workflows, stock alerts, and inventory events';

-- Add comments to columns
COMMENT ON COLUMN notifications.type IS 'Notification type: approval_request, approval_approved, approval_rejected, stock_adjustment, batch_expiring, low_stock, transfer_initiated, transfer_received';
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, medium, high, urgent';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional data specific to notification type (adjustment_id, batch_id, etc.)';
COMMENT ON COLUMN notifications.read IS 'Whether notification has been read by user';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was marked as read';
