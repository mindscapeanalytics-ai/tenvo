#!/usr/bin/env bun
/**
 * Assert marketing demo heroes are unique and domain-accurate.
 * Run: bun run verify:marketing-demo-heroes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CANONICAL_DEMO_HEROES,
  getDemoStoreHeroByDomain,
  getFeaturedDemoGalleryItems,
  getHeroDemoGalleryItems,
} from '../lib/marketing/demoStoreGalleryMeta.js';
import {
  HOME_INDUSTRY_SOLUTIONS,
  HOME_TOOLKIT_TABS,
  MARKETING_HONEST_STATS,
} from '../lib/marketing/homeVisualThemes.js';
import { AUTO_PARTS_DEFAULT_SLIDES } from '../lib/storefront/autoPartsArchiveMap.js';
import { TENVO_VEHICLES_ASSETS } from '../lib/storefront/tenvoVehiclesAssets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let failed = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const featured = getFeaturedDemoGalleryItems();
const byUrl = new Map();
for (const store of featured) {
  if (!store.heroImage) {
    fail(`${store.domain} missing heroImage`);
    continue;
  }
  if (!byUrl.has(store.heroImage)) byUrl.set(store.heroImage, []);
  byUrl.get(store.heroImage).push(store.domain);
}

for (const [url, domains] of byUrl) {
  if (domains.length > 1) {
    fail(`duplicate hero URL shared by ${domains.join(', ')} (${url.slice(0, 72)}…)`);
  }
}
if (byUrl.size === featured.length) {
  ok(`${featured.length} featured demos have unique hero URLs`);
}

const showroomHero = getDemoStoreHeroByDomain('demo-showroom');
const vehiclesHero = TENVO_VEHICLES_ASSETS.hero.vehicles;
const autopartsImages = new Set(
  AUTO_PARTS_DEFAULT_SLIDES.map((s) => s.image).filter(Boolean)
);

if (showroomHero !== vehiclesHero) {
  fail(`demo-showroom hero must be TENVO_VEHICLES_ASSETS.hero.vehicles`);
} else {
  ok('demo-showroom uses dealership vehicles hero');
}

if (autopartsImages.has(showroomHero)) {
  fail('demo-showroom hero collides with AUTO_PARTS_DEFAULT_SLIDES');
} else {
  ok('demo-showroom hero is not an auto-parts archive slide');
}

const supermarket = getDemoStoreHeroByDomain('demo-supermarket');
const fmcg = getDemoStoreHeroByDomain('demo-fmcg');
if (!supermarket || !fmcg || supermarket === fmcg) {
  fail('demo-supermarket and demo-fmcg must have distinct heroes');
} else {
  ok('demo-supermarket and demo-fmcg heroes differ');
}

const restaurant = getDemoStoreHeroByDomain('demo-restaurant');
if (!restaurant.includes('eatx.pk') && !restaurant.includes('ProductImages')) {
  fail('demo-restaurant hero should come from restaurant/eatx demo assets');
} else {
  ok('demo-restaurant uses storefront BBQ hero');
}

const toolkitDomains = HOME_TOOLKIT_TABS.map((t) => t.domain);
for (const required of ['demo-textile', 'demo-marine', 'demo-pharmacy']) {
  if (!toolkitDomains.includes(required)) {
    fail(`HOME_TOOLKIT_TABS missing ${required}`);
  }
}
if (toolkitDomains.includes('demo-textile') && toolkitDomains.includes('demo-marine')) {
  ok('toolkit tabs include textile and marine');
}

const wholesale = HOME_INDUSTRY_SOLUTIONS.find((s) => s.id === 'wholesale');
if (!wholesale || wholesale.domain !== 'demo-textile') {
  fail('industry wholesale card must link demo-textile');
} else {
  ok('industry wholesale uses textile demo');
}

const commerceSrc = fs.readFileSync(
  path.join(root, 'components/marketing/sections/CommerceAndIntelligenceSection.jsx'),
  'utf8'
);
if (!commerceSrc.includes("orders: 'demo-autoparts'")) {
  fail('commerce orders pillar must use demo-autoparts');
} else {
  ok('commerce orders pillar uses auto parts demo');
}

const verticalMeta = fs.readFileSync(
  path.join(root, 'lib/marketing/domainPackageVerticalMeta.js'),
  'utf8'
);
const dealershipBlock = verticalMeta.match(/'vehicle-dealership':\s*\{[\s\S]*?\},/);
if (!dealershipBlock) {
  fail('vehicle-dealership preset block missing in domainPackageVerticalMeta');
} else if (dealershipBlock[0].includes('AUTO_PARTS')) {
  fail('vehicle-dealership preset must not reference AUTO_PARTS slides');
} else if (!dealershipBlock[0].includes('TENVO_VEHICLES_ASSETS')) {
  fail('vehicle-dealership preset must use TENVO_VEHICLES_ASSETS');
} else {
  ok('solutions vehicle-dealership preset uses dealership assets');
}
if (!verticalMeta.includes("'vehicle-showroom':") || !verticalMeta.includes('TENVO_VEHICLES_ASSETS.hero.vehicles')) {
  fail('vehicle-showroom package channel heroes should include dealership vehicles hero');
} else {
  ok('vehicle-showroom package channels use dealership vehicles hero');
}

const gallerySrc = fs.readFileSync(
  path.join(root, 'components/marketing/sections/DemoStoreGallery.jsx'),
  'utf8'
);
if (gallerySrc.includes('photo-1492144534655-ae79c964c9d7')) {
  fail('DemoStoreGallery must not use shared car Unsplash error fallback');
} else {
  ok('DemoStoreGallery has no cross-domain car error fallback');
}

const heroCount = getHeroDemoGalleryItems().length;
const liveStat = MARKETING_HONEST_STATS.find((s) => String(s.label).toLowerCase().includes('live demo'));
if (liveStat && String(liveStat.value) !== String(heroCount)) {
  fail(
    `MARKETING_HONEST_STATS live demos (${liveStat.value}) must match hero carousel count (${heroCount})`
  );
} else {
  ok(`honest live-demo stat is ${heroCount}; hero carousel has ${heroCount} slides`);
}

if (!CANONICAL_DEMO_HEROES['demo-showroom'] || !CANONICAL_DEMO_HEROES['demo-fmcg']) {
  fail('CANONICAL_DEMO_HEROES missing required domains');
} else {
  ok('CANONICAL_DEMO_HEROES map exported');
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll marketing demo hero checks passed');
