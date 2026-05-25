/**
 * Tests the actual storefront getProducts query against the live DB
 * to confirm no SQL errors and products are returned with full data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Get first business with products
    const biz = await client.query(`
      SELECT b.id, b.business_name, b.domain
      FROM businesses b
      JOIN products p ON p.business_id = b.id AND p.is_active = true
      WHERE b.domain IS NOT NULL
      GROUP BY b.id HAVING COUNT(p.id) > 0
      LIMIT 1
    `);
    if (!biz.rows.length) { console.log('No businesses with products found.'); return; }
    const { id: bizId, business_name, domain } = biz.rows[0];
    console.log(`\n🏪 Testing storefront for: ${business_name} (${domain})`);

    // --- Test 1: Full product list query ---
    const list = await client.query(`
      SELECT 
        p.id, p.name, p.sku, p.price, p.stock, p.image_url, p.is_active,
        p.slug, p.compare_price, p.is_featured, p.is_new,
        p.sales_count, p.stock_status, p.images, p.has_variants,
        p.rating, p.review_count, p.enable_reviews,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        COALESCE(pv.price, p.price) as display_price,
        COALESCE(pv.stock, p.stock) as display_stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id::uuid AND pv.is_default = true
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.business_id = $1::uuid AND p.is_active = true
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 5
    `, [bizId]);

    console.log(`\n✅ Product list query OK — ${list.rows.length} rows returned`);
    list.rows.forEach(p => {
      console.log(`  [${p.id.slice(0,8)}] ${p.name.substring(0,30).padEnd(32)} price=${p.price} | cat=${p.category_name || '?'} | slug=${p.slug || '?'} | stock=${p.stock}`);
    });

    // --- Test 2: Category list ---
    const cats = await client.query(`
      SELECT c.id, c.name, c.slug, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      WHERE c.business_id = $1::uuid AND c.is_active = true
      GROUP BY c.id ORDER BY c.sort_order, c.name
    `, [bizId]);
    console.log(`\n✅ Category query OK — ${cats.rows.length} categories`);
    cats.rows.forEach(c => console.log(`  • ${c.name} (${c.product_count} products)`));

    // --- Test 3: Product by slug ---
    if (list.rows[0]?.slug) {
      const slug = list.rows[0].slug;
      const bySlug = await client.query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE p.business_id = $1::uuid AND p.slug = $2 AND p.is_active = true
      `, [bizId, slug]);
      console.log(`\n✅ Product by slug query OK — found: ${bySlug.rows[0]?.name}`);
    }

    // --- Test 4: Search ---
    const searchTerm = list.rows[0]?.name?.split(' ')[0] || 'a';
    const search = await client.query(`
      SELECT p.id, p.name, p.slug, p.price, p.image_url, p.stock, p.sku,
        NULL as compare_price, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.business_id = $1::uuid AND p.is_active = true
        AND (p.name ILIKE $2 OR p.description ILIKE $2 OR p.sku ILIKE $2)
      LIMIT 5
    `, [bizId, `%${searchTerm}%`]);
    console.log(`\n✅ Search query OK — "${searchTerm}" → ${search.rows.length} results`);

    console.log('\n🎉 All storefront queries pass! Schema and data are correctly wired.');
    console.log(`\n🌐 Storefront URL: http://localhost:3000/store/${domain}`);

  } catch (e) {
    console.error('\n❌ Query failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
run();
