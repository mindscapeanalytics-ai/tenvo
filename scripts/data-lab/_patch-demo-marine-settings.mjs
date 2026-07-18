/**
 * Patch demo-marine storefront.marine with looping hero video + section defaults.
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../../lib/dataLab/pool.mjs';
import {
  MARINE_HERO_VIDEO_URL,
  MARINE_HERO_POSTER,
  MARINE_DEFAULT_SLIDES,
} from '../../lib/storefront/marinePartsArchiveMap.js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const marinePatch = {
  showFinder: true,
  showKpis: true,
  showExpertise: true,
  showEquipmentGrid: true,
  showStayAhead: true,
  showInsights: true,
  showFeaturedRails: true,
  showSpareRail: true,
  showBottomCta: true,
  showMarketingBanners: true,
  heroVideoUrl: MARINE_HERO_VIDEO_URL,
  heroPosterUrl: MARINE_HERO_POSTER,
  heroEyebrow: 'Tenvo Marine',
  heroTitle: 'Shaping reliable power at sea',
  heroSubtitle:
    'Find thrusters, rudder propellers, seals, and lifecycle spare parts by part number, OEM, or equipment type.',
  heroCtaLabel: 'Browse catalogue',
  slides: MARINE_DEFAULT_SLIDES,
};

const pool = createPool();
try {
  const row = await pool.query(
    `SELECT bs.settings
     FROM businesses b
     JOIN business_settings bs ON bs.business_id = b.id
     WHERE b.domain = 'demo-marine'
     LIMIT 1`
  );
  if (!row.rows[0]) throw new Error('demo-marine settings row missing');

  let settings = row.rows[0].settings;
  if (typeof settings === 'string') settings = JSON.parse(settings);
  if (!settings || typeof settings !== 'object') settings = {};

  settings.storefront = {
    ...(settings.storefront || {}),
    marine: {
      ...(settings.storefront?.marine || {}),
      ...marinePatch,
    },
    heroTitle: settings.storefront?.heroTitle || 'Tenvo Marine',
  };
  if (!settings.brand) settings.brand = { primaryColor: '#002d54' };
  else if (!settings.brand.primaryColor) settings.brand.primaryColor = '#002d54';

  await pool.query(
    `UPDATE business_settings bs
     SET settings = $1::jsonb, updated_at = NOW()
     FROM businesses b
     WHERE bs.business_id = b.id AND b.domain = 'demo-marine'`,
    [JSON.stringify(settings)]
  );

  console.log('OK patched demo-marine marine heroVideoUrl + sections');
} finally {
  await pool.end();
}
