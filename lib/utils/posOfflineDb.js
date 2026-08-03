/**
 * Shared IndexedDB for POS offline queue + catalog snapshot.
 */

export const POS_OFFLINE_DB_NAME = 'tenvo_pos_offline';
/** v1 = sales only; v2 adds catalog store */
export const POS_OFFLINE_DB_VERSION = 2;

export function openPosOfflineDb() {
    if (typeof indexedDB === 'undefined') {
        return Promise.reject(new Error('IndexedDB unavailable'));
    }
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(POS_OFFLINE_DB_NAME, POS_OFFLINE_DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('sales')) {
                const os = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
                os.createIndex('businessId', 'businessId', { unique: false });
                os.createIndex('status', 'status', { unique: false });
            }
            if (!db.objectStoreNames.contains('catalog')) {
                db.createObjectStore('catalog', { keyPath: 'businessId' });
            }
        };
    });
}
