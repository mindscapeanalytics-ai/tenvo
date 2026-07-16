/**
 * Tax Strategy Pattern
 * Handles regional tax calculations based on business context.
 */

import { RegionalStandards } from './regionalHelpers';

export interface TaxLineItem {
    amount: number;
    taxPercent: number;
    category?: string;
    domain?: string;
    /** Optional GST share (%) when breaking out GST_PST */
    gstPercent?: number;
    /** Optional PST share (%) when breaking out GST_PST */
    pstPercent?: number;
}

export interface TaxBreakdown {
    baseAmount: number;
    taxAmount: number;
    /** Alias for taxAmount — used by calculateTotals in EnhancedInvoiceBuilder */
    totalTax: number;
    totalAmount: number;
    label: string;
    details: Record<string, { rate: number; amount: number }>;
}

export interface TaxStrategy {
    calculate(item: TaxLineItem, standards: RegionalStandards): TaxBreakdown;
    calculateBulk(items: TaxLineItem[], standards: RegionalStandards): TaxBreakdown;
}

/**
 * Pakistan Tax Strategy (GST + PST)
 * When item.taxPercent is a combined rate, shows a single GST/PST detail.
 * Prefer POS resolvePosTaxComponents for true multi-line breakout at the till.
 */
export const PakistanTaxStrategy: TaxStrategy = {
    calculate(item, standards) {
        const base = item.amount;
        const rate = (item.taxPercent || 18) / 100;
        const taxAmount = Math.round(base * rate * 100) / 100;
        const gstShare = item.gstPercent != null ? Number(item.gstPercent) / 100 : rate;
        const pstShare = item.pstPercent != null ? Number(item.pstPercent) / 100 : 0;
        // Build into a typed Record — a ternary widens to a union with optional
        // `undefined` keys, which is not assignable to Record<string, {...}>.
        const details: TaxBreakdown['details'] = {};
        if (pstShare > 0) {
            details.GST = { rate: gstShare, amount: Math.round(base * gstShare * 100) / 100 };
            details.PST = { rate: pstShare, amount: Math.round(base * pstShare * 100) / 100 };
        } else {
            details['GST/PST'] = { rate: rate, amount: taxAmount };
        }

        return {
            baseAmount: base,
            taxAmount: taxAmount,
            totalTax: taxAmount,
            totalAmount: base + taxAmount,
            label: standards.taxLabel,
            details,
        };
    },
    calculateBulk(items, standards) {
        // Aggregate per-item tax amounts, accumulating details by tax label
        const aggregated = items.reduce((acc, item) => {
            const result = this.calculate(item, standards);
            const nextDetails = { ...acc.details };
            for (const [key, val] of Object.entries(result.details || {})) {
                const prevDetail = nextDetails[key] || { rate: val.rate || 0, amount: 0 };
                nextDetails[key] = {
                    rate: val.rate ?? prevDetail.rate,
                    amount: prevDetail.amount + (val.amount || 0),
                };
            }
            return {
                baseAmount: acc.baseAmount + result.baseAmount,
                taxAmount: acc.taxAmount + result.taxAmount,
                totalTax: acc.totalTax + result.taxAmount,
                totalAmount: acc.totalAmount + result.totalAmount,
                label: standards.taxLabel,
                details: nextDetails,
            };
        }, { baseAmount: 0, taxAmount: 0, totalTax: 0, totalAmount: 0, label: standards.taxLabel, details: {} as Record<string, { rate: number; amount: number }> });
        return aggregated;
    }
};

/**
 * GCC Tax Strategy (Fixed VAT)
 */
export const GCCTaxStrategy: TaxStrategy = {
    calculate(item, standards) {
        const base = item.amount;
        const rate = (item.taxPercent || 5) / 100; // UAE/KSA usually 5-15%
        const taxAmount = Math.round(base * rate * 100) / 100;

        return {
            baseAmount: base,
            taxAmount: taxAmount,
            totalTax: taxAmount,
            totalAmount: base + taxAmount,
            label: standards.taxLabel || 'VAT',
            details: {
                'VAT': { rate: rate, amount: taxAmount }
            }
        };
    },
    calculateBulk(items, standards) {
        const aggregated = items.reduce((acc, item) => {
            const result = this.calculate(item, standards);
            const detailKey = 'VAT';
            const prevDetail = acc.details[detailKey] || { rate: result.details[detailKey]?.rate || 0, amount: 0 };
            return {
                baseAmount: acc.baseAmount + result.baseAmount,
                taxAmount: acc.taxAmount + result.taxAmount,
                totalTax: acc.totalTax + result.taxAmount,
                totalAmount: acc.totalAmount + result.totalAmount,
                label: standards.taxLabel || 'VAT',
                details: {
                    ...acc.details,
                    [detailKey]: {
                        rate: prevDetail.rate,
                        amount: prevDetail.amount + result.taxAmount,
                    }
                }
            };
        }, { baseAmount: 0, taxAmount: 0, totalTax: 0, totalAmount: 0, label: standards.taxLabel || 'VAT', details: {} as Record<string, { rate: number; amount: number }> });
        return aggregated;
    }
};

/**
 * Get the appropriate tax strategy for a region
 */
export function getTaxStrategy(standards: RegionalStandards): TaxStrategy {
    switch (standards.taxStrategy) {
        case 'VAT': return GCCTaxStrategy;
        case 'GST_PST': return PakistanTaxStrategy;
        default: return PakistanTaxStrategy;
    }
}
