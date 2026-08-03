/**
 * Archive-extracted assets for Tenvo Footwear demo.
 * Source: archive/shoe1.html (Foot Locker homepage) — https://www.footlocker.com/
 * Product catalog images still prefer Khazanay CDN when seeded.
 */
export const FOOTWEAR_FL_CDN = 'https://images.footlocker.com/content/dam/final';

/** Tenvo footwear accent — web yellow (Zappos/FL energy with yellow CTAs). */
export const FOOTWEAR_BRAND_YELLOW = '#FFDA00';
export const FOOTWEAR_BRAND_YELLOW_DARK = '#E6C400';

const FL = FOOTWEAR_FL_CDN;

/** Sale / hero lifestyle banners. */
export const FOOTWEAR_HERO_IMAGES = Object.freeze({
  sale:
    `${FL}/footlocker/site/homepage/2026/july/260717-fl-recjctp9ltdwglxup-bts-sale-sotf-1up-hp/260717-fl-recJCTp9ltDWGLxup-bts-sale-sotf-1up-web.jpg`,
  hero1:
    `${FL}/footlocker/site/homepage/2026/july/260717-fl-recjctp9ltdwglxup-bts-sale-sotf-1up-hp/260717-fl-recJCTp9ltDWGLxup-bts-sale-sotf-1up-web.jpg`,
  hero2:
    `${FL}/footlocker/site/homepage/2026/july/20260727-recn5lrdogkdxhrxx-flus-flca-bts-essentials/20260727-recN5lrdOGkDXhrxX-FLUS-FLCA-BTS-Essentials-1UP-D.jpg`,
  hero3:
    `${FL}/footlocker/site/homepage/2026/july/260725-fl-rechwju04nhupbnyj-jordan-retro-4-comic-con/260725-fl-recHWJu04nHUpBnYj-jordan-retro-4-comic-con-1up-v2.jpg`,
  lifestyle1:
    `${FL}/footlocker/site/homepage/2026/june/20260706-reclqi2mh00jgnjw3-flus-flca-triplewhite-ftw/20260706-recLQi2mH00jGNjW3-FLUS-FLCA-TripleWhite-FTW-MPS-2.jpg`,
  lifestyle2:
    `${FL}/footlocker/site/homepage/2026/july/20260726-recr13i3c0lxuw9rb-flus-flca-nb-abzorb-2010/20260726-recR13i3c0LxUw9rB-FLUS-FLCA-NB-Abzorb-2010-1UP-D.jpg`,
  lifestyle3:
    `${FL}/footlocker/site/homepage/2026/july/260722-flus-solestories-rechinqw9leq8dc6u/260722-solestories-1UP-desktop-rechiNqw9leq8DC6u.jpg`,
  energy:
    `${FL}/footlocker/site/homepage/2026/july/20260727-recn5lrdogkdxhrxx-flus-flca-bts-essentials/20260727-recN5lrdOGkDXhrxX-FLUS-FLCA-BTS-Essentials-1UP-D.jpg`,
  rewards:
    `${FL}/footlocker/site/homepage/2026/july/260722-flus-solestories-rechinqw9leq8dc6u/260722-solestories-1UP-desktop-rechiNqw9leq8DC6u.jpg`,
});

/** Floating sale sneakers (hero product stack). */
export const FOOTWEAR_SALE_STACK_IMAGES = Object.freeze([
  `${FL}/footlockercanada/site/homepage/2024/may/240502-fl-flca-sale-top-nav-nike.jpg`,
  `${FL}/footlockercanada/site/homepage/2024/may/240502-fl-flca-sale-top-nav-jordan.jpg`,
  `${FL}/footlockercanada/site/homepage/2024/may/240502-fl-flca-sale-top-nav-adidas.jpg`,
]);

/** Three-up editorial banners. */
export const FOOTWEAR_THREE_UP_IMAGES = Object.freeze({
  apparel:
    `${FL}/footlocker/site/homepage/2026/july/260727-fl-recwnc5vcmsvpkso2-bts-accessories-apparel/260727-fl-recWNC5VCMsvpksO2-bts-accessories-apparel-3up.jpg`,
  running:
    `${FL}/footlocker/site/homepage/2026/july/260714-fl-recwa5hirx8ae8iu6/20260714-fl-recWa5HIrX8aE8iu6-w-3up-alt.jpg`,
  trends:
    `${FL}/footlocker/site/homepage/2026/july/260726-flca-recj4tozat98eak4p-trends/260726-flca-recj4tOZAT98eAk4p-trends1.jpg`,
});

/** Men / Women / Kids / Accessories category tiles. */
export const FOOTWEAR_CATEGORY_IMAGES = Object.freeze({
  men: `${FL}/footlocker/site/homepage/2026/july/260706-fl-recewkkwbndt1lsif-bts-essentials-4up/260706-fl-recewKKwBNdT1lSif-bts-essentials-mens-4up.jpg`,
  women: `${FL}/footlocker/site/homepage/2026/july/260706-fl-recewkkwbndt1lsif-bts-essentials-4up/260706-fl-recewKKwBNdT1lSif-bts-essentials-womens-4up.jpg`,
  kids: `${FL}/footlocker/site/homepage/2026/july/260706-fl-recewkkwbndt1lsif-bts-essentials-4up/260706-fl-recewKKwBNdT1lSif-bts-essentials-kids-4up.jpg`,
  accessories: `${FL}/footlocker/site/homepage/2026/july/260706-fl-recewkkwbndt1lsif-bts-essentials-4up/260706-fl-recewKKwBNdT1lSif-bts-essentials-clothing-accessories-4up.jpg`,
  sports: FOOTWEAR_THREE_UP_IMAGES.running,
  casual: FOOTWEAR_HERO_IMAGES.lifestyle1,
  boots: FOOTWEAR_HERO_IMAGES.energy,
  orthopedic: `${FL}/FootLockerInc/site/evergreen/brands-brand-6up-asics.jpg`,
});

/** Shop by brand visual-nav tiles. */
export const FOOTWEAR_BRAND_TILE_IMAGES = Object.freeze({
  nike: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-Nike-D.jpg`,
  jordan: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-Jordan-D.jpg`,
  newBalance: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-NB-D.jpg`,
  adidas: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-adidas-D.jpg`,
  asics: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-asics-D.jpg`,
  on: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-on-D.jpg`,
  timberland: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-timberland-D.jpg`,
  ugg: `${FL}/footlocker/site/homepage/2026/june/20260706-recd7s4tkjluxh691-flus-flca-bts-visnav-brand/20260706-recd7s4TKJLuxh691-FLUS-FLCA-BTS-VisNav-Brand-ugg-D.jpg`,
});

/** Aliases used by older resolvers. */
export const FOOTWEAR_VISUAL_NAV_IMAGES = Object.freeze({
  hoka: FOOTWEAR_BRAND_TILE_IMAGES.on,
  on: FOOTWEAR_BRAND_TILE_IMAGES.on,
  nike: FOOTWEAR_BRAND_TILE_IMAGES.nike,
  newBalance: FOOTWEAR_BRAND_TILE_IMAGES.newBalance,
  brooks: FOOTWEAR_BRAND_TILE_IMAGES.asics,
  asics: FOOTWEAR_BRAND_TILE_IMAGES.asics,
});

export const FOOTWEAR_CAMPAIGN_IMAGES = Object.freeze({
  asics: FOOTWEAR_BRAND_TILE_IMAGES.asics,
  outdoor: FOOTWEAR_THREE_UP_IMAGES.running,
  investment: FOOTWEAR_HERO_IMAGES.lifestyle1,
  coffeecore: FOOTWEAR_HERO_IMAGES.lifestyle2,
  kids: FOOTWEAR_CATEGORY_IMAGES.kids,
  cloudmonster: FOOTWEAR_HERO_IMAGES.energy,
  backToSchool: FOOTWEAR_HERO_IMAGES.sale,
});

export const FOOTWEAR_CONDITION_IMAGES = Object.freeze({
  premiumPlus: FOOTWEAR_SALE_STACK_IMAGES[0],
  premium: FOOTWEAR_SALE_STACK_IMAGES[1],
  excellent: FOOTWEAR_SALE_STACK_IMAGES[2],
  veryGood: FOOTWEAR_BRAND_TILE_IMAGES.newBalance,
  storeReturn: FOOTWEAR_BRAND_TILE_IMAGES.adidas,
  brandNew: FOOTWEAR_BRAND_TILE_IMAGES.nike,
});

export const FOOTWEAR_LOCAL_BRANDS = Object.freeze([
  'Bata Pakistan',
  'Service Shoes',
  'Borjan',
  'Stylo',
  'Metro Shoes',
  'Ndure',
  'ECS',
  'Servis Cheetah',
]);

export const FOOTWEAR_IMPORTED_BRANDS = Object.freeze([
  'Nike',
  'Jordan',
  'Adidas',
  'New Balance',
  'ASICS',
  'On',
  'Puma',
  'Hoka',
  'Brooks',
  'Skechers',
  'Under Armour',
  'Timberland',
  'UGG',
]);
