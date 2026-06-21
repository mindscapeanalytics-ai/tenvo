/**
 * Absolute URLs for post-checkout / portal / crypto return navigation.
 * Hub routes live at `/business/[domainSlug]` (not `/business/settings`).
 */

/**
 * @param {string} baseUrl - Origin only, e.g. https://app.example.com (no trailing slash)
 * @param {string} domainSlug - `businesses.domain` handle
 * @param {Record<string, string | undefined>} [query] - Query pairs (encoded via URLSearchParams)
 * @returns {string}
 */
export function businessHubUrl(baseUrl, domainSlug, query = {}) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  const slug = String(domainSlug || '').trim().toLowerCase();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  if (!base || !slug) {
    return qs ? `${base}/pricing?${qs}` : `${base}/pricing`;
  }
  return qs
    ? `${base}/business/${encodeURIComponent(slug)}?${qs}`
    : `${base}/business/${encodeURIComponent(slug)}`;
}

/**
 * Stripe Checkout `success_url` must include the literal `{CHECKOUT_SESSION_ID}` substring
 * (not URL-encoded), or substitution will not run.
 *
 * @param {string} baseUrl
 * @param {string} domainSlug
 * @returns {string}
 */
export function stripeCheckoutSuccessUrl(baseUrl, domainSlug) {
  const u = businessHubUrl(baseUrl, domainSlug, { tab: 'settings', billing: 'success' });
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}session_id={CHECKOUT_SESSION_ID}`;
}
