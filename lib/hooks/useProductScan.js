'use client';

import { useCallback } from 'react';
import { findProductByScanCode, mergeScannedProductIntoList } from '@/lib/utils/productScanLookup';
import { lookupProductByScanCodeAction } from '@/lib/actions/standard/inventory/lookup';
import { serialAPI } from '@/lib/api/serial';

/**
 * Unified scan resolver — client catalog first, server fallback, optional serial pass.
 */
export function useProductScan({
  products,
  businessId,
  isSerialEnabled = false,
  onProductResolved,
} = {}) {
  const resolveScan = useCallback(
    async (code, { serverFallback = true } = {}) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) return { type: 'empty' };

      let product = findProductByScanCode(products, trimmed);
      if (product) {
        return { type: 'product', product, code: trimmed, source: 'client' };
      }

      if (serverFallback && businessId) {
        try {
          const result = await lookupProductByScanCodeAction(businessId, trimmed);
          if (result.success && result.product) {
            onProductResolved?.(result.product);
            return {
              type: 'product',
              product: result.product,
              code: trimmed,
              source: 'server',
              matchedVariantId: result.matchedVariantId || null,
              matchedVariantSku: result.matchedVariantSku || null,
            };
          }
        } catch {
          /* fall through */
        }
      }

      if (isSerialEnabled && businessId) {
        try {
          const serial = await serialAPI.getSerial(businessId, trimmed);
          if (serial) {
            const linkedProduct =
              findProductByScanCode(products, serial.product_id) ||
              (products || []).find((p) => p.id === serial.product_id) ||
              null;
            return {
              type: 'serial',
              serial,
              product: linkedProduct,
              code: trimmed,
              source: 'serial',
            };
          }
        } catch {
          /* fall through */
        }
      }

      return { type: 'miss', code: trimmed };
    },
    [products, businessId, isSerialEnabled, onProductResolved]
  );

  return { resolveScan, mergeScannedProductIntoList };
}
