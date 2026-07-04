import {
  applyStorefrontCartValidationIssues,
  filterPurchasableCartItems,
} from '@/lib/storefront/storefrontCartSanitize';
import { validateStorefrontCheckoutCart } from '@/lib/storefront/placeStorefrontOrder';

/**
 * Map cart lines for server validation.
 * @param {object[]} items
 */
export function mapCartLinesForValidation(items) {
  return (items || []).map((i) => ({
    productId: i.productId,
    variantId: i.variantId || null,
    quantity: i.quantity,
    name: i.name,
  }));
}

/**
 * Validate cart with server rules; return sanitized lines when fixes apply.
 * @param {string} businessDomain
 * @param {object[]} items — raw cart lines
 */
export async function reconcileStorefrontCheckoutCart(businessDomain, items) {
  const sanitized = filterPurchasableCartItems(items);
  if (!sanitized.length) {
    return {
      ok: false,
      error: 'Your cart is empty',
      issues: [],
      items: [],
      changed: items.length !== sanitized.length,
    };
  }

  try {
    await validateStorefrontCheckoutCart(businessDomain, mapCartLinesForValidation(sanitized));
    return {
      ok: true,
      items: sanitized,
      issues: [],
      changed: items.length !== sanitized.length,
    };
  } catch (err) {
    const issues = err.issues || [];
    if (issues.length) {
      const nextItems = applyStorefrontCartValidationIssues(sanitized, issues);
      return {
        ok: nextItems.length > 0,
        error: err.message || 'Some items in your cart are no longer available',
        issues,
        items: nextItems,
        changed: true,
      };
    }
    throw err;
  }
}
