/**
 * Owner marketing banners for data-lab demo storefronts.
 * Default: no auto banners — elevated templates ship vertical homepage sections instead.
 * Owners add banners via Settings → Homepage marketing sections.
 */
import { getActivePageSections } from '../storefront/storePageSections.js';

/** @param {object | null | undefined} section */
export function isDemoAutoPageSection(section) {
  return String(section?.id || '').startsWith('demo-');
}

/**
 * Remove legacy auto-seeded demo banners (full-width product image under hero).
 * @param {object} settings
 */
export function stripDemoAutoPageSections(settings) {
  const prev = settings && typeof settings === 'object' ? settings : {};
  const rows = Array.isArray(prev.pageSections) ? prev.pageSections : [];
  const filtered = rows.filter((row) => !isDemoAutoPageSection(row));
  if (filtered.length === rows.length) return prev;
  return { ...prev, pageSections: filtered };
}

/**
 * @param {{ domainKey: string; domainHandle?: string; storefrontProfile?: Record<string, unknown>; productImages?: string[] }} _params
 * @returns {object[]}
 */
export function buildDemoPageSectionsSeed(_params = {}) {
  return [];
}

/**
 * Merge demo page sections only when tenant has none active.
 * @param {object} settings
 * @param {object} _ctx
 */
export function mergeDemoPageSectionsIntoSettings(settings, _ctx) {
  const prev = settings && typeof settings === 'object' ? settings : {};
  const active = getActivePageSections(prev.pageSections);
  if (active.length > 0) return prev;

  return {
    ...prev,
    pageSections: buildDemoPageSectionsSeed(),
  };
}
