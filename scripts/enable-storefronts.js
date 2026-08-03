#!/usr/bin/env node
/**
 * Enable storefront for all businesses
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function enableStorefronts() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Enabling storefront for all businesses...\n');
    
    // Enable storefront for all businesses
    await client.query(
      "UPDATE business_settings SET is_storefront_enabled = true, plan_tier = 'growth'"
    );
    
    // Update businesses to have all required fields
    await client.query(
      `UPDATE businesses SET
        description = COALESCE(description, business_name || ' - Your trusted partner for quality products.'),
        category = COALESCE(category, 'retail'),
        is_active = true,
        is_verified = true
      WHERE description IS NULL OR category IS NULL`
    );
    
    // Verify
    const result = await client.query(
      `SELECT b.domain, b.business_name, bs.plan_tier, bs.is_storefront_enabled
       FROM businesses b
       JOIN business_settings bs ON b.id = bs.business_id
       ORDER BY b.created_at DESC`
    );
    
    console.log('✅ Storefront status updated:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.domain}:`);
      console.log(`    - Name: ${row.business_name}`);
      console.log(`    - Plan: ${row.plan_tier}`);
      console.log(`    - Storefront: ${row.is_storefront_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`    - URL: http://localhost:3000/store/${row.domain}`);
      console.log();
    });
    
    console.log('🎉 All storefronts enabled!');
    console.log('\n📍 Test URLs:');
    result.rows.forEach(row => {
      console.log(`  http://localhost:3000/store/${row.domain}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

enableStorefronts();
