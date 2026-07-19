#!/usr/bin/env node
/**
 * Static wiring checks for storefront payment eligibility + checkout panels.
 * Run: node scripts/verify-storefront-payments.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let failed = false;
const mark = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};

const eligibility = read('lib/storefront/storefrontPaymentEligibility.js');
const payments = read('lib/actions/storefront/payments.js');
const orders = read('app/api/storefront/[businessDomain]/orders/route.js');
const checkout = read('app/store/[businessDomain]/checkout/page.jsx');
const cryptoCreate = read('app/api/storefront/[businessDomain]/crypto/create/route.js');
const stripeIntent = read('app/api/storefront/[businessDomain]/stripe/create-intent/route.js');
const paymentMethods = read('app/api/storefront/[businessDomain]/payment-methods/route.js');

if (!eligibility.includes('resolveEligibleStorefrontPaymentMethods')) {
  mark('storefrontPaymentEligibility must resolve eligible methods');
}
if (!eligibility.includes('coerceStorefrontPaymentMethod')) {
  mark('storefrontPaymentEligibility must coerce unavailable methods to COD');
}
if (!payments.includes('resolveEligibleStorefrontPaymentMethods')) {
  mark('getAvailablePaymentMethods must use eligibility resolver');
}
if (payments.includes('methods.push({') && payments.includes("provider: 'crypto'")) {
  mark('getAvailablePaymentMethods must not auto-inject crypto without owner enable');
}
if (!orders.includes('coerceStorefrontPaymentMethod')) {
  mark('orders route must coerce payment method server-side');
}
if (orders.includes("effectivePaymentMethod = 'cod'") && orders.includes('payment method gate skipped')) {
  mark('orders route must not soft-fail payment gate to COD');
}
if (!orders.includes('payment method gate failed') || !orders.includes('503')) {
  mark('orders route must fail closed (503) when payment eligibility cannot load');
}
if (!paymentMethods.includes('status: 503') || !paymentMethods.includes('success: false')) {
  mark('payment-methods GET must fail closed (503) on unexpected load errors');
}
{
  const outerCatchIdx = paymentMethods.lastIndexOf('catch (error)');
  const outerCatch = outerCatchIdx >= 0 ? paymentMethods.slice(outerCatchIdx) : '';
  if (outerCatch.includes('STOREFRONT_COD_METHOD') && !outerCatch.includes('status: 503')) {
    mark('payment-methods outer catch must not soft-return COD success');
  }
}
const checkoutClient = read('lib/storefront/storefrontCheckoutClient.js');
if (
  checkoutClient.includes('fall through to COD') ||
  (checkoutClient.includes('return COD_FALLBACK') &&
    checkoutClient.includes('catch') &&
    /catch \{[\s\S]*return COD_FALLBACK/.test(checkoutClient))
) {
  mark('fetchStorefrontPaymentMethods must not soft-fallback to COD on API errors');
}
if (!checkout.includes('StripeCheckoutPanel')) {
  mark('checkout must render StripeCheckoutPanel for card payments');
}
if (!cryptoCreate.includes('isStorefrontPaymentProviderReady')) {
  mark('crypto create must verify business enabled crypto');
}
if (!stripeIntent.includes('createStorefrontStripePaymentIntent')) {
  mark('stripe create-intent route must exist');
}

if (failed) {
  process.exit(1);
}
console.log('OK: storefront payment wiring checks passed');
