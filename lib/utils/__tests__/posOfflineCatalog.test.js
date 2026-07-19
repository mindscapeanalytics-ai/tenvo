import { describe, expect, test } from 'bun:test';
import {
    isPosOfflineCatalogFresh,
    slimPosOfflineProduct,
    POS_OFFLINE_CATALOG_TTL_MS,
} from '@/lib/utils/posOfflineCatalog';
import { newPosClientRef } from '@/lib/utils/posOfflineIds';

describe('posOfflineCatalog', () => {
    test('fresh within TTL', () => {
        const now = Date.parse('2026-07-18T12:00:00Z');
        const updatedAt = new Date(now - 60_000).toISOString();
        expect(isPosOfflineCatalogFresh(updatedAt, now)).toBe(true);
    });

    test('stale after TTL', () => {
        const now = Date.parse('2026-07-18T12:00:00Z');
        const updatedAt = new Date(now - POS_OFFLINE_CATALOG_TTL_MS - 1).toISOString();
        expect(isPosOfflineCatalogFresh(updatedAt, now)).toBe(false);
    });

    test('invalid updatedAt is not fresh', () => {
        expect(isPosOfflineCatalogFresh(null)).toBe(false);
        expect(isPosOfflineCatalogFresh('not-a-date')).toBe(false);
    });

    test('slim keeps sell fields and drops extras', () => {
        const slim = slimPosOfflineProduct({
            id: 'p1',
            name: 'Tea',
            sku: 'T1',
            barcode: '123',
            price: 10,
            selling_price: 10,
            stock: 5,
            category: 'Drinks',
            is_active: true,
            huge: { nested: true },
        });
        expect(slim.id).toBe('p1');
        expect(slim.name).toBe('Tea');
        expect(slim.huge).toBeUndefined();
    });
});

describe('posOfflineIds', () => {
    test('newPosClientRef returns non-empty string <= 64', () => {
        const ref = newPosClientRef();
        expect(typeof ref).toBe('string');
        expect(ref.length).toBeGreaterThan(8);
        expect(ref.length).toBeLessThanOrEqual(64);
    });
});
