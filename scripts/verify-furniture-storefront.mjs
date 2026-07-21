#!/usr/bin/env node
/**
 * Sanity-check furniture elevated homepage config + resolvers.
 */
import {
  FURNITURE_DEMO_HERO_VIDEO_URL,
  getFurnitureConfig,
  getFurnitureHeroSlides,
  isFurnitureElevatedStore,
  normalizeFurnitureVideoUrl,
  partitionFurnitureHomepageRails,
  resolveFurnitureBrandStories,
  resolveFurnitureLifestyleSpotlight,
  resolveFurniturePromoMosaic,
  resolveFurnitureShowroomBanner,
  resolveFurnitureTrustPillars,
} from '../lib/storefront/furnitureStorefront.js';

const errors = [];

if (!isFurnitureElevatedStore('furniture')) {
  errors.push('furniture should be elevated');
}
if (isFurnitureElevatedStore('gems-jewellery')) {
  errors.push('jewellery must not resolve as furniture elevated');
}

if (normalizeFurnitureVideoUrl('javascript:alert(1)') !== '') {
  errors.push('normalize should reject javascript: URLs');
}
if (normalizeFurnitureVideoUrl('/relative.mp4') !== '') {
  errors.push('normalize should reject relative URLs');
}
if (normalizeFurnitureVideoUrl('https://cdn.example.com/show.mp4') !== 'https://cdn.example.com/show.mp4') {
  errors.push('normalize should accept https URLs');
}

const liveCfg = getFurnitureConfig({}, 'acme-furniture');
if (liveCfg.heroVideoUrl) {
  errors.push('live tenants must not get a forced demo hero video');
}
if (liveCfg.showTrustStrip !== true || liveCfg.showLifestyleSpotlight !== true) {
  errors.push('trust strip and lifestyle spotlight should default on');
}

const demoCfg = getFurnitureConfig({}, 'demo-furniture');
if (demoCfg.heroVideoUrl !== FURNITURE_DEMO_HERO_VIDEO_URL) {
  errors.push('demo-furniture should receive demo hero video default');
}

const slides = getFurnitureHeroSlides('/store/demo-furniture', {}, {
  businessDomain: 'demo-furniture',
  storeName: 'Woodin',
  products: [{ id: '1', name: 'Sofa', image_url: 'https://example.com/a.jpg', is_featured: true }],
});
if (!slides.length) errors.push('demo hero slides should not be empty');
if (!slides[0]?.videoUrl) errors.push('demo hero slide 0 should include videoUrl');

const rails = partitionFurnitureHomepageRails([
  { id: 'a', name: 'Featured Sofa', price: 100, compare_price: 150, is_featured: true, stock: 2 },
  { id: 'b', name: 'Deal Chair', price: 40, compare_price: 80, is_featured: false, stock: 2 },
  { id: 'c', name: 'Both', price: 50, compare_price: 90, is_featured: true, stock: 2 },
]);
const featuredIds = new Set(rails.topPicks.map((p) => p.id));
if (rails.deals.some((p) => featuredIds.has(p.id))) {
  errors.push('deals rail must not repeat featured product ids');
}
if (!rails.deals.some((p) => p.id === 'b')) {
  errors.push('exclusive deal product should remain in deals rail');
}

const mosaic = resolveFurniturePromoMosaic({}, [], 'demo-furniture', 'furniture');
if (mosaic.length > 2) errors.push('promo mosaic must cap at 2');

const spotlight = resolveFurnitureLifestyleSpotlight({}, [], 'demo-furniture', 'furniture');
if (!spotlight?.title) errors.push('demo lifestyle spotlight should resolve');

const pillars = resolveFurnitureTrustPillars({}, 'demo-furniture');
if (pillars.length < 4) errors.push('trust pillars should default to 4');

const brandStories = resolveFurnitureBrandStories({}, [], 'demo-furniture', 'furniture', {
  storeName: 'Woodin',
});
if (brandStories.length < 2) errors.push('demo brand stories should resolve two motivation blocks');
if (!brandStories[0]?.image || !brandStories[0]?.title) {
  errors.push('brand story should include image and title');
}

const customBrandCfg = getFurnitureConfig(
  {
    storefront: {
      furniture: {
        brandStory1Title: 'Custom craft',
        brandStory1Image: 'https://cdn.example.com/a.jpg',
        brandStory1Subtitle: 'Built to last',
      },
    },
  },
  'acme-furniture'
);
const customStories = resolveFurnitureBrandStories(
  {
    storefront: {
      furniture: {
        brandStory1Title: 'Custom craft',
        brandStory1Image: 'https://cdn.example.com/a.jpg',
        brandStory1Subtitle: 'Built to last',
      },
    },
  },
  [],
  'acme-furniture',
  'furniture'
);
if (!customBrandCfg.brandStories?.length) {
  errors.push('flat brand story settings should populate config.brandStories');
}
if (customStories[0]?.title !== 'Custom craft') {
  errors.push('owner brand story title should win for live tenants');
}

const showroom = resolveFurnitureShowroomBanner({}, {
  businessDomain: 'demo-furniture',
  storeName: 'Woodin',
  products: [],
});
if (!showroom?.image) errors.push('showroom banner must resolve a default image');
if (!showroom.image.startsWith('http')) errors.push('showroom banner image must be an absolute URL');

const ownerShowroom = resolveFurnitureShowroomBanner(
  {
    storefront: {
      furniture: {
        showroomBannerImage: 'https://cdn.example.com/showroom.jpg',
        showroomTitle: 'Come visit us',
      },
    },
  },
  { businessDomain: 'acme-furniture', storeName: 'Acme', products: [] }
);
if (ownerShowroom?.image !== 'https://cdn.example.com/showroom.jpg') {
  errors.push('owner showroomBannerImage should win');
}
if (ownerShowroom?.title !== 'Come visit us') {
  errors.push('owner showroom title should win');
}

if (errors.length) {
  console.error('verify-furniture-storefront FAILED:');
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log('verify-furniture-storefront OK');
