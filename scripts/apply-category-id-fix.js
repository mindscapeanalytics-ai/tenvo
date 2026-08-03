require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    const sql = await fs.readFile(path.join(__dirname, '../lib/db/migrations/fix_category_id_type.sql'), 'utf8');
    console.log('⏳ Fixing products.category_id type...');
    await client.query(sql);
    console.log('✅ Done');
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
run();
