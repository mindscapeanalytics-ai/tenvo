'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useProductScan } from '@/lib/hooks/useProductScan';

/**
 * Inventory scan pipeline — product lookup, server fallback, optional serial pass.
 */
export function useInventoryScan({
  products,
  businessId,
  isSerialEnabled = false,
  onProductDiscovered,
}) {
  const { resolveScan } = useProductScan({
    products,
    businessId,
    isSerialEnabled,
    onProductResolved: onProductDiscovered,
  });

  const applyScanToInventory = useCallback(
    async (
      code,
      {
        setActiveTab,
        setSearchTerm,
        setProductToView,
        setSelectedProduct,
        setShowSerialScanner,
      } = {}
    ) => {
      const result = await resolveScan(code);

      if (result.type === 'empty') return result;

      setActiveTab?.('products');

      if (result.type === 'product') {
        const { product } = result;
        setSearchTerm?.(product.barcode || product.sku || result.code);
        setProductToView?.(product);
        const hint = result.source === 'server' ? ' (live lookup)' : '';
        toast.success(`Found: ${product.name}${hint}`, { id: 'inv-scan' });
        return result;
      }

      if (result.type === 'serial') {
        const label = result.product?.name || result.code;
        if (result.product) {
          setSearchTerm?.(result.code);
          setSelectedProduct?.(result.product);
          setShowSerialScanner?.(true);
          toast.success(`Serial matched: ${label}`, { id: 'inv-scan' });
        } else {
          toast.success(`Serial ${result.code} (${result.serial.status || 'registered'})`, {
            id: 'inv-scan',
          });
        }
        return result;
      }

      setSearchTerm?.(result.code);
      toast.error(`No product for "${result.code}"`, { id: 'inv-scan-miss' });
      return result;
    },
    [resolveScan]
  );

  return { resolveScan, applyScanToInventory };
}
