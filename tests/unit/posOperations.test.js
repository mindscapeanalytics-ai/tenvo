import { describe, it, expect } from 'vitest';
import { posActionRequiresManagerPin, resolvePosSettings } from '@/lib/config/posSettings';
import {
    parsePosSessionNotes,
    serializePosSessionNotes,
    sumPosCashMovements,
} from '@/lib/utils/posCashDrawer';

describe('posActionRequiresManagerPin', () => {
    const withPin = resolvePosSettings({
        settings: {
            pos: {
                managerPin: '1234',
                requirePinForClear: true,
                requirePinForTaxExempt: true,
                requirePinForDiscountAbove: 15,
            },
        },
    });

    it('skips when no pin configured', () => {
        const s = resolvePosSettings({ settings: { pos: { managerPin: '' } } });
        expect(posActionRequiresManagerPin('clear', s)).toBe(false);
    });

    it('requires pin for clear and tax exempt', () => {
        expect(posActionRequiresManagerPin('clear', withPin)).toBe(true);
        expect(posActionRequiresManagerPin('tax_exempt', withPin)).toBe(true);
        expect(posActionRequiresManagerPin('paid_out', withPin)).toBe(true);
    });

    it('requires pin only when discount exceeds threshold', () => {
        expect(posActionRequiresManagerPin('discount', withPin, { discountPercent: 10 })).toBe(false);
        expect(posActionRequiresManagerPin('discount', withPin, { discountPercent: 20 })).toBe(true);
    });
});

describe('posCashDrawer session notes', () => {
    it('round-trips cash movements in notes JSON', () => {
        const notes = serializePosSessionNotes({
            text: 'Opening',
            cashMovements: [{ type: 'paid_in', amount: 500, reason: 'Float', at: '2026-01-01' }],
        });
        const parsed = parsePosSessionNotes(notes);
        expect(parsed.text).toBe('Opening');
        expect(parsed.cashMovements).toHaveLength(1);
        expect(sumPosCashMovements([
            { type: 'paid_in', amount: 500 },
            { type: 'paid_out', amount: 50 },
        ])).toBe(450);
    });

    it('treats legacy plain notes as text', () => {
        const parsed = parsePosSessionNotes('Shift note');
        expect(parsed.text).toBe('Shift note');
        expect(parsed.cashMovements).toEqual([]);
    });
});
