/**
 * Smoke-test registration provisioning helpers (no DB required).
 * Run: node scripts/verify-registration-flow.mjs
 */
import {
  buildRegistrationSeedPayload,
  buildRegistrationSettingsSnapshot,
  buildRegistrationDomainProfile,
  buildDemoCatalogPayload,
} from '../lib/utils/registrationSeed.js';
import { getDefaultCoaForCountry } from '../lib/config/regionalCoa.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { DOMAIN_KNOWLEDGE_KEYS } from '../lib/domainKnowledge.js';
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { resolveRegistrationStorefrontDefaults } from '../lib/onboarding/registrationStorefrontDefaults.js';
import {
  SUPERMARKET_REGISTRATION_VERTICALS,
  REGISTRATION_RICH_CATALOG_VERTICALS,
  PK_CLOTHING_REGISTRATION_VERTICALS,
} from '../lib/onboarding/registrationRichVerticals.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const bizId = '00000000-0000-0000-0000-000000000001';

const pkAutoParts = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'auto-parts',
  countryIso: 'PK',
});
assert(pkAutoParts.items.length >= 25, 'auto-parts registration should seed archive catalog');
assert(pkAutoParts.categories.includes('Filters'), 'auto-parts registration should include Filters category');
assert(
  pkAutoParts.items.every((i) => i.business_id === bizId),
  'auto-parts seed items must be tenant-scoped'
);

const pkRetail = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'retail-shop',
  countryIso: 'PK',
});
assert(pkRetail.items.length === 0, 'Registration must not seed demo products for retail-shop');

const pkDealership = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'vehicle-dealership',
  countryIso: 'PK',
});
assert(pkDealership.items.length >= 30, 'vehicle-dealership registration should seed Tenvo Vehicles catalog');
assert(pkDealership.items.every((i) => i.image_url?.startsWith('https://')), 'Dealership seed images should be HTTPS CDN URLs');
assert(pkDealership.categories.includes('All Cars'), 'Dealership seed should include All Cars category');
assert(pkRetail.categories.length > 0, 'PK retail-shop should produce category shells');
assert(pkRetail.domainProfile?.automation, 'Registration should include automation defaults');
assert(pkRetail.domainProfile?.intelligence, 'Registration should include intelligence defaults');

const pkGarments = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'garments',
  countryIso: 'PK',
});
assert(pkGarments.items.length >= 8, 'PK garments registration should seed local + imported catalog');
assert(
  pkGarments.items.some((i) => i.domain_data?.sourcing === 'local'),
  'PK garments seed should include local Pakistani brands'
);
assert(
  pkGarments.items.some((i) => i.domain_data?.sourcing === 'imported'),
  'PK garments seed should include imported fashion stock'
);
assert(pkGarments.categories.includes('Imported Fashion'), 'PK garments should include Imported Fashion category');

const pkBoutique = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'boutique-fashion',
  countryIso: 'PK',
});
assert(pkBoutique.items.length >= 15, 'PK boutique-fashion registration should seed rich catalog');

const pkTextile = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'textile-wholesale',
  countryIso: 'PK',
});
assert(pkTextile.items.length >= 10, 'PK textile-wholesale registration should seed local + imported fabric');
assert(
  pkTextile.items.some((i) => i.category === 'Imported Fabric' || i.category === 'Lunda Bazaar'),
  'PK textile-wholesale seed should include imported / Lunda categories'
);
assert(
  pkTextile.categories.includes('Lawn') && pkTextile.categories.includes('Silk'),
  'PK textile-wholesale categories should include Lawn and Silk'
);
assert(
  pkTextile.items.every(
    (i) => !i.domain_data?.sourcing || ['local', 'imported'].includes(String(i.domain_data.sourcing).toLowerCase())
  ),
  'textile-wholesale seed sourcing values should be local or imported when set'
);
assert(
  pkTextile.items.filter((i) => i.domain_data?.sourcing === 'local').length >= 1,
  'textile-wholesale seed should stamp local sourcing on mill/local lots'
);

const textileProfile = buildRegistrationDomainProfile({
  domainKey: 'textile-wholesale',
  countryIso: 'PK',
});
assert(textileProfile.automation.batchTrackingEnabled === true, 'textile-wholesale batch automation');
assert(textileProfile.automation.multiLocationEnabled === true, 'textile-wholesale multi-location automation');
assert(textileProfile.automation.manufacturingEnabled === false, 'textile-wholesale manufacturing off');

const usTextileNoPkg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'textile-wholesale',
  countryIso: 'US',
});
assert(usTextileNoPkg.items.length === 0, 'Non-PK textile-wholesale without package must not seed products');

const usTextilePkg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'textile-wholesale',
  countryIso: 'US',
  domainPackageKey: 'clothing-commerce',
});
assert(
  usTextilePkg.items.length >= 10,
  'US textile-wholesale with clothing-commerce package should seed rich catalog'
);

const usGarments = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'garments',
  countryIso: 'US',
});
assert(usGarments.items.length === 0, 'Non-PK garments registration must not seed demo products');

const aePharmacy = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'pharmacy',
  countryIso: 'AE',
});
assert(aePharmacy.items.length === 0, 'Registration must not seed products for AE pharmacy');
assert(aePharmacy.categories.length > 0, 'AE pharmacy should produce categories');

const demoAuto = buildDemoCatalogPayload({
  businessId: bizId,
  domainKey: 'auto-parts',
  countryIso: 'SG',
});
assert(demoAuto.items.length >= 10, 'Demo catalog auto-parts should have rich products');
assert(demoAuto.items.every((i) => i.image_url), 'Demo catalog items should include images');

const profile = buildRegistrationDomainProfile({ domainKey: 'auto-parts', countryIso: 'SG' });
assert(profile.domainSnapshot.key === 'auto-parts', 'Domain profile key');
assert(profile.automation.reorderEnabled === true, 'Auto-parts reorder automation');

const coaAe = getDefaultCoaForCountry('AE');
assert(
  coaAe.some((a) => a.name.includes('VAT') && !a.name.includes('FBR')),
  'AE COA should use VAT labels'
);

const snap = buildRegistrationSettingsSnapshot('US', null, { domainVertical: 'retail-shop' });
assert(snap.country_iso === 'US', 'Registration snapshot country_iso');
assert(snap.domain_vertical === 'retail-shop', 'Registration snapshot domain_vertical');

const dk = getDomainKnowledge('mobile', { countryIso: 'US' });
assert(dk.countryIso === 'US', 'getDomainKnowledge sets countryIso for US');
assert(Array.isArray(dk.marketFeatures?.popularBrands), 'US mobile should expose market brands');

for (const key of DOMAIN_KNOWLEDGE_KEYS.slice(0, 5)) {
  const payload = buildRegistrationSeedPayload({
    businessId: bizId,
    domainKey: key,
    countryIso: 'PK',
  });
  const canonical = resolveDomainKey(key);
  const expectProducts =
    canonical === 'vehicle-dealership' ||
    canonical === 'auto-parts' ||
    (canonical === 'garments' && payload.items.length > 0) ||
    (canonical === 'boutique-fashion' && payload.items.length > 0) ||
    (canonical === 'textile-wholesale' && payload.items.length > 0) ||
    (canonical === 'textile-mill' && payload.items.length > 0);
  assert(
    Array.isArray(payload.items) && (expectProducts ? payload.items.length > 0 : payload.items.length === 0),
    expectProducts
      ? `${canonical} should seed starter products on registration (PK)`
      : `no products for ${key}`
  );
  assert(Array.isArray(payload.categories), `category array for ${key}`);
}

// Full rich-catalog vertical coverage (not only the first 5 alphabetical keys).
for (const key of REGISTRATION_RICH_CATALOG_VERTICALS) {
  const payload = buildRegistrationSeedPayload({
    businessId: bizId,
    domainKey: key,
    countryIso: 'PK',
  });
  assert(payload.items.length > 0, `${key} must seed rich products on PK registration`);
  assert(payload.categories.length > 0, `${key} must seed category shells`);
  const categorySet = new Set(payload.categories.map((c) => String(c).toLowerCase()));
  const orphanCategories = [
    ...new Set(
      payload.items
        .map((i) => i.category)
        .filter(Boolean)
        .filter((c) => !categorySet.has(String(c).toLowerCase()))
    ),
  ];
  assert(
    orphanCategories.length === 0,
    `${key}: product categories missing from shells: ${orphanCategories.slice(0, 8).join(', ')}`
  );
}

for (const key of PK_CLOTHING_REGISTRATION_VERTICALS) {
  const payload = buildRegistrationSeedPayload({
    businessId: bizId,
    domainKey: key,
    countryIso: 'PK',
  });
  assert(payload.items.length > 0, `PK clothing ${key} must seed products`);
}

const restaurantReg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'restaurant-cafe',
  countryIso: 'PK',
});
assert(
  restaurantReg.categories.some((c) => /bbq|rolls|biryani|combos/i.test(String(c))),
  'restaurant-cafe registration categories must match Roll Inn SKU taxonomy (not generic Main Course)'
);

const jewelleryReg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'gems-jewellery',
  countryIso: 'PK',
});
assert(jewelleryReg.items.length >= 5, 'gems-jewellery registration should seed jewellery catalog');

const pharmacyNoPkg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'pharmacy',
  countryIso: 'PK',
});
assert(pharmacyNoPkg.items.length === 0, 'pharmacy without package must not seed products');
const pharmacyPkg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'pharmacy',
  countryIso: 'PK',
  domainPackageKey: 'pharmacy-commerce',
});
assert(pharmacyPkg.items.length > 0, 'pharmacy-commerce package should seed pharmacy catalog');

const furniturePkg = buildRegistrationSeedPayload({
  businessId: bizId,
  domainKey: 'furniture',
  countryIso: 'US',
  domainPackageKey: 'furniture-commerce',
});
assert(furniturePkg.items.length > 0, 'furniture-commerce package should seed furniture catalog');


// Prisma businesses.create() only accepts logo_url / cover_image_url from businessMedia.
// keywords must land on seoKeywords → settings.seo (never as a businesses column).
const ALLOWED_BUSINESS_MEDIA_KEYS = new Set(['logo_url', 'cover_image_url']);
const storefrontRegional = {
  countryName: 'Pakistan',
  countryCode: 'PK',
  currency: 'PKR',
  locale: 'en-PK',
};
for (const key of DOMAIN_KNOWLEDGE_KEYS) {
  let defaults;
  try {
    defaults = resolveRegistrationStorefrontDefaults({
      domainKey: key,
      businessName: `Verify ${key}`,
      regional: storefrontRegional,
    });
  } catch (err) {
    errors.push(`${key}: resolveRegistrationStorefrontDefaults threw: ${err.message}`);
    continue;
  }
  const mediaKeys = Object.keys(defaults.businessMedia || {});
  const invalidMedia = mediaKeys.filter((k) => !ALLOWED_BUSINESS_MEDIA_KEYS.has(k));
  assert(
    invalidMedia.length === 0,
    `${key}: businessMedia must only include Prisma columns (got ${invalidMedia.join(', ')})`
  );
  assert(
    defaults.seoKeywords == null || typeof defaults.seoKeywords === 'string',
    `${key}: seoKeywords must be string or null`
  );
}

const autoPartsSf = resolveRegistrationStorefrontDefaults({
  domainKey: 'auto-parts',
  businessName: 'Auto Parts Test',
  regional: storefrontRegional,
});
assert(
  !Object.prototype.hasOwnProperty.call(autoPartsSf.businessMedia || {}, 'keywords'),
  'auto-parts businessMedia must not include keywords'
);
assert(
  typeof autoPartsSf.seoKeywords === 'string' && autoPartsSf.seoKeywords.includes('auto parts'),
  'auto-parts must expose seoKeywords for settings.seo'
);
assert(
  typeof autoPartsSf.businessMedia?.cover_image_url === 'string',
  'auto-parts should still seed cover_image_url'
);

for (const key of SUPERMARKET_REGISTRATION_VERTICALS) {
  const payload = buildRegistrationSeedPayload({
    businessId: bizId,
    domainKey: key,
    countryIso: 'PK',
  });
  assert(payload.items.length > 0, `supermarket-family ${key} must seed products on PK registration`);
  const categorySet = new Set(payload.categories.map((c) => String(c).toLowerCase()));
  const orphans = [
    ...new Set(
      payload.items
        .map((i) => i.category)
        .filter(Boolean)
        .filter((c) => !categorySet.has(String(c).toLowerCase()))
    ),
  ];
  assert(orphans.length === 0, `${key}: missing category shells for ${orphans.slice(0, 5).join(', ')}`);
}

for (const key of SUPERMARKET_REGISTRATION_VERTICALS) {
  const sf = resolveRegistrationStorefrontDefaults({
    domainKey: key,
    businessName: `Verify ${key}`,
    regional: storefrontRegional,
  });
  assert(
    !Object.prototype.hasOwnProperty.call(sf.businessMedia || {}, 'keywords'),
    `${key}: supermarket-family businessMedia must not include keywords`
  );
  assert(
    typeof sf.businessMedia?.cover_image_url === 'string' || sf.seoKeywords == null || typeof sf.seoKeywords === 'string',
    `${key}: supermarket-family registration defaults must resolve without throwing`
  );
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}

console.log('OK: registration flow helpers (empty inventory, domain profile, demo catalog split, Prisma-safe media).');
