#!/usr/bin/env node
/**
 * Apply Storefront Product Columns Migration
 * Adds missing columns to products table needed for the public storefront.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */

// Load .env from project root
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in environment');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const sqlPath = path.join(__dirname, '../lib/db/migrations/add_storefront_product_columns.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('⏳ Applying storefront product columns migration...');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('✅ Migration applied successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
