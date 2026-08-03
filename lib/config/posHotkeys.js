/**
 * Canonical POS function-key map (Busy / AmberPOS-style power till).
 */

/** @typedef {'search' | 'customer' | 'discount' | 'hold' | 'pay' | 'payment' | 'tax' | 'clear' | 'print'} PosHotkeyAction */

/** @type {Record<string, PosHotkeyAction>} */
export const POS_HOTKEY_MAP = Object.freeze({
    F1: 'search',
    F2: 'customer',
    F3: 'discount',
    F4: 'hold',
    F5: 'pay',
    F6: 'payment',
    F7: 'tax',
    F8: 'clear',
    F9: 'print',
});

/** @type {Array<{ key: string, action: PosHotkeyAction, label: string, shortLabel: string }>} */
export const POS_HOTKEY_DOCK_ITEMS = Object.freeze([
    { key: 'F1', action: 'search', label: 'Search', shortLabel: 'Search' },
    { key: 'F2', action: 'customer', label: 'Customer', shortLabel: 'Customer' },
    { key: 'F3', action: 'discount', label: 'Discount', shortLabel: 'Disc' },
    { key: 'F4', action: 'hold', label: 'Hold', shortLabel: 'Hold' },
    { key: 'F5', action: 'pay', label: 'Pay', shortLabel: 'Pay' },
    { key: 'F6', action: 'payment', label: 'Tender', shortLabel: 'Tender' },
    { key: 'F7', action: 'tax', label: 'Tax', shortLabel: 'Tax' },
    { key: 'F8', action: 'clear', label: 'Clear', shortLabel: 'Clear' },
    { key: 'F9', action: 'print', label: 'Print', shortLabel: 'Print' },
]);

export const POS_PAYMENT_CYCLE = Object.freeze(['cash', 'card', 'wallet', 'split']);

/**
 * @param {string} current
 * @param {string[]} [cycle]
 */
export function nextPosPaymentMethod(current, cycle = POS_PAYMENT_CYCLE) {
    const list = cycle.length ? cycle : POS_PAYMENT_CYCLE;
    const idx = list.indexOf(String(current || 'cash').toLowerCase());
    return list[(idx + 1) % list.length];
}
