#!/usr/bin/env node
/**
 * Run all pending migrations
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrations = [
  { name: 'Business Storefront Columns', file: 'add_business_storefront_columns.sql' },
  { name: 'Fix Business Settings', file: 'fix_business_settings.sql' },
  { name: 'Notifications System', file: 'add_notifications_system.sql' },
  { name: 'API Usage Logs', file: 'add_api_usage_logs.sql' },
  { name: 'Business Members', file: 'add_business_members.sql' },
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running all migrations...\n');
    
    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', 'lib', 'db', 'migrations', migration.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${migration.name} - file not found`);
        continue;
      }
      
      console.log(`📦 Running: ${migration.name}`);
      
      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`   ✅ ${migration.name} completed\n`);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
          console.log(`   ⏭️  ${migration.name} - already applied\n`);
        } else {
          console.error(`   ❌ ${migration.name} failed:`, err.message.split('\n')[0], '\n');
        }
      }
    }
    
    console.log('🎉 All migrations completed!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigrations();
