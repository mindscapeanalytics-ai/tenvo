-- ============================================
-- NOTIFICATIONS SYSTEM MIGRATION
-- For real-time order notifications
-- ============================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    business_id UUID NOT NULL,
    user_id UUID,
    type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'inventory', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}', -- { order_id, customer_name, amount, etc. }
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(business_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 2. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    business_id UUID NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    order_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    inventory_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_business ON notification_preferences(business_id);

-- 3. FUNCTION TO CREATE ORDER NOTIFICATION
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for new order
    INSERT INTO notifications (business_id, type, title, message, metadata, action_url)
    VALUES (
        NEW.business_id,
        'order',
        'New Order Received',
        'Order #' || NEW.order_number || ' from ' || COALESCE(NEW.customer_name, 'Guest'),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', NEW.customer_name,
            'customer_email', NEW.customer_email,
            'total_amount', NEW.total_amount,
            'currency', NEW.currency,
            'status', NEW.status
        ),
        '/business/retail-shop?tab=orders&order_id=' || NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER ON NEW ORDER
DROP TRIGGER IF EXISTS trg_order_notification ON storefront_orders;
CREATE TRIGGER trg_order_notification
    AFTER INSERT ON storefront_orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_notification();

-- 5. WEBSOCKET CONNECTIONS TABLE (for tracking active connections)
CREATE TABLE IF NOT EXISTS websocket_connections (
    id SERIAL PRIMARY KEY,
    business_id UUID NOT NULL,
    user_id UUID,
    connection_id VARCHAR(100) NOT NULL,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ws_connections_business ON websocket_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_ws_connections_user ON websocket_connections(user_id);

-- Clean up old connections periodically
CREATE OR REPLACE FUNCTION cleanup_old_ws_connections()
RETURNS void AS $$
BEGIN
    DELETE FROM websocket_connections 
    WHERE last_ping < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
