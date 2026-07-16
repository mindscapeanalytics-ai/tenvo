'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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
            setHeldOrders(Array.isArray(parsed) ? parsed : []);
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
        if (!snapshot?.items?.length) return false;
        setHeldOrders((prev) => [
            ...prev,
            {
                items: snapshot.items,
                customer: snapshot.customer || null,
                discount: snapshot.discount ?? 0,
                discountType: snapshot.discountType || 'fixed',
                taxMode: snapshot.taxMode || 'standard',
                paymentMethod: snapshot.paymentMethod || 'cash',
                timestamp: Date.now(),
            },
        ]);
        return true;
    }, []);

    const resumeLastHeld = useCallback(() => {
        if (heldOrders.length === 0) return null;
        const updated = [...heldOrders];
        const restored = updated.pop();
        setHeldOrders(updated);
        return restored || null;
    }, [heldOrders]);

    const clearHeld = useCallback(() => setHeldOrders([]), []);

    return {
        heldOrders,
        holdSale,
        resumeLastHeld,
        clearHeld,
        setHeldOrders,
    };
}
