/**
 * Third-party CDNs that 403 when Referer is tenvo.store (Cloudflare hotlink / same-origin policy).
 * Use referrerPolicy=no-referrer when rendering these, or prefer Unsplash/local assets.
 */
export const HOTLINK_PROTECTED_HOSTS = new Set([
  'sehgalmotorsports.pk',
  'www.sehgalmotorsports.pk',
]);

/**
 * @param {string | null | undefined} url
 */
export function isHotlinkProtectedImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return HOTLINK_PROTECTED_HOSTS.has(host) || [...HOTLINK_PROTECTED_HOSTS].some((h) => host.endsWith(`.${h}`));
  } catch {
    return /sehgalmotorsports\.pk/i.test(url);
  }
}

/**
 * Safe referrer policy for remote storefront/marketing images.
 * Local /public paths keep the default; remotes (esp. hotlink-protected) omit Referer.
 * @param {string | null | undefined} url
 * @returns {'no-referrer' | undefined}
 */
export function resolveImageReferrerPolicy(url) {
  const raw = String(url || '').trim();
  if (!raw || raw.startsWith('/') || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return undefined;
  }
  return 'no-referrer';
}
