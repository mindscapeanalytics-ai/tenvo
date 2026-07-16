import { describe, it, expect } from 'vitest';
import {
    resolvePosTaxComponents,
    sumPosTaxComponentRates,
    computePosCartTax,
    resolvePosLineTaxPercent,
} from '@/lib/utils/posTaxComponents';
import { computePosOrderTotals } from '@/lib/utils/posHelpers';
import { nextPosPaymentMethod } from '@/lib/config/posHotkeys';

describe('posTaxComponents', () => {
    it('splits GST and PST when both rates are configured', () => {
        const comps = resolvePosTaxComponents({
            taxStrategy: 'GST_PST',
            taxConfig: { sales_tax_rate: 18, provincial_tax_rate: 5 },
            defaultTaxRate: 18,
        });
        expect(comps).toEqual([
            { key: 'gst', label: 'GST', rate: 18 },
            { key: 'pst', label: 'PST', rate: 5 },
        ]);
        expect(sumPosTaxComponentRates(comps)).toBe(23);
    });

    it('omits PST when provincial rate is zero', () => {
        const comps = resolvePosTaxComponents({
            taxStrategy: 'GST_PST',
            taxConfig: { sales_tax_rate: 18, provincial_tax_rate: 0 },
            defaultTaxRate: 18,
        });
        expect(comps).toEqual([{ key: 'gst', label: 'GST', rate: 18 }]);
    });

    it('gst_only mode drops PST', () => {
        const comps = resolvePosTaxComponents({
            taxStrategy: 'GST_PST',
            taxMode: 'gst_only',
            taxConfig: { sales_tax_rate: 18, provincial_tax_rate: 5 },
            defaultTaxRate: 18,
        });
        expect(comps.map((c) => c.key)).toEqual(['gst']);
    });

    it('exempt mode returns no components', () => {
        const comps = resolvePosTaxComponents({
            taxStrategy: 'GST_PST',
            taxMode: 'exempt',
            taxConfig: { sales_tax_rate: 18, provincial_tax_rate: 5 },
        });
        expect(comps).toEqual([]);
    });

    it('computes cart tax breakdown for dual components', () => {
        const comps = [
            { key: 'gst', label: 'GST', rate: 18 },
            { key: 'pst', label: 'PST', rate: 2 },
        ];
        const lines = [
            { unitPrice: 1000, quantity: 1, taxPercent: 20 },
            { unitPrice: 500, quantity: 2, taxPercent: 20 },
        ];
        const result = computePosCartTax(lines, comps);
        expect(result.taxAmount).toBe(400);
        expect(result.breakdown).toHaveLength(2);
        expect(result.breakdown[0].label).toBe('GST');
        expect(result.breakdown[1].label).toBe('PST');
        const sumParts = result.breakdown.reduce((s, b) => s + b.amount, 0);
        expect(Math.round(sumParts * 100) / 100).toBe(400);
    });

    it('honours product tax exempt', () => {
        expect(resolvePosLineTaxPercent({ tax_exempt: true }, [{ key: 'gst', label: 'GST', rate: 18 }])).toBe(0);
    });

    it('computePosOrderTotals returns taxBreakdown when components passed', () => {
        const totals = computePosOrderTotals(
            [{ unitPrice: 1000, quantity: 1, taxPercent: 18 }],
            {
                taxComponents: [{ key: 'gst', label: 'GST', rate: 18 }],
                discount: 0,
            }
        );
        expect(totals.taxAmount).toBe(180);
        expect(totals.taxBreakdown?.[0]?.amount).toBe(180);
        expect(totals.total).toBe(1180);
    });
});

describe('posHotkeys', () => {
    it('cycles payment methods', () => {
        expect(nextPosPaymentMethod('cash')).toBe('card');
        expect(nextPosPaymentMethod('split')).toBe('cash');
    });
});
