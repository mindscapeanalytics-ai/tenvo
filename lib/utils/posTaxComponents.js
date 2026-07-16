/**
 * POS multi-component tax (GST / PST / VAT) for till totals and receipt breakout.
 * Line taxPercent stays as the sum of active components for POSService compatibility.
 */

/**
 * @typedef {{ key: string, label: string, rate: number }} PosTaxComponent
 * @typedef {'standard' | 'gst_only' | 'exempt'} PosTaxMode
 */

/**
 * @param {unknown} value
 * @param {number} [fallback=0]
 */
function toRate(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Resolve till tax components from tax_configurations + regional UI pack.
 * Does not invent stacked provincial rates when PST is unset (defaults to GST/VAT only).
 *
 * @param {{
 *   taxConfig?: Record<string, unknown> | null,
 *   defaultTaxRate?: number,
 *   taxStrategy?: string,
 *   taxLabel?: string,
 *   taxMode?: PosTaxMode,
 * }} opts
 * @returns {PosTaxComponent[]}
 */
export function resolvePosTaxComponents(opts = {}) {
    const mode = opts.taxMode || 'standard';
    if (mode === 'exempt') return [];

    const cfg = opts.taxConfig && typeof opts.taxConfig === 'object' ? opts.taxConfig : {};
    const strategy = String(opts.taxStrategy || 'VAT').toUpperCase();
    const packRate = toRate(opts.defaultTaxRate, 0);
    const gstRate = toRate(
        cfg.sales_tax_rate ?? cfg.gst_rate ?? cfg.salesTaxRate ?? cfg.gstRate,
        packRate
    );
    const pstRate = toRate(
        cfg.provincial_tax_rate ?? cfg.provincialTaxRate,
        0
    );

    if (strategy === 'GST_PST') {
        /** @type {PosTaxComponent[]} */
        const components = [];
        if (gstRate > 0) {
            components.push({
                key: 'gst',
                label: 'GST',
                rate: gstRate,
            });
        }
        if (mode === 'standard' && pstRate > 0) {
            components.push({
                key: 'pst',
                label: 'PST',
                rate: pstRate,
            });
        }
        if (components.length === 0 && packRate > 0) {
            components.push({
                key: 'gst',
                label: opts.taxLabel || 'GST / PST',
                rate: packRate,
            });
        }
        return components;
    }

    const vatRate = gstRate > 0 ? gstRate : packRate;
    if (vatRate <= 0) return [];
    return [{
        key: 'vat',
        label: opts.taxLabel || 'VAT',
        rate: vatRate,
    }];
}

/**
 * Sum of component rates (percent).
 * @param {PosTaxComponent[]} components
 */
export function sumPosTaxComponentRates(components) {
    return (components || []).reduce((s, c) => s + toRate(c.rate, 0), 0);
}

/**
 * Resolve effective line tax percent from product + cart components.
 * @param {object} productOrLine
 * @param {PosTaxComponent[]} components
 */
export function resolvePosLineTaxPercent(productOrLine, components) {
    const row = productOrLine || {};
    const domain = row.domain_data && typeof row.domain_data === 'object' ? row.domain_data : {};
    if (row.taxExempt || row.tax_exempt || domain.tax_exempt || domain.taxExempt) {
        return 0;
    }
    if (row.taxPercent != null && Number.isFinite(Number(row.taxPercent)) && row._taxLocked) {
        return toRate(row.taxPercent, 0);
    }
    const explicit = row.tax_percent ?? row.tax_rate ?? domain.tax_percent ?? domain.tax_rate;
    if (explicit != null && Number.isFinite(Number(explicit))) {
        return toRate(explicit, 0);
    }
    return sumPosTaxComponentRates(components);
}

/**
 * Allocate tax amounts per component across a taxable base.
 * @param {number} taxableBase
 * @param {PosTaxComponent[]} components
 * @returns {{ taxAmount: number, breakdown: Array<{ key: string, label: string, rate: number, amount: number }> }}
 */
export function allocatePosTaxBreakdown(taxableBase, components) {
    const base = Math.max(0, Number(taxableBase) || 0);
    const list = Array.isArray(components) ? components : [];
    const breakdown = list.map((c) => {
        const rate = toRate(c.rate, 0);
        const amount = Math.round(base * (rate / 100) * 100) / 100;
        return {
            key: c.key,
            label: c.label,
            rate,
            amount,
        };
    });
    const taxAmount = Math.round(breakdown.reduce((s, b) => s + b.amount, 0) * 100) / 100;
    return { taxAmount, breakdown };
}

/**
 * Compute cart tax using per-line taxPercent when set, else component rates.
 * Prefer summing line taxes (matches existing POS behaviour) and derive display
 * breakdown by pro-rating component rates against taxable subtotal.
 *
 * @param {Array<{ unitPrice?: number, quantity?: number, taxPercent?: number, taxExempt?: boolean }>} lines
 * @param {PosTaxComponent[]} components
 */
export function computePosCartTax(lines, components) {
    const rows = Array.isArray(lines) ? lines : [];
    const comps = Array.isArray(components) ? components : [];
    const defaultPct = sumPosTaxComponentRates(comps);

    let taxableSubtotal = 0;
    let taxAmount = 0;

    for (const line of rows) {
        const lineSub = (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0);
        if (line.taxExempt || line.tax_exempt) continue;
        const pct = line.taxPercent != null && Number.isFinite(Number(line.taxPercent))
            ? toRate(line.taxPercent, 0)
            : defaultPct;
        if (pct <= 0) continue;
        taxableSubtotal += lineSub;
        taxAmount += lineSub * (pct / 100);
    }

    taxAmount = Math.round(taxAmount * 100) / 100;
    taxableSubtotal = Math.round(taxableSubtotal * 100) / 100;

    let breakdown = [];
    if (comps.length > 1 && taxableSubtotal > 0 && taxAmount > 0) {
        const allocated = allocatePosTaxBreakdown(taxableSubtotal, comps);
        // Scale if line percents diverge slightly from component sum
        const allocatedSum = allocated.taxAmount || 1;
        const scale = taxAmount / allocatedSum;
        breakdown = allocated.breakdown.map((b) => ({
            ...b,
            amount: Math.round(b.amount * scale * 100) / 100,
        }));
        const drift = Math.round((taxAmount - breakdown.reduce((s, b) => s + b.amount, 0)) * 100) / 100;
        if (breakdown.length && drift !== 0) {
            breakdown[breakdown.length - 1].amount =
                Math.round((breakdown[breakdown.length - 1].amount + drift) * 100) / 100;
        }
    } else if (comps.length === 1 && taxAmount > 0) {
        breakdown = [{
            key: comps[0].key,
            label: comps[0].label,
            rate: comps[0].rate,
            amount: taxAmount,
        }];
    } else if (taxAmount > 0) {
        breakdown = [{
            key: 'tax',
            label: 'Tax',
            rate: defaultPct,
            amount: taxAmount,
        }];
    }

    return {
        taxAmount,
        taxableSubtotal,
        taxPercent: defaultPct,
        breakdown,
    };
}
