#!/usr/bin/env node
/**
 * Extract "The Home Edit" + "Sale" mosaic blocks from scripts/gulahmed.html
 * Run: node scripts/build-fashion-gul-sections.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(root, 'scripts/gulahmed.html');
const outPath = path.join(root, 'lib/dataLab/fashionGulAhmedSections.js');

const html = fs.readFileSync(htmlPath, 'utf8');

function toHttps(url) {
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
}

function pickImg(block) {
  const m = block.match(/data-srcset="([^"]+)"/) || block.match(/src="([^"]+)"/);
  if (!m) return '';
  const first = m[1].split(',')[0].trim().split(/\s+/)[0];
  return toHttps(first);
}

function pickHref(block) {
  const m = block.match(/href="(\/collections\/[^"]+)"/);
  return m ? m[1].replace('/collections/', '?category=') : '/products?onSale=true';
}

function pickSpan(block, className) {
  const re = new RegExp(`class="${className}"[^>]*><span>([^<]+)</span>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

// ── Home Edit ────────────────────────────────────────────────────────────────
const homeBlock = html.match(
  /The Home Edit[\s\S]*?customImageBanner--largeImg[\s\S]*?customImageBanner-row[\s\S]*?<\/div><\/div><\/div><\/div>/i
);

/** @type {object} */
const homeEdit = {
  title: 'The Home Edit',
  subtitle:
    'Elevate everyday living with premium linens, essentials & home accessories- crafted for comfort, style and home harmony',
  viewAllHref: '?category=home',
  tiles: [],
};

if (homeBlock) {
  const chunk = homeBlock[0];
  const large = chunk.match(/customImageBanner--largeImg[\s\S]*?(?=customImageBanner--smallImg)/i)?.[0] || '';
  const small = chunk.match(/customImageBanner--smallImg[\s\S]*/i)?.[0] || '';

  homeEdit.tiles.push({
    id: 'bedding-hero',
    slot: 'hero',
    eyebrow: pickSpan(large, 'sub_title custom-text-style') || 'Ideas Home Bedding',
    title: 'Create a home that feels soft, welcoming, and full of love.',
    ctaLabel: 'Explore',
    href: pickHref(large) || '?category=bedding',
    image: pickImg(large),
  });

  const smallItems = [...small.matchAll(/customImageBanner-item content_absolute[\s\S]*?(?=customImageBanner-item|$)/gi)];
  const slots = ['banner', 'half-left', 'half-right'];
  smallItems.slice(0, 3).forEach((match, i) => {
    const block = match[0];
    const titleMatch = block.match(/class="link_title"><span>([^<]+)<\/span>/);
    homeEdit.tiles.push({
      id: ['bedding-basics', 'bath-linen', 'plates-platters'][i],
      slot: slots[i],
      eyebrow: pickSpan(block, 'sub_title custom-text-style') || ['Bedding Basics', 'Bath Linen', 'Plates & platters'][i],
      title: titleMatch ? titleMatch[1].trim() : '',
      ctaLabel: 'Explore',
      href: pickHref(block) || '?category=home',
      image: pickImg(block),
    });
  });
}

// ── Sale mosaic (desktop) ────────────────────────────────────────────────────
const saleLabels = {
  'sale-kids': 'Kids',
  'sale-ideas-pret-ready-to-wear': 'Ready to Wear',
  'sale-home': 'Ideas Home',
  'sale-salt': 'Salt by Ideas',
  'sale-unstitched': "Women's Unstitched",
  'sale-men': 'Men Eastern',
  'sale-accessories': 'Shoes & Bags',
};

const saleImages = {
  kids: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-kids-wb_575aaa29-01e7-45d7-b55f-bfa772be5b57.webp?v=1780487677&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-kids-mb_1f261ed6-bd44-4e0d-a00e-d3ec530c452f.webp?v=1780487926&width=750',
  },
  rtw: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-rtw-wb_b56e926a-3968-42da-bfec-fa65986f983a.webp?v=1780487677&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-rtw-mb_c5d1594a-b1c4-4fc7-b6be-da0d0e8b3693.webp?v=1780487926&width=750',
  },
  home: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-home-wb_743e6659-4f93-40bd-ae7a-6218e5bcb124.webp?v=1780487677&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-home-mb_e44d07b1-4906-4ce9-bcea-ff36ab3bcf57.webp?v=1780487926&width=750',
  },
  salt: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-salt-wb_9b8ab626-6261-4baf-a36d-0b40b2e5578d.webp?v=1780487677&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-sale-mb.webp?v=1780487926&width=750',
  },
  unstitched: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-unstitched-wb.webp?v=1780487678&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-unstitched-mb.webp?v=1780487926&width=750',
  },
  men: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-men-eastern.webp?v=1780487677&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-eastern-mb.webp?v=1780487926&width=750',
  },
  shoes: {
    desktop: 'https://www.gulahmedshop.com/cdn/shop/files/sale-shoes-bags-wb.webp?v=1780487678&width=1000',
    mobile: 'https://www.gulahmedshop.com/cdn/shop/files/sale-shoes-bags-mb.webp?v=1780487926&width=750',
  },
};

const saleMosaic = {
  title: 'Sale',
  columns: [
    { id: 'col-kids', tiles: [{ id: 'kids', label: 'Kids', href: '?category=kids&onSale=true', ...saleImages.kids }] },
    {
      id: 'col-rtw-home',
      tiles: [
        { id: 'rtw', label: 'Ready to Wear', href: '?sort=newest&onSale=true', ...saleImages.rtw },
        { id: 'home', label: 'Ideas Home', href: '?category=home&onSale=true', ...saleImages.home },
      ],
    },
    { id: 'col-salt', tiles: [{ id: 'salt', label: 'Salt by Ideas', href: '?category=pret&onSale=true', ...saleImages.salt }] },
    {
      id: 'col-unstitched-men',
      tiles: [
        { id: 'unstitched', label: "Women's Unstitched", href: '?category=unstitched&onSale=true', ...saleImages.unstitched },
        { id: 'men', label: 'Men Eastern', href: '?category=eastern-wear&onSale=true', ...saleImages.men },
      ],
    },
    { id: 'col-shoes', tiles: [{ id: 'shoes', label: 'Shoes & Bags', href: '?category=accessories&onSale=true', ...saleImages.shoes }] },
  ],
};

const jewelleryHomeEdit = {
  title: 'The Jewellery Edit',
  subtitle: 'Timeless gold, diamonds, and bridal sets crafted for every milestone.',
  viewAllHref: '?category=gold',
  tiles: [
    {
      id: 'gold-hero',
      slot: 'hero',
      eyebrow: 'Fine gold',
      title: 'Celebrate every occasion with hallmarked purity.',
      ctaLabel: 'Explore',
      href: '?category=gold',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=82&auto=format&fit=crop',
    },
    {
      id: 'diamonds',
      slot: 'banner',
      eyebrow: 'Diamonds',
      title: 'Brilliance that lasts generations',
      ctaLabel: 'Explore',
      href: '?category=diamonds',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=82&auto=format&fit=crop',
    },
    {
      id: 'bridal',
      slot: 'half-left',
      eyebrow: 'Bridal',
      ctaLabel: 'Explore',
      href: '?category=bridal',
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=82&auto=format&fit=crop',
    },
    {
      id: 'gifts',
      slot: 'half-right',
      eyebrow: 'Gifts',
      ctaLabel: 'Explore',
      href: '?sort=featured',
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=82&auto=format&fit=crop',
    },
  ],
};

const jewellerySaleMosaic = {
  title: 'Sale',
  columns: [
    { id: 'col-gold', tiles: [{ id: 'gold', label: 'Gold', href: '?category=gold&onSale=true', desktop: saleImages.rtw.desktop, mobile: saleImages.rtw.mobile }] },
    {
      id: 'col-bridal-diamonds',
      tiles: [
        { id: 'bridal', label: 'Bridal', href: '?category=bridal&onSale=true', desktop: saleImages.unstitched.desktop, mobile: saleImages.unstitched.mobile },
        { id: 'diamonds', label: 'Diamonds', href: '?category=diamonds&onSale=true', desktop: saleImages.home.desktop, mobile: saleImages.home.mobile },
      ],
    },
    { id: 'col-gifts', tiles: [{ id: 'gifts', label: 'Gift sets', href: '?onSale=true', desktop: saleImages.salt.desktop, mobile: saleImages.salt.mobile }] },
    {
      id: 'col-rings-bangles',
      tiles: [
        { id: 'rings', label: 'Rings', href: '?category=rings&onSale=true', desktop: saleImages.men.desktop, mobile: saleImages.men.mobile },
        { id: 'bangles', label: 'Bangles', href: '?category=bangles&onSale=true', desktop: saleImages.shoes.desktop, mobile: saleImages.shoes.mobile },
      ],
    },
    { id: 'col-watches', tiles: [{ id: 'watches', label: 'Watches', href: '?category=watches&onSale=true', desktop: saleImages.kids.desktop, mobile: saleImages.kids.mobile }] },
  ],
};

const file = `/**
 * Gul Ahmed–inspired homepage section seeds (The Home Edit + Sale mosaic).
 * Generated by scripts/build-fashion-gul-sections.mjs — re-run after updating gulahmed.html.
 */

export const GUL_AHMED_HOME_EDIT = ${JSON.stringify(homeEdit, null, 2)};

export const GUL_AHMED_SALE_MOSAIC = ${JSON.stringify(saleMosaic, null, 2)};

export const JEWELLERY_HOME_EDIT = ${JSON.stringify(jewelleryHomeEdit, null, 2)};

export const JEWELLERY_SALE_MOSAIC = ${JSON.stringify(jewellerySaleMosaic, null, 2)};

/** @typedef {'boutique' | 'textile' | 'leather' | 'jewellery'} FashionGulVariant */

/**
 * @param {import('@/lib/storefront/luxuryFashion').LuxuryFashionVariant | null | undefined} variant
 */
export function getDefaultFashionGulSections(variant) {
  if (variant === 'jewellery') {
    return { homeEdit: JEWELLERY_HOME_EDIT, saleMosaic: JEWELLERY_SALE_MOSAIC };
  }
  return { homeEdit: GUL_AHMED_HOME_EDIT, saleMosaic: GUL_AHMED_SALE_MOSAIC };
}
`;

fs.writeFileSync(outPath, file, 'utf8');
console.log(`✅ Wrote ${outPath}`);
console.log(`   Home Edit tiles: ${homeEdit.tiles.length}`);
console.log(`   Sale columns: ${saleMosaic.columns.length}`);
