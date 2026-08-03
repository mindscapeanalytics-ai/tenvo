import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';
import { isPurchasableCartLine } from '@/lib/storefront/storefrontPurchasability';

/**
 * Client-side: drop cart lines that cannot checkout (preview / corrupt refs).
 * @param {Array<{ productId?: string }>} items
 */
export function filterPurchasableCartItems(items) {
  return (items || []).filter(isPurchasableCartLine);
}

/**
 * Apply server validation issues to cart lines (remove OOS, clamp qty).
 * @param {Array<object>} items
 * @param {Array<object>} issues
 */
export function applyStorefrontCartValidationIssues(items, issues = []) {
  if (!issues.length) return items;
  let next = [...items];
  for (const issue of issues) {
    const matchesLine = (i) =>
      i.productId === issue.productId &&
      (issue.variantId == null || issue.variantId === '' || i.variantId === issue.variantId);

    if (issue.removed) {
      next = next.filter((i) => !matchesLine(i));
      continue;
    }
    if (issue.adjustQuantity != null && issue.productId) {
      const qty = Number(issue.adjustQuantity);
      if (qty <= 0) {
        next = next.filter((i) => !matchesLine(i));
      } else {
        next = next.map((i) =>
          matchesLine(i) ? { ...i, quantity: qty, maxQuantity: qty } : i
        );
      }
    }
  }
  return next;
}
