-- Migration: Add sales_orders, delivery_challans, and payments tables
-- Created: 2026-02-03
-- Purpose: Support complete order lifecycle (quotation → sales order → delivery challan → invoice)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add conversion tracking to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS converted_to_order BOOLEAN DEFAULT false;

-- 2. Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number VARCHAR(255) NOT NULL,
    quotation_id UUID REFERENCES quotations(id),
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL,
    delivery_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    total_tax DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    converted_to_challan BOOLEAN DEFAULT false,
    converted_to_invoice BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, order_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_orders_business_id ON sales_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);

-- 3. Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    name VARCHAR(255),
    description TEXT,
    quantity DECIMAL(12,2) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- 4. Create delivery_challans table
CREATE TABLE IF NOT EXISTS delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    challan_number VARCHAR(255) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    customer_id UUID REFERENCES customers(id),
    warehouse_id UUID REFERENCES warehouse_locations(id),
    date DATE NOT NULL,
    vehicle_number VARCHAR(100),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    converted_to_invoice BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, challan_number)
);

CREATE INDEX IF NOT EXISTS idx_delivery_challans_business_id ON delivery_challans(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_customer_id ON delivery_challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_status ON delivery_challans(status);

-- 5. Create challan_items table
CREATE TABLE IF NOT EXISTS challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    batch_id UUID REFERENCES product_batches(id),
    name VARCHAR(255),
    quantity DECIMAL(12,2) DEFAULT 1,
    serial_numbers TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challan_items_challan_id ON challan_items(challan_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_product_id ON challan_items(product_id);

-- 6. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL, -- 'receipt' or 'payment'
    reference_type VARCHAR(50), -- 'invoice', 'purchase', etc.
    reference_id UUID,
    customer_id UUID REFERENCES customers(id),
    vendor_id UUID REFERENCES vendors(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(50), -- 'cash', 'bank', 'cheque', 'online'
    payment_date DATE NOT NULL,
    bank_name VARCHAR(255),
    cheque_number VARCHAR(100),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Add comments for documentation
COMMENT ON TABLE sales_orders IS 'Sales orders created from quotations or directly';
COMMENT ON TABLE delivery_challans IS 'Delivery challans for goods dispatch';
COMMENT ON TABLE payments IS 'Customer receipts and vendor payments';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON sales_orders TO your_app_user;
-- GRANT ALL ON sales_order_items TO your_app_user;
-- GRANT ALL ON delivery_challans TO your_app_user;
-- GRANT ALL ON challan_items TO your_app_user;
-- GRANT ALL ON payments TO your_app_user;
