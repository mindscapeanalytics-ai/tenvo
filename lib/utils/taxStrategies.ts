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
 */
export const PakistanTaxStrategy: TaxStrategy = {
    calculate(item, standards) {
        const base = item.amount;
        const rate = (item.taxPercent || 18) / 100;
        const taxAmount = Math.round(base * rate * 100) / 100;

        return {
            baseAmount: base,
            taxAmount: taxAmount,
            totalTax: taxAmount,
            totalAmount: base + taxAmount,
            label: standards.taxLabel,
            details: {
                'GST/PST': { rate: rate, amount: taxAmount }
            }
        };
    },
    calculateBulk(items, standards) {
        // Aggregate per-item tax amounts, accumulating details by tax label
        const aggregated = items.reduce((acc, item) => {
            const result = this.calculate(item, standards);
            const detailKey = 'GST/PST';
            const prevDetail = acc.details[detailKey] || { rate: result.details[detailKey]?.rate || 0, amount: 0 };
            return {
                baseAmount: acc.baseAmount + result.baseAmount,
                taxAmount: acc.taxAmount + result.taxAmount,
                totalTax: acc.totalTax + result.taxAmount,
                totalAmount: acc.totalAmount + result.totalAmount,
                label: standards.taxLabel,
                details: {
                    ...acc.details,
                    [detailKey]: {
                        rate: prevDetail.rate,
                        amount: prevDetail.amount + result.taxAmount,
                    }
                }
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
