require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const EXPECTED = ['slug','compare_price','is_featured','is_new','sales_count','stock_status','images','has_variants','rating','review_count','enable_reviews'];

pool.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' AND column_name = ANY($1) ORDER BY column_name`,
  [EXPECTED]
).then(r => {
  const found = r.rows.map(c => c.column_name);
  const missing = EXPECTED.filter(c => !found.includes(c));
  console.log('\n✅ Found columns:', found.join(', '));
  if (missing.length) console.log('❌ Missing columns:', missing.join(', '));
  else console.log('🎉 All required storefront columns are present!');

  // Also check product_reviews and product_specifications tables
  return pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name IN ('product_reviews','product_specifications') ORDER BY table_name`);
}).then(r => {
  console.log('📋 Extra tables:', r.rows.map(t => t.table_name).join(', ') || 'none found');
  pool.end();
}).catch(e => { console.error('Error:', e.message); pool.end(); });
