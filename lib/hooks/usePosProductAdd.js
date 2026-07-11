'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { findProductScanMatch } from '@/lib/utils/productScanLookup';
import { lookupProductByScanCodeAction } from '@/lib/actions/standard/inventory/lookup';
import { getPosDomainFlags } from '@/lib/config/posDomains';
import { isProductExpired, productRequiresBatch } from '@/lib/utils/posPharmacy';
import { getWholesaleUnitPrice, validateWholesaleQuantity } from '@/lib/utils/posWholesale';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { getProductAvailableStock } from '@/lib/utils/posHelpers';

/**
 * Shared POS product-add pipeline — pharmacy, wholesale, stock guards, server scan fallback.
 */
export function usePosProductAdd({
    category,
    posSettings,
    effectiveTaxRate = 0,
    businessId = null,
    setCart,
    setPharmacyProduct,
    onAdded,
    onProductDiscovered,
}) {
    const domainFlags = getPosDomainFlags(category);

    const tryAddProduct = useCallback((product, batchMeta = null, variantMeta = null) => {
        const stock = getProductAvailableStock(product);
        if (stock <= 0 && !product.allow_negative_stock) {
            toast.error(`${product.name} is out of stock`, { id: 'pos-stock' });
            return false;
        }
        if (posSettings?.blockExpiredProducts && isProductExpired(product)) {
            toast.error(`${product.name} is expired and cannot be sold`, { id: 'pos-expiry' });
            return false;
        }
        if (
            domainFlags.pharmacyMode
            && posSettings?.enforcePharmacyBatch
            && productRequiresBatch(product, category)
            && !batchMeta
        ) {
            setPharmacyProduct?.(product);
            return false;
        }

        const moqCheck = domainFlags.wholesaleMode && posSettings?.enforceWholesaleMoq
            ? validateWholesaleQuantity(product, 1)
            : { ok: true, moq: 1 };
        if (!moqCheck.ok) {
            toast.error(moqCheck.message, { id: 'pos-moq' });
            return false;
        }

        const isWeightItem = product.unit === 'kg' || product.unit === 'g'
            || product.unit === 'lb' || product.is_weight_item
            || product.domain_data?.is_weight_item;
        const startQty = isWeightItem ? 1.0 : Math.max(1, moqCheck.moq || 1);
        const unitPrice = domainFlags.wholesaleMode
            ? getWholesaleUnitPrice(product, startQty)
            : parseFloat(
                variantMeta?.unitPrice
                ?? product.selling_price
                ?? product.price
                ?? 0
            );

        const variantId = variantMeta?.variantId || null;
        const lineSku = variantMeta?.variantSku || product.sku;
        const lineName = variantMeta?.variantName
            ? `${product.name} (${variantMeta.variantName})`
            : product.name;

        setCart((prev) => {
            const batchKey = batchMeta?.batchId || null;
            const existing = prev.findIndex(
                (i) =>
                    i.productId === product.id
                    && (i.batchId || null) === batchKey
                    && (i.variantId || null) === variantId
            );
            if (existing >= 0 && !isWeightItem) {
                const nextQty = prev[existing].quantity + 1;
                if (domainFlags.wholesaleMode && posSettings?.enforceWholesaleMoq) {
                    const check = validateWholesaleQuantity(product, nextQty);
                    if (!check.ok) {
                        toast.error(check.message, { id: 'pos-moq' });
                        return prev;
                    }
                }
                const updated = [...prev];
                updated[existing] = {
                    ...updated[existing],
                    quantity: nextQty,
                    unitPrice: domainFlags.wholesaleMode
                        ? getWholesaleUnitPrice(product, nextQty)
                        : updated[existing].unitPrice,
                };
                return updated;
            }

            return [...prev, {
                productId: product.id,
                name: lineName,
                sku: lineSku,
                variantId,
                variantSku: variantMeta?.variantSku || null,
                image: getEffectiveProductImageUrl(product),
                quantity: startQty,
                unitPrice,
                taxPercent: effectiveTaxRate,
                unit: product.unit || (isWeightItem ? 'kg' : 'pcs'),
                batchId: batchMeta?.batchId || null,
                batchNumber: batchMeta?.batchNumber || null,
                maxStock: stock,
            }];
        });

        onAdded?.(product);
        return true;
    }, [category, domainFlags, posSettings, effectiveTaxRate, setCart, setPharmacyProduct, onAdded]);

    const handleScanCode = useCallback(async (products, code, { clearSearch } = {}) => {
        let product = null;
        let matchedVariantId = null;
        let matchedVariantSku = null;

        const local = findProductScanMatch(products, code);
        if (local?.product) {
            product = local.product;
            matchedVariantId = local.matchedVariantId;
            matchedVariantSku = local.matchedVariantSku;
        }

        if (!product && businessId) {
            try {
                const result = await lookupProductByScanCodeAction(businessId, code);
                if (result.success && result.product) {
                    product = result.product;
                    matchedVariantId = result.matchedVariantId || null;
                    matchedVariantSku = result.matchedVariantSku || null;
                    onProductDiscovered?.(product);
                }
            } catch {
                /* client-only fallback */
            }
        }

        if (product) {
            let variantMeta = null;
            if (matchedVariantId || matchedVariantSku) {
                const variants = product.variants || product.product_variants || [];
                const variant = variants.find(
                    (v) =>
                        (matchedVariantId && v.id === matchedVariantId)
                        || (matchedVariantSku
                            && String(v.variant_sku || v.sku || '').toLowerCase()
                                === String(matchedVariantSku).toLowerCase())
                );
                variantMeta = {
                    variantId: matchedVariantId || variant?.id || null,
                    variantSku: matchedVariantSku || variant?.variant_sku || variant?.sku || null,
                    variantName: variant?.name || variant?.label || matchedVariantSku || null,
                    unitPrice: variant?.price != null ? Number(variant.price) : undefined,
                };
            }
            tryAddProduct(product, null, variantMeta);
            clearSearch?.();
            return product;
        }
        toast.error(`No product for "${code}"`, { id: 'pos-scan-miss' });
        return null;
    }, [tryAddProduct, businessId, onProductDiscovered]);

    return { tryAddProduct, handleScanCode, domainFlags };
}
