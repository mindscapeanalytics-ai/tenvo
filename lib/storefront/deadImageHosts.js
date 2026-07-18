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
  // Marketing / elevated home section IDs verified 404 (Jul 2026)
  'photo-1619405399517-d7fdef856543',
  'photo-1629909613654-28e495c44ad7',
  'photo-1581578735548-049c48d88d70',
  'photo-1587854694152-42e3e8f5b672',
  'photo-1471869640468-c56530f4c4d2',
  'photo-1550572017-edd390b6992c',
  'photo-1550572017-edd951aaee62',
  'photo-1607611568730-7d8a1a2612d4',
  'photo-1515488042361-ee00e8170dc0',
  'photo-1579684385127-1ef15d508a118',
  'photo-1570172619644-dfd955f5b7a3',
  'photo-1583292650118-0c8d2f9a9f2d',
  'photo-1520639882103-d7964dc5a26a',
  'photo-1600566753086-17f0baa2a6c3',
  'photo-1600210492486-7c9b86f56020',
  'photo-1504148455328-c376675a07ab',
  'photo-1576091160399-112ba8d25d1f',
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
