import { describe, expect, it } from 'vitest';
import { createHeldSaleEntry } from '@/lib/hooks/usePosHeldSales';
import { buildPosCheckoutPayload } from '@/lib/utils/posHelpers';

describe('createHeldSaleEntry', () => {
    it('creates id and preserves discountType', () => {
        const entry = createHeldSaleEntry({
            items: [{ productId: 'p1', quantity: 2, unitPrice: 10 }],
            customer: { id: 'c1', name: 'Zeeshan' },
            discount: 5,
            discountType: 'percentage',
            taxMode: 'gst_only',
            paymentMethod: 'card',
        });
        expect(entry).toBeTruthy();
        expect(entry.id).toBeTruthy();
        expect(entry.discountType).toBe('percentage');
        expect(entry.customer.name).toBe('Zeeshan');
        expect(entry.items).toHaveLength(1);
    });

    it('returns null for empty cart', () => {
        expect(createHeldSaleEntry({ items: [] })).toBeNull();
        expect(createHeldSaleEntry({})).toBeNull();
    });
});

describe('buildPosCheckoutPayload fidelity', () => {
    it('preserves batchId, variantId, and serialNumber', () => {
        const payload = buildPosCheckoutPayload({
            businessId: 'b1',
            sessionId: 's1',
            customerId: null,
            cart: [{
                productId: 'p1',
                name: 'Milk',
                quantity: 1,
                unitPrice: 100,
                taxPercent: 0,
                batchId: '11111111-1111-1111-1111-111111111111',
                variantId: '22222222-2222-2222-2222-222222222222',
                serialNumber: 'SN-9',
            }],
            discount: 0,
            discountType: 'fixed',
            paymentMethod: 'cash',
        });
        expect(payload.items[0].batchId).toBe('11111111-1111-1111-1111-111111111111');
        expect(payload.items[0].variantId).toBe('22222222-2222-2222-2222-222222222222');
        expect(payload.items[0].serialNumber).toBe('SN-9');
    });
});
