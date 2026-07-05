import { describe, expect, it } from 'vitest';
import {
  buildExcelMobileHiddenColumnKeys,
  EXCEL_MOBILE_ESSENTIAL_KEYS,
  resolveExcelMobileColumnWidth,
} from '@/lib/utils/inventoryExcelMobile';

describe('inventoryExcelMobile', () => {
  it('hides non-essential columns on mobile profile', () => {
    const columns = [
      { accessorKey: 'name' },
      { accessorKey: 'mrp' },
      { accessorKey: 'max_stock' },
      { id: 'status_dot' },
    ];
    const hidden = buildExcelMobileHiddenColumnKeys(columns);
    expect(hidden.has('mrp')).toBe(true);
    expect(hidden.has('max_stock')).toBe(true);
    expect(hidden.has('name')).toBe(false);
    expect(EXCEL_MOBILE_ESSENTIAL_KEYS.has('name')).toBe(true);
  });

  it('widens touch columns when touchOptimized', () => {
    expect(resolveExcelMobileColumnWidth({ accessorKey: 'name' }, true)).toBe(160);
    expect(resolveExcelMobileColumnWidth({ accessorKey: 'unknown_field' }, true)).toBe(96);
    expect(resolveExcelMobileColumnWidth({ accessorKey: 'name' }, false)).toBeNull();
  });
});
