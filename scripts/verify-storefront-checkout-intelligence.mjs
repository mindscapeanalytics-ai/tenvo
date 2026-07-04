#!/usr/bin/env bun
/**
 * Sanity-check cross-domain storefront checkout intelligence.
 */
import {
  isPurchasableStorefrontProduct,
  isPurchasableCartLine,
  resolveStorefrontProductBrowseHref,
} from '../lib/storefront/storefrontPurchasability.js';
import {
  filterPurchasableCartItems,
  applyStorefrontCartValidationIssues,
} from '../lib/storefront/storefrontCartSanitize.js';
import { mapCartLinesForValidation } from '../lib/storefront/storefrontCheckoutReconcile.js';

const UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const errors = [];

if (!isPurchasableStorefrontProduct({ id: UUID })) {
  errors.push('UUID product should be purchasable');
}
if (isPurchasableStorefrontProduct({ id: 'RIN-1234', catalog_preview: true })) {
  errors.push('preview SKU should not be purchasable');
}
if (!isPurchasableCartLine({ productId: UUID })) {
  errors.push('UUID cart line should be purchasable');
}
if (filterPurchasableCartItems([{ productId: UUID }, { productId: 'sku-only' }]).length !== 1) {
  errors.push('filterPurchasableCartItems should drop non-UUID lines');
}

const href = resolveStorefrontProductBrowseHref(
  { id: 'RIN-1', name: 'Test Dish', catalog_preview: true },
  'demo-restaurant'
);
if (!href.includes('search=')) {
  errors.push('preview product href should route to search');
}

const adjusted = applyStorefrontCartValidationIssues(
  [
    { productId: UUID, variantId: null, quantity: 3 },
    { productId: 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee', variantId: null, quantity: 1 },
  ],
  [{ productId: UUID, variantId: null, adjustQuantity: 1 }]
);
if (adjusted.length !== 2 || adjusted[0].quantity !== 1) {
  errors.push('applyStorefrontCartValidationIssues should clamp qty per line');
}

const mapped = mapCartLinesForValidation([{ productId: UUID, quantity: 2, name: 'Item' }]);
if (mapped[0].productId !== UUID || mapped[0].quantity !== 2) {
  errors.push('mapCartLinesForValidation should preserve cart fields');
}

if (errors.length) {
  console.error('verify-storefront-checkout-intelligence FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log('verify-storefront-checkout-intelligence OK');
