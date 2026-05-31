/**
 * Canonical public site origin (no trailing slash).
 * Default matches initial production host; set NEXT_PUBLIC_APP_URL when moving to tenvo.com / .org.
 */
export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL || 'https://tenvo.mindscapeanalytics.com';
  return raw.replace(/\/$/, '');
}
