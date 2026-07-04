/** Mobile inventory catalog layout — list is default (best for tap-to-edit data entry). */

export const INVENTORY_MOBILE_VIEW_STORAGE_KEY = 'tenvo-inventory-mobile-view';

export const INVENTORY_MOBILE_VIEWS = {
  list: { id: 'list', label: 'List', hint: 'Tap to edit · quick stock' },
  cards: { id: 'cards', label: 'Cards', hint: 'Visual browse' },
};

export const DEFAULT_INVENTORY_MOBILE_VIEW = 'list';

export function readInventoryMobileViewPreference() {
  if (typeof window === 'undefined') return DEFAULT_INVENTORY_MOBILE_VIEW;
  try {
    const stored = window.localStorage.getItem(INVENTORY_MOBILE_VIEW_STORAGE_KEY);
    if (stored === 'list' || stored === 'cards') return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_INVENTORY_MOBILE_VIEW;
}

export function writeInventoryMobileViewPreference(mode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INVENTORY_MOBILE_VIEW_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
