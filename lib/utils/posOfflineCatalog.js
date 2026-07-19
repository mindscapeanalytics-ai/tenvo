/**
 * Offline POS catalog snapshot — IndexedDB cache + TTL helpers.
 */

import { openPosOfflineDb } from '@/lib/utils/posOfflineDb';

export const POS_OFFLINE_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @param {string|number|Date|null|undefined} updatedAt
 * @param {number} [now]
 */
export function isPosOfflineCatalogFresh(updatedAt, now = Date.now()) {
    if (updatedAt == null) return false;
    const ts =
        typeof updatedAt === 'number'
            ? updatedAt
            : updatedAt instanceof Date
                ? updatedAt.getTime()
                : Date.parse(String(updatedAt));
    if (!Number.isFinite(ts)) return false;
    return now - ts <= POS_OFFLINE_CATALOG_TTL_MS;
}

/**
 * Keep only fields needed to scan/sell offline (not full hub DTO).
 * @param {Record<string, unknown>} product
 */
export function slimPosOfflineProduct(product) {
    if (!product || typeof product !== 'object') return null;
    const slim = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.price,
        selling_price: product.selling_price,
        unit_price: product.unit_price,
        stock: product.stock,
        tax_rate: product.tax_rate,
        taxPercent: product.taxPercent,
        category: product.category,
        is_active: product.is_active,
    };
    if (Array.isArray(product.variants)) {
        slim.variants = product.variants;
    }
    return slim;
}

/**
 * @param {string} businessId
 * @param {object[]} products
 */
export async function writePosOfflineCatalog(businessId, products) {
    if (!businessId) throw new Error('businessId required');
    const db = await openPosOfflineDb();
    const slimProducts = (Array.isArray(products) ? products : [])
        .map(slimPosOfflineProduct)
        .filter(Boolean);
    const record = {
        businessId,
        updatedAt: new Date().toISOString(),
        products: slimProducts,
    };
    return new Promise((resolve, reject) => {
        const tx = db.transaction('catalog', 'readwrite');
        tx.objectStore('catalog').put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * @param {string} businessId
 * @returns {Promise<{ businessId: string, updatedAt: string, products: object[] } | null>}
 */
export async function readPosOfflineCatalog(businessId) {
    if (!businessId) return null;
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('catalog', 'readonly');
        const req = tx.objectStore('catalog').get(businessId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}
