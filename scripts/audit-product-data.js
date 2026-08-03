require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Check all businesses with products and their price fields
    const prods = await client.query(`
      SELECT id, name, price, cost_price, mrp, compare_price, stock, category, category_id,
             slug, is_active, image_url
      FROM products
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log('\n📊 Product price/category audit (latest 20):');
    console.log('─'.repeat(90));
    prods.rows.forEach(p => {
      console.log(`  ${p.name.substring(0,30).padEnd(32)} price=${String(p.price).padEnd(8)} mrp=${String(p.mrp||'').padEnd(8)} cost=${String(p.cost_price||'').padEnd(8)} stock=${String(p.stock).padEnd(5)} cat=${p.category||'(none)'} cat_id=${p.category_id||'(none)'}`);
    });

    // Check what categories each business has in product_categories
    const bizCats = await client.query(`
      SELECT b.business_name, b.id as biz_id, COUNT(pc.id) as cat_count
      FROM businesses b
      LEFT JOIN product_categories pc ON pc.business_id = b.id
      WHERE b.domain IS NOT NULL
      GROUP BY b.id ORDER BY cat_count DESC
      LIMIT 10
    `);
    console.log('\n📂 Category counts per business:');
    bizCats.rows.forEach(r => console.log(`  • ${r.business_name}: ${r.cat_count} categories`));

    // Check products.category (text) vs products.category_id (uuid) usage
    const catStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE category IS NOT NULL AND category != '') as has_category_text,
        COUNT(*) FILTER (WHERE category_id IS NOT NULL) as has_category_id,
        COUNT(*) FILTER (WHERE category IS NULL AND category_id IS NULL) as has_neither,
        COUNT(*) as total
      FROM products WHERE is_active=true
    `);
    console.log('\n🔗 Category linkage stats (all products):');
    const cs = catStats.rows[0];
    console.log(`  has category text: ${cs.has_category_text}, has category_id: ${cs.has_category_id}, has neither: ${cs.has_neither}, total: ${cs.total}`);

    // Check price distribution
    const priceStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE price > 0) as nonzero_price,
        COUNT(*) FILTER (WHERE price = 0) as zero_price,
        COUNT(*) FILTER (WHERE mrp > 0) as nonzero_mrp,
        COUNT(*) FILTER (WHERE cost_price > 0) as nonzero_cost,
        COUNT(*) as total
      FROM products WHERE is_active=true
    `);
    console.log('\n💰 Price stats (all active products):');
    const ps = priceStats.rows[0];
    console.log(`  price>0: ${ps.nonzero_price}, price=0: ${ps.zero_price}, mrp>0: ${ps.nonzero_mrp}, cost>0: ${ps.nonzero_cost}, total: ${ps.total}`);

    // Distinct category text values
    const catTexts = await client.query(`
      SELECT DISTINCT category, COUNT(*) as cnt
      FROM products WHERE category IS NOT NULL AND category != '' AND is_active=true
      GROUP BY category ORDER BY cnt DESC LIMIT 20
    `);
    console.log('\n🏷️  Distinct category text values (top 20):');
    catTexts.rows.forEach(r => console.log(`  • "${r.category}" — ${r.cnt} products`));

  } finally {
    client.release();
    pool.end();
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
