/**
 * Runtime helpers for Next.js image host allowlisting.
 * Patterns: `allowedImageHosts.json` (also required by next.config.js).
 */
import hostConfig from './allowedImageHosts.json';

const PATTERNS = Array.isArray(hostConfig?.remotePatterns) ? hostConfig.remotePatterns : [];

/**
 * @param {string} host
 * @param {string} pattern
 */
function matchHostnamePattern(host, pattern) {
  const h = String(host || '').toLowerCase();
  const p = String(pattern || '').toLowerCase();
  if (!h || !p) return false;
  if (p === h) return true;
  if (p.startsWith('**.')) {
    const base = p.slice(3);
    return h === base || h.endsWith(`.${base}`);
  }
  return false;
}

/**
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function getImageUrlHostname(url) {
  try {
    const raw = String(url || '').trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return '';
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * True when next/image may safely optimize this URL.
 * Relative/local paths and data URLs are allowed; unknown remote hosts are not
 * (passing them to next/image throws Invalid src in production).
 * @param {string | null | undefined} url
 */
export function isAllowedNextImageSrc(url) {
  const raw = String(url || '').trim();
  if (!raw) return false;
  if (raw.startsWith('/') || raw.startsWith('data:') || raw.startsWith('blob:')) return true;
  if (!/^https?:\/\//i.test(raw)) return false;
  const host = getImageUrlHostname(raw);
  if (!host) return false;
  return PATTERNS.some((row) => matchHostnamePattern(host, row.hostname));
}

export { PATTERNS as STOREFRONT_IMAGE_REMOTE_PATTERNS };
