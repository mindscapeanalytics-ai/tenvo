#!/usr/bin/env node
/**
 * Storefront Migration Runner - Simple Version
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running storefront migration...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', 'add_storefront_tables_v3.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute entire SQL as one transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed!\n');
    
    // Verify
    const tables = ['subscription_plans', 'business_settings', 'business_custom_domains', 'product_categories', 'storefront_orders', 'storefront_order_items'];
    
    console.log('📊 Table Status:');
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `, [table]);
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }
    
    // Check subscription plans
    const plans = await client.query('SELECT name FROM subscription_plans ORDER BY sort_order');
    console.log('\n📋 Plans created:', plans.rows.map(p => p.name).join(', '));
    
    // Check business settings count
    const settings = await client.query('SELECT COUNT(*) as count FROM business_settings');
    console.log(`📋 Business settings: ${settings.rows[0].count} records`);
    
    console.log('\n🎉 Storefront is ready! Run: bun start');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
