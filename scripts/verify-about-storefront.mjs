/**
 * Smoke checks for About storefront config.
 */
import assert from 'node:assert/strict';
import {
  normalizeAboutStorefrontConfig,
  resolveAboutPageContent,
  prefersAboutPageByDefault,
  isAboutPageEnabled,
} from '../lib/storefront/aboutStorefront.js';

assert.equal(prefersAboutPageByDefault('marine-parts'), true);
assert.equal(prefersAboutPageByDefault('boutique-fashion'), false);

const marineDefault = normalizeAboutStorefrontConfig(null, { category: 'marine-parts' });
assert.equal(marineDefault.enabled, true);
assert.equal(marineDefault.showInFooter, true);

const retailDefault = normalizeAboutStorefrontConfig(null, { category: 'electronics' });
assert.equal(retailDefault.enabled, false);

const filled = resolveAboutPageContent({
  business: {
    business_name: 'Tenvo Marine',
    category: 'marine-parts',
    description: 'Propulsion specialists',
  },
  settings: {
    storefront: {
      about: {
        enabled: true,
        headline: 'Our company',
        ownerName: 'Alex',
        ownerTitle: 'CEO',
        team: [{ name: 'Sam', role: 'Sales' }],
        values: ['Quality', 'Speed'],
      },
    },
  },
});
assert.equal(filled.headline, 'Our company');
assert.equal(filled.hasOwner, true);
assert.equal(filled.hasTeam, true);
assert.equal(filled.values.length, 2);
assert.equal(isAboutPageEnabled({ storefront: { about: { enabled: false } } }, { category: 'marine-parts' }), false);

console.log('OK: about storefront');
