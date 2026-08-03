/**
 * Stable row keys shared by BusyGrid, ExcelModeModal validation, and save guards.
 */
export function inventoryGridRowKey(row, rowIndex = 0) {
  if (!row) return `__${rowIndex}`;
  if (row.id != null && row.id !== '') return String(row.id);
  if (row._tempId != null) return String(row._tempId);
  return `__${rowIndex}`;
}

/**
 * Validation error map keys: `${inventoryGridRowKey(row, index)}-${field}`.
 */
export function inventoryValidationErrorKey(row, rowIndex, field) {
  return `${inventoryGridRowKey(row, rowIndex)}-${field}`;
}
