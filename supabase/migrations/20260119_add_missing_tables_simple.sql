-- Migration: Add Missing Tables for Multi-Domain Inventory System (Simplified)
-- Created: 2026-01-19
-- Description: Adds invoice_items, purchase_items, quotations, sales_orders, delivery_challans tables
--              and domain_data column to customers table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_business_id ON invoice_items(business_id);

-- Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    batch_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    quotation_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, quotation_number)
);

CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON quotations(business_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- Quotation Items Table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product_id ON quotation_items(product_id);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_business_id ON sales_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);

-- Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(50),
    serial_number VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- Delivery Challans Table
CREATE TABLE IF NOT EXISTS delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    challan_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'issued',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, challan_number)
);

CREATE INDEX IF NOT EXISTS idx_delivery_challans_business_id ON delivery_challans(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_customer_id ON delivery_challans(customer_id);

-- Delivery Challan Items Table
CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    batch_number VARCHAR(50),
    serial_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_challan_items_challan_id ON delivery_challan_items(delivery_challan_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_items_product_id ON delivery_challan_items(product_id);

-- Add domain_data column to customers if missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS domain_data JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON TABLE invoice_items IS 'Line items for invoices with product details and pricing';
COMMENT ON TABLE purchase_items IS 'Line items for purchase orders with product details and costing';
COMMENT ON TABLE quotations IS 'Customer quotations before conversion to sales orders or invoices';
COMMENT ON TABLE sales_orders IS 'Confirmed sales orders from customers';
COMMENT ON TABLE delivery_challans IS 'Delivery challans for goods dispatch tracking';
