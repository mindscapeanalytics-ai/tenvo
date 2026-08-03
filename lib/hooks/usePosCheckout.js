'use client';

import { useCallback } from 'react';
import { buildPosCheckoutPayload } from '@/lib/utils/posHelpers';
import toast from 'react-hot-toast';

/**
 * Checkout with optional offline queue fallback.
 */
export function usePosCheckout({
    businessId,
    session,
    cart,
    customer,
    discount,
    discountType = 'fixed',
    paymentMethod,
    splitPayments,
    isOnline,
    offlineEnabled,
    catalogReady = true,
    queueSale,
    onCompleteSale,
    onSuccess,
    mapCartLine,
}) {
    return useCallback(async () => {
        const payload = buildPosCheckoutPayload({
            businessId,
            sessionId: session?.id,
            customerId: customer?.id || null,
            cart: (cart || []).map((i) => (mapCartLine ? mapCartLine(i) : i)),
            discount,
            discountType,
            paymentMethod: splitPayments?.length ? 'split' : paymentMethod,
            payments: splitPayments || undefined,
        });

        if (!isOnline && offlineEnabled) {
            if (!catalogReady) {
                toast.error('Connect once to cache products before selling offline', {
                    id: 'pos-offline',
                });
                return { success: false, error: 'catalog_not_ready' };
            }
            await queueSale(payload);
            toast.success('Sale queued offline - syncs when connected', { id: 'pos-offline' });
            onSuccess?.({ offline: true });
            return { success: true, offline: true };
        }

        const result = await onCompleteSale?.(payload);
        if (result?.success) {
            onSuccess?.({ result, payload });
        }
        return result;
    }, [
        businessId, session, cart, customer, discount, discountType,
        paymentMethod, splitPayments, isOnline, offlineEnabled, catalogReady,
        queueSale, onCompleteSale, onSuccess, mapCartLine,
    ]);
}
