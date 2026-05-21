import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils/order';
import { sendOrderConfirmationEmail } from '@/lib/email/resend';

/**
 * POST /api/storefront/[businessDomain]/orders
 * Create a new order from storefront
 */
export async function POST(request, { params }) {
  const { businessDomain } = params;
  
  const client = await pool.connect();
  
  try {
    // Get business
    const businessResult = await client.query(
      `SELECT id, business_name, email, settings
      FROM businesses
      WHERE domain = $1 AND is_active = true`,
      [businessDomain]
    );
    
    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    const business = businessResult.rows[0];
    const settings = business.settings || {};
    
    // Parse request body
    const body = await request.json();
    const {
      customer,
      shippingAddress,
      billingAddress,
      items,
      subtotal,
      shipping,
      tax,
      total,
      shippingMethod,
      paymentMethod,
      notes,
      promoCode,
    } = body;
    
    // Validation
    if (!customer?.email || !customer?.firstName || !customer?.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer information is required' },
        { status: 400 }
      );
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check stock availability
    for (const item of items) {
      const stockCheck = await client.query(
        `SELECT COALESCE(pv.stock, p.stock) as stock, p.name
        FROM products p
        LEFT JOIN product_variants pv ON pv.id = $2 AND pv.product_id = p.id
        WHERE p.id = $1 AND p.business_id = $3`,
        [item.productId, item.variantId || null, business.id]
      );
      
      if (stockCheck.rows.length === 0) {
        throw new Error(`Product not found: ${item.name}`);
      }
      
      const availableStock = stockCheck.rows[0].stock;
      
      if (availableStock !== null && availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${stockCheck.rows[0].name}. Only ${availableStock} available.`
        );
      }
    }
    
    // Generate order number
    const orderNumber = await generateOrderNumber(client, business.id);
    
    // Create customer record or get existing
    let customerId = null;
    const existingCustomer = await client.query(
      `SELECT id FROM customers 
      WHERE business_id = $1 AND email = $2`,
      [business.id, customer.email]
    );
    
    if (existingCustomer.rows.length > 0) {
      customerId = existingCustomer.rows[0].id;
      
      // Update customer info
      await client.query(
        `UPDATE customers 
        SET name = $1, phone = $2, updated_at = NOW()
        WHERE id = $3`,
        [`${customer.firstName} ${customer.lastName}`, customer.phone, customerId]
      );
    } else {
      // Create new customer
      const newCustomer = await client.query(
        `INSERT INTO customers (
          business_id, name, email, phone, 
          address, city, country, postal_code,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id`,
        [
          business.id,
          `${customer.firstName} ${customer.lastName}`,
          customer.email,
          customer.phone,
          shippingAddress.address,
          shippingAddress.city,
          shippingAddress.country || 'PK',
          shippingAddress.postalCode,
        ]
      );
      customerId = newCustomer.rows[0].id;
    }
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        business_id, customer_id, order_number,
        customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_country, shipping_postal_code,
        billing_address, billing_city, billing_country, billing_postal_code,
        subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
        shipping_method, payment_method, payment_status, order_status,
        notes, source, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW())
      RETURNING *`,
      [
        business.id,
        customerId,
        orderNumber,
        `${customer.firstName} ${customer.lastName}`,
        customer.email,
        customer.phone,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.country || 'PK',
        shippingAddress.postalCode,
        billingAddress?.address || shippingAddress.address,
        billingAddress?.city || shippingAddress.city,
        billingAddress?.country || shippingAddress.country || 'PK',
        billingAddress?.postalCode || shippingAddress.postalCode,
        subtotal,
        shipping,
        tax,
        0, // Discount amount (TODO: apply promo code)
        total,
        shippingMethod,
        paymentMethod,
        paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
        'pending',
        notes,
        'storefront',
      ]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, variant_id,
          product_name, variant_name, sku,
          quantity, unit_price, total_price,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          order.id,
          item.productId,
          item.variantId || null,
          item.name,
          item.variantName || null,
          item.sku || null,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );
      
      // Update product stock
      if (item.variantId) {
        await client.query(
          `UPDATE product_variants 
          SET stock = stock - $1, updated_at = NOW()
          WHERE id = $2`,
          [item.quantity, item.variantId]
        );
      } else {
        await client.query(
          `UPDATE products 
          SET stock = stock - $1, sales_count = COALESCE(sales_count, 0) + $1, updated_at = NOW()
          WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Send confirmation email (async, don't wait)
    sendOrderConfirmationEmail({
      to: customer.email,
      order: {
        orderNumber,
        items,
        subtotal,
        shipping,
        tax,
        total,
        shippingMethod,
        paymentMethod,
      },
      business: {
        name: business.business_name,
        email: business.email,
      },
    }).catch(console.error);
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: parseFloat(order.total_amount),
        status: order.order_status,
        paymentStatus: order.payment_status,
      },
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Create Order] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create order' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * GET /api/storefront/[businessDomain]/orders
 * Get customer orders (requires authentication)
 */
export async function GET(request, { params }) {
  const { businessDomain } = params;
  
  // TODO: Add authentication check
  // For now, this is a placeholder
  
  return NextResponse.json(
    { success: false, error: 'Authentication required' },
    { status: 401 }
  );
}
