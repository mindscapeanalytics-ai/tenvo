/**
 * Tenvo Milk Demo / milk-shop registration catalog.
 * Assortment from archive/milk-shop.html (Bismillah Karachi) + PK shop research
 * (Pure Nest, Punjab Milk Shop, Pure Quality, Anhaar, PurePio).
 * Fresh milk sold by kg first (Pakistan neighborhood doodh shop practice).
 */
import { buildUnsplashImageUrl } from '../storefront/unsplashUrl.js';

/** Stable Unsplash photo ids (allowlisted dairy / bakery / beverage pools). */
const P = {
  milk: '1563636619-e9143da7973b',
  yogurt: '1488477181946-6428a0291777',
  aisle: '1578916171728-46686eac8d58',
  bread: '1509440159596-0249088772ff',
  bread2: '1549931319-a545dcf3bc73',
  drink: '1544145945-f90425340c7e',
  drink2: '1437418747212-8d9709afab22',
  produce: '1542838132-92c53300491e',
};

/** @param {string} photoId */
function img(photoId) {
  return buildUnsplashImageUrl(photoId, { w: 800, q: 82 });
}

export const MILK_SHOP_SEED_CATEGORIES = [
  'Fresh Milk',
  'Yogurt / Dahi',
  'Cream & Butter',
  'Ghee',
  'Cheese & Khoya',
  'Lassi & Drinks',
  'Dairy Sweets',
  'Packaged Dairy',
  'Eggs',
  'Bakery Staples',
];

export const MILK_SHOP_MARKETING_HERO_IMAGE = img(P.milk);

/**
 * @param {object} partial
 * @returns {Record<string, unknown>}
 */
function milkProduct(partial) {
  const {
    name,
    brand = 'Tenvo Milk',
    category,
    sku,
    price,
    compare_price,
    unit = 'kg',
    stock = 80,
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
    compare_price: compare_price ?? null,
    cost_price: cost,
    stock,
    sku,
    description:
      description ||
      `${name}. Fresh dairy from Tenvo Milk Shop. Sold ${unit === 'kg' ? 'by the kilogram' : `per ${unit}`}.`,
    image_url: image,
    imageCredit: 'Unsplash seed',
    is_featured: featured,
    domain_data: {
      source: domain_data.source || (brand === 'Tenvo Milk' ? 'Farm / Collector' : 'Brand'),
      fatpercent: domain_data.fatpercent || '',
      chill: domain_data.chill !== false,
      ...domain_data,
    },
  };
}

/** @type {Array<Record<string, unknown>>} */
export const MILK_SHOP_SEED_PRODUCTS = [
  // —— Fresh Milk (kg-first) ——
  milkProduct({
    name: 'Fresh Cow Milk',
    category: 'Fresh Milk',
    sku: 'MLK-COW-KG',
    unit: 'kg',
    price: 220,
    stock: 180,
    featured: true,
    image: img(P.milk),
    description: 'Farm-fresh cow milk. Order by kg for daily household use.',
    domain_data: { fatpercent: '3.5', source: 'Farm / Collector' },
  }),
  milkProduct({
    name: 'Fresh Buffalo Milk',
    category: 'Fresh Milk',
    sku: 'MLK-BUF-KG',
    unit: 'kg',
    price: 240,
    stock: 160,
    featured: true,
    image: img(P.milk),
    description: 'Thick, creamy buffalo milk sold by the kilogram.',
    domain_data: { fatpercent: '6.5', source: 'Farm / Collector' },
  }),
  milkProduct({
    name: 'Fresh Goat Milk',
    category: 'Fresh Milk',
    sku: 'MLK-GOT-KG',
    unit: 'kg',
    price: 280,
    stock: 40,
    image: img(P.milk),
    description: 'Light, naturally digestible goat milk by kg.',
    domain_data: { fatpercent: '4.0', source: 'Farm / Collector' },
  }),
  milkProduct({
    name: 'Fresh Milk 1L',
    category: 'Fresh Milk',
    sku: 'MLK-FRS-1L',
    unit: 'litre',
    price: 278,
    stock: 120,
    featured: true,
    image: img(P.milk),
    description: 'Chilled fresh milk in 1 litre pack (Bismillah-style daily SKU).',
  }),

  // —— Yogurt / Dahi ——
  milkProduct({
    name: 'Homemade Dahi',
    category: 'Yogurt / Dahi',
    sku: 'MLK-DAH-KG',
    unit: 'kg',
    price: 260,
    stock: 90,
    featured: true,
    image: img(P.yogurt),
    description: 'Thick homemade dahi sold by kg.',
  }),
  milkProduct({
    name: 'Fresh Yogurt 250g',
    category: 'Yogurt / Dahi',
    sku: 'MLK-YOG-250',
    unit: 'pack',
    price: 102,
    stock: 100,
    image: img(P.yogurt),
  }),
  milkProduct({
    name: 'Fresh Yogurt 500g',
    category: 'Yogurt / Dahi',
    sku: 'MLK-YOG-500',
    unit: 'pack',
    price: 204,
    stock: 90,
    image: img(P.yogurt),
  }),
  milkProduct({
    name: 'Yogurt 1kg',
    category: 'Yogurt / Dahi',
    sku: 'MLK-YOG-1KG',
    unit: 'kg',
    price: 408,
    stock: 70,
    image: img(P.yogurt),
  }),

  // —— Cream & Butter ——
  milkProduct({
    name: 'Fresh Makkhan (Desi Butter)',
    category: 'Cream & Butter',
    sku: 'MLK-MAK-KG',
    unit: 'kg',
    price: 1800,
    stock: 25,
    featured: true,
    image: img(P.yogurt),
    description: 'Unsalted fresh makkhan churned daily.',
  }),
  milkProduct({
    name: 'Fresh Malai (Cream)',
    category: 'Cream & Butter',
    sku: 'MLK-MAL-KG',
    unit: 'kg',
    price: 900,
    stock: 35,
    image: img(P.milk),
    description: 'Thick farm malai sold by kg.',
  }),
  milkProduct({
    name: "Nurpur Butter 100g",
    brand: 'Nurpur',
    category: 'Cream & Butter',
    sku: 'MLK-NUR-BUT100',
    unit: 'pack',
    price: 574,
    stock: 60,
    image: img(P.yogurt),
  }),
  milkProduct({
    name: "Olper's Cream 200ml",
    brand: "Olper's",
    category: 'Cream & Butter',
    sku: 'MLK-OLP-CRM200',
    unit: 'pack',
    price: 240,
    stock: 80,
    image: img(P.milk),
  }),

  // —— Ghee ——
  milkProduct({
    name: 'Desi Ghee',
    category: 'Ghee',
    sku: 'MLK-GHE-KG',
    unit: 'kg',
    price: 4000,
    stock: 20,
    featured: true,
    image: img(P.aisle),
    description: 'Pure aromatic desi ghee by kg.',
  }),

  // —— Cheese & Khoya ——
  milkProduct({
    name: 'Fresh Paneer',
    category: 'Cheese & Khoya',
    sku: 'MLK-PAN-KG',
    unit: 'kg',
    price: 2500,
    stock: 30,
    featured: true,
    image: img(P.yogurt),
    description: 'Soft fresh paneer made daily. Sold by kg.',
  }),
  milkProduct({
    name: 'Fresh Khoya',
    category: 'Cheese & Khoya',
    sku: 'MLK-KHO-KG',
    unit: 'kg',
    price: 2600,
    stock: 18,
    image: img(P.aisle),
    description: 'Fresh khoya for sweets and desserts.',
  }),

  // —— Lassi & Drinks ——
  milkProduct({
    name: 'Sweet Lassi Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-LAS-SWT',
    unit: 'pcs',
    price: 180,
    stock: 100,
    featured: true,
    image: img(P.drink2),
  }),
  milkProduct({
    name: 'Pheeki Lassi Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-LAS-PHK',
    unit: 'pcs',
    price: 169,
    stock: 100,
    image: img(P.drink2),
    description: 'Salted namkeen lassi (Bismillah menu staple).',
  }),
  milkProduct({
    name: 'Special Malai Lassi Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-LAS-MAL',
    unit: 'pcs',
    price: 220,
    stock: 80,
    image: img(P.drink2),
  }),
  milkProduct({
    name: 'Mango Lassi Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-LAS-MNG',
    unit: 'pcs',
    price: 289,
    stock: 70,
    image: img(P.drink),
  }),
  milkProduct({
    name: 'Chocolate Lassi Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-LAS-CHC',
    unit: 'pcs',
    price: 249,
    stock: 70,
    image: img(P.drink2),
  }),
  milkProduct({
    name: 'Rose Milk Glass',
    category: 'Lassi & Drinks',
    sku: 'MLK-ROS-GLS',
    unit: 'pcs',
    price: 149,
    stock: 80,
    image: img(P.drink),
  }),
  milkProduct({
    name: 'Badami Doodh 450ml',
    category: 'Lassi & Drinks',
    sku: 'MLK-BAD-450',
    unit: 'pcs',
    price: 180,
    stock: 50,
    image: img(P.drink2),
  }),
  milkProduct({
    name: 'Doodh Soda 500ml',
    category: 'Lassi & Drinks',
    sku: 'MLK-SOD-500',
    unit: 'pcs',
    price: 299,
    stock: 60,
    image: img(P.milk),
  }),
  milkProduct({
    name: 'Pakola Doodh Soda Glass',
    brand: 'Pakola',
    category: 'Lassi & Drinks',
    sku: 'MLK-PAK-SOD',
    unit: 'pcs',
    price: 119,
    stock: 80,
    image: img(P.drink),
  }),

  // —— Dairy Sweets ——
  milkProduct({
    name: 'Kheer 250g',
    category: 'Dairy Sweets',
    sku: 'MLK-KHR-250',
    unit: 'pack',
    price: 219,
    stock: 40,
    featured: true,
    image: img(P.aisle),
  }),
  milkProduct({
    name: 'Rabri Doodh',
    category: 'Dairy Sweets',
    sku: 'MLK-RAB-POR',
    unit: 'pack',
    price: 400,
    stock: 30,
    image: img(P.aisle),
    description: 'Rich rabri doodh portion.',
  }),
  milkProduct({
    name: 'Doodh Jalebi 250g',
    category: 'Dairy Sweets',
    sku: 'MLK-JAL-250',
    unit: 'pack',
    price: 169,
    stock: 35,
    image: img(P.aisle),
  }),

  // —— Packaged Dairy ——
  milkProduct({
    name: "Olper's Full Cream Milk 1L",
    brand: "Olper's",
    category: 'Packaged Dairy',
    sku: 'MLK-OLP-1L',
    unit: 'litre',
    price: 380,
    stock: 100,
    featured: true,
    image: img(P.milk),
  }),
  milkProduct({
    name: 'Nurpur Full Cream Milk 1L',
    brand: 'Nurpur',
    category: 'Packaged Dairy',
    sku: 'MLK-NUR-1L',
    unit: 'litre',
    price: 380,
    stock: 90,
    image: img(P.milk),
  }),
  milkProduct({
    name: 'Dayfresh Milk 1L',
    brand: 'Dayfresh',
    category: 'Packaged Dairy',
    sku: 'MLK-DAY-1L',
    unit: 'litre',
    price: 360,
    stock: 70,
    image: img(P.milk),
  }),
  milkProduct({
    name: 'Prema Fresh Milk 250ml',
    brand: 'Prema',
    category: 'Packaged Dairy',
    sku: 'MLK-PRE-250',
    unit: 'pack',
    price: 95,
    stock: 120,
    image: img(P.milk),
  }),
  milkProduct({
    name: "Nurpur Flavoured Milk Chocolate 180ml",
    brand: 'Nurpur',
    category: 'Packaged Dairy',
    sku: 'MLK-NUR-CHC180',
    unit: 'pack',
    price: 90,
    stock: 80,
    image: img(P.drink2),
  }),
  milkProduct({
    name: 'Nestlé Everyday Milk Powder 400g',
    brand: 'Nestlé',
    category: 'Packaged Dairy',
    sku: 'MLK-NST-ED400',
    unit: 'pack',
    price: 1150,
    stock: 45,
    image: img(P.milk),
  }),

  // —— Eggs ——
  milkProduct({
    name: 'Farm Fresh Eggs (Dozen)',
    category: 'Eggs',
    sku: 'MLK-EGG-DZ',
    unit: 'dozen',
    price: 420,
    stock: 60,
    featured: true,
    image: img(P.produce),
    description: 'Grade-A farm eggs. Common milk-shop companion SKU.',
  }),

  // —— Bakery staples (Bismillah sells bread alongside dairy) ——
  milkProduct({
    name: 'Dawn Milky Bread Small',
    brand: 'Dawn',
    category: 'Bakery Staples',
    sku: 'MLK-DWN-BRD',
    unit: 'pcs',
    price: 139,
    stock: 50,
    image: img(P.bread),
  }),
  milkProduct({
    name: "Brady's Bread Milky Medium 650g",
    brand: "Brady's",
    category: 'Bakery Staples',
    sku: 'MLK-BRD-MLK',
    unit: 'pcs',
    price: 189,
    stock: 40,
    image: img(P.bread2),
  }),
];

export const MILK_SHOP_SEED_PRODUCT_COUNT = MILK_SHOP_SEED_PRODUCTS.length;
