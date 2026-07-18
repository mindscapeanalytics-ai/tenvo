#!/usr/bin/env node
/**
 * Feed Ziglam beauty store: salon-spa category, curated nails catalog, hero + banners.
 *
 * Usage:
 *   npx tsx scripts/data-lab/feed-ziglam-beauty.mjs
 *   npx tsx scripts/data-lab/feed-ziglam-beauty.mjs --email zainab.gul9325@gmail.com --name ziglam
 *   npx tsx scripts/data-lab/feed-ziglam-beauty.mjs --dry-run
 *
 * Env: DATABASE_URL (.env / .env.local)
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool, withTransaction } from '../../lib/dataLab/pool.mjs';
import { seedCategories, seedProducts } from '../../lib/dataLab/catalogSeed.mjs';
import { buildDefaultJewelleryStorefrontSeed } from '../../lib/storefront/jewelleryStorefront.js';
import {
  ZIGLAM_BEAUTY_CATEGORIES,
  ZIGLAM_BEAUTY_MARKETING_IMAGES,
  ZIGLAM_BEAUTY_SEED_PRODUCTS,
} from '../../lib/dataLab/ziglamBeautyCatalog.js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

function parseArgs(argv) {
  const emailIdx = argv.indexOf('--email');
  const nameIdx = argv.indexOf('--name');
  const domainIdx = argv.indexOf('--domain');
  return {
    email: emailIdx >= 0 ? String(argv[emailIdx + 1] || '').trim().toLowerCase() : 'zainab.gul9325@gmail.com',
    nameHint: nameIdx >= 0 ? String(argv[nameIdx + 1] || '').trim().toLowerCase() : 'ziglam',
    domainHint: domainIdx >= 0 ? String(argv[domainIdx + 1] || '').trim().toLowerCase() : '',
    dryRun: argv.includes('--dry-run'),
  };
}

function buildHeroSlides(domain, images) {
  const base = `/store/${domain}`;
  const products = `${base}/products`;
  const slides = [
    {
      eyebrow: 'Ziglam Beauty',
      title: 'Nail Salon Quality, Done at Home',
      subtitle: 'Gel polish, press-ons, and kits curated for everyday glam.',
      image: images[0] || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Shop Polish & Gel',
      ctaHref: `${products}?category=polish`,
      rating: 4.9,
      ratingText: 'Loved by nail enthusiasts',
      promoTag: '21-Free',
    },
    {
      eyebrow: 'New arrivals',
      title: 'Press-Ons & Pedi Sets',
      subtitle: 'Salon finish in minutes — soft almonds, french tips, and beach nudes.',
      image: images[1] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Shop Press-Ons',
      ctaHref: `${products}?category=press-ons`,
      rating: 4.8,
      ratingText: 'At-home manicure favorites',
      promoTag: 'Press-Ons',
    },
    {
      eyebrow: 'Starter kits',
      title: 'Everything You Need for a Perfect Mani',
      subtitle: 'Lamps, top coats, gel systems, and care essentials in one shop.',
      image: images[2] || 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Shop Kits',
      ctaHref: `${products}?category=kits`,
      rating: 4.9,
      ratingText: 'Complete systems',
      promoTag: 'Kits',
    },
  ];
  return slides;
}

function buildPageSections(images) {
  const banners = [];
  const mid = images[3] || images[0];
  const foot = images[4] || images[1] || images[0];
  if (mid) {
    banners.push({
      id: 'ziglam-mid-nails',
      type: 'banner',
      placement: 'mid-page',
      designMode: 'image-only',
      heightPreset: 'standard',
      imageFit: 'cover',
      imageUrl: mid,
      href: '/products',
      active: true,
    });
  }
  if (foot) {
    banners.push({
      id: 'ziglam-footer-beauty',
      type: 'banner',
      placement: 'before-footer',
      designMode: 'image-only',
      heightPreset: 'compact',
      imageFit: 'cover',
      imageUrl: foot,
      href: '/products?category=kits',
      active: true,
    });
  }
  return banners;
}

async function resolveZiglamBusiness(client, opts) {
  const byEmail = await client.query(
    `SELECT b.id, b.business_name, b.domain, b.category, b.country, bs.settings
     FROM businesses b
     LEFT JOIN "user" u_owner ON u_owner.id = b.user_id
     LEFT JOIN business_users bu ON bu.business_id = b.id
     LEFT JOIN "user" u_member ON u_member.id = bu.user_id
     LEFT JOIN business_settings bs ON bs.business_id = b.id
     WHERE (
         LOWER(COALESCE(u_owner.email, '')) = $1
         OR LOWER(COALESCE(u_member.email, '')) = $1
         OR LOWER(COALESCE(b.email, '')) = $1
       )
       AND (
         LOWER(b.business_name) LIKE $2
         OR LOWER(COALESCE(b.domain, '')) LIKE $2
         OR LOWER(COALESCE(b.domain, '')) = $3
       )
     GROUP BY b.id, b.business_name, b.domain, b.category, b.country, bs.settings, b.created_at
     ORDER BY b.created_at DESC NULLS LAST
     LIMIT 5`,
    [opts.email, `%${opts.nameHint}%`, opts.domainHint || opts.nameHint]
  );

  if (byEmail.rows.length) return byEmail.rows[0];

  const loose = await client.query(
    `SELECT b.id, b.business_name, b.domain, b.category, b.country, bs.settings
     FROM businesses b
     LEFT JOIN "user" u_owner ON u_owner.id = b.user_id
     LEFT JOIN business_users bu ON bu.business_id = b.id
     LEFT JOIN "user" u_member ON u_member.id = bu.user_id
     LEFT JOIN business_settings bs ON bs.business_id = b.id
     WHERE LOWER(COALESCE(u_owner.email, '')) = $1
        OR LOWER(COALESCE(u_member.email, '')) = $1
        OR LOWER(COALESCE(b.email, '')) = $1
     GROUP BY b.id, b.business_name, b.domain, b.category, b.country, bs.settings, b.created_at
     ORDER BY b.created_at DESC NULLS LAST
     LIMIT 10`,
    [opts.email]
  );
  if (loose.rows.length === 1) return loose.rows[0];
  if (loose.rows.length > 1) {
    const named = loose.rows.find((r) => String(r.business_name || '').toLowerCase().includes(opts.nameHint));
    if (named) return named;
    console.error('Multiple businesses for owner; pass --name or --domain. Found:');
    for (const r of loose.rows) {
      console.error(`  - ${r.business_name} (${r.domain}) [${r.category}] ${r.id}`);
    }
    return null;
  }
  return null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!ZIGLAM_BEAUTY_SEED_PRODUCTS?.length) {
    throw new Error('Catalog empty — run: node scripts/build-nails-seed-catalog.mjs');
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const business = await resolveZiglamBusiness(client, opts);
    if (!business) {
      throw new Error(`Ziglam business not found for ${opts.email} / ${opts.nameHint}`);
    }

    console.log(`Found: ${business.business_name} <${business.domain}> category=${business.category} id=${business.id}`);
    console.log(`Catalog: ${ZIGLAM_BEAUTY_SEED_PRODUCTS.length} products, marketing images: ${ZIGLAM_BEAUTY_MARKETING_IMAGES.length}`);

    if (opts.dryRun) {
      console.log('Dry run — no writes.');
      return;
    }

    const domain = String(business.domain || 'ziglam').toLowerCase();
    const heroSlides = buildHeroSlides(domain, ZIGLAM_BEAUTY_MARKETING_IMAGES);
    const pageSections = buildPageSections(ZIGLAM_BEAUTY_MARKETING_IMAGES);
    const beautySeed = buildDefaultJewelleryStorefrontSeed('salon-spa');

    await withTransaction(client, async (tx) => {
      if (String(business.category || '') !== 'salon-spa') {
        await tx.query(`UPDATE businesses SET category = 'salon-spa', updated_at = NOW() WHERE id = $1::uuid`, [
          business.id,
        ]);
        console.log('Updated category → salon-spa');
      }

      await seedCategories(tx, business.id, ZIGLAM_BEAUTY_CATEGORIES, { refresh: true });
      const seeded = await seedProducts(tx, business.id, ZIGLAM_BEAUTY_SEED_PRODUCTS, { refresh: true });
      console.log(`Seeded products: ${seeded.length}`);

      const prev =
        business.settings && typeof business.settings === 'object' ? business.settings : {};
      const prevSf = prev.storefront && typeof prev.storefront === 'object' ? prev.storefront : {};
      const jewellery = {
        ...(beautySeed.jewellery || {}),
        ...(prevSf.jewellery && typeof prevSf.jewellery === 'object' ? prevSf.jewellery : {}),
        heroSlides,
        brands: [
          { id: 'ziglam', name: 'Ziglam', slug: 'ziglam' },
          { id: 'olive-june', name: 'Olive & June', slug: 'olive-june' },
          { id: 'best-nails', name: 'The Best Nails', slug: 'best-nails' },
        ],
        quickSearchTerms: ['Nail Polish', 'Gel Kit', 'Press-on Nails', 'Top Coat', 'Base Coat', 'Cuticle Serum'],
      };

      const patch = {
        storefront: {
          ...prevSf,
          jewellery,
          heroSlides,
        },
        pageSections,
      };

      await tx.query(
        `INSERT INTO business_settings (business_id, is_storefront_enabled, settings)
         VALUES ($1::uuid, true, $2::jsonb)
         ON CONFLICT (business_id) DO UPDATE SET
           is_storefront_enabled = true,
           settings = COALESCE(business_settings.settings, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()`,
        [business.id, JSON.stringify(patch)]
      );
    });

    const verify = await client.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE image_url IS NOT NULL AND TRIM(image_url) <> '')::int AS with_img,
         COUNT(*) FILTER (WHERE is_featured = true)::int AS featured
       FROM products
       WHERE business_id = $1::uuid
         AND (is_deleted = false OR is_deleted IS NULL)
         AND COALESCE(is_active, true) = true`,
      [business.id]
    );
    const v = verify.rows[0];
    console.log(`Verify active products: ${v.total} (with images: ${v.with_img}, featured: ${v.featured})`);
    console.log(`Storefront: /store/${domain}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
