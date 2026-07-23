/**
 * Known-dead external image hosts. URLs on these hosts no longer resolve
 * (DNS ENOTFOUND / permanently offline CDNs), so we treat them as missing and
 * fall back to curated stock imagery instead of letting the Next.js image
 * optimizer hammer them and spam `fetch failed` / `upstream image response failed`.
 */
export const DEAD_IMAGE_HOSTS = new Set([
  'cloud.superme.al',
  // Magento cache hotlink-blocked (403); also not in next.config remotePatterns →
  // next/image throws Invalid src and production digests ErrorBoundary crashes.
  'imraneshop.com',
  'www.imraneshop.com',
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
  // Electronics / phone pool IDs verified 404 (Jul 2026)
  'photo-1626806787461-94efa66c42c8',
  'photo-1592899677977-99c296376d88',
  'photo-1631545806609-7a0f4b8a0c8f',
  'photo-1461158534269-385e6683c365',
  // Cross-store pool / placeholder IDs verified 404 (Jul 2026 bulk probe)
  'photo-1490481651871-ab68de25d000',
  'photo-1504148455325-0c9e7ed84403',
  'photo-1507473889641-bef09dcb8081',
  'photo-1515562141207-7a88fbbeb966',
  'photo-1516734212186-a967f81ad9d7',
  'photo-1519641471654-76ce5427da69',
  'photo-1521572267360-ee0c2907d7e0',
  'photo-1522771739844-6a9f6d5f31af',
  'photo-1523206489230-c012c64b2c48',
  'photo-1525547719571-a2d4ac8944e2',
  'photo-1548036328-c9fa89d9b363',
  'photo-1550583724-b2692b85aa20',
  'photo-1553062407-98ae227d21a5',
  'photo-1555041469-a32ef8fd9617',
  'photo-1558171813-e2f8110a3b1e',
  'photo-1560008581-09826d1d69c4',
  'photo-1572804013307-28ccbfc7ecb4',
  'photo-1578985545062-55a8154f7274',
  'photo-1585659722983-cb0e1e2f9b47',
  'photo-1585705117036-856f63a4e20e',
  'photo-1586796640118-4811f0880a72',
  'photo-1588964895597-cfccd6bf2d57',
  'photo-1615874959471-fe2bbce3e3e5',
  'photo-1619642751034-765df43d7749',
  'photo-1625047509248-ec889cbff817',
  'photo-1626689455954-5652d2f6f0b8',
  'photo-1627123427854-05d3f2b9d900',
  'photo-1627457390561-67c14815660e',
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
