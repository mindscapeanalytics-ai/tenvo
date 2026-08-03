/**
 * Smoke: demo-marine exists with marine-parts catalog + hero wiring.
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../../lib/dataLab/pool.mjs';
import { getDomainKnowledge } from '../../lib/domainKnowledge.js';
import { isMarinePartsStore } from '../../lib/storefront/marineParts.js';
import { getHeroPreset } from '../../lib/storefront/heroPresets.js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const k = getDomainKnowledge('marine-parts');
if (!k?.fieldConfig?.partnumber) throw new Error('missing marine fieldConfig');
if (!k.serialTrackingEnabled || !k.batchTrackingEnabled) throw new Error('tracking flags');
if (!isMarinePartsStore('ships-parts')) throw new Error('alias store gate');

const preset = getHeroPreset('marine-parts', 'demo-marine', {}, { name: 'Tenvo Marine', category: 'marine-parts' });
if (preset?.type !== 'marine-parts-finder') {
  throw new Error(`hero type expected marine-parts-finder got ${preset?.type}`);
}

const pool = createPool();
try {
  const r = await pool.query(`
    SELECT b.business_name, b.category, b.domain, COALESCE(bs.is_storefront_enabled, true) AS storefront_on,
      (SELECT count(*)::int FROM products p WHERE p.business_id = b.id AND COALESCE(p.is_active, true) = true) AS products
    FROM businesses b
    LEFT JOIN business_settings bs ON bs.business_id = b.id
    WHERE b.domain = 'demo-marine'
  `);
  if (!r.rows[0]) throw new Error('demo-marine business missing');
  if (r.rows[0].category !== 'marine-parts') throw new Error(`bad category ${r.rows[0].category}`);
  if (Number(r.rows[0].products) < 50) throw new Error(`too few products ${r.rows[0].products}`);

  const sample = await pool.query(`
    SELECT p.sku, p.domain_data->>'equipmenttype' AS equipmenttype, p.domain_data->>'partnumber' AS partnumber
    FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.domain = 'demo-marine' AND COALESCE(p.is_active, true) = true
    LIMIT 1
  `);
  if (!sample.rows[0]?.partnumber) throw new Error('sample missing partnumber domain_data');

  console.log('OK smoke demo-marine', {
    name: r.rows[0].business_name,
    products: r.rows[0].products,
    hero: preset.type,
    sampleSku: sample.rows[0].sku,
  });
} finally {
  await pool.end();
}
