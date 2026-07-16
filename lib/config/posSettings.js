/**
 * Tenant POS preferences stored at business.settings.pos
 */

export const DEFAULT_POS_SETTINGS = Object.freeze({
    barcodeMode: 'auto', // auto | wedge | camera | manual
    defaultPaymentMethod: 'cash',
    requireSession: false,
    autoPrintReceipt: true,
    taxInclusiveDisplay: false,
    receiptFooter: '',
    allowCreditSale: false,
    blockExpiredProducts: true,
    enforcePharmacyBatch: true,
    enforceWholesaleMoq: true,
    syncRestaurantToPos: true,
    offlineModeEnabled: false,
    /** Empty string disables manager PIN prompts */
    managerPin: '',
    requirePinForClear: true,
    requirePinForTaxExempt: true,
    /** Require PIN when order discount % exceeds this (0 = never by %) */
    requirePinForDiscountAbove: 15,
    loyaltyAtTill: true,
    /** Attempt ESC/POS drawer kick after cash sales */
    cashDrawerKickOnCashSale: true,
});

/**
 * @param {Record<string, unknown>} [business]
 */
export function resolvePosSettings(business) {
    const raw = business?.settings?.pos;
    const fromSettings = raw && typeof raw === 'object' ? raw : {};
    return {
        ...DEFAULT_POS_SETTINGS,
        ...fromSettings,
    };
}

/**
 * @param {Record<string, unknown>} currentSettings
 * @param {Partial<typeof DEFAULT_POS_SETTINGS>} posPatch
 */
export function mergePosSettingsIntoBusiness(currentSettings = {}, posPatch = {}) {
    const base = currentSettings && typeof currentSettings === 'object' ? currentSettings : {};
    return {
        ...base,
        pos: {
            ...DEFAULT_POS_SETTINGS,
            ...(base.pos && typeof base.pos === 'object' ? base.pos : {}),
            ...posPatch,
        },
    };
}

/**
 * Whether a till action needs manager PIN given current settings.
 * @param {'clear' | 'tax_exempt' | 'discount' | 'paid_out'} action
 * @param {ReturnType<typeof resolvePosSettings>} settings
 * @param {{ discountPercent?: number }} [ctx]
 */
export function posActionRequiresManagerPin(action, settings, ctx = {}) {
    const pin = String(settings?.managerPin || '').trim();
    if (!pin) return false;
    if (action === 'clear') return settings.requirePinForClear !== false;
    if (action === 'tax_exempt') return settings.requirePinForTaxExempt !== false;
    if (action === 'paid_out') return true;
    if (action === 'discount') {
        const threshold = Number(settings.requirePinForDiscountAbove);
        if (!Number.isFinite(threshold) || threshold <= 0) return false;
        const pct = Number(ctx.discountPercent) || 0;
        return pct >= threshold;
    }
    return false;
}
