/**
 * Smoke checks for storefront brand mark resolver (no DB).
 */
import assert from 'node:assert/strict';
import {
  normalizeStorefrontBranding,
  inferStorefrontBrandMode,
  resolveStorefrontBrandMark,
  resolveBrandTextClassName,
} from '../lib/storefront/storefrontBrandMark.js';

assert.equal(normalizeStorefrontBranding(null).mode, null);
assert.equal(normalizeStorefrontBranding({ mode: 'logo' }).mode, 'logo');
assert.equal(normalizeStorefrontBranding({ mode: 'nope' }).mode, null);
assert.equal(inferStorefrontBrandMode('https://x/logo.webp', null), 'logo-text');
assert.equal(inferStorefrontBrandMode(null, null), 'text');
assert.equal(inferStorefrontBrandMode('https://x/logo.webp', { mode: 'text' }), 'text');

const legacyLogo = resolveStorefrontBrandMark({
  business: { business_name: 'Legacy Co', logo_url: 'https://cdn.example/logo.webp', category: 'retail' },
  settings: {},
});
assert.equal(legacyLogo.mode, 'logo-text');
assert.equal(legacyLogo.showLogo, true);
assert.equal(legacyLogo.showText, true);

const withLogo = resolveStorefrontBrandMark({
  business: { business_name: 'Tenvo Marine', logo_url: 'https://cdn.example/logo.webp', category: 'marine-parts' },
  settings: { storefront: { branding: { mode: 'logo', textStyle: 'bold', iconKey: 'anchor' } } },
});
assert.equal(withLogo.mode, 'logo');
assert.equal(withLogo.showLogo, true);
assert.equal(withLogo.showText, false);
assert.equal(withLogo.showIcon, false);

const textOnly = resolveStorefrontBrandMark({
  business: { business_name: 'Aqua Shop', category: 'marine-parts' },
  settings: { storefront: { branding: { mode: 'text', textStyle: 'editorial' } } },
});
assert.equal(textOnly.mode, 'text');
assert.equal(textOnly.showText, true);
assert.equal(textOnly.showLogo, false);
assert.match(textOnly.textClassName, /uppercase/);

const iconText = resolveStorefrontBrandMark({
  business: { business_name: 'Fit Co', category: 'gym-fitness' },
  settings: { storefront: { branding: { mode: 'icon-text', iconKey: 'dumbbell' } } },
  displayName: 'Fit Co Gym',
});
assert.equal(iconText.showIcon, true);
assert.equal(iconText.showText, true);
assert.equal(iconText.displayName, 'Fit Co Gym');

assert.ok(resolveBrandTextClassName('classic').includes('font-semibold'));

console.log('OK: storefront brand mark');
