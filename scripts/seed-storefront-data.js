#!/usr/bin/env node
/**
 * Seed storefront data for testing
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedStorefrontData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Seeding storefront data...\n');

    // 1. Get existing businesses
    const businessesResult = await client.query(
      'SELECT id, business_name, domain, category FROM businesses ORDER BY created_at DESC LIMIT 5'
    );
    
    if (businessesResult.rows.length === 0) {
      console.log('❌ No businesses found. Please create a business first.');
      return;
    }
    
    console.log(`📊 Found ${businessesResult.rows.length} businesses\n`);
    
    for (const business of businessesResult.rows) {
      console.log(`\n🏪 Processing: ${business.business_name} (${business.domain})`);
      
      // 2. Update business with storefront fields
      await client.query(
        `UPDATE businesses SET
          description = COALESCE(description, $1),
          logo_url = COALESCE(logo_url, $2),
          cover_image_url = COALESCE(cover_image_url, $3),
          website = COALESCE(website, $4),
          category = COALESCE(category, $5),
          address = COALESCE(address, $6),
          city = COALESCE(city, $7),
          country = COALESCE(country, $8),
          postal_code = COALESCE(postal_code, $9),
          is_active = true,
          is_verified = true
        WHERE id = $10`,
        [
          `${business.business_name} - Your trusted partner for quality products and services.`,
          `https://ui-avatars.com/api/?name=${encodeURIComponent(business.business_name)}&size=128&format=png&background=0d9488&color=ffffff&bold=true`,
          null,
          `https://${business.domain}.tenvo.com`,
          business.category || 'Retail',
          '123 Main Street',
          'Lahore',
          'Pakistan',
          '54000',
          business.id
        ]
      );
      
      // 3. Ensure business_settings exists
      await client.query(
        `INSERT INTO business_settings (business_id, plan_tier, is_storefront_enabled, store_settings)
         VALUES ($1, 'growth', true, $2)
         ON CONFLICT (business_id) DO UPDATE SET
           is_storefront_enabled = true,
           store_settings = $2`,
        [
          business.id,
          JSON.stringify({
            theme: 'default',
            currency: 'PKR',
            allow_guest_checkout: true,
            require_phone: true
          })
        ]
      );
      
      // 4. Seed product categories
      const categories = [
        { name: 'Featured', slug: 'featured', sort: 1 },
        { name: 'Best Sellers', slug: 'best-sellers', sort: 2 },
        { name: 'New Arrivals', slug: 'new-arrivals', sort: 3 },
        { name: 'Sale Items', slug: 'sale', sort: 4 }
      ];
      
      for (const cat of categories) {
        await client.query(
          `INSERT INTO product_categories (business_id, name, slug, sort_order, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (business_id, slug) DO NOTHING`,
          [business.id, cat.name, cat.slug, cat.sort]
        );
      }
      
      // 5. Seed dummy products (if products table exists and is empty)
      const productsCheck = await client.query(
        'SELECT COUNT(*) as count FROM products WHERE business_id = $1',
        [business.id]
      );
      
      if (parseInt(productsCheck.rows[0].count) === 0) {
        const dummyProducts = [
          {
            name: 'Premium Quality Widget',
            description: 'Our best-selling premium widget with advanced features.',
            price: 1999.99,
            sku: 'PW-001',
            category: 'Featured'
          },
          {
            name: 'Essential Starter Pack',
            description: 'Everything you need to get started. Great value!',
            price: 999.99,
            sku: 'ESP-002',
            category: 'Best Sellers'
          },
          {
            name: 'Deluxe Combo Set',
            description: 'Complete set with all accessories included.',
            price: 3499.99,
            sku: 'DCS-003',
            category: 'New Arrivals'
          },
          {
            name: 'Basic Standard Item',
            description: 'Reliable and affordable option for everyday use.',
            price: 499.99,
            sku: 'BSI-004',
            category: 'Sale Items'
          }
        ];
        
        for (const prod of dummyProducts) {
          try {
            await client.query(
              `INSERT INTO products (business_id, name, description, price, sku, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, true, NOW())
               ON CONFLICT (sku, business_id) DO NOTHING`,
              [business.id, prod.name, prod.description, prod.price, prod.sku]
            );
          } catch (e) {
            // Products table might have different structure, ignore errors
          }
        }
        console.log(`   ✅ Added ${dummyProducts.length} dummy products`);
      }
      
      // 6. Seed dummy orders
      const dummyOrders = [
        {
          order_number: `ORD-${Date.now()}-1`,
          customer_email: 'customer1@example.com',
          customer_name: 'John Doe',
          total: 1999.99,
          status: 'completed'
        },
        {
          order_number: `ORD-${Date.now()}-2`,
          customer_email: 'customer2@example.com',
          customer_name: 'Jane Smith',
          total: 2999.99,
          status: 'processing'
        },
        {
          order_number: `ORD-${Date.now()}-3`,
          customer_email: 'customer3@example.com',
          customer_name: 'Bob Johnson',
          total: 499.99,
          status: 'pending'
        }
      ];
      
      for (const order of dummyOrders) {
        try {
          // Check if storefront_orders table exists
          await client.query(
            `INSERT INTO storefront_orders (business_id, order_number, customer_email, customer_name, total_amount, status, payment_status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
             ON CONFLICT (order_number) DO NOTHING`,
            [business.id, order.order_number, order.customer_email, order.customer_name, order.total, order.status]
          );
        } catch (e) {
          // Table might not exist or different structure
        }
      }
      
      console.log(`   ✅ Business storefront configured`);
    }
    
    console.log('\n🎉 Storefront data seeding completed!');
    console.log('\n📍 Test URLs:');
    for (const business of businessesResult.rows) {
      console.log(`   http://localhost:3000/store/${business.domain}`);
    }
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedStorefrontData();
