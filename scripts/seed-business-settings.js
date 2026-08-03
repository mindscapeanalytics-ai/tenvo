#!/usr/bin/env node
/**
 * Seed Business Settings for Existing Businesses
 * Note: business_id is UUID type
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding business settings...\n');
    
    // Insert default settings for businesses that don't have them
    const result = await client.query(`
      INSERT INTO business_settings (business_id, plan_tier, settings, storefront_settings)
      SELECT 
        b.id, 
        'free',
        '{"currency": "PKR", "timezone": "Asia/Karachi"}',
        '{"enabled": true}'
      FROM businesses b
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE bs.id IS NULL AND b.is_active = true
      RETURNING business_id
    `);
    
    console.log(`✅ Created settings for ${result.rows.length} businesses`);
    
    // Show total count
    const count = await client.query('SELECT COUNT(*) as total FROM business_settings');
    console.log(`📊 Total business settings: ${count.rows[0].total}`);
    
    // Show sample
    const sample = await client.query(`
      SELECT bs.business_id, b.business_name, bs.plan_tier 
      FROM business_settings bs
      JOIN businesses b ON bs.business_id = b.id
      LIMIT 5
    `);
    
    if (sample.rows.length > 0) {
      console.log('\n📋 Sample records:');
      sample.rows.forEach(row => {
        console.log(`   • ${row.business_name} (ID: ${row.business_id}) - ${row.plan_tier} plan`);
      });
    }
    
    console.log('\n✅ Seeding complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
