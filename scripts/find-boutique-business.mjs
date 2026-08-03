import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const r = await pool.query(`
  SELECT id, business_name, domain, category, 
         (SELECT COUNT(*) FROM storefront_orders WHERE business_id = businesses.id) as sf_orders,
         (SELECT COUNT(*) FROM invoices WHERE business_id = businesses.id AND is_deleted = false) as invoices
  FROM businesses 
  WHERE business_name LIKE '%Boutique%' 
     OR domain LIKE '%boutique%'
     OR business_name LIKE '%Fashion%'
     OR domain LIKE '%fashion%'
  ORDER BY created_at DESC
`);

console.log('Found businesses:');
r.rows.forEach(b => {
  console.log(`\n${b.business_name} (${b.domain})`);
  console.log(`  ID: ${b.id}`);
  console.log(`  Category: ${b.category}`);
  console.log(`  Storefront Orders: ${b.sf_orders}`);
  console.log(`  Invoices: ${b.invoices}`);
});

await pool.end();
