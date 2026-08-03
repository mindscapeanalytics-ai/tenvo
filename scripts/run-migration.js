#!/usr/bin/env node
/**
 * Migration Runner - Execute SQL migrations directly
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL or DIRECT_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to database');
    
    // Read the specific migration file
    const migrationFile = path.join(__dirname, '..', 'lib', 'db', 'migrations', 'EXECUTE_THIS_IN_SUPABASE.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📄 Executing migration...');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Tables created/updated:');
    console.log('  - inventory_stock (with RLS, indexes, triggers)');
    console.log('  - payments.is_deleted column added');
    console.log('');
    console.log('🚀 Your invoice system is now ready!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some objects may already exist - this is okay');
    } else {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
