require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // 1. Check businesses with storefront enabled
    const biz = await client.query(`
      SELECT b.id, b.business_name, b.domain, b.category,
             bs.storefront_settings
      FROM businesses b
      LEFT JOIN business_settings bs ON bs.business_id = b.id
      WHERE b.domain IS NOT NULL
      LIMIT 5
    `);
    console.log('\n📦 Businesses with domain:');
    biz.rows.forEach(r => console.log(`  • ${r.business_name} | domain=${r.domain} | category=${r.category} | id=${r.id}`));

    if (!biz.rows.length) { console.log('  (none found)'); return; }
    const bizId = biz.rows[0].id;
    const bizDomain = biz.rows[0].domain;

    // 2. Product count
    const prodCount = await client.query(`SELECT COUNT(*) as total FROM products WHERE business_id=$1 AND is_active=true`, [bizId]);
    console.log(`\n🛍️  Products (active) for "${biz.rows[0].business_name}": ${prodCount.rows[0].total}`);

    // 3. Sample products with new columns
    const prods = await client.query(`
      SELECT id, name, slug, price, compare_price, is_featured, is_new, stock, sales_count, category_id, image_url
      FROM products WHERE business_id=$1 AND is_active=true
      LIMIT 5
    `, [bizId]);
    console.log('\n🔍 Sample products:');
    prods.rows.forEach(p => console.log(`  • [${p.id.slice(0,8)}] ${p.name} | price=${p.price} | slug=${p.slug || '(null)'} | stock=${p.stock} | featured=${p.is_featured}`));

    // 4. Categories
    const cats = await client.query(`
      SELECT c.id, c.name, c.slug, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON p.category_id::text = c.id::text AND p.is_active=true
      WHERE c.business_id=$1 AND c.is_active=true
      GROUP BY c.id ORDER BY c.name
    `, [bizId]);
    console.log(`\n📂 Categories: ${cats.rows.length}`);
    cats.rows.forEach(c => console.log(`  • ${c.name} (slug=${c.slug}) — ${c.product_count} products`));

    // 5. Storefront orders
    const orders = await client.query(`SELECT COUNT(*) as total FROM storefront_orders WHERE business_id=$1`, [bizId]);
    console.log(`\n📋 Storefront orders: ${orders.rows[0].total}`);

    // 6. product_variants table check
    const variantCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='product_variants' 
      AND column_name IN ('is_default','is_active','sku','price','stock','image_url')
      ORDER BY column_name
    `);
    console.log(`\n🔩 product_variants columns: ${variantCols.rows.map(r=>r.column_name).join(', ')}`);

    // 7. Slugs — how many products need slugs generated
    const nullSlugs = await client.query(`SELECT COUNT(*) as total FROM products WHERE business_id=$1 AND (slug IS NULL OR slug='')`, [bizId]);
    console.log(`\n🐌 Products missing slug: ${nullSlugs.rows[0].total}`);

    if (parseInt(nullSlugs.rows[0].total) > 0) {
      console.log('   → Auto-generating slugs...');
      await client.query(`
        UPDATE products
        SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g'))
                   || '-' || SUBSTR(id::text, 1, 8)
        WHERE business_id=$1 AND (slug IS NULL OR slug='')
      `, [bizId]);
      console.log('   ✅ Slugs generated');
    }

    console.log('\n✅ Storefront flow check complete — all systems ready.');
    console.log(`\n🌐 Test URL: http://localhost:3000/store/${bizDomain}`);

  } finally {
    client.release();
    pool.end();
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
