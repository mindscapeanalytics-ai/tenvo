/**
 * sync-categories-from-products.js
 *
 * For every business that has products using the free-text `products.category`
 * column but NO matching rows in `product_categories`:
 *   1. Creates a `product_categories` row for each distinct category text value.
 *   2. Back-fills `products.category_id` to point at the new rows.
 *
 * Safe to run multiple times — skips businesses that already have categories.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Businesses that have products with category text but no category_id
    const bizResult = await client.query(`
      SELECT DISTINCT p.business_id
      FROM products p
      WHERE p.category IS NOT NULL
        AND p.category != ''
        AND p.category_id IS NULL
        AND p.is_active = true
    `);

    const businesses = bizResult.rows.map(r => r.business_id);
    console.log(`\n🔍 Found ${businesses.length} businesses needing category sync`);

    let totalCatsCreated = 0;
    let totalProductsLinked = 0;

    for (const bizId of businesses) {
      // Get distinct category names for this business
      const catsResult = await client.query(`
        SELECT DISTINCT TRIM(category) as cat_name
        FROM products
        WHERE business_id = $1
          AND category IS NOT NULL
          AND category != ''
          AND is_active = true
        ORDER BY cat_name
      `, [bizId]);

      console.log(`\n  Business ${bizId.slice(0, 8)}: ${catsResult.rows.length} distinct categories`);

      for (const { cat_name } of catsResult.rows) {
        const slug = toSlug(cat_name);

        // Upsert category row
        const upsert = await client.query(`
          INSERT INTO product_categories (business_id, name, slug, is_active, sort_order)
          VALUES ($1, $2, $3, true, 0)
          ON CONFLICT (business_id, slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [bizId, cat_name, slug]);

        const categoryId = upsert.rows[0].id;
        totalCatsCreated++;

        // Link products to this category
        const update = await client.query(`
          UPDATE products
          SET category_id = $1
          WHERE business_id = $2
            AND TRIM(category) = $3
            AND category_id IS NULL
        `, [categoryId, bizId, cat_name]);

        totalProductsLinked += update.rowCount;
        console.log(`    ✓ "${cat_name}" (id=${categoryId}) → linked ${update.rowCount} products`);
      }
    }

    await client.query('COMMIT');

    console.log(`\n✅ Done!`);
    console.log(`   Categories created/updated : ${totalCatsCreated}`);
    console.log(`   Products linked to category: ${totalProductsLinked}`);

    // Final verification
    const verify = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE category_id IS NOT NULL) as linked,
        COUNT(*) FILTER (WHERE category_id IS NULL AND category IS NOT NULL AND category != '') as still_unlinked,
        COUNT(*) as total
      FROM products WHERE is_active = true
    `);
    const v = verify.rows[0];
    console.log(`\n📊 Final: linked=${v.linked} | still_unlinked=${v.still_unlinked} | total=${v.total}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error (rolled back):', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
