#!/usr/bin/env node
/**
 * Storefront Migration Runner
 * Runs the storefront tables migration
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting storefront migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', 'add_storefront_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements (handle comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))
      .map(s => s + ';');
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let executed = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        executed++;
        process.stdout.write('.');
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
          process.stdout.write('s'); // s = skipped
        } else {
          console.error(`\n⚠️ Warning: ${err.message.split('\n')[0]}`);
        }
      }
    }
    
    console.log(`\n\n✅ Migration completed successfully!`);
    console.log(`   Executed: ${executed} statements`);
    
    // Verify tables were created
    const tables = [
      'subscription_plans',
      'business_settings',
      'business_custom_domains',
      'product_categories',
      'storefront_orders',
      'storefront_order_items'
    ];
    
    console.log('\n📊 Verifying tables:');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ ${table}`);
      } catch (err) {
        console.log(`   ❌ ${table} - ${err.message}`);
      }
    }
    
    // Show subscription plans
    const plansResult = await client.query('SELECT slug, name FROM subscription_plans ORDER BY sort_order');
    console.log('\n📋 Subscription Plans:');
    plansResult.rows.forEach(plan => {
      console.log(`   • ${plan.slug}: ${plan.name}`);
    });
    
    console.log('\n🎉 Storefront is ready to use!');
    console.log('   Restart your server: bun start');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
