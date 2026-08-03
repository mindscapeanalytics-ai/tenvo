const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkColumns() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'businesses' ORDER BY ordinal_position"
    );
    console.log('✅ Business table columns:');
    result.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    // Check business_settings
    const bsResult = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'business_settings' ORDER BY ordinal_position"
    );
    console.log('\n✅ Business settings table columns:');
    bsResult.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    // Check data
    const dataResult = await client.query(
      "SELECT domain, description, is_active, is_verified FROM businesses LIMIT 5"
    );
    console.log('\n✅ Sample businesses:');
    dataResult.rows.forEach(row => console.log(`  - ${row.domain}: ${row.description?.substring(0, 50)}... (active:${row.is_active}, verified:${row.is_verified})`));
    
    // Check business_settings data
    const bsDataResult = await client.query(
      "SELECT b.domain, bs.plan_tier, bs.is_storefront_enabled FROM businesses b JOIN business_settings bs ON b.id = bs.business_id LIMIT 5"
    );
    console.log('\n✅ Sample business settings:');
    bsDataResult.rows.forEach(row => console.log(`  - ${row.domain}: plan=${row.plan_tier}, storefront=${row.is_storefront_enabled}`));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkColumns();
