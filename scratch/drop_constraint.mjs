import { pool } from '../lib/db.js';

async function main() {
  try {
    await pool.query('ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_business_id_slug_key;');
    console.log('Constraint dropped');
  } catch (e) {
    console.error('Error dropping constraint:', e);
  } finally {
    process.exit(0);
  }
}

main();
