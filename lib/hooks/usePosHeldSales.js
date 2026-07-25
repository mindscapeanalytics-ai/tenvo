'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Build a held-sale entry from a cart snapshot.
 * @param {object} snapshot
 */
export function createHeldSaleEntry(snapshot) {
    if (!snapshot?.items?.length) return null;
    const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `held-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
        id,
        items: snapshot.items,
        customer: snapshot.customer || null,
        discount: snapshot.discount ?? 0,
        discountType: snapshot.discountType || 'fixed',
        taxMode: snapshot.taxMode || 'standard',
        paymentMethod: snapshot.paymentMethod || 'cash',
        timestamp: Date.now(),
    };
}

/**
 * Park / resume POS carts in localStorage (per business).
 * @param {string | null | undefined} businessId
 */
export function usePosHeldSales(businessId) {
    const storageKey = useMemo(
        () => `tenvo:pos:held:${businessId || 'default'}`,
        [businessId]
    );
    const [heldOrders, setHeldOrders] = useState([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                setHeldOrders([]);
                return;
            }
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : [];
            setHeldOrders(
                list.map((entry, idx) =>
                    entry?.id
                        ? entry
                        : {
                              ...entry,
                              id: `legacy-${idx}-${entry?.timestamp || Date.now()}`,
                              discountType: entry?.discountType || 'fixed',
                          }
                )
            );
        } catch {
            setHeldOrders([]);
        }
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(heldOrders));
        } catch {
            /* ignore quota */
        }
    }, [heldOrders, storageKey]);

    const holdSale = useCallback((snapshot) => {
        const entry = createHeldSaleEntry(snapshot);
        if (!entry) return false;
        setHeldOrders((prev) => [...prev, entry]);
        return entry.id;
    }, []);

    const resumeHeld = useCallback((id) => {
        if (!id) return null;
        const idx = heldOrders.findIndex((e) => e.id === id);
        if (idx < 0) return null;
        const restored = heldOrders[idx];
        setHeldOrders((prev) => prev.filter((e) => e.id !== id));
        return restored;
    }, [heldOrders]);

    const removeHeld = useCallback((id) => {
        if (!id) return false;
        setHeldOrders((prev) => prev.filter((e) => e.id !== id));
        return true;
    }, []);

    const resumeLastHeld = useCallback(() => {
        if (heldOrders.length === 0) return null;
        return resumeHeld(heldOrders[heldOrders.length - 1].id);
    }, [heldOrders, resumeHeld]);

    const clearHeld = useCallback(() => setHeldOrders([]), []);

    return {
        heldOrders,
        holdSale,
        resumeHeld,
        removeHeld,
        resumeLastHeld,
        clearHeld,
        setHeldOrders,
    };
}
