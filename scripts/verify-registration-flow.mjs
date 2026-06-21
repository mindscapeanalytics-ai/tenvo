/**
 * Smoke-test registration provisioning helpers (no DB required).
 * Run: node scripts/verify-registration-flow.mjs
 */
import { buildRegistrationSeedPayload, buildRegistrationSettingsSnapshot } from '../lib/utils/registrationSeed.js';
import { getDefaultCoaForCountry } from '../lib/config/regionalCoa.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { DOMAIN_KNOWLEDGE_KEYS } from '../lib/domainKnowledge.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const pkRetail = buildRegistrationSeedPayload({
  businessId: '00000000-0000-0000-0000-000000000001',
  domainKey: 'retail-shop',
  countryIso: 'PK',
});
assert(pkRetail.items.length > 0, 'PK retail-shop should produce seed items');
assert(pkRetail.categories.length > 0, 'PK retail-shop should produce categories');
assert(pkRetail.items[0].price > 0, 'PK retail seed should preserve template defaultPrice');
assert(pkRetail.items[0].stock > 0, 'PK retail seed should preserve template startingStock');
assert(pkRetail.items[0].brand, 'PK retail seed should assign a brand');

const aePharmacy = buildRegistrationSeedPayload({
  businessId: '00000000-0000-0000-0000-000000000001',
  domainKey: 'pharmacy',
  countryIso: 'AE',
});
assert(aePharmacy.items.length > 0, 'AE pharmacy should produce seed items');
assert(
  aePharmacy.items.some((i) => i.brand && !String(i.brand).includes('Getz')),
  'AE pharmacy brands should differ from PK defaults when possible'
);

const groceryZero = buildRegistrationSeedPayload({
  businessId: '00000000-0000-0000-0000-000000000001',
  domainKey: 'grocery',
  countryIso: 'PK',
});
assert(
  groceryZero.items.every((i) => i.tax_percent === 0),
  'Grocery vertical defaultTax 0 should not be overridden by PK regional defaultTaxRate'
);

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
    businessId: '00000000-0000-0000-0000-000000000001',
    domainKey: key,
    countryIso: 'PK',
  });
  assert(Array.isArray(payload.items), `payload items array for ${key}`);
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}

console.log('OK: registration flow helpers (seed payload, COA, domain knowledge).');
