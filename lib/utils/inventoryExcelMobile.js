/**
 * Mobile Excel / bulk-entry column profile and layout helpers.
 * Keeps data entry focused on high-signal fields below the lg breakpoint.
 */

/** Always visible on mobile bulk grid (plus status_dot). */
export const EXCEL_MOBILE_ESSENTIAL_KEYS = new Set([
  'name',
  'sku',
  'barcode',
  'category',
  'brand',
  'price',
  'cost_price',
  'stock',
  'min_stock',
  'reorder_point',
]);

/** Minimum touch-friendly column widths (px) on compact viewports. */
export const EXCEL_MOBILE_COLUMN_MIN_WIDTH = {
  name: 160,
  sku: 120,
  barcode: 120,
  category: 120,
  brand: 110,
  price: 100,
  cost_price: 100,
  stock: 88,
  min_stock: 88,
  reorder_point: 100,
  default: 96,
};

/**
 * Keys to hide on mobile so the grid stays legible; user can re-enable via Columns picker.
 * @param {Array<{ accessorKey?: string, id?: string }>} columns
 * @returns {Set<string>}
 */
export function buildExcelMobileHiddenColumnKeys(columns = []) {
  const hidden = new Set();
  for (const col of columns) {
    const key = col.accessorKey || col.id;
    if (!key || key === 'status_dot') continue;
    if (!EXCEL_MOBILE_ESSENTIAL_KEYS.has(key)) {
      hidden.add(key);
    }
  }
  return hidden;
}

/**
 * @param {{ accessorKey?: string, id?: string, width?: number, size?: number }} col
 * @param {boolean} touchOptimized
 */
export function resolveExcelMobileColumnWidth(col, touchOptimized) {
  if (!touchOptimized) return null;
  const key = col.accessorKey || col.id;
  if (!key) return EXCEL_MOBILE_COLUMN_MIN_WIDTH.default;
  return EXCEL_MOBILE_COLUMN_MIN_WIDTH[key] ?? EXCEL_MOBILE_COLUMN_MIN_WIDTH.default;
}
