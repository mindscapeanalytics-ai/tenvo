#!/usr/bin/env node
/**
 * Verify fashion demo stores have persisted Gul section seed + resolvable tiles.
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../lib/dataLab/pool.mjs';
import { resolveFashionHomeEdit, resolveFashionSaleMosaic } from '../lib/storefront/fashionGulSections.js';
import { getFashionEditorialConfig } from '../lib/storefront/fashionEditorial.js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const DOMAINS = ['demo-boutique', 'demo-textile', 'demo-jewellery', 'demo-footwear'];
const errors = [];

const pool = createPool();
const client = await pool.connect();
try {
  const r = await client.query(
    `
    SELECT b.domain, b.category, bs.settings,
      (SELECT COUNT(*)::int FROM products p
       WHERE p.business_id = b.id AND (p.is_deleted = false OR p.is_deleted IS NULL)) AS products
    FROM businesses b
    LEFT JOIN business_settings bs ON bs.business_id = b.id
    WHERE LOWER(b.domain) = ANY($1::text[])
    ORDER BY b.domain
    `,
    [DOMAINS.map((d) => d.toLowerCase())]
  );

  for (const row of r.rows) {
    const settings = row.settings || {};
    const cfg = getFashionEditorialConfig(settings, row.domain);
    const storeBase = `/store/${row.domain}`;
    const homeEdit = resolveFashionHomeEdit(settings, row.category, row.domain, storeBase);
    const saleMosaic = resolveFashionSaleMosaic(settings, row.category, row.domain, storeBase);
    const dbTiles = settings?.storefront?.fashion?.homeEdit?.tiles?.length ?? 0;
    const dbColumns = settings?.storefront?.fashion?.saleMosaic?.columns?.length ?? 0;

    console.log(`${row.domain} (${row.category}) — ${row.products} products`);
    console.log(`  DB tiles: ${dbTiles}, columns: ${dbColumns}`);
    console.log(`  Resolved tiles: ${homeEdit?.tiles?.length ?? 0}, columns: ${saleMosaic?.columns?.length ?? 0}`);

    if (Number(row.products) < 12 && row.domain === 'demo-boutique') {
      errors.push(`${row.domain}: expected at least 12 products, got ${row.products}`);
    }
    if (!homeEdit?.tiles?.length) errors.push(`${row.domain}: home edit has no tiles`);
    if (!saleMosaic?.columns?.length) errors.push(`${row.domain}: sale mosaic has no columns`);
    if (row.domain === 'demo-boutique' && dbTiles < 4) {
      errors.push(`${row.domain}: expected persisted homeEdit tiles in DB`);
    }
  }
} finally {
  client.release();
  await pool.end();
}

if (errors.length) {
  console.error('\n❌ Fashion demo seed verification failed:');
  errors.forEach((e) => console.error(`   • ${e}`));
  process.exit(1);
}

console.log('\n✅ Fashion demo seed verification passed');
