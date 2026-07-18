/**
 * Known-dead external image hosts. URLs on these hosts no longer resolve
 * (DNS ENOTFOUND / permanently offline CDNs), so we treat them as missing and
 * fall back to curated stock imagery instead of letting the Next.js image
 * optimizer hammer them and spam `fetch failed` / `upstream image response failed`.
 */
export const DEAD_IMAGE_HOSTS = new Set([
  'cloud.superme.al',
]);

/**
 * Known-dead image URL fragments — individual assets that were removed upstream
 * (e.g. Unsplash photo IDs that now return 404 to the image optimizer). Matched
 * as substrings so query params / sizing suffixes don't matter. Treated as
 * missing so the monogram/brand placeholder renders instead of a broken image
 * and a failed optimizer fetch. Verified dead via the optimizer at render time.
 */
export const DEAD_IMAGE_URL_FRAGMENTS = new Set([
  'photo-1517048676732-2162716b9996',
  'photo-1619767886555-efdc259cde1a',
  'photo-1494976388531-d1058498cdd8',
  'photo-1607868895042-8aabcb736287',
  'photo-1542362565-777542eab9da',
  'photo-1544639917-a0f146b8456b',
  'photo-1583121274602-3c12800fd3b5',
  'photo-1619644094661-99a4c4e4b711',
  'photo-1580273916550-bfc281217630',
  'photo-1450778869188-41d060ede37d',
  'photo-1617814076665-75e412d1d0cd',
  'photo-1622484218808-aa8020a849b1',
  'photo-1579722821273-0f6c8d1b1c3f',
]);

/**
 * @param {string | null | undefined} url
 * @returns {boolean} true when the URL points at a known-dead image host or asset.
 */
export function isDeadImageUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  for (const host of DEAD_IMAGE_HOSTS) {
    if (url.includes(`//${host}/`) || url.endsWith(`//${host}`)) return true;
  }
  for (const fragment of DEAD_IMAGE_URL_FRAGMENTS) {
    if (url.includes(fragment)) return true;
  }
  return false;
}
