/**
 * Marine-parts storefront finder data and product-list URL builders.
 * Isolated from auto-parts (vehicle VIN/plate) and industrial-parts.
 */

import { resolveDomainKey } from '../config/domainKeyAliases.js';

export const MARINE_PARTS_FINDER_CANONICALS = new Set(['marine-parts']);

/**
 * @param {string | null | undefined} category
 */
export function isMarinePartsFinderStore(category) {
  return MARINE_PARTS_FINDER_CANONICALS.has(resolveDomainKey(category));
}

/** domain_data keys surfaced on product cards and detail specs. */
export const MARINE_PARTS_DISPLAY_FIELDS = [
  ['partnumber', 'Part number'],
  ['oemnumber', 'OEM number'],
  ['interchangecode', 'Interchange'],
  ['equipmenttype', 'Equipment type'],
  ['systemcondition', 'Condition'],
  ['vesseltype', 'Vessel type'],
  ['manufacturer', 'Manufacturer'],
  ['criticality', 'Stocking class'],
  ['warrantyperiod', 'Warranty'],
  ['compatiblemodels', 'Compatible models'],
];

/**
 * @param {Record<string, unknown> | null | undefined} domainData
 */
export function buildMarinePartsSpecifications(domainData) {
  if (!domainData || typeof domainData !== 'object') return {};
  /** @type {Record<string, string>} */
  const specs = {};
  for (const [key, label] of MARINE_PARTS_DISPLAY_FIELDS) {
    const val = domainData[key];
    if (val != null && String(val).trim()) specs[label] = String(val).trim();
  }
  return specs;
}

export const MARINE_EQUIPMENT_TYPES = [
  'Hydraulic retractable rudder propeller',
  'Well-mounted rudder propeller',
  'Tunnel thruster',
  'Azimuth L/Z-drive',
  'Pump-jet / waterjet',
  'Hydraulic crane',
  'Sterntube / shaft seal',
  'Steering gear',
  'Rudder',
  'Other',
];

export const MARINE_VESSEL_TYPES = [
  'Workboat',
  'Tug',
  'Ferry',
  'Tanker',
  'Cargo',
  'Yacht',
  'Naval',
  'Other',
];

export const MARINE_SYSTEM_CONDITIONS = ['new', 'used', 'refurbished', 'spare'];

/** @typedef {'partNumber' | 'oem' | 'equipment' | 'vessel'} MarineSearchMode */

/**
 * @param {string} base `/store/{domain}/products`
 * @param {{
 *   search?: string,
 *   searchMode?: MarineSearchMode,
 *   equipmentType?: string,
 *   vesselType?: string,
 *   systemCondition?: string,
 *   manufacturer?: string,
 *   category?: string,
 * }} params
 */
export function buildMarineProductsUrl(base, params = {}) {
  const q = new URLSearchParams();
  const search = String(params.search || '').trim();
  if (search) {
    q.set('search', search);
    if (params.searchMode) q.set('searchMode', params.searchMode);
  }
  if (params.equipmentType) q.set('equipmentType', params.equipmentType);
  if (params.vesselType) q.set('vesselType', params.vesselType);
  if (params.systemCondition) q.set('systemCondition', params.systemCondition);
  if (params.manufacturer) q.set('manufacturer', params.manufacturer);
  if (params.category) q.set('category', params.category);
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}
