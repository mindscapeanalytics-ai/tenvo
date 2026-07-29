/**
 * Build Tenvo Footwear seed catalog from archive/khazany.html + archive/nike.html.
 * Fetches live product JSON from Khazanay for images/prices when network allows.
 * Run: node scripts/build-footwear-seed-catalog.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const khPath = path.join(root, 'archive/khazany.html');
const nikePath = path.join(root, 'archive/nike.html');
const assetsOut = path.join(root, 'lib/dataLab/footwearArchiveAssets.js');
const catalogOut = path.join(root, 'lib/dataLab/footwearDemoCatalog.js');

const BRANDS = [
  'New Balance',
  'Under Armour',
  'Skechers',
  'Adidas',
  'Nike',
  'Puma',
  'Asics',
  'Brooks',
  'Jordan',
  'Hummel',
  'Altra',
  'On',
  'Avia',
  'Varsity Vibe',
  'Saucony',
  'Clove',
  'Allbirds',
  'Orthofeet',
];

const LOCAL_BRANDS = [
  'Bata Pakistan',
  'Service Shoes',
  'Borjan',
  'Stylo',
  'Metro Shoes',
  'Ndure',
  'ECS',
  'Servis Cheetah',
];

function titleFromHandle(handle) {
  return handle
    .replace(/-s-\d+$/i, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function brandFromName(name) {
  for (const b of BRANDS) {
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return name.split(' ')[0];
}

function inferGender(name) {
  const n = name.toLowerCase();
  if (/\bkids?\b|\bbaby\b|\btoddler\b|\bhustle\b/.test(n)) return 'kids';
  if (/\bwomen'?s?\b|\bladies\b|\bqt\b|\bnergize\b|\bme time\b/.test(n)) return 'women';
  if (/\bmen'?s?\b/.test(n)) return 'men';
  return 'unisex';
}

function inferStyle(name) {
  const n = name.toLowerCase();
  if (/pegasus|vapor|mercurial|adrenaline|glycerin|gowalk|run|fresh foam|hover|charged|cloud|venture|olympus/.test(n)) {
    return 'Sports';
  }
  if (/force|jordan|campus|574|2002|vision|court|air max|uno|dlites|breaknet|treziod|pacer|st runner/.test(n)) {
    return 'Casual';
  }
  if (/boot|hike|zegama|terrex/.test(n)) return 'Boot';
  if (/orthopedic|arch fit|ortho|memory foam/.test(n)) return 'Orthopedic';
  if (/sandal|slide|slip/.test(n)) return 'Sandal';
  return 'Casual';
}

function inferCategory(gender, style) {
  if (style === 'Sports') return 'Sports Shoes';
  if (style === 'Boot') return 'Boots';
  if (style === 'Orthopedic') return 'Orthopedic';
  if (style === 'Sandal') return 'Sandals';
  if (gender === 'women') return "Women's Shoes";
  if (gender === 'kids') return "Kids Shoes";
  if (gender === 'men') return "Men's Shoes";
  return 'Casual';
}

function defaultPrice(brand, style) {
  const premium = ['Nike', 'Jordan', 'Brooks', 'On', 'New Balance', 'Asics'].includes(brand);
  const base = premium ? 8900 : style === 'Orthopedic' ? 7200 : 5400;
  return base + (brand.length * 37) % 2800;
}

function extractNikeImages(html) {
  const re = /https:\/\/static\.nike\.com\/a\/images\/[^"'\\\s)]+/g;
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    let u = m[0].replace(/\)+$/, '').replace(/,$/, '');
    if (u.includes('swoosh-logo')) continue;
    if (u.length < 40) continue;
    set.add(u);
  }
  return [...set];
}

function extractKhazanayHandles(html) {
  const handles = [];
  const seen = new Set();
  const re = /"handle":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const h = m[1];
    if (seen.has(h)) continue;
    if (!/-s-\d+$/i.test(h) && !/nike|adidas|skechers|balance|armour|asics|brooks|jordan|puma|hummel|altra|avia|varsity/i.test(h)) {
      continue;
    }
    seen.add(h);
    handles.push(h);
  }
  return handles;
}

function extractKhazanayFileImages(html) {
  const re = /\/\/www\.khazanay\.pk\/cdn\/shop\/files\/[^"'\\\s)]+\.(?:png|jpg|jpeg|webp)/gi;
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    set.add(`https:${m[0]}`);
  }
  return [...set];
}

async function fetchProduct(handle) {
  const url = `https://www.khazanay.pk/products/${handle}.js`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'TenvoSeedBuilder/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickImage(product) {
  const featured = product?.featured_image;
  if (typeof featured === 'string' && featured) {
    return featured.startsWith('//') ? `https:${featured}` : featured;
  }
  if (featured?.src) {
    return featured.src.startsWith('//') ? `https:${featured.src}` : featured.src;
  }
  const img = product?.images?.[0];
  if (typeof img === 'string') return img.startsWith('//') ? `https:${img}` : img;
  if (img?.src) return img.src.startsWith('//') ? `https:${img.src}` : img.src;
  return '';
}

function sizeOptions(product) {
  const opts = product?.options || [];
  const sizeOpt = opts.find((o) => /size/i.test(o.name || ''));
  if (sizeOpt?.values?.length) return sizeOpt.values.slice(0, 8).map(String);
  return ['40', '41', '42', '43', '44'];
}

const CONDITION_LABELS = new Set([
  'excellent',
  'premium',
  'premium+',
  'premium plus',
  'very good',
  'brand new',
  'new',
  'store return',
  'store returns',
  'good',
  'fair',
]);

function normalizeCondition(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (/premium\+|premium plus/.test(s)) return 'premium_plus';
  if (/premium/.test(s)) return 'premium';
  if (/excellent/.test(s)) return 'excellent';
  if (/very good/.test(s)) return 'very_good';
  if (/store return/.test(s)) return 'store_return';
  if (/brand new|^new$/.test(s)) return 'new';
  return '';
}

function inferColorFromName(name) {
  const n = String(name || '').toLowerCase();
  const pairs = [
    [/\bblack\s*\/\s*white\b|\boreo\b|\bpanda\b/, 'Black / White'],
    [/\bnavy\b/, 'Navy'],
    [/\bgrey\b|\bgray\b/, 'Grey'],
    [/\bwhite\b/, 'White'],
    [/\bblack\b/, 'Black'],
    [/\bred\b/, 'Red'],
    [/\bblue\b/, 'Blue'],
    [/\bgreen\b/, 'Green'],
    [/\bpink\b/, 'Pink'],
    [/\bbrown\b|\btan\b|\bbeige\b|\bkhaki\b/, 'Brown'],
    [/\bpurple\b|\bviolet\b/, 'Purple'],
    [/\borange\b/, 'Orange'],
    [/\byellow\b|\bgold\b/, 'Yellow'],
    [/\bsilver\b/, 'Silver'],
  ];
  for (const [re, label] of pairs) {
    if (re.test(n)) return label;
  }
  return 'Multi';
}

function pickVariantColor(product, fallbackName) {
  const opts = product?.options || [];
  const colorOpt = opts.find((o) => /colou?r|shade|way/i.test(o.name || ''));
  if (colorOpt?.values?.[0]) {
    const v = String(colorOpt.values[0]).trim();
    if (v && !CONDITION_LABELS.has(v.toLowerCase())) return v.slice(0, 40);
  }
  for (const variant of product?.variants || []) {
    for (const key of ['option1', 'option2', 'option3']) {
      const v = String(variant?.[key] || '').trim();
      if (!v || CONDITION_LABELS.has(v.toLowerCase()) || /eur|uk|usa|pak|\d/.test(v.toLowerCase())) continue;
      if (/^[A-Za-z][A-Za-z /-]{1,30}$/.test(v)) return v.slice(0, 40);
    }
  }
  return inferColorFromName(product?.title || fallbackName);
}

function pickVariantCondition(product, index) {
  const opts = product?.options || [];
  const condOpt = opts.find((o) => /condition|grade|quality/i.test(o.name || ''));
  if (condOpt?.values?.[0]) {
    const n = normalizeCondition(condOpt.values[0]);
    if (n) return n;
  }
  for (const variant of product?.variants || []) {
    for (const key of ['option1', 'option2', 'option3']) {
      const n = normalizeCondition(variant?.[key]);
      if (n) return n;
    }
  }
  return index % 5 === 0 ? 'premium_plus' : index % 4 === 0 ? 'excellent' : 'premium';
}

function cleanProductDescription({ name, brand, size, color, style, condition }) {
  const sizeBit = size ? ` Size ${size}.` : '';
  const colorBit = color && color !== 'Multi' ? ` ${color} colourway.` : '';
  const condBit =
    condition && condition !== 'new'
      ? ` Graded ${String(condition).replace(/_/g, ' ')}.`
      : '';
  return `${name}. Authentic ${brand} ${String(style || 'footwear').toLowerCase()}.${sizeBit}${colorBit}${condBit} Clear sizing and nationwide delivery.`.replace(
    /\s+/g,
    ' '
  ).trim();
}

async function main() {
  const kh = fs.readFileSync(khPath, 'utf8');
  const nike = fs.readFileSync(nikePath, 'utf8');
  const nikeImgs = extractNikeImages(nike);
  const khFiles = extractKhazanayFileImages(kh);
  const handles = extractKhazanayHandles(kh);

  console.log(`Nike images: ${nikeImgs.length}`);
  console.log(`Khazanay file images: ${khFiles.length}`);
  console.log(`Product handles: ${handles.length}`);

  const products = [];
  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const name = titleFromHandle(handle);
    const brand = brandFromName(name);
    process.stdout.write(`[${i + 1}/${handles.length}] ${handle}... `);
    const live = await fetchProduct(handle);
    const gender = inferGender(name);
    const style = inferStyle(name);
    const category = inferCategory(gender, style);
    let price = defaultPrice(brand, style);
    let compare = Math.round(price * 1.55);
    let image = '';
    let sizes = ['40', '41', '42', '43', '44'];
    let color = inferColorFromName(name);
    let condition = i % 5 === 0 ? 'premium_plus' : i % 4 === 0 ? 'excellent' : 'premium';

    if (live) {
      const cents = Number(live.price || live.variants?.[0]?.price || 0);
      if (cents > 0) {
        // Shopify JS API often returns price in minor units (paisa) for PKR
        price = cents > 100000 ? Math.round(cents / 100) : cents;
      }
      const cmp = Number(live.compare_at_price || live.variants?.[0]?.compare_at_price || 0);
      if (cmp > 0) {
        compare = cmp > 100000 ? Math.round(cmp / 100) : cmp;
      } else {
        compare = Math.round(price * 1.55);
      }
      image = pickImage(live);
      sizes = sizeOptions(live);
      const title = live.title || name;
      color = pickVariantColor(live, title);
      condition = pickVariantCondition(live, i);
      const description = cleanProductDescription({
        name: title,
        brand,
        size: sizes[0],
        color,
        style,
        condition,
      });
      console.log(`ok PKR ${price}`);
      products.push({
        handle,
        name: title,
        brand,
        category,
        price,
        compare_price: compare > price ? compare : Math.round(price * 1.4),
        image,
        description,
        gender,
        style,
        sizes,
        color: String(color).slice(0, 40),
        condition,
      });
    } else {
      console.log('fallback');
      const fallbackImg = nikeImgs[i % Math.max(nikeImgs.length, 1)] || '';
      const description = cleanProductDescription({
        name,
        brand,
        size: sizes[0],
        color,
        style,
        condition,
      });
      products.push({
        handle,
        name,
        brand,
        category,
        price,
        compare_price: compare,
        image: fallbackImg,
        description,
        gender,
        style,
        sizes,
        color,
        condition,
      });
    }
    await new Promise((r) => setTimeout(r, 180));
  }

  // Local PK brand fillers so demo covers local + imported
  const localFillers = [
    { name: "Bata Men's Formal Oxford", brand: 'Bata Pakistan', category: "Men's Shoes", style: 'Formal', gender: 'men', price: 4500 },
    { name: "Service Women's Block Heel", brand: 'Service Shoes', category: "Women's Shoes", style: 'Formal', gender: 'women', price: 3800 },
    { name: 'Borjan Casual Loafer', brand: 'Borjan', category: "Men's Shoes", style: 'Casual', gender: 'men', price: 5200 },
    { name: 'Stylo Kids Canvas Sneaker', brand: 'Stylo', category: "Kids Shoes", style: 'Casual', gender: 'kids', price: 2200 },
    { name: 'Metro Soft Walk Orthopedic', brand: 'Metro Shoes', category: 'Orthopedic', style: 'Orthopedic', gender: 'unisex', price: 6100 },
    { name: 'Ndure Sports Runner', brand: 'Ndure', category: 'Sports Shoes', style: 'Sports', gender: 'men', price: 4900 },
    { name: 'ECS Everyday Slip-On', brand: 'ECS', category: 'Casual', style: 'Casual', gender: 'unisex', price: 3400 },
    { name: 'Servis Cheetah School Shoe', brand: 'Servis Cheetah', category: "Kids Shoes", style: 'Casual', gender: 'kids', price: 2800 },
  ];

  for (let i = 0; i < localFillers.length; i++) {
    const f = localFillers[i];
    products.push({
      handle: `local-${f.brand.toLowerCase().replace(/\s+/g, '-')}-${i}`,
      name: f.name,
      brand: f.brand,
      category: f.category,
      price: f.price,
      compare_price: Math.round(f.price * 1.25),
      image: nikeImgs[(i + 3) % Math.max(nikeImgs.length, 1)] || '',
      description: `${f.name}. Local Pakistani brand footwear for everyday wear.`,
      gender: f.gender,
      style: f.style,
      sizes: f.gender === 'kids' ? ['28', '30', '32', '34'] : ['39', '40', '41', '42', '43'],
      color: 'Black',
      condition: 'new',
      sourcing: 'local',
    });
  }

  const heroImgs = nikeImgs.slice(0, 8);
  const assetsSrc = `/**
 * Archive-extracted assets for Tenvo Footwear demo seed.
 * Sources: archive/nike.html (hero / lifestyle), archive/khazany.html (PK retail reference).
 * Product images prefer live Khazanay CDN when scraped; Nike static for heroes.
 */
export const FOOTWEAR_NIKE_CDN = 'https://static.nike.com/a/images';
export const FOOTWEAR_KHAZANAY_CDN = 'https://www.khazanay.pk/cdn/shop/files';

/** Full-bleed / campaign hero banners from Nike archive. */
export const FOOTWEAR_HERO_IMAGES = Object.freeze({
  hero1: ${JSON.stringify(heroImgs[0] || '')},
  hero2: ${JSON.stringify(heroImgs[1] || '')},
  hero3: ${JSON.stringify(heroImgs[2] || '')},
  hero4: ${JSON.stringify(heroImgs[3] || '')},
  hero5: ${JSON.stringify(heroImgs[4] || '')},
  lifestyle1: ${JSON.stringify(heroImgs[5] || heroImgs[0] || '')},
  lifestyle2: ${JSON.stringify(heroImgs[6] || heroImgs[1] || '')},
  lifestyle3: ${JSON.stringify(heroImgs[7] || heroImgs[2] || '')},
});

/** Category discovery tiles (Khazanay-style gender / style). */
export const FOOTWEAR_CATEGORY_IMAGES = Object.freeze({
  men: ${JSON.stringify(heroImgs[0] || '')},
  women: ${JSON.stringify(heroImgs[1] || '')},
  kids: ${JSON.stringify(heroImgs[2] || '')},
  sports: ${JSON.stringify(heroImgs[3] || '')},
  casual: ${JSON.stringify(heroImgs[4] || '')},
  boots: ${JSON.stringify(heroImgs[5] || '')},
  orthopedic: ${JSON.stringify(heroImgs[6] || '')},
  accessories: ${JSON.stringify(heroImgs[7] || '')},
});

/** Condition guide tiles. */
export const FOOTWEAR_CONDITION_IMAGES = Object.freeze({
  premiumPlus: ${JSON.stringify(heroImgs[0] || '')},
  premium: ${JSON.stringify(heroImgs[1] || '')},
  excellent: ${JSON.stringify(heroImgs[2] || '')},
  veryGood: ${JSON.stringify(heroImgs[3] || '')},
  storeReturn: ${JSON.stringify(heroImgs[4] || '')},
  brandNew: ${JSON.stringify(heroImgs[5] || '')},
});

export const FOOTWEAR_KHAZANAY_FILE_IMAGES = Object.freeze(${JSON.stringify(khFiles.slice(0, 24), null, 2)});

export const FOOTWEAR_LOCAL_BRANDS = Object.freeze(${JSON.stringify(LOCAL_BRANDS)});
export const FOOTWEAR_IMPORTED_BRANDS = Object.freeze(${JSON.stringify(BRANDS)});
`;

  fs.writeFileSync(assetsOut, assetsSrc);

  const catalogLines = products.map((p, i) => {
    const sku = `TF-SHOE-${String(i + 1).padStart(3, '0')}`;
    const sourcing = p.sourcing || (LOCAL_BRANDS.includes(p.brand) ? 'local' : 'imported');
    const condition =
      p.condition ||
      (sourcing === 'local' ? 'new' : i % 5 === 0 ? 'premium_plus' : i % 4 === 0 ? 'excellent' : 'premium');
    const size = p.sizes?.[2] || p.sizes?.[0] || '42';
    return `  shoeProduct({
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(p.brand)},
    category: ${JSON.stringify(p.category)},
    sku: ${JSON.stringify(sku)},
    price: ${Number(p.price) || 5000},
    compare_price: ${Number(p.compare_price) || Math.round((p.price || 5000) * 1.4)},
    stock: ${12 + (i % 18)},
    featured: ${i < 10 || /nike|jordan|adidas|brooks|force|campus/i.test(p.name)},
    image: ${JSON.stringify(p.image || '')},
    description: ${JSON.stringify(p.description || '')},
    domain_data: {
      articlenumber: ${JSON.stringify(sku)},
      size: ${JSON.stringify(String(size))},
      color: ${JSON.stringify(p.color || 'Multi')},
      material: ${JSON.stringify(p.style === 'Formal' ? 'Genuine Leather' : 'Mixed')},
      style: ${JSON.stringify(p.style || 'Casual')},
      gender: ${JSON.stringify(p.gender || 'unisex')},
      condition: ${JSON.stringify(condition)},
      sourcing: ${JSON.stringify(sourcing)},
      brand: ${JSON.stringify(p.brand)},
    },
  })`;
  });

  const catalogSrc = `/**
 * Tenvo Footwear demo / registration catalog.
 * Imported SKUs from Khazanay archive handles; local PK brands for country-aware mix.
 * Images: Khazanay CDN when scraped, Nike archive heroes for marketing assets.
 */
import {
  FOOTWEAR_HERO_IMAGES,
  FOOTWEAR_CATEGORY_IMAGES,
  FOOTWEAR_CONDITION_IMAGES,
} from './footwearArchiveAssets.js';

/** @type {string[]} */
export const FOOTWEAR_SEED_CATEGORIES = [
  "Men's Shoes",
  "Women's Shoes",
  "Kids Shoes",
  'Sports Shoes',
  'Casual',
  'Sandals',
  'Boots',
  'Orthopedic',
  'Accessories',
  'Leather Goods',
];

/**
 * @param {object} partial
 * @returns {Record<string, unknown>}
 */
function shoeProduct(partial) {
  const {
    name,
    brand,
    category,
    sku,
    price,
    compare_price,
    unit = 'pair',
    stock = 16,
    featured = false,
    image,
    description,
    domain_data = {},
  } = partial;
  const cost = Math.round(Number(price) * 0.72);
  return {
    name,
    brand,
    category,
    unit,
    price,
    compare_price: compare_price ?? Math.round(Number(price) * 1.4),
    cost_price: cost,
    stock,
    sku,
    description:
      description ||
      \`\${name}. \${brand} \${String(category || 'footwear').toLowerCase()} with size \${domain_data.size || 'as marked'}.\`,
    image_url: image,
    imageCredit: domain_data.sourcing === 'local' ? 'Local brand seed' : 'Khazanay archive reference',
    is_featured: featured,
    domain_data: {
      articlenumber: domain_data.articlenumber || sku,
      size: domain_data.size || '',
      color: domain_data.color || '',
      material: domain_data.material || 'Mixed',
      style: domain_data.style || 'Casual',
      gender: domain_data.gender || 'unisex',
      condition: domain_data.condition || 'premium',
      sourcing: domain_data.sourcing || 'imported',
      brand: brand,
      ...domain_data,
    },
  };
}

/** Marketing hero for gallery / demo meta */
export const FOOTWEAR_MARKETING_HERO_IMAGE = FOOTWEAR_HERO_IMAGES.hero1;

/** @type {Array<Record<string, unknown>>} */
export const FOOTWEAR_SEED_PRODUCTS = [
${catalogLines.join(',\n')},
];

export {
  FOOTWEAR_HERO_IMAGES,
  FOOTWEAR_CATEGORY_IMAGES,
  FOOTWEAR_CONDITION_IMAGES,
};

export const FOOTWEAR_SEED_COUNT = FOOTWEAR_SEED_PRODUCTS.length;
`;

  fs.writeFileSync(catalogOut, catalogSrc);
  console.log(`\nWrote ${products.length} products → ${catalogOut}`);
  console.log(`Wrote assets → ${assetsOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
