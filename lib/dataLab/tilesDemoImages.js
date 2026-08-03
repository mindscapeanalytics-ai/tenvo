/**
 * Curated Unsplash imagery for tiles, marble & stone demo stores.
 * Taxonomy inspired by STILE spaces/collections and natural-stone catalogs
 * (SK Stones, SMB Marble) — imagery is Unsplash stock, not competitor CDNs.
 * @see https://unsplash.com/license
 */
import { buildUnsplashImageUrl } from '../storefront/unsplashUrl.js';

/** @param {string} photoId @param {number} [w] */
export function tilesStockImage(photoId, w = 900) {
  return buildUnsplashImageUrl(photoId, { w, q: 85 });
}

/**
 * Verified interior / surface photo ids (Unsplash photo-{id}).
 * Avoid fabricated hex tails — dead IDs leave empty tiles on the public store.
 * @type {Record<string, string>}
 */
export const TILES_DEMO_PHOTO_IDS = {
  heroFloor: '1600585154340-be6161a56a0c',
  heroWall: '1600566753190-17f0baa2a6c3',
  heroOutdoor: '1600585154526-990dced4db0d',
  heroShowroom: '1600210492491-09497fd6d5c3',
  living: '1600210492491-09497fd6d5c3',
  dining: '1615874959471-fe2bbce3e3e5',
  bedroom: '1505693416388-ac5ce068fe85',
  bathroom: '1584622650111-993a426fbf0a',
  kitchen: '1556912173-46c336c7fd55',
  outdoor: '1600585154084-dbf211d73318',
  porcelain: '1600585154340-be6161a56a0c',
  marbleWhite: '1615874959471-fe2bbce3e3e5',
  marbleGold: '1600566753190-17f0baa2a6c3',
  granite: '1600585154526-990dced4db0d',
  onyx: '1600566753190-17f0baa2a6c3',
  travertine: '1600585154526-990dced4db0d',
  limestone: '1600210492491-09497fd6d5c3',
  mosaic: '1584622650111-993a426fbf0a',
  woodPlank: '1600585154340-be6161a56a0c',
  vitrified: '1600585154084-dbf211d73318',
  adhesive: '1581092160562-40aa08e78837',
  collectionElite: '1615874959471-fe2bbce3e3e5',
  collectionModish: '1600566753190-17f0baa2a6c3',
  collectionSignature: '1584622650111-993a426fbf0a',
};

/**
 * @param {keyof typeof TILES_DEMO_PHOTO_IDS | string} key
 * @param {number} [w]
 */
export function getTilesDemoImage(key, w = 900) {
  const id = TILES_DEMO_PHOTO_IDS[key] || TILES_DEMO_PHOTO_IDS.heroFloor;
  return tilesStockImage(id, w);
}
