/**
 * Offline POS sale queue — replays checkout when connection restores.
 */

import { openPosOfflineDb } from '@/lib/utils/posOfflineDb';

const STORE = 'sales';

/**
 * @param {{ businessId: string, payload: object, clientRef: string }} sale
 */
export async function enqueueOfflinePosSale(sale) {
    const clientRef = sale?.clientRef || sale?.payload?.clientRef;
    if (!clientRef || typeof clientRef !== 'string') {
        throw new Error('clientRef required for offline POS sale');
    }
    const businessId = sale.businessId;
    if (!businessId) {
        throw new Error('businessId required for offline POS sale');
    }

    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const record = {
            businessId,
            clientRef,
            payload: { ...sale.payload, clientRef, businessId },
            status: 'pending',
            createdAt: new Date().toISOString(),
            attempts: 0,
        };
        const req = tx.objectStore(STORE).add(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function listPendingPosSales(businessId) {
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const idx = tx.objectStore(STORE).index('businessId');
        const req = idx.getAll(businessId);
        req.onsuccess = () => {
            const rows = (req.result || []).filter((r) => r.status === 'pending');
            rows.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
            resolve(rows);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function markPosSaleSynced(id) {
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const row = getReq.result;
            if (!row) {
                resolve(false);
                return;
            }
            row.status = 'synced';
            row.syncedAt = new Date().toISOString();
            store.put(row);
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

export async function markPosSaleFailed(id, error) {
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const row = getReq.result;
            if (!row) {
                resolve(false);
                return;
            }
            row.status = 'failed';
            row.lastError = error || null;
            row.failedAt = new Date().toISOString();
            store.put(row);
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

export async function incrementPosSaleAttempt(id, error) {
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const row = getReq.result;
            if (!row) return;
            row.attempts = (row.attempts || 0) + 1;
            row.lastError = error || null;
            store.put(row);
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

export async function countPendingPosSales(businessId) {
    const pending = await listPendingPosSales(businessId);
    return pending.length;
}

export async function listFailedPosSales(businessId) {
    const db = await openPosOfflineDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const idx = tx.objectStore(STORE).index('businessId');
        const req = idx.getAll(businessId);
        req.onsuccess = () => {
            const rows = (req.result || []).filter((r) => r.status === 'failed');
            resolve(rows);
        };
        req.onerror = () => reject(req.error);
    });
}
