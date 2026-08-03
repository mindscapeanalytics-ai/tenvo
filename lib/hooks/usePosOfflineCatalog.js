'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    writePosOfflineCatalog,
    readPosOfflineCatalog,
    isPosOfflineCatalogFresh,
} from '@/lib/utils/posOfflineCatalog';

const WRITE_THROTTLE_MS = 60_000;

/**
 * Persist / restore a slim product snapshot for offline POS.
 */
export function usePosOfflineCatalog(businessId, { enabled = false, products = [] } = {}) {
    const [catalogReady, setCatalogReady] = useState(false);
    const [catalogProducts, setCatalogProducts] = useState([]);
    const lastWriteAtRef = useRef(0);
    const productsRef = useRef(products);
    productsRef.current = products;

    const refreshFromMemory = useCallback(async () => {
        if (!businessId || !enabled) {
            setCatalogReady(false);
            setCatalogProducts([]);
            return;
        }

        const list = Array.isArray(productsRef.current) ? productsRef.current : [];
        const now = Date.now();
        if (list.length > 0 && now - lastWriteAtRef.current >= WRITE_THROTTLE_MS) {
            try {
                await writePosOfflineCatalog(businessId, list);
                lastWriteAtRef.current = now;
            } catch {
                /* IndexedDB may be unavailable */
            }
        } else if (list.length > 0 && lastWriteAtRef.current === 0) {
            // First paint: always write once so cold offline works after one online load.
            try {
                await writePosOfflineCatalog(businessId, list);
                lastWriteAtRef.current = now;
            } catch {
                /* ignore */
            }
        }

        try {
            const snap = await readPosOfflineCatalog(businessId);
            const ready = Boolean(
                snap?.products?.length && isPosOfflineCatalogFresh(snap.updatedAt)
            );
            setCatalogReady(ready);
            setCatalogProducts(snap?.products || []);
        } catch {
            setCatalogReady(false);
            setCatalogProducts([]);
        }
    }, [businessId, enabled]);

    useEffect(() => {
        refreshFromMemory();
    }, [refreshFromMemory, products?.length]);

    return { catalogReady, catalogProducts, refreshFromMemory };
}
