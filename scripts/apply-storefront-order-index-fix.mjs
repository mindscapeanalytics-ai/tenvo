import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      for (const line of text.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* ignore */
    }
  }
}

loadEnv();

const sql = fs.readFileSync(
  path.join(__dirname, '../prisma/migrations/20260705_drop_storefront_order_number_global_index/migration.sql'),
  'utf8'
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const client = await pool.connect();

try {
  await client.query(sql);

  const indexes = await client.query(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'storefront_orders' AND indexdef ILIKE '%order_number%'
  `);
  console.log('Applied migration. order_number indexes:');
  for (const row of indexes.rows) {
    console.log(`  ${row.indexname}: ${row.indexdef}`);
  }

  const hasGlobal = indexes.rows.some(
    (r) => r.indexdef.includes('(order_number)') && !r.indexdef.includes('business_id')
  );
  if (hasGlobal) {
    console.error('FAILED: global order_number unique index still present');
    process.exit(1);
  }
  console.log('OK: no global order_number unique index');
} finally {
  client.release();
  await pool.end();
}
