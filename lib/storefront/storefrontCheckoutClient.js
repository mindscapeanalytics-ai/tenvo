import { STOREFRONT_COD_METHOD } from '@/lib/storefront/storefrontPaymentEligibility';

const COD_FALLBACK = [{ ...STOREFRONT_COD_METHOD }];

/**
 * Load eligible payment methods for storefront checkout (public API).
 * Missing / empty domain → COD only (no tenant context).
 * API success with methods → those methods.
 * Unexpected API failure (incl. 503) → empty list so checkout can fail closed / retry
 * instead of silently advertising COD.
 * @param {string} businessDomain
 * @returns {Promise<Array>}
 */
export async function fetchStorefrontPaymentMethods(businessDomain) {
  if (!businessDomain) return COD_FALLBACK;

  try {
    const response = await fetch(
      `/api/storefront/${encodeURIComponent(businessDomain)}/payment-methods`,
      { cache: 'no-store' }
    );
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success && Array.isArray(data.methods) && data.methods.length > 0) {
      return data.methods;
    }
    // 42P01 soft COD still returns success:true with COD — handled above.
    // Fail closed on 503 / empty / malformed so UI does not invent eligibility.
    if (!response.ok || data.success === false) {
      return [];
    }
    if (Array.isArray(data.methods)) {
      return data.methods;
    }
  } catch {
    return [];
  }

  return [];
}

export { COD_FALLBACK as STOREFRONT_COD_FALLBACK };
