/**
 * Smoke checks for store connection CTA resolver.
 */
import assert from 'node:assert/strict';
import {
  supportsStoreConnectionButtons,
  resolveStoreConnectionActions,
  formatTelHref,
  getStoreConnectionConfig,
} from '../lib/storefront/storeConnectionActions.js';

assert.equal(supportsStoreConnectionButtons('marine-parts'), true);
assert.equal(supportsStoreConnectionButtons('industrial-parts'), true);
assert.equal(supportsStoreConnectionButtons('boutique-fashion'), false);
assert.equal(formatTelHref('+31 481 424 303'), 'tel:+31481424303');

const actions = resolveStoreConnectionActions({
  business: {
    category: 'marine-parts',
    business_name: 'Tenvo Marine',
    domain: 'demo-marine',
  },
  settings: {
    contact: {
      published: true,
      email: 'parts@tenvo.example',
      phone: '+31481424303',
      whatsapp: '+31481424303',
      country: 'Netherlands',
    },
    storefront: {
      connection: {
        preferWhatsApp: false,
        quoteLabel: 'Receive Quotation',
      },
    },
  },
  businessDomain: 'demo-marine',
});

assert.equal(actions.length, 3);
assert.equal(actions[0].id, 'quote');
assert.ok(actions[0].href.includes('/contact?subject=quotation'));
assert.equal(actions[1].id, 'call');
assert.equal(actions[1].href, 'tel:+31481424303');
assert.equal(actions[2].id, 'mail');
assert.equal(actions[2].href, 'mailto:parts@tenvo.example');

const wa = resolveStoreConnectionActions({
  business: { category: 'industrial-parts', domain: 'demo-industrial' },
  settings: {
    contact: { published: true, phone: '03001234567', whatsapp: '03001234567', country: 'Pakistan' },
    storefront: { connection: { preferWhatsApp: true, showMail: false } },
  },
  businessDomain: 'demo-industrial',
});
assert.ok(wa.some((a) => a.id === 'whatsapp' && a.href.includes('wa.me')));
assert.ok(!wa.some((a) => a.id === 'mail'));

assert.equal(getStoreConnectionConfig({}).enabled, true);

console.log('OK: store connection actions');
