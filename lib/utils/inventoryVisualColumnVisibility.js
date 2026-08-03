import { readGridCellValue } from '@/lib/utils/inventoryGridColumns';

function isFilledCellValue(value) {
  if (value == null || value === '') return false;
  const s = String(value).trim();
  return s !== '' && s !== '-';
}

/**
 * Hide domain columns in Visual mode when fewer than `minFillRate` rows have data.
 */
export function buildSparseDomainColumnVisibility(columns, rows, category, minFillRate = 0.12) {
  if (!Array.isArray(columns) || !rows?.length) return {};

  const visibility = {};
  const total = rows.length;

  for (const col of columns) {
    if (!col?.id?.startsWith('domain_') || !col.accessorKey) continue;

    const filled = rows.reduce((count, row) => {
      const value = readGridCellValue(row, col.accessorKey, category);
      return count + (isFilledCellValue(value) ? 1 : 0);
    }, 0);

    if (filled / total < minFillRate) {
      visibility[col.id] = false;
    }
  }

  return visibility;
}

/** Excel column picker keys for sparse domain columns. */
export function buildSparseHiddenColumnKeys(columns, rows, category, minFillRate = 0.12) {
  const visibility = buildSparseDomainColumnVisibility(columns, rows, category, minFillRate);
  const keys = new Set();
  for (const col of columns) {
    if (col?.id && visibility[col.id] === false) {
      keys.add(col.accessorKey || col.id);
    }
  }
  return keys;
}
